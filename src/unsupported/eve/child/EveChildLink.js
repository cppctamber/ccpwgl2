import { meta } from "utils";
import { quat } from "math";
import { EveChild } from "eve/child";


@meta.notImplemented
@meta.type("EveChildLink")
export class EveChildLink extends EveChild
{

    @meta.string
    name = "";

    @meta.list("Tw2ValueBinding")
    linkStrengthBindings = [];

    @meta.list("Tw2Curve")
    linkStrengthCurves = [];

    @meta.struct("Tw2Mesh")
    mesh = null;

    @meta.quaternion
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
