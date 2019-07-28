import {Tw2CurveAdapter} from "./Tw2CurveAdapter";
import {vec4} from "../../global";

/**
 * Tr2RotationAdapter
 *
 * @property {vec4} value -
 */
export class Tr2RotationAdapter extends Tw2CurveAdapter
{

    value = vec4.create();

    /**
     * The curve's current value property
     * @type {?String}
     */
    static valueProperty = "value";

    /**
     * The sequencer's output dimension
     * @type {number}
     */
    static outputDimension = 4;

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["curve", r.object],
            ["value", r.vector4]
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}
