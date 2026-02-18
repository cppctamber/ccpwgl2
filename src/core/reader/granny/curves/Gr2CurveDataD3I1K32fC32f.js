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
     * Gets knot count
     * @return {number}
     */
    GetKnotCount()
    {
        return this.knotsControls.length / 2;
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
        if (!this._buffer) this.RebuildVec3Buffer();
        return this._buffer;
    }

    /**
     * Rebuilds knots
     */
    RebuildKnots()
    {
        this._knots = new Float32Array(this.GetKnotCount());
        const out = this._knots;
        const count = this.GetKnotCount();
        const src = this.knotsControls;

        for (let i = 0; i < count; i++)
        {
            out[i] = src[i];
        }
    }

    /**
     * Rebuilds vec3 buffer
     */
    RebuildVec3Buffer()
    {
        this._buffer = rebuildBuffer(
            this.knotsControls,
            this.GetKnotCount(),
            this.controlScales,
            this.controlOffsets
        );
    }

    /**
     * Gr2 format
     * @type {number}
     */
    static format = 16;

}


/**
 * Shared helper used by D3I1K32fC32f and D3I1k16uC16u
 * Controls are stored as: [knots...][scalarControls...]
 *
 * @param {TypedArray} knotsControls
 * @param {number} count
 * @param {Float32Array|Array<number>} controlScales vec3 scale
 * @param {Float32Array|Array<number>} controlOffsets vec3 offset
 * @return {Float32Array}
 */
export function rebuildBuffer(knotsControls, count, controlScales, controlOffsets)
{
    const out = new Float32Array(count * 3);

    for (let i = 0; i < count; i++)
    {
        const v = knotsControls[count + i];
        out[i * 3] = v * controlScales[0] + controlOffsets[0];
        out[i * 3 + 1] = v * controlScales[1] + controlOffsets[1];
        out[i * 3 + 2] = v * controlScales[2] + controlOffsets[2];
    }

    return out;
}
