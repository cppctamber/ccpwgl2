/**
 * Instanced Mesh instance reader
 */
class EveSOFDataInstancedMeshInstanceReader
{
    constructor(data)
    {
        this.data = data;
    }

    static blackStruct(reader)
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
export class EveSOFDataInstancedMesh
{

    name = "";
    geometryResPath = "";
    instances = [];
    lowestLodVisible = 0;
    shader = "";
    textures = [];

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "geometryResPath", r.path ],
            [ "instances", r.structList(EveSOFDataInstancedMeshInstanceReader) ],
            [ "lowestLodVisible", r.uint ],
            [ "name", r.string ],
            [ "shader", r.string ],
            [ "textures", r.array ]
        ];
    }
}
