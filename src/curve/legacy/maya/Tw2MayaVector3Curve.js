import { meta } from "utils";
import { vec3 } from "math";
import { Tw2Curve } from "curve";


@meta.ctor("Tw2MayaVector3Curve")
export class Tw2MayaVector3Curve extends Tw2Curve
{

    @meta.float
    xIndex = -1;

    @meta.float
    yIndex = -1;

    @meta.float
    zIndex = -1;

    @meta.struct("Tw2MayaAnimationEngine")
    animationEngine = null;

    @meta.vector3
    @meta.isPrivate
    value = vec3.create();

    @meta.float
    @meta.isPrivate
    length = 0;


    /**
     * Sorts the curve's keys
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
            if (this.xIndex)
            {
                this.value[0] = this.animationEngine.Evaluate(this.xIndex, time);
            }

            if (this.yIndex)
            {
                if (this.yIndex === this.xIndex)
                {
                    this.value[1] = this.value[0];
                }
                else
                {
                    this.value[1] = this.animationEngine.Evaluate(this.yIndex, time);
                }
            }

            if (this.zIndex)
            {
                if (this.zIndex === this.xIndex)
                {
                    this.value[2] = this.value[0];
                }
                else
                {
                    this.value[2] = this.animationEngine.Evaluate(this.zIndex, time);
                }
            }
        }
    }

    /**
     * Computes curve Length
     */
    ComputeLength()
    {
        if (!this.animationEngine || this.animationEngine.GetNumberOfCurves() === 0) return;

        this.length = 0;
        if (this.xIndex >= 0)
        {
            this.length = this.animationEngine.GetLength(this.xIndex);
        }

        if (this.yIndex >= 0)
        {
            this.length = Math.max(this.length, this.animationEngine.GetLength(this.yIndex));
        }

        if (this.zIndex >= 0)
        {
            this.length = Math.max(this.length, this.animationEngine.GetLength(this.zIndex));
        }
    }

    /**
     * The curve's dimension
     * @type {number}
     */
    static outputDimension = 3;

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
