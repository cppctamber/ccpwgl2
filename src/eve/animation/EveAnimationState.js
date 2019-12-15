import { meta } from "global";
import { EveAnimationStateTransition } from "./EveAnimationStateTransition";


/**
 * EveAnimationState
 *
 * @property {String} name                                    -
 * @property {EveAnimation} animation                         -
 * @property {Array<EveAnimationCurve>} curves                -
 * @property {Array<EveAnimationCommand>} commands            -
 * @property {Array<EveAnimationCommand>} initCommands        -
 * @property {Array<EveAnimationStateTransition>} transitions -
 */
@meta.notImplemented
@meta.type("EveAnimationState", true)
export class EveAnimationState
{

    @meta.black.string
    name = "";

    @meta.black.object
    animation = null;

    @meta.black.list
    curves = [];

    @meta.black.list
    commands = [];

    @meta.black.list
    initCommands = [];

    @meta.black.struct([ EveAnimationStateTransition ])
    transitions = [];

}
