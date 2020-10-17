import { meta } from "utils";
import { Tw2CurveKey, Tw2Curve } from "curve";


@meta.ctor("AudEventKey")
export class AudEventKey extends Tw2CurveKey
{

    @meta.float
    time = 0;

    @meta.ushort
    value = 0;

}


@meta.notImplemented
@meta.ctor("AudEventCurve")
export class AudEventCurve extends Tw2Curve
{

    @meta.string
    name = "";

    @meta.list("AudEventKey")
    keys = [];

    @meta.struct("TriObserverLocal")
    sourceTriObserver = null;

}
