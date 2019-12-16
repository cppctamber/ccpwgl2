import { meta } from "global";
import { Tw2CurveKey, Tw2Curve } from "curve";


@meta.type("AudEventKey", true)
export class AudEventKey extends Tw2CurveKey
{

    @meta.black.float
    time = 0;

    @meta.black.ushort
    value = 0;

}


@meta.notImplemented
@meta.type("AudEventCurve", true)
export class AudEventCurve extends Tw2Curve
{

    @meta.black.string
    name = "";

    @meta.black.listOf("AudEventKey")
    keys = [];

    @meta.black.objectOf("TriObserverLocal")
    sourceTriObserver = null;

}
