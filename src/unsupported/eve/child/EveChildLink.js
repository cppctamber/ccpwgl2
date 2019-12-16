import { meta, quat } from "global";
import { EveChild } from "eve/child";


@meta.notImplemented
@meta.type("EveChildLink", true)
export class EveChildLink extends EveChild
{

    @meta.black.string
    name = "";

    @meta.black.listOf("Tw2ValueBinding")
    linkStrengthBindings = [];

    @meta.black.listOf("Tw2Curve")
    linkStrengthCurves = [];

    @meta.black.objectOf("Tw2Mesh")
    mesh = null;

    @meta.black.quaternion
    rotation = quat.create();


    /**
     * Gets object resources
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2Resource>} [out]
     */
    GetResources(out = [])
    {
        if (this.mesh) this.mesh.GetResources(out);
        return out;
    }

}
