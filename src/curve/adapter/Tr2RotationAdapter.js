import {Tw2CurveAdapter} from "./Tw2CurveAdapter";
import {vec4} from "../../global";

/**
 * Tr2RotationAdapter
 * @ccp Tr2RotationAdapter
 *
 * @property {vec4} value - rotation
 */
export class Tr2RotationAdapter extends Tw2CurveAdapter
{

    value = vec4.create();

    /**
     * Gets value at a given time
     * @param {Number} time
     * @param {*} value
     */
    GetValueAt(time, value)
    {
        if (this.curve)
        {
            this.curve.GetValueAt(time, this.value);
        }

        return vec4.copy(value, this.value);
    }

    /**
     * The adapter's output dimension
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
