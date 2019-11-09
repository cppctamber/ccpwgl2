import { Tw2BaseClass } from "global";

/**
 * Tr2StateMachine
 * Todo: Implement
 *
 * @property {String} name                         -
 * @property {Number} startState                   -
 * @property {Array.<Tr2StateMachineState>} states -
 */
export class Tr2StateMachine extends Tw2BaseClass
{

    name = "";
    startState = 0;
    states = [];

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "name", r.string ],
            [ "states", r.array ],
            [ "startState", r.uint ],
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}
