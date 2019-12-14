import { meta } from "global";
import { Tw2Curve } from "../Tw2Curve";

/**
 * Tw2RandomConstantCurve
 *
 * @property {number} currentValue
 * @property {number} min
 * @property {number} max
 * @property {Boolean} hold
 */
@meta.type("Tw2RandomConstantCurve")
export class Tw2RandomConstantCurve extends Tw2Curve
{

    @meta.float
    @meta.isPrivate
    value = 0;

    @meta.float
    min = 0;

    @meta.float
    max = 1;

    @meta.boolean
    hold = true;


    /**
     * Sorts the curve
     */
    Sort()
    {
        // No operation
    }

    /**
     * Gets the curve's length
     * @returns {number}
     */
    GetLength()
    {
        return 0;
    }

    /**
     * Updates the current value at the given time
     */
    UpdateValue()
    {
        this.value = this.GetValueAt();
    }

    /**
     * Gets a value at a specific time
     * @returns {number}
     */
    GetValueAt()
    {
        return this.hold ? this.value : this.min + (this.max - this.min) * Math.random();
    }

    /**
     * The curve's dimension
     * @type {number}
     */
    static outputDimension = 1;

    /**
     * The curve's current value property
     * @type {String}
     */
    static valueProperty = "value";

    /**
     * The curve's type
     * @type {number}
     */
    static curveType = Tw2Curve.Type.CURVE_NO_KEYS;

}
