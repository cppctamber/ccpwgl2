import { mat4, quat, vec3 } from "../../global";
import { EveChild } from "./EveChild";

/**
 * EveChildExplosion
 * TODO: Implement
 *
 * @property {String} name                               -
 * @property {Number} globalDuration                     -
 * @property {EveChildContainer} globalExplosion         -
 * @property {Number} globalExplosionDelay               -
 * @property {vec3} globalScaling                        -
 * @property {Number} localDuration                      -
 * @property {EveChildContainer} localExplosion          -
 * @property {Number} localExplosionInterval             -
 * @property {Number} localExplosionIntervalFactor       -
 * @property {EveChildContainer} localExplosionShared    -
 * @property {Array.<EveChildContainer>} localExplosions -
 * @property {mat4} localTransform                       -
 * @property {quat} rotation                             -
 * @property {vec3} scaling                              -
 */
export class EveChildExplosion extends EveChild
{

    name = "";
    globalDuration = 0;
    globalExplosion = null;
    globalExplosionDelay = 0;
    globalScaling = vec3.fromValues(1, 1, 1);
    localDuration = 0;
    localExplosion = null;
    localExplosionInterval = 0;
    localExplosionIntervalFactor = 0;
    localExplosionShared = null;
    localExplosions = [];
    localTransform = mat4.create();
    rotation = quat.create();
    scaling = vec3.fromValues(1, 1, 1);

    /**
     * Gets object resources
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2Resource>} [out]
     */
    GetResources(out = [])
    {
        if (this.localExplosion) this.localExplosion.GetResources(out);
        if (this.localExplosionShared) this.localExplosionShared.GetResources(out);
        for (let i = 0; i < this.localExplosions.length; i++)
        {
            this.localExplosions[i].GetResources(out);
        }
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
            [ "globalDuration", r.float ],
            [ "globalExplosion", r.object ],
            [ "globalExplosionDelay", r.float ],
            [ "globalExplosions", r.array ],
            [ "globalScaling", r.vector3 ],
            [ "localDuration", r.float ],
            [ "localExplosion", r.object ],
            [ "localExplosions", r.array ],
            [ "localExplosionInterval", r.float ],
            [ "localExplosionIntervalFactor", r.float ],
            [ "localExplosionShared", r.object ],
            [ "localTransform", r.matrix ],
            [ "name", r.string ],
            [ "rotation", r.vector4 ],
            [ "scaling", r.vector3 ]
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}
