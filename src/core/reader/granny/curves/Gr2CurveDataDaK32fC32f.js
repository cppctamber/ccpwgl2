import { ErrGr2CurveDataControlSizeInvalid, Gr2Curve2 } from "./Gr2Curve2";
import { meta } from "utils";


@meta.type("Gr2CurveDataDaK32fC32f")
export class Gr2CurveDataDaK32fC32f extends Gr2Curve2
{

    @meta.float32Array
    knots = new Float32Array(0);

    @meta.float32Array
    controls = new Float32Array(0);


    /**
     * Gets the curve type
     * @return {number}
     */
    GetCurveType()
    {
        const size = this.controls.length;
        if (this.knots.length * 3 === size) return Gr2Curve2.Type.POSITION;
        else if (this.knots.length * 4 === size) return Gr2Curve2.Type.ROTATION;
        else if (this.knots.length * 9 === size) return Gr2Curve2.Type.SCALE_SHEAR;
        throw new ErrGr2CurveDataControlSizeInvalid({ size });
    }

    /**
     * Gets knot count
     * @return {number}
     */
    GetKnotCount()
    {
        return this.knots.length;
    }

    /**
     * Gets knots
     * @return {Float32Array}
     */
    GetKnots()
    {
        return this.knots;
    }

    /**
     * Gets the vec3 buffer
     * @return {Float32Array}
     */
    GetVec3Buffer()
    {
        if (this.GetCurveType() === Gr2Curve2.Type.POSITION) return this.controls;
        super.GetVec3Buffer();
    }

    /**
     * Gets the quat buffer
     * @return {Float32Array}
     */
    GetQuatBuffer()
    {
        if (this.GetCurveType() === Gr2Curve2.Type.ROTATION) return this.controls;
        super.GetQuatBuffer();
    }

    /**
     * Gets the mat3 buffer
     * @return {Float32Array}
     */
    GetMat3Buffer()
    {
        if (this.GetCurveType() === Gr2Curve2.Type.SCALE_SHEAR) return this.controls;
        super.GetMat3Buffer();
    }

    /**
     * Gr2 format
     * @type {number}
     */
    static format = 1;

}
