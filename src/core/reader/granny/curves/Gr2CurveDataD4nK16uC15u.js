import { Gr2Curve2 } from "./Gr2Curve2";
import { meta } from "utils";


@meta.type("Gr2CurveDataD4nK16uC15u")
export class Gr2CurveDataD4nK16uC15u extends Gr2Curve2
{

    @meta.uint
    scaleOffsetTableEntries = 0;

    @meta.float
    oneOverKnotScale = 0.0;

    @meta.vector
    knotsControls = new this.constructor.ControlConstructor(0);


    _knots = null;
    _quatBuffer = null;


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
     * @return {Float32Array|Float32Array}
     */
    GetKnots()
    {
        if (!this._knots) this.RebuildKnots();
        return this._knots;
    }

    /**
     * Gets quat buffer
     * @return {Float32Array}
     */
    GetQuatBuffer()
    {
        if (!this._quatBuffer) this.RebuildQuatBuffer();
        return this._quatBuffer;
    }

    /**
     * Rebuilds knots
     */
    RebuildKnots()
    {
        this._knots = Gr2Curve2.GetKnotsFromControl(this.knotsControls, this.GetKnotCount(), 1 / this.oneOverKnotScale);
    }

    /**
     * Rebuilds the quat buffer
     */
    RebuildQuatBuffer()
    {
        this._quatBuffer = rebuildBuffers(
            this.knotsControls,
            this.GetKnotCount(),
            this.constructor.SCALE_TABLE_MULTIPLIER,
            this.scaleOffsetTableEntries,
            this.constructor.GetQuatFromControl
        );
    }

    /**
     * Gets a quaternion from scale and offset controls
     * @param {quat|Float32Array} out
     * @param {Number} a
     * @param {Number} b
     * @param {Number} c
     * @param {quat|Float32Array} scales
     * @param {quat|Float32Array} offsets
     * @return {quat|Float32Array} out
     */
    static GetQuatFromControl(out, a, b, c, scales, offsets)
    {
        const
            swizzle1 = ((b & 0x8000) >> 14) | (c >> 15),
            swizzle2 = (swizzle1 + 1) & 3,
            swizzle3 = (swizzle2 + 1) & 3,
            swizzle4 = (swizzle3 + 1) & 3;

        const
            dataA = (a & 0x7fff) * scales[swizzle2] + offsets[swizzle2],
            dataB = (b & 0x7fff) * scales[swizzle3] + offsets[swizzle3],
            dataC = (c & 0x7fff) * scales[swizzle4] + offsets[swizzle4];

        let dataD = Math.sqrt(1 - (dataA * dataA + dataB * dataB + dataC * dataC));
        if ((a & 0x8000) !== 0) dataD = -dataD;

        out[swizzle2] = dataA;
        out[swizzle3] = dataB;
        out[swizzle4] = dataC;
        out[swizzle1] = dataD;

        return out;
    }

    /**
     * Scale table multiplier
     * @type {number}
     */
    static SCALE_TABLE_MULTIPLIER = 0.000030518509;

    /**
     * Control constructor
     * @type {Uint16ArrayConstructor}
     */
    static ControlConstructor = Uint16Array;

    /**
     * Gr2 curve data format
     * @type {number}
     */
    static format = 0;

    /**
     * Bytes per knot
     * @type {number}
     */
    static bytesPerKnot = 2;

}


/**
 * Gets quat buffer from controls for D4n curves
 * @param {TypedArray} controls
 * @param {Number} count
 * @param {Number} scaleTableMultiplier
 * @param {Number} selector
 * @param {Function} getQuatFromControl
 * @return {Float32Array}
 */
function rebuildBuffers(controls, count, scaleTableMultiplier, selector, getQuatFromControl)
{

    const D4N_SCALE_TABLE = new Float32Array([
        1.4142135, 0.70710677, 0.35355338, 0.35355338,
        0.35355338, 0.17677669, 0.17677669, 0.17677669,
        -1.4142135, -0.70710677, -0.35355338, -0.35355338,
        -0.35355338, -0.17677669, -0.17677669, -0.17677669
    ]);

    const D4N_OFFSET_TABLE = new Float32Array([
        -0.70710677, -0.35355338, -0.53033006, -0.17677669,
        0.17677669, -0.17677669, -0.088388346, 0.0,
        0.70710677, 0.35355338, 0.53033006, 0.17677669,
        -0.17677669, 0.17677669, 0.088388346, -0.0
    ]);

    const scaleTable = new Float32Array([
        D4N_SCALE_TABLE[(selector >> 0) & 0x0f] * scaleTableMultiplier,
        D4N_SCALE_TABLE[(selector >> 4) & 0x0f] * scaleTableMultiplier,
        D4N_SCALE_TABLE[(selector >> 8) & 0x0f] * scaleTableMultiplier,
        D4N_SCALE_TABLE[(selector >> 12) & 0x0f] * scaleTableMultiplier
    ]);

    const offsetTable = new Float32Array([
        D4N_OFFSET_TABLE[(selector >> 0) & 0x0f],
        D4N_OFFSET_TABLE[(selector >> 4) & 0x0f],
        D4N_OFFSET_TABLE[(selector >> 8) & 0x0f],
        D4N_OFFSET_TABLE[(selector >> 12) & 0x0f]
    ]);

    const
        quat = new Float32Array([ 0, 0, 0, 1 ]),
        out = new Float32Array(count * 4);

    for (let i = 0; i < count; i++)
    {
        getQuatFromControl(quat,
            controls[count + i * 3],
            controls[count + i * 3 + 1],
            controls[count + i * 3 + 2],
            scaleTable,
            offsetTable
        );

        out[i * 4] = quat[0];
        out[i * 4 + 1] = quat[1];
        out[i * 4 + 2] = quat[2];
        out[i * 4 + 3] = quat[3];
    }

    return out;
}
