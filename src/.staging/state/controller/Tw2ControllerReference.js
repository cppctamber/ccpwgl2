import {Tw2StagingClass} from "../../class";

/**
 * Tw2ControllerReference
 * @ccp Tr2ControllerReference
 * @implements StateController
 *
 * @parameter {String} path -
 */
export default class Tw2ControllerReference extends Tw2StagingClass
{

    path = "";

}

Tw2StagingClass.define(Tw2ControllerReference, Type =>
{
    return {
        type: "Tw2ControllerReference",
        category: "StateController",
        props: {
            path: Type.PATH
        }
    };
});

