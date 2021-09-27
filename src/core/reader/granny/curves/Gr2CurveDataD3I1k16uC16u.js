import { Gr2Curve2 } from "./Gr2Curve2";
import { rebuildBuffer } from "./Gr2CurveDataD3I1K32fC32f";
import { meta } from "utils";
import { vec3 } from "math";


@meta.type("Gr2CurveDataD3I1K16uC16u")
export class Gr2CurveDataD3I1K16uC16u extends Gr2Curve2
{

    @meta.vector3
    controlOffsets = vec3.create();

    @meta.vector3
    controlScales = vec3.create();

    @meta.vector
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
        return this.knotsControls.length / 2;
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
    static format = 17;

    /**
     * Bytes per knot
     * @type {number}
     */
    static bytesPerKnot = 2;

}

