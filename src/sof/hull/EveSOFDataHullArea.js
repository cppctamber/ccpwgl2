import { meta } from "utils";


@meta.type("EveSOFDataHullArea")
export class EveSOFDataHullArea
{

    @meta.string
    name = "";

    @meta.uint
    areaType = 0;

    @meta.uint
    blockedMaterials = 0;

    @meta.uint
    count = 1;

    @meta.uint
    index = 0;

    @meta.list("EveSOFDataParameter")
    parameters = [];

    @meta.string
    shader = "";

    @meta.list("EveSOFDataTexture")
    textures = [];

    /**
     * Assigns the object's textures and parameters to an effect config
     * @param {Object} config={}]
     * @returns {Object} config
     */
    Assign(config = {})
    {
        config.textures = this.AssignTextures(config.textures);
        config.parameters = this.AssignParameters(config.parameters);
        return config;
    }

    /**
     * Assigns the area's parameters to an object
     * @param {Object} [out={}]
     * @returns {Object} out
     */
    AssignParameters(out = {})
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
    AssignTextures(out = {})
    {
        for (let i = 0; i < this.textures.length; i++)
        {
            this.textures[i].Assign(out);
        }
        return out;
    }

}
