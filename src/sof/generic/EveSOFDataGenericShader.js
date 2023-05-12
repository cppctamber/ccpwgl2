import { meta } from "utils";


@meta.type("EveSOFDataGenericShader")
export class EveSOFDataGenericShader extends meta.Model
{

    @meta.list("EveSOFDataParameter")
    defaultParameters = [];

    @meta.list("EveSOFDataTexture")
    defaultTextures = [];

    @meta.notImplemented
    @meta.boolean
    doGenerateDepthArea = false;

    @meta.list("EveSOFDataGenericString")
    parameters = [];

    @meta.path
    shader = "";

    @meta.notImplemented
    @meta.string
    transparencyTextureName = "";

    /**
     * Checks if the shader uses parameter or texture usage by name
     * @param {String} key
     * @returns {Object<name:String, value:String:Array>}
     */
    HasUsage(key)
    {
        if (!key) return false;

        if (this.transparencyTextureName === key) return true;

        for (let i = 0; i < this.defaultParameters.length; i++)
        {
            if (this.defaultParameters[i].name === key) return true;
        }

        for (let i = 0; i < this.parameters.length; i++)
        {
            if (this.parameters[i].str === key) return true;
        }

        for (let i = 0; i < this.defaultTextures.length; i++)
        {
            if (this.defaultTextures[i].name === key) return true;
        }

        return false;
    }

    /**
     * Checks if the effect has pattern mask maps
     * @returns {boolean}
     */
    get hasPatternMaskMaps()
    {
        for (let i = 0; i < this.defaultTextures.length; i++)
        {
            if (EveSOFDataGenericShader.PatternMaskMaps.includes(this.defaultTextures[i].name))
            {
                return true;
            }
        }
        return false;
    }

    /**
     * Assigns the object's textures and parameters to an effect config
     * @param {Object} [config={}]]
     * @param  {object} [provided={}]
     * @returns {Object} config
     */
    Assign(config = {}, provided = {})
    {
        //config.effectFilePath = this.shader;
        config.textures = this.AssignTextures(config.textures, provided.textures);
        config.parameters = this.AssignParameters(config.parameters, provided.parameters);
        return config;
    }

    /**
     * Assigns the shader's parameters to an object
     * @param {Object} [out={}]
     * @param {Object} [provided]
     * @returns {Object} out
     */
    AssignParameters(out = {}, provided)
    {
        for (let i = 0; i < this.defaultParameters.length; i++)
        {
            this.defaultParameters[i].Assign(out);
        }

        for (let i = 0; i < this.parameters.length; i++)
        {
            const { str } = this.parameters[i];

            if (provided && provided[str])
            {
                out[str] = Array.from(provided[str]);
            }
            else if (out[str])
            {
                out[str] = [ 0, 0, 0, 1 ];
            }
        }

        return out;
    }

    /**
     * Assigns the shader's textures to an object
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

        // No way to know what textures are allowed
        return Object.assign(out, provided);
    }

    /**
     * Pattern mask maps
     * @type {string[]}
     */
    static PatternMaskMaps = [ "PatternMask1Map", "PatternMask2Map" ];

}
