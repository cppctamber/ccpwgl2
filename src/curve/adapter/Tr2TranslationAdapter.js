import {vec3, Tw2BaseClass} from "../../global";

/**
 * Tr2TranslationAdapter
 *
 * @property {Curve|CurveExpression} curve -
 * @property {vec4} value
 */
export class Tr2TranslationAdapter extends Tw2BaseClass
{

    curve = null;
    value = vec3.create();

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["curve", r.object],
            ["value", r.vector3]
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}
