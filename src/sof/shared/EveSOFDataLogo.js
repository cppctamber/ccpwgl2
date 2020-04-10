import { meta } from "global";


@meta.type("EveSOFDataLogo", true)
export class EveSOFDataLogo
{

    @meta.black.listOf("EveSOFDataTexture")
    textures = [];

    /**
     * Assigns the logo's textures to an object
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
