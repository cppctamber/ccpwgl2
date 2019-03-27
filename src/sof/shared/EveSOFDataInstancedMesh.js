import {EveSOFBaseClass} from "../EveSOFBaseClass";

/**
 * EveSOFDataInstancedMesh
 *
 * @property {String} name                        -
 * @property {String} geometryResPath             -
 * @property {Array.} instances                   -
 * @property {Number} lowestLodVisible            -
 * @property {String} shader                      -
 * @property {Array.<EveSOFDataTexture>} textures -
 */
export class EveSOFDataInstancedMesh extends EveSOFBaseClass
{

    name = "";
    geometryResPath = "";
    instances = [];
    lowestLodVisible = 0;
    shader = "";
    textures = [];

}

/**
 * Instanced Mesh instance reader
 */
class EveSOFDataInstancedMeshInstanceReader
{
    constructor(data)
    {
        this.data = data;
    }

    static ReadStruct(reader)
    {
        let data = [
            reader.ReadF32(),
            reader.ReadF32(),
            reader.ReadF32(),
            reader.ReadF32(),
            reader.ReadF32(),
            reader.ReadF32(),
            reader.ReadF32(),
            reader.ReadF32(),
            reader.ReadF32(),
            reader.ReadF32(),
            reader.ReadF32()
        ];

        return new EveSOFDataInstancedMeshInstanceReader(data);
    }
}


EveSOFDataInstancedMesh.define(r =>
{
    return {
        type: "EveSOFDataInstancedMesh",
        black: [
            ["geometryResPath", r.path],
            ["instances", r.structList(EveSOFDataInstancedMeshInstanceReader)],
            ["lowestLodVisible", r.uint],
            ["name", r.string],
            ["shader", r.string],
            ["textures", r.array]
        ]
    };
});

