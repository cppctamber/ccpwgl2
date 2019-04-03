import {mat4, quat, vec3} from "../../global";
import {EveChild} from "./EveChild";


/**
 * EveChildCloud
 * TODO: Implement
 *
 * @property {Number} cellScreenSize      -
 * @property {Tw2Effect} effect           -
 * @property {Number} preTesselationLevel -
 * @property {quat} rotation              -
 * @property {vec3} scaling               -
 * @property {Number} sortingModifier     -
 * @property {vec3} translation           -
 */
export class EveChildCloud extends EveChild
{

    cellScreenSize = 0;
    effect = null;
    preTesselationLevel = 0;
    rotation = quat.create();
    scaling = vec3.fromValues(1, 1, 1);
    sortingModifier = 0;
    translation = vec3.create();

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["cellScreenSize", r.float],
            ["sortingModifier", r.float],
            ["effect", r.object],
            ["name", r.string],
            ["preTesselationLevel", r.uint],
            ["rotation", r.vector4],
            ["scaling", r.vector3],
            ["translation", r.vector3]
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}
