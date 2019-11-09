import { vec3 } from "global";
import { Tw2CurveAdapter } from "./Tw2CurveAdapter";

/**
 * Tr2TranslationAdapter
 * @ccp Tr2TranslationAdapter
 *
 * @property {vec3} value - translation
 */
export class Tr2TranslationAdapter extends Tw2CurveAdapter
{

    value = vec3.create();

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

        vec3.copy(value, this.value);
    }

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
            [ "curve", r.object ],
            [ "value", r.vector3 ]
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}
