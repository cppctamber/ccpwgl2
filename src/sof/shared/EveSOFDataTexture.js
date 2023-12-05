import { meta } from "utils";


@meta.type("EveSOFDataTexture")
export class EveSOFDataTexture extends meta.Model
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

    /**
     *
     * @param {Array<EveSOFDataTexture>} a
     * @param {Array<EveSOFDataTexture>} [b]
     * @param {Array<EveSOFDataTexture>} [out=[]]
     * @returns {Array<EveSOFDataTexture>}
     */
    static combineArrays(a, b, out = [])
    {
        // Remove unused textures
        const validTextureNames = a.map(x => x.name);
        for (let i = 0; i < out.length; i++)
        {
            if (!validTextureNames.includes(out[i].name))
            {
                out.splice(i, 1);
                i--;
            }
        }

        for (let i = 0; i < a.length; i++)
        {
            const { name, resFilePath } = a[i];
            let found = out.find(x => x.name === name);
            if (!found)
            {
                found = new EveSOFDataTexture();
                found.name = name;
                out.push(found);
            }
            const foundB = b ? b.find(x => x.name === name) : null;
            found.resFilePath = foundB ? foundB.resFilePath : resFilePath;
        }

        return out;
    }
}
