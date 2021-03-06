import { meta } from "utils";
import { Tw2Curve } from "curve";


@meta.type("Tw2MayaScalarCurve")
export class Tw2MayaScalarCurve extends Tw2Curve
{

    @meta.float
    index = -1;

    @meta.struct("Tw2MayaAnimationEngine")
    animationEngine = null;

    @meta.float
    @meta.isPrivate
    value = 0;

    @meta.float
    @meta.isPrivate
    length = 0;


    /**
     * Sorts the curve
     */
    Sort()
    {
        this.ComputeLength();
    }

    /**
     * Gets the curve's length
     * @returns {number}
     */
    GetLength()
    {
        return this.length;
    }

    /**
     * Updates a value at a specific time
     * @param {number} time
     */
    UpdateValue(time)
    {
        if (this.animationEngine)
        {
            this.value = this.animationEngine.Evaluate(this.index, time);
        }
    }

    /**
     * Computes curve Length
     */
    ComputeLength()
    {
        if (!this.animationEngine || this.animationEngine.GetNumberOfCurves() === 0) return;
        if (this.index >= 0) this.length = this.animationEngine.GetLength(this.index);
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
    static curveType = Tw2Curve.Type.CURVE_MAYA;

}
