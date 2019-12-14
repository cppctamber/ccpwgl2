import { meta } from "global";

/**
 * EveAnimationStateMachine
 *
 * @property {String} name                                    -
 * @property {Boolean} autoPlayDefault                        -
 * @property {Array<EveAnimationState>} states                -
 * @property {Array<EveAnimationStateTransition>} transitions -
 * @property {String} trackMask                               -
 * @property {String} defaultAnimation                        -
 */
@meta.notImplemented
@meta.type("EveAnimationStateMachine", true)
export class EveAnimationStateMachine
{

    @meta.black.string
    name = "";

    @meta.black.boolean
    autoPlayDefault = true;

    @meta.black.list
    states = [];

    @meta.black.list
    transitions = [];

    @meta.black.string
    trackMask = "";

    @meta.black.string
    defaultAnimation = "";

}
