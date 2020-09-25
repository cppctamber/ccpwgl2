import { meta, Tw2BaseClass } from "global";


@meta.notImplemented
@meta.ctor("EveStretch2")
export class EveStretch2 extends Tw2BaseClass
{

    @meta.string
    name = "";

    @meta.struct()
    destinationEmitter = null;

    @meta.struct()
    destinationLight = null;

    @meta.struct("Tw2Effect")
    effect = null;

    @meta.struct("Tw2CurveSet")
    loop = null;

    @meta.struct()
    sourceEmitter = null;

    @meta.struct()
    sourceLight = null;

    @meta.uint
    quadCount = 0;

}
