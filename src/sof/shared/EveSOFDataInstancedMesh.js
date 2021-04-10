import { meta } from "utils";


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
        return new EveSOFDataInstancedMeshInstanceReader(reader.ReadF32Array(11));
    }
}


@meta.type("EveSOFDataInstancedMesh")
export class EveSOFDataInstancedMesh
{

    @meta.string
    name = "";

    @meta.path
    geometryResPath = "";

    @meta.list(EveSOFDataInstancedMeshInstanceReader)
    instances = [];

    @meta.uint
    lowestLodVisible = 0;

    @meta.string
    shader = "";

    @meta.list("EveSOFDataTexture")
    textures = [];

    /**
     * Assigns textures to an object
     * @param {Object} [out={}]
     * @return {Object} out
     */
    AssignTextures(out={})
    {
        for (let i = 0; i < this.textures.length; i++)
        {
            this.textures[i].Assign(out);
        }
        return out;
    }

}
