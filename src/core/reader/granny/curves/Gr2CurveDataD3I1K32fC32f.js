import { Gr2Curve2 } from "./Gr2Curve2";
import { vec3 } from "math";
import { meta } from "utils";


@meta.type("Gr2CurveDataD3I1K32fC32f")
export class Gr2CurveDataD3I1K32fC32f extends Gr2Curve2
{

    @meta.vector3
    controlOffsets = vec3.create();

    @meta.vector3
    controlScales = vec3.create();

    @meta.float32Array
    knotsControls = new Float32Array(0);


    _knots = null;
    _buffer = null;


    /**
     * Gets the knot count
     * @return {number}
     */
    GetKnotCount()
    {
        return this.knotsControls / 2;
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
     * Gets points
     * @return {Float32Array}
     */
    GetVec3Buffer()
    {
        if (!this._buffer) this.RebuildVec3Buffer();
        return this._buffer;
    }

    /**
     * Rebuilds knots
     */
    RebuildKnots()
    {
        this._knots = Gr2Curve2.GetKnotsFromControl(
            this.controls,
            this.GetKnotCount()
        );
    }

    /**
     * Rebuilds vec3 buffer
     */
    RebuildVec3Buffer()
    {
        this._buffer = rebuildBuffer(this.controls, this.GetKnotCount(), this.controlScales, this.controlOffsets);
    }

    /**
     * Gr2 format
     * @type {number}
     */
    static format = 16;

}


/**
 * Rebuilds vec3 buffers
 * @param {TypedArray} controls
 * @param {Number} count
 * @param {vec3} scale
 * @param {vec3} offset
 * @return {Float32Array}
 */
export function rebuildBuffer(controls, count, scale, offset)
{
    const out = new Float32Array(count * 3);
    for (let i = 0; i < count; i++)
    {
        for (let x = 0; x < 3; x++)
        {
            out[i * 3 + x] = controls[count + i] * scale[x] + offset[x];
        }
    }
    return out;
}



