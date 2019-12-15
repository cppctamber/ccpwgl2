import { meta, Tw2BaseClass } from "global";

/**
 * Tr2Controller
 *
 * @property {String} name                           -
 * @property {Boolean} isShared                      -
 * @property {Array.<Tr2StateMachine>} stateMachines -
 * @property {Array.<StateVariable>} variables       -
 */
@meta.notImplemented
@meta.type("Tr2Controller", true)
export class Tr2Controller extends Tw2BaseClass
{

    @meta.black.string
    name = "";

    @meta.black.boolean
    isShared = false;

    @meta.black.list
    stateMachines = [];

    @meta.black.list
    variables = [];

}
