import { meta, Tw2BaseClass } from "global";


@meta.notImplemented
@meta.type("EveStretch2", true)
export class EveStretch2 extends Tw2BaseClass
{

    @meta.black.string
    name = "";

    @meta.black.object
    destinationEmitter = null;

    @meta.black.object
    destinationLight = null;

    @meta.black.objectOf("Tw2Effect")
    effect = null;

    @meta.black.objectOf("Tw2CurveSet")
    loop = null;

    @meta.black.object
    sourceEmitter = null;

    @meta.black.object
    sourceLight = null;

    @meta.black.uint
    quadCount = 0;

}
