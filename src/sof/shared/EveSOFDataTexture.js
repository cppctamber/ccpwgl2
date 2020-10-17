import { meta } from "utils";


@meta.ctor("EveSOFDataTexture")
export class EveSOFDataTexture
{

    @meta.string
    name = "";

    @meta.path
    resFilePath = "";


    /**
     * Assigns the textures value to an object
     * @param {{}} out
     * @returns {{}} out
     */
    Assign(out = {})
    {
        out[this.name] = this.resFilePath;
        return out;
    }

}
