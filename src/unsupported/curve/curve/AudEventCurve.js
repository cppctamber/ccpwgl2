import { meta } from "utils";
import { Tw2CurveKey, Tw2Curve } from "curve";


@meta.type("AudEventKey")
export class AudEventKey extends Tw2CurveKey
{

    @meta.float
    time = 0;

    @meta.ushort
    value = 0;

}


@meta.notImplemented
@meta.type("AudEventCurve")
export class AudEventCurve extends Tw2Curve
{

    @meta.string
    name = "";

    @meta.uint
    extrapolation = 0;

    @meta.list("AudEventKey")
    keys = [];

    @meta.struct("TriObserverLocal")
    sourceTriObserver = null;

}
