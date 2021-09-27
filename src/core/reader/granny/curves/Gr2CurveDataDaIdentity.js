import { Gr2Curve2 } from "./Gr2Curve2";
import { meta } from "utils/index";


@meta.type("Gr2CurveDataDaIdentity")
export class Gr2CurveDataDaIdentity extends Gr2Curve2
{

    @meta.uint
    dimension = 0;


    /**
     * Gets the knot count
     * @return {number}
     */
    GetKnotCount()
    {
        return 1;
    }

    /**
     * Gets knots
     * @return {Float32Array}
     */
    GetKnots()
    {
        return new Float32Array([ 0.0 ]);
    }

    /**
     * Gets the vec3 buffer
     * @return {Float32Array}
     */
    GetVec3Buffer()
    {
        return new this.constructor.ControlsConstructor([ 0, 0, 0 ]);
    }

    /**
     * Gets quat buffer
     * @return {Float32Array}
     */
    GetQuatBuffer()
    {
        return new this.constructor.ControlsConstructor([ 0, 0, 0, 1 ]);
    }

    /**
     * Gets mat3 buffer
     * @return {Float32Array}
     */
    GetMat3Buffer()
    {
        return new this.constructor.ControlsConstructor([ 1, 0, 0, 0, 1, 0, 0, 0, 1 ]);
    }

    /**
     * Constructor for knots
     * @type {Float32ArrayConstructor}
     */
    static ControlsConstructor = Float32Array;

    /**
     * Gr2 format
     * @type {number}
     */
    static format = 2;

    /**
     * Identifies float values
     * @type {boolean}
     */
    static isFloat = true;

}
