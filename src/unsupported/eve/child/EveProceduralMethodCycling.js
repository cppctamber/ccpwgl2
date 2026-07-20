import { meta } from "utils";


@meta.notImplemented
@meta.type("EveProceduralMethodCycling")
@meta.define({
    wgl: "EveProceduralMethodCycling",
    ccp: true
})
export class EveProceduralMethodCycling extends meta.Model
{

    @meta.float
    startTimeOffset = 0;

    @meta.boolean
    randomizeOrder = false;

    @meta.list("EveProceduralMethodCyclingParameter")
    parameters = [];

    @meta.list()
    debugVolumes = [];

}


@meta.notImplemented
@meta.type("EveProceduralMethodCyclingParameter")
@meta.define({
    wgl: "EveProceduralMethodCyclingParameter",
    ccp: true
})
export class EveProceduralMethodCyclingParameter extends meta.Model
{

    @meta.string
    name = "";

    @meta.struct()
    child = null;

    @meta.float
    playDuration = 0;

    @meta.boolean
    restartRequired = false;

    @meta.boolean
    reloadRequired = false;

}
