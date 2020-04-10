import { meta } from "global";


@meta.type("EveSOFDataGenericShader", true)
export class EveSOFDataGenericShader
{

    @meta.black.listOf("EveSOFDataParameter")
    defaultParameters = [];

    @meta.black.listOf("EveSOFDataTexture")
    defaultTextures = [];

    @meta.notImplemented
    @meta.black.boolean
    doGenerateDepthArea = false;

    @meta.black.listOf("EveSOFDataGenericString")
    parameters = [];

    @meta.black.path
    shader = "";

    @meta.notImplemented
    @meta.black.string
    transparencyTextureName = "";

    /**
     * Checks if the effect has pattern mask maps
     * @returns {boolean}
     */
    HasPatternMaskMaps()
    {
        for (let i = 0; i < this.parameters.length; i++)
        {
            if (EveSOFDataGenericShader.PatternMaskMaps.includes(this.parameters[i].str))
            {
                return true;
            }
        }
        return false;
    }

    /**
     * Assigns the shader's parameters
     * @param {Object} [out={}]
     * @param {Object} [provided]
     * @returns {Object} out
     */
    Assign(out = {}, provided)
    {
        out.parameters = this.AssignParameters(out.parameters, provided ? provided.parameters : undefined);
        out.textures = this.AssignTextures(out.textures, provided ? provided.textures : undefined);
        return out;
    }

    /**
     * Assigns the shader's parameters to an object
     * @param {Object} [out={}]
     * @param {Object} [provided]
     * @return {Object} out
     */
    AssignParameters(out = {}, provided)
    {
        for (let i = 0; i < this.defaultParameters.length; i++)
        {
            this.defaultParameters[i].Assign(out);
        }

        if (provided)
        {
            for (let i = 0; i < this.parameters.length; i++)
            {
                const { str } = this.parameters[i];
                if (provided[str] !== undefined)
                {
                    out[str] = provided[str];
                }
            }
        }

        return out;
    }

    /**
     * Assigns the shader's textures to an object
     * @param {Object} [out={}]
     * @param {Object} [provided] - unused
     * @returns {Object} out
     */
    AssignTextures(out = {}, provided)
    {
        for (let i = 0; i < this.defaultTextures.length; i++)
        {
            this.defaultTextures[i].Assign(out);
        }
        return out;
    }

    /**
     * Pattern mask maps
     * @type {string[]}
     */
    static PatternMaskMaps = [ "PatternMask1Map", "PatternMask2Map" ];

}
