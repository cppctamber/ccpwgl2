import { meta } from "global";


@meta.type("EveSOFDataGenericDecalShader", true)
export class EveSOFDataGenericDecalShader
{

    @meta.black.listOf("EveSOFDataTexture")
    defaultTextures = [];

    @meta.black.listOf("EveSOFDataGenericString")
    parameters = [];

    @meta.black.listOf("EveSOFDataGenericString")
    parentTextures = [];

    @meta.black.string
    shader = "";


    /**
     * Assigns the shader's parameters to an object
     * @param {Object} [out={}]
     * @param {Object} [provided]
     * @returns {Object} out
     */
    Assign(out={}, provided)
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

            if (provided && str in provided)
            {
                console.log("Providing texture: ", str);
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
