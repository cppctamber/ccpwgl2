import { meta } from "global";


@meta.type("EveSOFDataHullArea", true)
export class EveSOFDataHullArea
{

    @meta.black.string
    name = "";

    @meta.black.uint
    areaType = 0;

    @meta.black.uint
    blockedMaterials = 0;

    @meta.black.uint
    count = 1;

    @meta.black.uint
    index = 0;

    @meta.black.listOf("EveSOFDataParameter")
    parameters = [];

    @meta.black.string
    shader = "";

    @meta.black.listOf("EveSOFDataTexture")
    textures = [];

    /**
     * Assigns the area's textures and parameters to an object
     * @param {Object} [out={}]
     * @returns {{}} out
     */
    Assign(out={})
    {
        out.parameters = this.AssignParameters(out.parameters);
        out.textures = this.AssignTextures(out.textures);
        return out;
    }

    /**
     * Assigns the area's parameters to an object
     * @param {Object} [out={}]
     * @returns {Object} out
     */
    AssignParameters(out={})
    {
        for (let i = 0; i < this.parameters.length; i++)
        {
            this.parameters[i].Assign(out);
        }
        return out;
    }

    /**
     * Assigns the area's textures to an object
     * @param {Object} [out={}]
     * @returns {Object} out
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
