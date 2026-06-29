import { meta } from "utils";


@meta.notImplemented
@meta.type("EveStarfield")
@meta.define({
    wgl: "EveStarfield",
    ccp: true
})
export class EveStarfield extends meta.Model
{
    @meta.boolean
    display = true;

    @meta.struct("Tw2Effect")
    effect = null;

    @meta.float
    maxDist = 300;

    @meta.float
    maxFlashRate = 1;

    @meta.float
    minDist = 100;

    @meta.float
    minFlashIntensity = 0;

    @meta.float
    minFlashRate = 0.5;

    @meta.uint
    numStars = 500;

    @meta.uint
    seed = 0;

    Initialize()
    {
        return true;
    }

    OnModified()
    {
        return true;
    }

    Update()
    {
    }

    GetResources(out = [])
    {
        if (this.effect && this.effect.GetResources)
        {
            this.effect.GetResources(out);
        }
        return out;
    }

    GetBatches()
    {
        return false;
    }

}
