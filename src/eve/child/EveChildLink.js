import { meta, quat } from "global";
import { EveChild } from "./EveChild";


/**
 * EveChildLink
 *
 * @property {String} name                                  -
 * @property {Array.<Tw2ValueBinding>} linkStrengthBindings -
 * @property {Array.<Curve>} linkStrengthCurves             -
 * @property {Tw2Mesh} mesh                                 -
 * @property {quat} rotation                                -
 */
@meta.notImplemented
@meta.type("EveChildLink", true)
export class EveChildLink extends EveChild
{

    @meta.black.string
    name = "";

    @meta.black.list
    linkStrengthBindings = [];

    @meta.black.list
    linkStrengthCurves = [];

    @meta.black.object
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
