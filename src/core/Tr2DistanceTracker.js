import {vec3} from "../global";

/**
 * Tr2DistanceTracker
 * @ccp Tr2DistanceTracker
 *
 * @property {String} name
 * @property {vec3} direction
 * @property {vec3} targetPosition
 */
export class Tr2DistanceTracker
{

    name = "";
    direction = vec3.create();
    targetPosition = vec3.create();

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["name", r.string],
            ["direction", r.vector3],
            ["targetPosition", r.vector3]
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}