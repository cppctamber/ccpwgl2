import {Tw2Curve} from "./Tw2Curve";
import {noise} from "../../global/math";

/**
 * Perlin curve
 * @ccp TriPerlinCurve
 *
 * @property {Number} N      -
 * @property {Number} alpha  -
 * @property {Number} beta   -
 * @property {Number} offset -
 * @property {Number} scale  -
 * @property {Number} speed  -
 * @property {Number} value  -
 */
export class Tw2PerlinCurve extends Tw2Curve
{

    N = 0;
    alpha = 0;
    beta = 0;
    offset = 0;
    scale = 0;
    speed = 0;
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

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["alpha", r.float],
            ["beta", r.float],
            ["N", r.uint],
            ["name", r.string],
            ["offset", r.float],
            ["scale", r.float],
            ["speed", r.float],
            ["value", r.float]
        ];
    }

}