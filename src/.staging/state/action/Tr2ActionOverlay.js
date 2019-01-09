import {Tw2BaseClass} from "../../class";

/**
 * Tr2ActionOverlay
 * @implements StateAction
 *
 * @parameter {String} path -
 */
export default class Tr2ActionOverlay extends Tw2BaseClass
{

    path = "";

}

Tw2BaseClass.define(Tr2ActionOverlay, Type =>
{
    return {
        isStaging: true,
        type: "Tr2ActionOverlay",
        category: "StateAction",
        props: {
            path: Type.PATH
        }
    };
});

