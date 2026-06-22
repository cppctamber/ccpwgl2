import { toArray } from "utils";
import { calculateNormals, calculateTangents } from "../vertex";


function isAreaLike(value)
{
    if (!value) return false;
    if (Array.isArray(value)) return !!value.length && typeof value[0] === "object" && value[0] !== null && "start" in value[0];
    return typeof value === "object" && "start" in value;
}


/**
 * Converts index and vertex buffer data to geometry json
 * @param {Array|TypedArray} indices
 * @param {Array|TypedArray} positions
 * @param {Array|TypedArray} uvs
 * @param {Array|TypedArray|Array|Object} [normals]
 * @param {Array|Object} [areas]
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

    if (isAreaLike(normals))
    {
        const temp = areas;
        areas = normals;
        normals = temp;
    }

    areas = toArray(areas || { start: 0, count: indices.length });

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
            name: "",
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
                    faces: indices.slice(area.start, area.start + area.count)
                };
            })
        } ]
    };
}


/**
 * Creates a mesh container from geometry json
 * @param {Object} tw2
 * @param {Object} json
 * @param {String} [name=""]
 * @param {Object} [autoCreateMeshAreas={}]
 * @returns {Object}
 */
export function toContainer(tw2, json, name = "", autoCreateMeshAreas = {})
{
    const
        container = new tw2.EveChildMesh(),
        mesh = container.mesh = new tw2.Tw2Mesh(),
        res = mesh.geometryResource = new tw2.Tw2GeometryRes();

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
