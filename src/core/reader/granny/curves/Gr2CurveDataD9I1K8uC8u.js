import { meta } from "utils";
import { Gr2CurveDataD9I1K16uC16u } from "./Gr2CurveDataD9I1K16uC16u";


@meta.type("Gr2CurveDataD9I1K8uC8u")
export class Gr2CurveDataD9I1K8uC8u extends Gr2CurveDataD9I1K16uC16u
{

    @meta.uint8Array
    knotsControls = new Uint8Array(0);


    /**
     * Gr2 curve data format
     * @type {number}
     */
    static format = 14;


}
