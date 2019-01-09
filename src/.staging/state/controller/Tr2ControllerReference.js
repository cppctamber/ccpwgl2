import {Tw2BaseClass} from "../../class";

/**
 * Tr2ControllerReference
 * @implements StateController
 *
 * @parameter {String} path -
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

