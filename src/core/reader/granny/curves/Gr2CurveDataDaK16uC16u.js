import { ErrGr2CurveDataControlSizeInvalid, Gr2Curve2 } from "./Gr2Curve2";
import { meta } from "utils";


@meta.type("Gr2CurveDataDaK16uC16u")
export class Gr2CurveDataDaK16uC16u extends Gr2Curve2
{

    @meta.uint
    oneOverKnotScaleTrunc = 0;

    @meta.float32Array
    controlScaleOffsets = new Float32Array(0);

    @meta.uint16Array
    knotsControls = new Uint16Array(0);


    _knots = null;
    _buffer = null;


    /**
     * Gets control size
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
     * Gets a vec3 buffer
     * @return {Float32Array}
     */
    GetVec3Buffer()
    {
        if (this.GetControlSize() !== 3) throw new ErrGr2CurveDataControlSizeInvalid({ size: this.GetControlSize(), expected: 3 });
        if (!this._buffer) this.RebuildBuffer();
        return this._buffer;
    }

    /**
     * Gets a quat buffer
     * @return {Float32Array}
     */
    GetQuatBuffer()
    {
        if (this.GetControlSize() !== 4) throw new ErrGr2CurveDataControlSizeInvalid({ size: this.GetControlSize(), expected: 4 });
        if (!this._buffer) this.RebuildBuffer();
        return this._buffer;
    }

    /**
     * Gets a mat3 buffer
     * @return {Float32Array}
     */
    GetMat3Buffer()
    {
        if (this.GetControlSize() !== 9) throw new ErrGr2CurveDataControlSizeInvalid({ size: this.GetControlSize(), expected: 9 });
        if (!this._buffer) this.RebuildBuffer();
        return this._buffer;
    }

    /**
     * Rebuilds knots
     */
    RebuildKnots()
    {
        this._knots = Gr2Curve2.GetKnotsFromControlWithOneOverKnotScaleTrunc(
            this.knotsControls,
            this.GetKnotCount(),
            this.oneOverKnotScaleTrunc
        );
    }

    /**
     * Rebuilds the buffer
     */
    RebuildBuffer()
    {
        const dim = this.GetControlSize();
        this._buffer = rebuildBuffer(this.knotsControls, this.GetKnotCount(), dim, this.controlScaleOffsets);
    }

    /**
     * Gr2 format
     * @type {number}
     */
    static format = 6;

}

/**
 * Gets a buffer from controls for DaK curves
 * @param {TypedArray} controls
 * @param {Number} count
 * @param {Number} dimension
 * @param {Float32Array} scaleOffsets
 * @return {Float32Array}
 */
function rebuildBuffer(controls, count, dimension, scaleOffsets)
{
    let out = new Float32Array(count * dimension);
    for (let i = 0; i < count; i++)
    {
        for (let x = 0; x < dimension; x++)
        {
            out[i * dimension + x] = controls[count + i * dimension + x] * scaleOffsets[x] + scaleOffsets[dimension + x];
        }
    }
    return out;
}
