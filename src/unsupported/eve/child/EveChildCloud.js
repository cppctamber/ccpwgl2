import { meta, quat, vec3 } from "global";
import { EveChild } from "eve/child";


@meta.notImplemented
@meta.ctor("EveChildCloud")
export class EveChildCloud extends EveChild
{

    @meta.string
    name = "";

    @meta.float
    cellScreenSize = 0;

    @meta.struct("Tw2Effect")
    effect = null;

    @meta.uint
    preTesselationLevel = 0;

    @meta.quaternion
    rotation = quat.create();

    @meta.vector3
    scaling = vec3.fromValues(1, 1, 1);

    @meta.float
    sortingModifier = 0;

    @meta.vector3
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
