import { meta } from "utils";


@meta.type("AudEmitter", true)
export class AudEmitter extends meta.Model
{

    @meta.string
    name = "";

    @meta.notImplemented
    @meta.boolean
    normalizeAttenuationScaling = true;

    @meta.notImplemented
    @meta.float
    maxNormalizedScalingFactor=1;

}
