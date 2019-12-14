import { meta, vec3 } from "global";
import { Tw2CurveAdapter } from "./Tw2CurveAdapter";

/**
 * Tr2TranslationAdapter
 *
 * @property {Tw2Curve} curve -
 * @property {vec3} value     -
 */
export class Tr2TranslationAdapter extends Tw2CurveAdapter
{

    @meta.black.object
    curve = null;

    @meta.black.vector3
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

}
