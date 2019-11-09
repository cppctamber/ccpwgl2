import { vec3 } from "global";
import { Tw2BaseClass } from "global";

/**
 * TriObserverLocal
 * Todo: Implement
 *
 * @property {vec3} front -
 */
export class TriObserverLocal extends Tw2BaseClass
{

    front = vec3.create();

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "front", r.vector3 ]
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}
