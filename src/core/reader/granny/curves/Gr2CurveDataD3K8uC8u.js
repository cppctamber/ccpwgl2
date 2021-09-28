import { Gr2CurveDataD3K16uC16u } from "./Gr2CurveDataD3K16uC16u";
import { meta } from "utils";


@meta.type("Gr2CurveDataD3K8uC8u")
export class Gr2CurveDataD3K8uC8u extends Gr2CurveDataD3K16uC16u
{

    @meta.uint8Array
    knotsControls = new Uint8Array(0);

    /**
     * Gr2 format
     * @type {number}
     */
    static format = 11;

}
