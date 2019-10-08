import { Tw2Curve } from "../curve/Tw2Curve";

/**
 * Tw2CurveAdapter
 * @ccp n/a
 *
 * @property {String} name
 * @property {Tw2Curve} curve
 * @property {Float32Array} value
 */
export class Tw2CurveAdapter extends Tw2Curve
{

    name = "";
    curve = null;
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
