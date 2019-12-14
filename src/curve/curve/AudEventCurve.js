import { meta } from "global";
import { Tw2CurveKey, Tw2Curve } from "./Tw2Curve";

/**
 * AudEventKey
 *
 * @property {Number} time  -
 * @property {Number} value -
 */
@meta.notImplemented
@meta.type("AudEventKey", true)
export class AudEventKey extends Tw2CurveKey
{

    @meta.black.float
    time = 0;

    @meta.black.ushort
    value = 0;

}

/**
 * AudEventCurve
 *
 * @property {Array.<AudEventKey>} keys           -
 * @property {TriObserverLocal} sourceTriObserver -
 */
@meta.notImplemented
@meta.type("AudEventCurve", true)
export class AudEventCurve extends Tw2Curve
{

    @meta.black.string
    name = "";

    @meta.black.list
    keys = [];

    @meta.black.object
    sourceTriObserver = null;

}
