import { Tw2CurveAdapter } from "./Tw2CurveAdapter";
import { meta, vec4 } from "global";

/**
 * Tr2RotationAdapter
 *
 * @property {Tw2Curve} curve -
 * @property {vec4} value     -
 */
@meta.notImplemented
@meta.type("Tr2RotationAdapter")
export class Tr2RotationAdapter extends Tw2CurveAdapter
{

    @meta.black.object
    curve = null;

    @meta.black.vector4
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

}
