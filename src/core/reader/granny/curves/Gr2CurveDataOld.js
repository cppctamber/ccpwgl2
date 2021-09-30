import { meta } from "utils";
import { Gr2Curve2 } from "./Gr2Curve2";


@meta.type("Gr2CurveOld")
export class Gr2CurveDataOld extends Gr2Curve2
{

    @meta.float32Array
    knots = new Float32Array(0);

    @meta.float32Array
    controls = new Float32Array(0);


    /**
     * Gets the curve type
     * @return {number}
     */
    GetType()
    {
        switch (this.dimension)
        {
            case 3:
                return Gr2Curve2.Type.POSITION;

            case 4:
                return Gr2Curve2.Type.ROTATION;

            case 9:
                return Gr2Curve2.Type.SCALE_SHEAR;

            default:
                throw new ReferenceError(`Unknown dimension (${this.dimension})`);
        }
    }

    /**
     * Gets knot count
     * @return {number}
     */
    GetKnotCount()
    {
        this.GetType();
        return this.controls / this.dimension;
    }

    /**
     * Gets the curves knots
     * @return {Float32Array}
     */
    GetKnots()
    {
        return this.knots;
    }

    /**
     * Gets a vec3 buffer
     * @return {Float32Array}
     */
    GetVec3Buffer()
    {
        if (this.GetType() === Gr2Curve2.Type.POSITION)
        {
            return this.controls;
        }

        super.GetVec3Buffer();
    }

    /**
     * Gets a quat buffer
     * @return {Float32Array}
     */
    GetQuatBuffer()
    {
        if (this.GetType() === Gr2Curve2.Type.ROTATION)
        {
            return this.controls;
        }

        super.GetQuatBuffer();
    }

    /**
     * Gets a mat3 buffer
     * @return {Float32Array}
     */
    GetMat3Buffer()
    {
        if (this.GetType() === Gr2Curve2.Type.SCALE_SHEAR)
        {
            return this.controls;
        }

        super.GetMat3Buffer();
    }

    /**
     * Evaluates the curve
     * @param {Number} time
     * @param {TypedArray }value
     * @param {Boolean} cycle
     * @param {Number} duration
     */
    Evaluate(time, value, cycle, duration)
    {
        Gr2Curve2.Evaluate(this.knots, this.controls, this.dimension, this.degree, time, value, cycle, duration);
    }

}
