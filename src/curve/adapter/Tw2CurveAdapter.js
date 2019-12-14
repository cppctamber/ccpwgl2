import { meta } from "global";
import { Tw2Curve } from "../curve/Tw2Curve";

/**
 * Tw2CurveAdapter
 *
 * @property {String} name
 * @property {Tw2Curve} curve
 * @property {Float32Array} value
 */
export class Tw2CurveAdapter extends Tw2Curve
{

    @meta.string
    name = "";

    @meta.object
    curve = null;

    @meta.unknown
    value = null;

    /**
     * Sorts the curve
     */
    Sort()
    {
        if (this.curve)
        {
            this.curve.Sort();
        }
    }

    /**
     * Updates the adapter's value
     */
    UpdateValue(time)
    {
        this.GetValueAt(time, this.value);
    }

    /**
     * The adapter's current value property
     * @type {?String}
     */
    static valueProperty = "value";

    /**
     * Curve type
     * @type {number}
     */
    static curveType = Tw2Curve.Type.ADAPTER;

}
