import { meta } from "utils";
import { vec4 } from "math";


@meta.type("EveSOFDataParameter")
export class EveSOFDataParameter
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

}
