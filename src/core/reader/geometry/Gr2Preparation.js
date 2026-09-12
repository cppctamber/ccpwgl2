import { CjsGr2Format } from "@carbonenginejs/runtime/resource/formats/gr2";

/** Pure data preparation shared by the worker and main-thread fallback. */
export function prepareGr2(data, options = {})
{
    const raw = CjsGr2Format.readRaw(data);
    if (CjsGr2Format.gsf.isRaw(raw)) throw Object.assign(new Error("Granny State files are not render geometry"), { name: "ErrGr2GeometryExpected" });
    const json = CjsGr2Format.read(raw, { emit: "json", unpackTangents: !!options.unpackTangents, decompressCurves: true });
    restoreGr2VertexChannels(raw, json);
    return prepareGr2JSON(json, options);
}

export function normalizeGrannyKeys(obj)
{
    if (!obj || typeof obj !== "object" || ArrayBuffer.isView(obj) || obj instanceof ArrayBuffer) return obj;
    const names = { controlscaleoffsets: "controlScaleOffsets", knotscontrols: "knotsControls", scaleshear: "scaleShear" };
    for (const key of Object.keys(obj))
    {
        const name = names[key.toLowerCase()] || key;
        const value = normalizeGrannyKeys(obj[key]);
        if (name !== key) delete obj[key];
        obj[name] = value;
    }
    return obj;
}

export function normalizeGr2Curve(curve, dimension)
{
    if (!curve) throw new Error("Missing GR2 curve");
    if (curve.uncompressed?.knots instanceof Float32Array && curve.uncompressed?.controls instanceof Float32Array) return curve;
    const input = curve.source ? { ...curve.source, ...curve.compressed } : curve;
    const decoded = curve.uncompressed || (curve.knots && curve.controls ? curve : CjsGr2Format.curves.decodeCurve(input, dimension));
    return {
        format: input.format,
        degree: input.degree || 0,
        uncompressed: {
            dimension: decoded.dimension || dimension,
            knots: Float32Array.from(decoded.knots),
            controls: Float32Array.from(decoded.controls)
        }
    };
}

export function prepareGr2JSON(json, options = {})
{
    normalizeGrannyKeys(json);
    if (options.firstMeshOnly !== false)
    {
        json.meshes?.splice(1);
        for (const model of json.models || []) model.meshBindings = (model.meshBindings || []).filter(index => index === 0);
    }
    for (const mesh of json.meshes || [])
    {
        if (mesh._prepared) continue;
        const vertex = mesh.vertex || {}, channels = [];
        const count = mesh.vertexCount ?? (vertex.position?.length || 0) / 3;
        let size = 0;
        for (const key of Object.keys(vertex))
        {
            const values = vertex[key];
            if (!values?.length) continue;
            const elements = values.length / count;
            if (!Number.isInteger(elements) || elements < 1 || elements > 4) throw new Error("Invalid GR2 vertex channel: " + key);
            channels.push({ key, elements, offset: size * 4 });
            size += elements;
        }
        // Preserve the legacy white stream until its remaining consumers are audited.
        const stride = size + 1, vertices = new Float32Array(count * stride);
        for (let v = 0; v < count; v++)
        {
            let offset = v * stride;
            for (const channel of channels)
            {
                const values = vertex[channel.key];
                for (let e = 0; e < channel.elements; e++) vertices[offset++] = values[v * channel.elements + e];
            }
            vertices[offset] = 1;
        }
        const areas = mesh.indices || [];
        const indices = new Uint32Array(areas.reduce((n, area) => n + (area.faces?.length || 0), 0));
        let offset = 0;
        for (const area of areas)
        {
            const faces = area.faces || [];
            indices.set(faces, offset);
            area.faces = indices.subarray(offset, offset + faces.length);
            offset += faces.length;
        }
        mesh._prepared = { channels, vertexCount: count, vertexSize: stride, vertices, indices };
        delete mesh.vertex;
    }
    for (const animation of json.animations || [])
    {
        for (const group of animation.trackGroups || [])
        {
            for (const track of group.transformTracks || [])
            {
                track.orientation = normalizeGr2Curve(track.orientation, 4);
                track.position = normalizeGr2Curve(track.position, 3);
                track.scaleShear = normalizeGr2Curve(track.scaleShear, 9);
            }
            for (const track of group.vectorTracks || []) track.valueCurve = normalizeGr2Curve(track.valueCurve, track.dimension);
        }
    }
    return json;
}

/** Collect unique transferable buffers, preserving aliases between typed views. */
export function gr2Transfers(value, buffers = new Set(), seen = new Set())
{
    if (!value || typeof value !== "object" || seen.has(value)) return buffers;
    seen.add(value);
    if (ArrayBuffer.isView(value)) buffers.add(value.buffer);
    else if (value instanceof ArrayBuffer) buffers.add(value);
    else for (const child of Object.values(value)) gr2Transfers(child, buffers, seen);
    return buffers;
}

/** Retains float4 instance channels omitted by runtime alpha.0 JSON projection. */
export function restoreGr2VertexChannels(raw, json)
{
    // Compatibility with runtime alpha.0: its JSON projector truncates
    // Position to xyz and UVs to xy. Traffic uses float4 streams; recover
    // their already-decoded floats from the same raw graph (no second read).
    for (let i = 0; i < (json.meshes || []).length; i++)
    {
        const vertices = raw.fileInfo.Meshes[i].PrimaryVertexData?.Vertices;
        if (!vertices?.length) continue;
        const mesh = json.meshes[i];
        for (const [ name, member ] of [ [ "position", "Position" ], [ "texcoord0", "TextureCoordinates0" ], [ "texcoord1", "TextureCoordinates1" ] ])
        {
            const type = vertices.__type?.find(x => x.name === member);
            if (!type || type.arrayWidth !== 4 || mesh.vertex[name]?.length === vertices.length * 4) continue;
            // Granny Real32/Real16 are decoded to JS numbers by readRaw.
            if (type.type !== 10 && type.type !== 21) throw new Error("Unsupported four-component traffic channel: " + member);
            mesh.vertex[name] = vertices.flatMap(vertex => vertex[member].map(Math.fround));
            if (name === "position") mesh.vertexCount = vertices.length;
        }
    }
}
