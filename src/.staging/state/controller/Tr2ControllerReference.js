import {Tw2BaseClass} from "../../../global";

/**
 * Tr2ControllerReference
 * @implements StateController
 *
 * @property {String} path -
 */
export default class Tr2ControllerReference extends Tw2BaseClass
{

    path = "";

}

Tw2BaseClass.define(Tr2ControllerReference, Type =>
{
    return {
        isStaging: true,
        type: "Tr2ControllerReference",
        category: "StateController",
        props: {
            path: Type.PATH
        }
    };
});

