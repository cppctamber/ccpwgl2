import {Tw2BaseClass} from "../../global";

/**
 * Tr2Controller
 * Todo: Implement
 *
 * @property {String} name                           -
 * @property {Boolean} isShared                      -
 * @property {Array.<Tr2StateMachine>} stateMachines -
 * @property {Array.<StateVariable>} variables       -
 */
export class Tr2Controller extends Tw2BaseClass
{

    name = "";
    isShared = false;
    stateMachines = [];
    variables = [];

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["isShared", r.boolean],
            ["stateMachines", r.array],
            ["name", r.string],
            ["variables", r.array]
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}
