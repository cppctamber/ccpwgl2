import { vec2, vec3 } from "math";
import { isArray, toArray } from "utils";


export function calculateNormals(indices, positions)
{
    const normals = [];

    for (let i = 0; i < positions.length; i++)
    {
        normals[i] = 0.0;
    }

    const
        pA = vec3.create(),
        pB = vec3.create(),
        pC = vec3.create();

    const
        nA = vec3.create(),
        nB = vec3.create(),
        nC = vec3.create();

    const
        cb = vec3.create(),
        ab = vec3.create();

    for (let i = 0, il = indices.length; i < il; i += 3)
    {
        const vA = indices[i + 0];
        const vB = indices[i + 1];
        const vC = indices[i + 2];

        vec3.fromArray(pA, positions, vA);
        vec3.fromArray(pB, positions, vB);
        vec3.fromArray(pC, positions, vC);

        vec3.subtract(cb, pC, pB);
        vec3.subtract(ab, pA, pB);
        vec3.cross(cb, cb, ab);

        vec3.fromArray(nA, normals, vA);
        vec3.fromArray(nB, normals, vB);
        vec3.fromArray(nC, normals, vC);

        vec3.add(nA, nA, cb);
        vec3.add(nB, nB, cb);
        vec3.add(nC, nC, cb);

        normals[vA+0] = nA[0];
        normals[vA+1] = nA[1];
        normals[vA+2] = nB[2];
        normals[vB+0] = nB[0];
        normals[vB+1] = nB[1];
        normals[vB+2] = nB[2];
        normals[vC+0] = nB[0];
        normals[vC+1] = nB[1];
        normals[vC+2] = nB[2];
    }

    for (let i = 0, il = normals.length; i < il; i+=3)
    {
        vec3.fromArray(cb, normals, i);
        vec3.normalize(cb, cb);
        normals[i+0] = cb[0];
        normals[i+1] = cb[1];
        normals[i+2] = cb[2];
    }

    return normals;
}


/**
 * Calculates normals
 * @param {Array|TypedArray} indices
 * @param {Array|TypedArray} positions
 * @returns {Array} normals
 */
export function _calculateNormals(indices, positions)
{
    const normals = [];

    for (let i = 0; i < indices.length; i+=3)
    {
        const
            i0 = indices[i + 0],
            i1 = indices[i + 1],
            i2 = indices[i + 2],

            a0 = positions[i0 * 3 + 0],
            a1 = positions[i0 * 3 + 1],
            a2 = positions[i0 * 3 + 2],

            b0 = positions[i1 * 3 + 0],
            b1 = positions[i1 * 3 + 1],
            b2 = positions[i1 * 3 + 2],

            c0 = positions[i2 * 3 + 0],
            c1 = positions[i2 * 3 + 1],
            c2 = positions[i2 * 3 + 2];

        const
            ax = c0 - b0,
            ay = c1 - b1,
            az = c2 - b2,
            bx = a0 - c0,
            by = a1 - c1,
            bz = a2 - c2;

        // Get cross product
        let x = ay * bz - az * by,
            y = az * bx - ax * bz,
            z = ax * by - ay * bx;

        // Normalize
        let len = x * x + y * y + z * z;
        if (len > 0)
        {
            len = 1 / Math.sqrt(len);
            normals[i0 * 3 + 0] = x * len;
            normals[i0 * 3 + 1] = y * len;
            normals[i0 * 3 + 2] = z * len;
        }
        else
        {
            throw new Error("Normalization error");
        }
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

    // based on http://www.terathon.com/code/tangent.html
    // (per vertex tangents)

    if (!normals || !normals.length)
    {
        normals = calculateNormals(indices, positions);
    }

    const tangents = [];

    const
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

        // silently ignore degenerate uv triangles having coincident or colinear vertices
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
        areas[0] = {
            start: 0,
            count: indices.length
        };
    }

    for (let i = 0, il = areas.length; i < il; ++i)
    {
        const
            area = areas[i],
            start = area.start,
            count = area.count;

        for (let j = start, jl = start + count; j < jl; j += 3)
        {
            handleTriangle(
                indices[j + 0],
                indices[j + 1],
                indices[j + 2]
            );
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

        // Gram-Schmidt orthogonalize
        vec3.copy(tmp, t);
        vec3.multiplyScalar(n, n, vec3.dot(n, t));
        vec3.subtract(tmp, tmp, n);
        vec3.normalize(tmp, tmp);

        // Calculate handedness
        vec3.cross(tmp2, n2, t);
        const test = vec3.dot(tmp2, tan2[v]);
        const w = test < 0.0
            ? -calculateTangents.handedness
            : calculateTangents.handedness;

        tangents[v * 4] = tmp[0];
        tangents[v * 4 + 1] = tmp[1];
        tangents[v * 4 + 2] = tmp[2];
        tangents[v * 4 + 3] = w;
    }

    for (let i = 0, il = areas.length; i < il; ++i)
    {
        const
            area = areas[i],
            start = area.start,
            count = area.count;

        for (let j = start, jl = start + count; j < jl; j += 3)
        {
            handleVertex(indices[j + 0]);
            handleVertex(indices[j + 1]);
            handleVertex(indices[j + 2]);
        }
    }

    return tangents;
}

calculateTangents.handedness = 1.0;


/**
 * Converts index and buffer data to json
 * @param {Array|TypedArray} indices
 * @param {Array|TypedArray} positions
 * @param {Array|TypedArray} uvs
 * @param {Array|Object} [areas]
 * @param {Array|TypedArray} [normals]
 * @param {Array|TypedArray} [tangents]
 * @throw If required data is not provided
 * @returns {Object}
 */
export function toJSON(indices, positions, uvs, normals, areas, tangents)
{

    if (!indices || !positions || !uvs || !indices.length || !positions.length || !uvs.length)
    {
        throw new Error("Invalid inputs");
    }

    areas = areas || { start: 0, count: indices.length };
    areas = toArray(areas);

    if (!normals || !normals.length)
    {
        normals = calculateNormals(indices, positions);
    }

    if (!tangents || !tangents.length)
    {
        tangents = calculateTangents(indices, positions, uvs, areas, normals);
    }

    return {
        meshes: [ {
            name,
            vertex: {
                position: positions,
                texcoord0: uvs,
                tangent: tangents,
                normal: normals,
                texcoord1: null,
                binormal: null,
                blendIndice: null,
                blendWeight: null
            },
            indices: areas.map(area =>
            {
                return {
                    bytesPerIndex: area.bytesPerIndex || 2,
                    start: area.start,
                    count: area.count,
                    faces: indices.slice(area.start, area.count)
                };
            })
        } ]
    };
}

export function toContainer(tw2, json, name="", autoCreateMeshAreas={})
{
    const
        container = new tw2.EveChildMesh(),
        mesh = container.mesh = new tw2.Tw2Mesh(),
        res = mesh.geometryResource = new tw2.Tw2GeometryRes;

    container.name = name;
    res.UpdateFromJSON(json);
    res.OnPrepared();

    Object
        .keys(autoCreateMeshAreas)
        .forEach(areaName =>
        {
            const effect = autoCreateMeshAreas[areaName] || {};
            for (let m = 0; m < res.meshes.length; m++)
            {
                for (let a = 0; a < res.meshes[m].areas.length; a++)
                {
                    const meshArea = new tw2.Tw2MeshArea();
                    meshArea.meshIndex = m;
                    meshArea.index = a;
                    meshArea.effect = tw2.Tw2Effect.from(effect);
                    mesh[areaName].push(meshArea);
                }
            }
        });

    return container;
}

// https://knowledge.autodesk.com/support/maya/learn-explore/caas/CloudHelp/cloudhelp/2020/ENU/Maya-Modeling/files/GUID-71B1F48B-52C7-46D2-ADE8-F920AC0DD3F9-htm.html