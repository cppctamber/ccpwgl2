import { meta, quat, vec3 } from "global";
import { EveChild } from "eve/child";


@meta.notImplemented
@meta.type("EveChildCloud", true)
export class EveChildCloud extends EveChild
{

    @meta.black.string
    name = "";

    @meta.black.float
    cellScreenSize = 0;

    @meta.black.objectOf("Tw2Effect")
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
