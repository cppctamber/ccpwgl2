import { meta, quat, vec3 } from "global";
import { EveChild } from "./EveChild";


/**
 * EveChildCloud
 *
 * @property {String} name                -
 * @property {Number} cellScreenSize      -
 * @property {Tw2Effect} effect           -
 * @property {Number} preTesselationLevel -
 * @property {quat} rotation              -
 * @property {vec3} scaling               -
 * @property {Number} sortingModifier     -
 * @property {vec3} translation           -
 */
@meta.notImplemented
@meta.type("EveChildCloud", true)
export class EveChildCloud extends EveChild
{

    @meta.black.string
    name = "";

    @meta.black.float
    cellScreenSize = 0;

    @meta.black.object
    effect = null;

    @meta.black.uint
    preTesselationLevel = 0;

    @meta.black.quaternion
    rotation = quat.create();

    @meta.black.vector3
    scaling = vec3.fromValues(1, 1, 1);

    @meta.black.float
    sortingModifier = 0;

    @meta.black.vector3
    translation = vec3.create();


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
