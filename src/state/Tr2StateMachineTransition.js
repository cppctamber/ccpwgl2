import { Tw2BaseClass } from "global";

/**
 * Tr2StateMachineTransition
 * Todo: Implement
 *
 * @property {String} name      -
 * @property {String} condition -
 */
export class Tr2StateMachineTransition extends Tw2BaseClass
{

    name = "";
    condition = "";

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "condition", r.string ],
            [ "name", r.string ]
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}
