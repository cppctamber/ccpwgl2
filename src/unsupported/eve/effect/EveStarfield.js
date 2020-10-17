import { meta } from "utils";


@meta.notImplemented
@meta.ctor("EveStarfield")
export class EveStarfield extends meta.Model
{

    @meta.struct("Tw2Effect")
    effect = null;

    @meta.float
    maxDist = 0;

    @meta.float
    maxFlashRate = 0;

    @meta.float
    minDist = 0;

    @meta.float
    minFlashIntensity = 0;

    @meta.float
    minFlashRate = 0;

    @meta.uint
    numStars = 0;

    @meta.uint
    seed = 0;

}
