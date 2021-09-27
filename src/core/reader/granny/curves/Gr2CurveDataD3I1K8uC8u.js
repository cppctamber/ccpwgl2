import { Gr2CurveDataD3I1K16uC16u } from "./Gr2CurveDataD3I1K16uC16u";
import { meta } from "utils";


@meta.type("Gr2CurveDataD3I1K8uC8u")
export class Gr2CurveDataD3I1K8uC8u extends Gr2CurveDataD3I1K16uC16u
{

    @meta.vector
    knotsControls = new this.constructor.ControlsConstructor(0);

    /**
     * Knots control constructor
     * @type {Uint8ArrayConstructor}
     */
    static ControlsConstructor = Uint8Array;

    /**
     * Gr2 format
     * @type {number}
     */
    static format = 18;

    /**
     * Bytes per knot
     * @type {number}
     */
    static bytesPerKnot = 1;

}
