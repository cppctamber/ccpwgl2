import { vec4 } from "global";


/**
 * EveSOFDataParameter
 *
 * @property {String} name -
 * @property {vec4} value  -
 */
export class EveSOFDataParameter
{

    name = "";
    value = vec4.create();

    /**
     * Assigns the parameter's values to an object
     * @param {{}} [out]
     * @param {String} [prefix]
     * @return {{}} out
     */
    Assign(out = {}, prefix)
    {
        out[prefix ? prefix + this.name : this.name] = Array.from(this.value);
        return out;
    }

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "name", r.string ],
            [ "value", r.vector4 ]
        ];
    }
}
