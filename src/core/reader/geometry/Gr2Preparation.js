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
