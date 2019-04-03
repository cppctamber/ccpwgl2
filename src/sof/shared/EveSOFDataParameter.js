import {vec4} from "../../global";


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
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["name", r.string],
            ["value", r.vector4]
        ];
    }
}