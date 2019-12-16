import { EveChild } from "eve/child";
import { meta } from "global";


@meta.notImplemented
@meta.type("EveChildBulletStorm", true)
export class EveChildBulletStorm extends EveChild
{

    @meta.black.objectOf("Tw2Effect")
    effect = null;

    @meta.black.uint
    multiplier = 0;

    @meta.black.float
    range = 0;

    @meta.black.string
    sourceLocatorSet = "";

    @meta.black.float
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
