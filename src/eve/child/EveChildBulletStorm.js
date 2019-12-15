import { EveChild } from "./EveChild";
import { meta } from "global/index";


/**
 * EveChildBulletStorm
 *
 * @property {Tw2Effect} effect        -
 * @property {Number} multiplier       -
 * @property {Number} range            -
 * @property {String} sourceLocatorSet -
 * @property {Number} speed            -
 */
@meta.notImplemented
@meta.type("EveChildBulletStorm", true)
export class EveChildBulletStorm extends EveChild
{

    @meta.black.object
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
