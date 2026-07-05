import { vec2, vec3 } from "math";


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
