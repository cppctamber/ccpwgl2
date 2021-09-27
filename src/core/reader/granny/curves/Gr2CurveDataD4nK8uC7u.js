import { Gr2CurveDataD4nK16uC15u } from "./Gr2CurveDataD4nK16uC15u";
import { meta } from "utils";


@meta.type("Gr2CurveDataD4nK8uC7u")
export class Gr2CurveDataD4nK8uC7u extends Gr2CurveDataD4nK16uC15u
{

    @meta.vector
    knotsControls = new this.constructor.ControlConstructor(0);


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
            swizzle1 = ((b & 0x80) >> 6) | ((c & 0x80) >> 7),
            swizzle2 = (swizzle1 + 1) & 3,
            swizzle3 = (swizzle2 + 1) & 3,
            swizzle4 = (swizzle3 + 1) & 3;

        const
            dataA = (a & 0x7f) * scales[swizzle2] + offsets[swizzle2],
            dataB = (b & 0x7f) * scales[swizzle3] + offsets[swizzle3],
            dataC = (c & 0x7f) * scales[swizzle4] + offsets[swizzle4];

        let dataD = Math.sqrt(1 - (dataA * dataA + dataB * dataB + dataC * dataC));
        if ((a & 0x80) !== 0) dataD = -dataD;

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
    static SCALE_TABLE_MULTIPLIER = 0.0078740157;

    /**
     * Control constructor
     * @type {Uint8ArrayConstructor}
     */
    static ControlConstructor = Uint8Array;

    /**
     * Gr2 curve data format
     * @type {number}
     */
    static format = 9;

    /**
     * Bytes per knot
     * @type {number}
     */
    static bytesPerKnot = 1;

}

