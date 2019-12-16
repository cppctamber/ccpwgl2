import { meta, Tw2BaseClass } from "global";


@meta.notImplemented
@meta.type("EveStarfield", true)
export class EveStarfield extends Tw2BaseClass
{

    @meta.black.objectOf("Tw2Effect")
    effect = null;

    @meta.black.float
    maxDist = 0;

    @meta.black.float
    maxFlashRate = 0;

    @meta.black.float
    minDist = 0;

    @meta.black.float
    minFlashIntensity = 0;

    @meta.black.float
    minFlashRate = 0;

    @meta.black.uint
    numStars = 0;

    @meta.black.uint
    seed = 0;

}
