import { meta } from "utils";


@meta.type("EveSOFDataInstancedMeshInstanceReader")
class EveSOFDataInstancedMeshInstanceReader extends meta.Model
{

    @meta.vector
    data = null;

    static blackStruct(reader)
    {
        const item = new EveSOFDataInstancedMeshInstanceReader();
        item.data = reader.ReadF32Array(11);
        return item;
    }
}


@meta.type("EveSOFDataInstancedMesh")
export class EveSOFDataInstancedMesh extends meta.Model
{

    @meta.string
    name = "";

    @meta.uint
    @meta.todo("Figure out constants")
    displayModifier = 0;

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
    AssignTextures(out = {})
    {
        for (let i = 0; i < this.textures.length; i++)
        {
            this.textures[i].Assign(out);
        }
        return out;
    }

}
