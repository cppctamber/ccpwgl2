import { meta } from "utils";
import { Gr2CurveDataD9I1K16uC16u } from "./Gr2CurveDataD9I1K16uC16u";


@meta.type("Gr2CurveDataD9I1K8uC8u")
export class Gr2CurveDataD9I1K8uC8u extends Gr2CurveDataD9I1K16uC16u
{

    @meta.vector
    knotsControls = new this.constructor.ControlConstructor(0);


    /**
     * Control constructor
     * @type {Uint8ArrayConstructor}
     */
    static ControlConstructor = Uint8Array;

    /**
     * Gr2 curve data format
     * @type {number}
     */
    static format = 14;


}
