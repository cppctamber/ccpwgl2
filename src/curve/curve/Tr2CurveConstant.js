import {vec4, Tw2BaseClass} from "../../global";

/**
 * Tr2CurveConstant
 * @ccp Tr2CurveConstant
 *
 * @property {String} name -
 * @property {vec4} value  -
 */
export class Tr2CurveConstant extends Tw2BaseClass
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
            ["value", r.vector4],
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}
