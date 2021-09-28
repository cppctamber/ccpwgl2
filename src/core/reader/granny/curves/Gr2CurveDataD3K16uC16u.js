import { Gr2Curve2 } from "./Gr2Curve2";
import { meta } from "utils";
import { vec3 } from "math";


@meta.type("Gr2CurveDataD3K16uC16u")
export class Gr2CurveDataD3K16uC16u extends Gr2Curve2
{

    @meta.vector3
    controlOffsets = vec3.create();

    @meta.vector3
    controlScales = vec3.create();

    @meta.uint16Array
    knotsControls = new this.constructor.ControlsConstructor(0);

    @meta.uint
    oneOverKnotScaleTrunc = 0;


    _knots = null;
    _buffer = null;


    /**
     * Gets knot count
     * @return {number}
     */
    GetKnotCount()
    {
        return this.knotsControls.length / 4;
    }

    /**
     * Gets knots
     * @return {null}
     */
    GetKnots()
    {
        if (!this._knots) this.RebuildKnots();
        return this._knots;
    }

    /**
     * Gets a vec3 buffer
     * @return {null}
     */
    GetVec3Buffer()
    {
        if (!this._buffer) this.RebuildVec3Buffer();
        return this._buffer;
    }

    /**
     * Rebuilds the knots and vec3 buffer
     */
    Rebuild()
    {
        this.RebuildKnots();
        this.RebuildVec3Buffer();
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
     * Rebuilds the vec3 buffer
     */
    RebuildVec3Buffer()
    {
        this._buffer = rebuildBuffer(this.controls, this.GetKnotCount(), this.controlScales, this.controlOffsets);
    }

    /**
     * Knot control constructor
     * @type {Uint16ArrayConstructor}
     */
    static ControlsConstructor = Uint16Array;

    /**
     * Gr2 format
     * @type {number}
     */
    static format = 10;

    /**
     * Bytes per knot
     * @type {number}
     */
    static bytesPerKnot = 2;

}

/**
 * Gets a vec3 buffer from controls for D3K curves
 * @param {TypedArray} controls
 * @param {Number} count
 * @param {TypedArray} scale
 * @param {TypedArray} offset
 * @return {Float32Array}
 */
function rebuildBuffer(controls, count, scale, offset)
{
    const out = new Float32Array(count * 3);
    for (let i = 0; i < count; i++)
    {
        for (let x = 0; x < 3; x++)
        {
            out[i * 3 + x] = controls[count + i * 3 + x] * scale[x] + offset[x];
        }
    }
    return out;
}
