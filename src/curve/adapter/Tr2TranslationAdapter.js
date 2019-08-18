import {vec3} from "../../global";
import {Tw2CurveAdapter} from "./Tw2CurveAdapter";

/**
 * Tr2TranslationAdapter
 *
 * @property {vec3} value -
 */
export class Tr2TranslationAdapter extends Tw2CurveAdapter
{

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
