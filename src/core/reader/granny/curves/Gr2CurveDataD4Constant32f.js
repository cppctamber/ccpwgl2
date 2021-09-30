import { Gr2Curve2 } from "./Gr2Curve2";
import { meta } from "utils";


@meta.type("Gr2CurveDataD4Constant32f")
export class Gr2CurveDataD4Constant32f extends Gr2Curve2
{

    @meta.float32Array
    controls = new Float32Array([ 0, 0, 0, 1 ]);


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
     * Gets the quat buffer
     * @returns {Float32Array}
     */
    GetQuatBuffer()
    {
        return this.controls;
    }

    /*
    _mat3Buffer = null;
    GetMat3Buffer()
    {
        if (!this._mat3Buffer) this.RebuildMat3Buffer();
        return this._mat3Buffer;
    }
    */

    /**
     * Gr2 format
     * @type {number}
     */
    static format = 5;


}
