import { meta } from "global";


@meta.type("EveSOFDataTexture", true)
export class EveSOFDataTexture
{

    @meta.black.string
    name = "";

    @meta.black.path
    resFilePath = "";


    /**
     * Assigns the texture's values to an object
     * @param {{}} [out={}]
     * @returns {{}}
     */
    Assign(out = {})
    {
        out[this.name] = this.resFilePath;
        return out;
    }

}
