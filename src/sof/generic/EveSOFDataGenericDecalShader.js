import { meta } from "utils";


@meta.type("EveSOFDataGenericDecalShader")
export class EveSOFDataGenericDecalShader extends meta.Model
{


    @meta.boolean
    additive = true; // Unknown default value

    @meta.list("EveSOFDataTexture")
    defaultTextures = [];

    @meta.list("EveSOFDataGenericString")
    parameters = [];

    @meta.list("EveSOFDataGenericString")
    parentTextures = [];

    @meta.string
    shader = "";

    /**
     * Checks if the shader uses parameter or texture usage by name
     * @param {String} name
     * @returns {Object<name:String, value:String:Array>}
     */
    HasUsage(name)
    {
        if (!name) return false;

        if (this.transparencyTextureName === name) return true;

        for (let i = 0; i < this.defaultParameters.length; i++)
        {
            if (this.defaultParameters[i].name === name) return true;
        }

        for (let i = 0; i < this.parameters.length; i++)
        {
            if (this.parameters[i].str === name) return true;
        }

        for (let i = 0; i < this.defaultTextures.length; i++)
        {
            if (this.defaultTextures[i].name === name) return true;
        }

        for (let i = 0; i < this.parentTextures.length; i++)
        {
            if (this.parentTextures[i].name === name) return true;
        }

        return false;
    }

    /**
     * Assigns the object's textures and parameters to an effect config
     * @param {Object} config={}]
     * @param {Object} [provided={}]
     * @returns {Object} config
     */
    Assign(config = {}, provided = {})
    {
        config.textures = this.AssignTextures(config.textures, provided.textures);
        config.parameters = this.AssignParameters(config.parameters, provided.parameters);
        return config;
    }

    /**
     * Assigns the shader's parameters to a plain object
     * @param {Object} [out={}]
     * @param {Object} [provided]
     * @returns {Object} out
     */
    AssignParameters(out = {}, provided)
    {
        for (let i = 0; i < this.parameters.length; i++)
        {
            const { str } = this.parameters[i];

            if (provided && provided[str])
            {
                out[str] = Array.from(provided[str]);
            }
            else
            {
                out[str] = [ 0, 0, 0, 1 ];
            }
        }

        return out;
    }

    /**
     * Assigns the shader's textures as a plain object
     * @param {Object} [out={}]
     * @param {Object} [provided]
     * @returns {Object} out
     */
    AssignTextures(out = {}, provided)
    {
        for (let i = 0; i < this.defaultTextures.length; i++)
        {
            this.defaultTextures[i].Assign(out);
        }

        for (let i = 0; i < this.parentTextures.length; i++)
        {
            const { str } = this.parentTextures[i];

            if (provided && provided[str])
            {
                out[str] = provided[str];
            }
            else if (!out[str])
            {
                out[str] = "";
            }
        }

        return out;
    }
}
