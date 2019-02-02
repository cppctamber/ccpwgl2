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

}

Tw2BaseClass.define(Tr2ControllerReference, Type =>
{
    return {
        isStaging: true,
        type: "Tr2ControllerReference",
        category: "StateController",
        props: {
            path: Type.PATH
        },
        notImplemented: [
            "path"
        ]
    };
});

