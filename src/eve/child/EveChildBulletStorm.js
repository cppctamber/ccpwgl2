import {EveChild} from "./EveChild";

/**
 * EveChildBulletStorm
 * Todo: Implement
 *
 * @property {Tw2Effect} effect        -
 * @property {Number} multiplier       -
 * @property {Number} range            -
 * @property {String} sourceLocatorSet -
 * @property {Number} speed            -
 */
export class EveChildBulletStorm extends EveChild
{

    effect = null;
    multiplier = 0;
    range = 0;
    sourceLocatorSet = "";
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

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["effect", r.object],
            ["multiplier", r.uint],
            ["range", r.float],
            ["speed", r.float],
            ["sourceLocatorSet", r.string]
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}
