import { Gr2Curve2 } from "./Gr2Curve2";
import { meta } from "utils";


@meta.type("Gr2CurveDataDaConstant32f")
export class Gr2CurveDataDaConstant32f extends Gr2Curve2
{

    @meta.matrix3
    controls = new this.constructor.ControlsConstructor([ 1, 0, 0, 0, 1, 0, 0, 0, 1 ]);


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
     * Gets the matrix 3 buffer
     * @return {Float32Array}
     */
    GetMat3Buffer()
    {
        return this.controls;
    }

    /**
     * Gr2 format
     * @type {number}
     */
    static format = 3;

    /**
     * Identifies float values
     * @type {boolean}
     */
    static isFloat = true;

}
