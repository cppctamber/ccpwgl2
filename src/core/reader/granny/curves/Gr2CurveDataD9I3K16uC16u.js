import { ErrGr2CurveDataRotationNotSupported, Gr2Curve2 } from "./Gr2Curve2";
import { meta } from "utils";
import { vec3 } from "math";


@meta.type("Gr2CurveDataD9I3K16uC16u")
export class Gr2CurveDataD9I3K16uC16u extends Gr2Curve2
{

    @meta.uint
    oneOverKnotScaleTrunc = 0;

    @meta.vector3
    controlScale = vec3.create();

    @meta.float
    controlOffset = vec3.create();

    @meta.vector
    knotsControls = new this.constructor.ControlConstructor(0);


    _knots = null;
    _mat3Buffer = null;


    /**
     * Gets knot count
     * @return {number}
     */
    GetKnotCount()
    {
        return this.knotsControls / 4;
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
     * Gets quat buffer
     */
    GetQuatBuffer()
    {
        throw new ErrGr2CurveDataRotationNotSupported();
    }

    /**
     * Gets mat3 buffer
     * @return {Float32Array}
     */
    GetMat3Buffer()
    {
        if (!this._mat3Buffer) this.RebuildMat3Buffer();
        return this._mat3Buffer;
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
     * Rebuilds mat3 buffer
     */
    RebuildMat3Buffer()
    {
        const
            count = this.GetKnotCount(),
            controls = this.knotsControls,
            offset = this.controlOffset,
            scale = this.controlScale;

        this._mat3Buffer = new Float32Array(count * 9);

        const out = this._mat3Buffer;
        for (let i = 0; i < count; i++)
        {
            out[i * 9] = controls[count + i * 3] * scale[0] + offset[0];
            out[i * 9 + 1] = 0;
            out[i * 9 + 2] = 0;
            out[i * 9 + 3] = 0;
            out[i * 9 + 4] = controls[count + i * 3 + 1] * scale[1] + offset[1];
            out[i * 9 + 5] = 0;
            out[i * 9 + 6] = 0;
            out[i * 9 + 7] = 0;
            out[i * 9 + 8] = controls[count + i * 3 + 2] * scale[2] + offset[2];
        }
    }

    /**
     * Control constructor
     * @type {Uint16ArrayConstructor}
     */
    static ControlConstructor = Uint16Array;

    /**
     * Gr2 curve data format
     * @type {number}
     */
    static format = 13;

}
