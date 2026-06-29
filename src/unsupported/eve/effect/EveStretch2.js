import { meta } from "utils";


@meta.notImplemented
@meta.type("EveStretch2")
@meta.define({
    wgl: "EveStretch2",
    ccp: true
})
export class EveStretch2 extends meta.Model
{

    @meta.string
    name = "";

    @meta.notOwned
    @meta.struct()
    destinationEmitter = null;

    @meta.notOwned
    @meta.struct()
    destinationLight = null;

    @meta.struct("Tw2Effect")
    effect = null;

    @meta.struct("Tw2CurveSet")
    loop = null;

    @meta.notOwned
    @meta.struct()
    sourceEmitter = null;

    @meta.notOwned
    @meta.struct()
    sourceLight = null;

    @meta.uint
    quadCount = 0;

}
