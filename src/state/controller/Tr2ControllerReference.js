import {Tw2BaseClass} from "../../global";

/**
 * Tr2ControllerReference
 * Todo: Implement
 *
 * @property {String} path -
 */
export class Tr2ControllerReference extends Tw2BaseClass
{

    path = "";

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["path", r.path]
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}