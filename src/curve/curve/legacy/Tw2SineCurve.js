import { meta } from "global";
import { Tw2Curve } from "../Tw2Curve";


@meta.type("Tw2SineCurve")
export class Tw2SineCurve extends Tw2Curve
{

    @meta.float
    @meta.isPrivate
    value = 0;

    @meta.float
    offset = 0;

    @meta.float
    scale = 1;

    @meta.float
    speed = 1;

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
     * @param {number} time
     */
    UpdateValue(time)
    {
        this.value = this.GetValueAt(time);
    }

    /**
     * Gets a value at a specific time
     * @param {number} time
     * @returns {number}
     */
    GetValueAt(time)
    {
        return Math.sin(time * Math.PI * 2 * this.speed) * this.scale + this.offset;
    }

    /**
     * THe curve's dimension
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
