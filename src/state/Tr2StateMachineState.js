import { Tw2BaseClass } from "global";

/**
 * Tr2StateMachineState
 * Todo: Implement
 *
 * @property {String} name                                   -
 * @property {Array.<StateAction>} actions                   -
 * @property {Tr2SyncToAnimation} finalizer                  -
 * @property {Array.<Tr2StateMachineTransition>} transitions -
 */
export class Tr2StateMachineState extends Tw2BaseClass
{

    name = "";
    actions = [];
    finalizer = null;
    transitions = [];

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "actions", r.array ],
            [ "finalizer", r.object ],
            [ "name", r.string ],
            [ "transitions", r.array ]
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}
