import { meta } from "utils";
import { vec4 } from "math";


@meta.type("EveSOFDataParameter")
export class EveSOFDataParameter extends meta.Model
{

    @meta.string
    name = "";

    @meta.vector4
    value = vec4.create();


    /**
     * Assigns the parameters value to an object
     * @param {Object} out
     * @param {String} [prefix] - Optional prefix
     * @returns {Object} out
     */
    Assign(out = {}, prefix)
    {
        const name = prefix ? prefix + this.name : this.name;
        out[name] = Array.from(this.value);
        return out;
    }

    /**
     *
     * @param {Array<EveSOFDataParameter>} a
     * @param {Array<EveSOFDataParameter>} [b]
     * @param {Array<EveSOFDataParameter>} [out=[]]
     * @returns {Array<EveSOFDataParameter>}
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
            const { name, value } = a[i];
            let found = out.find(x => x.name === name);
            if (!found)
            {
                found = new EveSOFDataParameter();
                found.name = name;
                out.push(found);
            }
            const foundB = b ? b.find(x => x.name === name) : null;
            vec4.copy(found.value, foundB ? foundB.value : value);
        }

        return out;
    }
}
