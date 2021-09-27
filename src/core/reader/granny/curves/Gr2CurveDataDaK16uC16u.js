import { ErrGr2CurveDataControlSizeInvalid, Gr2Curve2 } from "./Gr2Curve2";
import { meta } from "utils";


@meta.type("Gr2CurveDataDaK16uC16u")
export class Gr2CurveDataDaK16uC16u extends Gr2Curve2
{

    @meta.uint
    oneOverKnotScaleTrunc = 0;

    @meta.vector    // C# Single
    controlScaleOffsets = new Float32Array(0);

    @meta.vector
    knotsControls = new this.constructor.ControlsConstructor(0);


    _knots = null;
    _mat3Buffer = null;
    _quatBuffer = null;


    /**
     * Gets the curve type
     * @return {number}
     */
    GetType()
    {
        const size = this.GetControlSize();
        switch (size)
        {
            case 4:
                return Gr2Curve2.Type.ROTATION;

            case 9:
                return Gr2Curve2.Type.SCALE_SHEAR;

            default:
                throw new ErrGr2CurveDataControlSizeInvalid({ size });
        }
    }

    /**
     * Gets component count
     * @return {number}
     */
    GetControlSize()
    {
        return this.controlScaleOffsets.length / 2;
    }

    /**
     * Gets knot count
     * @return {number}
     */
    GetKnotCount()
    {
        return this.knotsControls.length / (this.GetControlSize() + 1);
    }

    /**
     * Gets knots
     * @return {Float32Array}
     */
    GetKnots()
    {
        if (!this._knots) this.RebuildKnots();
        return this._knots;
    }

    /**
     * Rebuilds knots
     */
    RebuildKnots()
    {
        this._knots = Gr2Curve2.GetKnotsFromControlWithOneOverKnotScaleTrunc(
            this.knotsControls,
            this.GetKnotCount(),
            this.oneOverKnotScaleTrunc,
        );
    }

    /**
     * Gets mat3 buffer
     * @return {Float32Array}
     */
    GetMat3Buffer()
    {
        if (this.GetType() === Gr2Curve2.Type.SCALE_SHEAR)
        {
            if (!this._mat3Buffer) this.RebuildMat3Buffer();
            return this._mat3Buffer;
        }

        super.GetMat3Buffer();
    }

    /**
     * Gets quat buffer
     * @return {Float32Array}
     */
    GetQuatBuffer()
    {
        if (this.GetType() === Gr2Curve2.Type.ROTATION)
        {
            if (!this._quatBuffer) this.RebuildQuatBuffer();
            return this._quatBuffer;
        }

        super.GetQuatBuffer();
    }

    /**
     * Rebuilds mat3 buffer
     */
    RebuildMat3Buffer()
    {
        if (this.GetType() !== Gr2Curve2.Type.SCALE_SHEAR)
        {
            this._mat3Buffer = null;
        }
        else
        {
            this._mat3Buffer = rebuildBuffer(this.knotsControls, this.GetKnotCount(), 9, this.controlScaleOffsets);
        }
    }

    /**
     * Rebuilds the quat buffer
     */
    RebuildQuatBuffer()
    {
        if (this.GetType() !== Gr2Curve2.Type.ROTATION)
        {
            this._quatBuffer = null;
        }
        else
        {
            this._quatBuffer = rebuildBuffer(this.knotsControls, this.GetKnotCount(), 4, this.controlScaleOffsets);
        }
    }

  

    /**
     * Knots controls constructor
     * @type {Uint16ArrayConstructor}
     */
    static ControlsConstructor = Uint16Array;

    /**
     * Bytes per knot
     * @type {number}
     */
    static bytesPerKnot = 2;

    /**
     * Gr2 format
     * @type {number}
     */
    static format = 6;

}


/**
 * Gets buffer from controls for DaK curves
 * @param {TypedArray} controls
 * @param {Number} count
 * @param {Number} dimension
 * @param {TypedArray} offset
 * @return {Float32Array}
 */
function rebuildBuffer(controls, count, dimension, offset)
{
    let out = new Float32Array(count * dimension);
    for (let i = 0; i < count; i++)
    {
        for (let x = 0; x < 9; x++)
        {
            out[i * dimension + x] = controls[count + i * dimension + x] * offset[x] + offset[dimension + x];
        }
    }
    return out;
}
