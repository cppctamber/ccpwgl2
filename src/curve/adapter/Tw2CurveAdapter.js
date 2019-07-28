import {Tw2BaseClass} from "../../global/class";
import {Tw2Curve} from "../curve/Tw2Curve";

export function Tw2CurveAdapter()
{
    Tw2BaseClass.defineID(this);
    this.name = "";
    this.curve = null;
    this.value = null;
}

Tw2CurveAdapter.prototype = Object.assign(Object.create(Tw2BaseClass.prototype), {

    constructor: Tw2CurveAdapter,

    /**
     * Updates the adapter's value
     */
    UpdateValue(time)
    {
        this.GetValueAt(time, this.value);
    },

    /**
     *
     * @param time
     * @param value
     * @constructor
     */
    GetValueAt(time, value)
    {
        if (this.curve)
        {
            this.curve.UpdateValue(time);
            const targetValue = this.curve[this.curve.constructor.valueProperty];
            for (let i = 0; i < this.value.length; i++)
            {
                this.value[i] = targetValue[i];
            }
        }
    }

});

/**
 * Curve type
 * @type {number}
 */
Tw2CurveAdapter.curveType = Tw2Curve.Type.ADAPTER;