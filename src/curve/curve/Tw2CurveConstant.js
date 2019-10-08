import { vec4 } from "../../global";
import { Tw2Curve } from "./Tw2Curve";

/**
 * Constant curve
 * TODO: Is this a curve or a key?
 * @ccp Tr2CurveConstant
 *
 * @property {vec4} value  -
 */
export class Tw2CurveConstant extends Tw2Curve
{

    value = vec4.create();

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
     * @param {number} [time]
     * @param {vec4} value
     */
    UpdateValue(time, value)
    {
        vec4.copy(value, this.value);
    }

    /**
     * The curve's dimension
     * @type {?number}
     */
    static inputDimension = 4;

    /**
     * The curve's dimension
     * @type {?number}
     */
    static outputDimension = 4;

    /**
     * The curve's current value property
     * @type {?String}
     */
    static valueProperty = "value";

    /**
     * The curve's type
     * @type {?number}
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
            [ "name", r.string ],
            [ "value", r.vector4 ],
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}
