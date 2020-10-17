import { EveChild } from "eve/child";
import { meta } from "utils";


@meta.notImplemented
@meta.ctor("EveChildBulletStorm")
export class EveChildBulletStorm extends EveChild
{

    @meta.struct("Tw2Effect")
    effect = null;

    @meta.uint
    multiplier = 0;

    @meta.float
    range = 0;

    @meta.string
    sourceLocatorSet = "";

    @meta.float
    speed = 0;


    /**
     * Gets object resources
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2Resource>} [out]
     */
    GetResources(out = [])
    {
        if (this.effect) this.effect.GetResources(out);
        return out;
    }

}
