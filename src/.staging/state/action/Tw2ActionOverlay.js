import {Tw2StagingClass} from "../../class";

/**
 * Tw2ActionOverlay
 * @ccp Tr2ActionOverlay
 * @implements StateAction
 *
 * @parameter {String} path -
 */
export default class Tw2ActionOverlay extends Tw2StagingClass
{

    path = "";

}

Tw2StagingClass.define(Tw2ActionOverlay, Type =>
{
    return {
        type: "Tw2ActionOverlay",
        category: "StateAction",
        props: {
            path: Type.PATH
        }
    };
});

