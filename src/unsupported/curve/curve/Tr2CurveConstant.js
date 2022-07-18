import { meta } from "utils";
import { vec4 } from "math";
import { Tw2Curve } from "curve";


@meta.notImplemented
@meta.type("Tw2CurveConstant")
@meta.todo("Is this a curve or a key?")
export class Tr2CurveConstant extends Tw2Curve
{

    @meta.string
    name = "";

    @meta.vector4
    value = vec4.create();

    /**
     * Alias for value
     * @returns {vec4}
     */
    get currentValue()
    {
        return this.value;
    }

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

}
