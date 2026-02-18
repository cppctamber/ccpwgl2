import { Gr2CurveDataDaK16uC16u } from "./Gr2CurveDataDaK16uC16u";
import { meta } from "utils";


@meta.type("Gr2CurveDataDaK8uC8u")
export class Gr2CurveDataDaK8uC8u extends Gr2CurveDataDaK16uC16u
{

    @meta.uint8Array
    knotsControls = new Uint8Array(0);

    get KnotsControls()
    {
        return this.knotsControls;
    }

    /**
     * GR2 curve data format
     * @type {number}
     */
    static format = 18;

}
