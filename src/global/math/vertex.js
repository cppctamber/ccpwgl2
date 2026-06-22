import { num, vec2, vec3, vec4 } from "math";


/**
 * EXPERIMENTAL: Packs one tangent basis into the angular vec4 format used by
 * some EVE quad/packed-tangent shaders.
 *
 * The input basis is normal/tangent/bitangent in object space. The output
 * stores tangent and bitangent azimuth/elevation angles normalized to 0..1,
 * with elevation signs chosen so the shader can reconstruct the intended
 * normal direction.
 *
 * This is currently only used as a GR2 debug/conversion helper and should not
 * be treated as a final tangent-space implementation.
 *
 * @param {Float32Array|vec4} out Destination packed tangent, length 4
 * @param {Array<number>|TypedArray|vec3} normal Source normal, length 3
 * @param {Array<number>|TypedArray|vec3} tangent Source tangent xyz, length 3
 * @param {Array<number>|TypedArray|vec3} bitangent Source bitangent xyz, length 3
 * @param {Boolean} flipZ Flips tangent/bitangent z before packing
 * @param {Boolean} enforcePositiveY Forces tangent elevation to be positive
 * @param {Boolean} quantizeUNorm8 Quantizes packed values to 8-bit UNORM steps
 * @returns {Float32Array|vec4} The destination packed tangent
 */
function packTangent(out, normal, tangent, bitangent, flipZ, enforcePositiveY, quantizeUNorm8)
{
    const
        n = vec3.normalize(vec3.alloc(), normal),
        t = vec3.normalize(vec3.alloc(), tangent),
        b = vec3.normalize(vec3.alloc(), bitangent),
        temp = vec3.alloc();

    if (vec3.dot(vec3.cross(temp, n, t), b) < 0)
    {
        vec3.negate(b, b);
    }

    out[0] = Math.atan2(t[1], t[0]);
    out[2] = Math.atan2(b[1], b[0]);

    const
        tangentZ = flipZ ? -t[2] : t[2],
        bitangentZ = flipZ ? -b[2] : b[2],
        tangentElevation = Math.acos(num.clamp(tangentZ, -1, 1)),
        bitangentElevation = Math.acos(num.clamp(bitangentZ, -1, 1));

    vec3.cross(temp, t, b);
    vec3.normalize(temp, temp);
    vec3.negate(temp, temp);

    const needsFlip = vec3.dot(temp, n) < 0;

    if (enforcePositiveY)
    {
        out[1] = num.strictPositive(tangentElevation);
        out[3] = needsFlip ? num.strictPositive(bitangentElevation) : num.strictNegative(bitangentElevation);
    }
    else if (needsFlip)
    {
        out[1] = num.strictPositive(tangentElevation);
        out[3] = num.strictPositive(bitangentElevation);
    }
    else
    {
        out[1] = num.strictNegative(tangentElevation);
        out[3] = num.strictPositive(bitangentElevation);
    }

    out[0] = (out[0] + num.PI) * num.INV_TWO_PI;
    out[1] = (out[1] + num.PI) * num.INV_TWO_PI;
    out[2] = (out[2] + num.PI) * num.INV_TWO_PI;
    out[3] = (out[3] + num.PI) * num.INV_TWO_PI;

    if (quantizeUNorm8)
    {
        out[0] = Math.round(num.clamp(out[0], 0, 1) * 255) / 255;
        out[1] = Math.round(num.clamp(out[1], 0, 1) * 255) / 255;
        out[2] = Math.round(num.clamp(out[2], 0, 1) * 255) / 255;
        out[3] = Math.round(num.clamp(out[3], 0, 1) * 255) / 255;
    }

    vec3.unalloc(temp);
    vec3.unalloc(b);
    vec3.unalloc(t);
    vec3.unalloc(n);

    return out;
}


/**
 * EXPERIMENTAL: Orthonormalizes a tangent basis around the source normal.
 *
 * The normal is normalized and preserved, the tangent is Gram-Schmidt
 * orthogonalized against that normal, and the bitangent is rebuilt from the
 * adjusted basis while preserving the original bitangent handedness where
 * possible.
 *
 * This can visibly change tangent islands, so callers must opt in.
 *
 * @param {Float32Array|vec3} outNormal Destination normal, length 3
 * @param {Float32Array|vec3} outTangent Destination tangent, length 3
 * @param {Float32Array|vec3} outBitangent Destination bitangent, length 3
 * @param {Array<number>|TypedArray|vec3} normal Source normal, length 3
 * @param {Array<number>|TypedArray|vec3} tangent Source tangent, length 3
 * @param {Array<number>|TypedArray|vec3} bitangent Source bitangent, length 3
 * @returns {void}
 */
function orthonormalizeTBN(outNormal, outTangent, outBitangent, normal, tangent, bitangent)
{
    const
        n = vec3.normalize(vec3.alloc(), normal),
        t = vec3.alloc(),
        b = vec3.alloc(),
        temp = vec3.alloc();

    vec3.scale(temp, n, vec3.dot(n, tangent));
    vec3.subtract(t, tangent, temp);

    if (vec3.dot(t, t) < num.EPSILON * num.EPSILON)
    {
        if (Math.abs(n[2]) < 0.999)
        {
            vec3.set(temp, 0, 0, 1);
        }
        else
        {
            vec3.set(temp, 0, 1, 0);
        }

        vec3.cross(t, temp, n);
    }

    vec3.normalize(t, t);
    vec3.cross(b, n, t);

    if (vec3.dot(b, bitangent) < 0)
    {
        vec3.negate(t, t);
        vec3.cross(b, n, t);
    }

    vec3.copy(outNormal, n);
    vec3.copy(outTangent, t);
    vec3.copy(outBitangent, b);

    vec3.unalloc(temp);
    vec3.unalloc(b);
    vec3.unalloc(t);
    vec3.unalloc(n);
}


/**
 * EXPERIMENTAL: Packs vertex normal/tangent/bitangent arrays into the packed
 * quad tangent format used by some GR2-derived EVE assets.
 *
 * This accepts normal arrays with 3 floats per vertex and tangent/bitangent
 * arrays with either 3 or 4 floats per vertex. Tangent/bitangent w components
 * are ignored. The return value is a Float32Array with 4 packed values per
 * vertex, suitable for replacing the tangent vertex element during debug GR2
 * conversion.
 *
 * @param {Array<number>|TypedArray} normals Normal data, 3 floats per vertex
 * @param {Array<number>|TypedArray} tangents Tangent data, 3 or 4 floats per vertex
 * @param {Array<number>|TypedArray} bitangents Bitangent data, 3 or 4 floats per vertex
 * @param {Boolean} [flipZ=false] Flips tangent/bitangent z before packing
 * @param {Boolean} [enforcePositiveY=false] Forces tangent elevation to be positive
 * @param {Boolean} [orthonormalize=false] Orthonormalizes each basis before packing
 * @param {Boolean} [quantizeUNorm8=false] Quantizes packed values to 8-bit UNORM steps
 * @returns {Float32Array} Packed tangents, 4 floats per vertex
 */
export function packTangents(normals, tangents, bitangents, flipZ = false, enforcePositiveY = false, orthonormalize = false, quantizeUNorm8 = false)
{
    const
        count = normals.length / 3,
        tangentStride = tangents.length / count === 3 ? 3 : 4,
        bitangentStride = bitangents.length / count === 3 ? 3 : 4,
        packedTangents = new Float32Array(count * 4),
        normal = vec3.alloc(),
        tangent = vec3.alloc(),
        bitangent = vec3.alloc(),
        packedTangent = vec4.alloc();

    for (let i = 0; i < count; i++)
    {
        vec3.fromArray(normal, normals, i * 3);
        vec3.fromArray(tangent, tangents, i * tangentStride);
        vec3.fromArray(bitangent, bitangents, i * bitangentStride);

        if (orthonormalize)
        {
            orthonormalizeTBN(normal, tangent, bitangent, normal, tangent, bitangent);
        }

        packTangent(packedTangent, normal, tangent, bitangent, flipZ, enforcePositiveY, quantizeUNorm8);

        const offset = i * 4;
        packedTangents[offset] = packedTangent[0];
        packedTangents[offset + 1] = packedTangent[1];
        packedTangents[offset + 2] = packedTangent[2];
        packedTangents[offset + 3] = packedTangent[3];
    }

    vec4.unalloc(packedTangent);
    vec3.unalloc(bitangent);
    vec3.unalloc(tangent);
    vec3.unalloc(normal);

    return packedTangents;
}


/**
 * Calculates normals
 * @param {Array|TypedArray} indices
 * @param {Array|TypedArray} positions
 * @returns {Array} normals
 */
export function calculateNormals(indices, positions)
{
    const
        normals = new Array(positions.length).fill(0),
        pA = vec3.create(),
        pB = vec3.create(),
        pC = vec3.create(),
        cb = vec3.create(),
        ab = vec3.create();

    for (let i = 0; i < indices.length; i += 3)
    {
        const
            a = indices[i] * 3,
            b = indices[i + 1] * 3,
            c = indices[i + 2] * 3;

        vec3.fromArray(pA, positions, a);
        vec3.fromArray(pB, positions, b);
        vec3.fromArray(pC, positions, c);

        vec3.subtract(cb, pC, pB);
        vec3.subtract(ab, pA, pB);
        vec3.cross(cb, cb, ab);

        normals[a] += cb[0];
        normals[a + 1] += cb[1];
        normals[a + 2] += cb[2];
        normals[b] += cb[0];
        normals[b + 1] += cb[1];
        normals[b + 2] += cb[2];
        normals[c] += cb[0];
        normals[c + 1] += cb[1];
        normals[c + 2] += cb[2];
    }

    for (let i = 0; i < normals.length; i += 3)
    {
        vec3.fromArray(cb, normals, i);
        vec3.normalize(cb, cb);
        normals[i] = cb[0];
        normals[i + 1] = cb[1];
        normals[i + 2] = cb[2];
    }

    return normals;
}


/**
 * Calculates tangents
 * @author Three.js (converted)
 * @param {Array|TypedArray} indices
 * @param {Array|TypedArray} positions
 * @param {Array|TypedArray} uvs
 * @param {Array<Object>} [areas]
 * @param {Array|TypedArray} [normals]
 * @returns {Array}
 */
export function calculateTangents(indices, positions, uvs, areas, normals)
{
    if (!indices || !positions || !uvs || !indices.length || !positions.length || !uvs.length)
    {
        console.dir({ indices, positions, uvs, areas, normals });
        throw new Error("Invalid inputs");
    }

    if (!normals || !normals.length)
    {
        normals = calculateNormals(indices, positions);
    }

    const
        tangents = [],
        nVertices = positions.length / 3,
        tan1 = [],
        tan2 = [];

    for (let i = 0; i < nVertices; i++)
    {
        tan1[i] = vec3.create();
        tan2[i] = vec3.create();
    }

    const
        vA = vec3.create(),
        vB = vec3.create(),
        vC = vec3.create(),
        uvA = vec2.create(),
        uvB = vec2.create(),
        uvC = vec2.create(),
        sdir = vec3.create(),
        tdir = vec3.create();

    function handleTriangle(a, b, c)
    {
        vec3.fromArray(vA, positions, a * 3);
        vec3.fromArray(vB, positions, b * 3);
        vec3.fromArray(vC, positions, c * 3);

        vec2.fromArray(uvA, uvs, a * 2);
        vec2.fromArray(uvB, uvs, b * 2);
        vec2.fromArray(uvC, uvs, c * 2);

        vec3.subtract(vB, vB, vA);
        vec3.subtract(vC, vC, vA);

        vec2.subtract(uvB, uvB, uvA);
        vec2.subtract(uvC, uvC, uvA);

        const r = 1.0 / (uvB[0] * uvC[1] - uvC[0] * uvB[1]);
        if (!isFinite(r)) return;

        vec3.copy(sdir, vB);
        vec3.multiplyScalar(sdir, sdir, uvC[1]);
        vec3.scaleAndAdd(sdir, sdir, vC, -uvB[1]);
        vec3.multiplyScalar(sdir, sdir, r);

        vec3.copy(tdir, vC);
        vec3.multiplyScalar(tdir, tdir, uvB[0]);
        vec3.scaleAndAdd(tdir, tdir, vC, -uvC[0]);
        vec3.multiplyScalar(tdir, tdir, r);

        vec3.add(tan1[a], tan1[a], sdir);
        vec3.add(tan1[b], tan1[b], sdir);
        vec3.add(tan1[c], tan1[c], sdir);

        vec3.add(tan2[a], tan2[a], tdir);
        vec3.add(tan2[b], tan2[b], tdir);
        vec3.add(tan2[c], tan2[c], tdir);
    }

    if (!areas || areas.length === 0)
    {
        areas = [ { start: 0, count: indices.length } ];
    }

    for (let i = 0; i < areas.length; ++i)
    {
        const { start, count } = areas[i];

        for (let j = start; j < start + count; j += 3)
        {
            handleTriangle(indices[j], indices[j + 1], indices[j + 2]);
        }
    }

    const
        tmp = vec3.create(),
        tmp2 = vec3.create(),
        n = vec3.create(),
        n2 = vec3.create();

    function handleVertex(v)
    {
        vec3.fromArray(n, normals, v * 3);
        vec3.copy(n2, n);

        const t = tan1[v];

        vec3.copy(tmp, t);
        vec3.multiplyScalar(n, n, vec3.dot(n, t));
        vec3.subtract(tmp, tmp, n);
        vec3.normalize(tmp, tmp);

        vec3.cross(tmp2, n2, t);

        const w = vec3.dot(tmp2, tan2[v]) < 0
            ? -calculateTangents.handedness
            : calculateTangents.handedness;

        tangents[v * 4] = tmp[0];
        tangents[v * 4 + 1] = tmp[1];
        tangents[v * 4 + 2] = tmp[2];
        tangents[v * 4 + 3] = w;
    }

    for (let i = 0; i < areas.length; ++i)
    {
        const { start, count } = areas[i];

        for (let j = start; j < start + count; j += 3)
        {
            handleVertex(indices[j]);
            handleVertex(indices[j + 1]);
            handleVertex(indices[j + 2]);
        }
    }

    return tangents;
}

calculateTangents.handedness = 1.0;
