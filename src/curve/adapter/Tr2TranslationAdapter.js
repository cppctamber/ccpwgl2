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
     * The curve's current value property
     * @type {?String}
     */
    static valueProperty = "value";

    /**
     * The sequencer's output dimension
     * @type {number}
     */
    static outputDimension = 3;

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
