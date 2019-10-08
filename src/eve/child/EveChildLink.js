import { quat } from "../../global";
import { EveChild } from "./EveChild";

/**
 * EveChildLink
 * TODO: Implement
 *
 * @property {String} name                                  -
 * @property {Array.<Tw2ValueBinding>} linkStrengthBindings -
 * @property {Array.<Curve>} linkStrengthCurves             -
 * @property {Tw2Mesh} mesh                                 -
 * @property {quat} rotation                                -
 */
export class EveChildLink extends EveChild
{

    name = "";
    linkStrengthBindings = [];
    linkStrengthCurves = [];
    mesh = null;
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

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "linkStrengthBindings", r.array ],
            [ "linkStrengthCurves", r.array ],
            [ "mesh", r.object ],
            [ "name", r.string ],
            [ "rotation", r.vector4 ]
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}
