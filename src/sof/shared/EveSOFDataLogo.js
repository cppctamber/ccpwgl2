import { meta } from "utils";


@meta.type("EveSOFDataLogo")
export class EveSOFDataLogo extends meta.Model
{

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
        return config;
    }


    /**
     * Assigns the logo's textures to an object
     * @param {Object} [out={}]
     * @returns {Object}
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
