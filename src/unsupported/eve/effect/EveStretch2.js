import { meta } from "utils";


@meta.notImplemented
@meta.type("EveStretch2")
export class EveStretch2 extends meta.Model
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
