import { meta, noise } from "global";
import { Tw2Curve } from "./Tw2Curve";

/**
 * Perlin curve
 *
 * @property {Number} N      -
 * @property {Number} alpha  -
 * @property {Number} beta   -
 * @property {Number} offset -
 * @property {Number} scale  -
 * @property {Number} speed  -
 * @property {Number} value  -
 */
@meta.type("Tw2PerlinCurve", "TriPerlinCurve")
export class Tw2PerlinCurve extends Tw2Curve
{

    @meta.black.string
    name = "";

    @meta.black.float
    alpha = 0;

    @meta.black.float
    beta = 0;

    @meta.black.uint
    N = 0;

    @meta.black.float
    offset = 0;

    @meta.black.float
    scale = 0;

    @meta.black.float
    speed = 0;

    @meta.black.float
    @meta.isPrivate
    value = 0;

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
        time -= this.offset;
        return ((noise.perlin1D(time * this.speed, this.alpha, this.beta, this.N) + 1) / 2) * this.scale + this.offset;
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
