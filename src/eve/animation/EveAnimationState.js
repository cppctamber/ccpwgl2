import { EveAnimationStateTransition } from "./EveAnimationStateTransition";

/**
 * EveAnimationState
 * TODO: Identify array children type of "initCommands" property
 *
 * @property {String} name                                    -
 * @property {EveAnimation} animation                         -
 * @property {Array<EveAnimationCurve>} curves                -
 * @property {Array<EveAnimationCommand>} commands            -
 * @property {Array<*>} initCommands                          -
 * @property {Array<EveAnimationStateTransition>} transitions -
 */
export class EveAnimationState
{

    name = "";
    animation = null;
    curves = [];
    commands = [];
    initCommands = [];
    transitions = [];

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "name", r.string ],
            [ "animation", r.object ],
            [ "curves", r.array ],
            [ "commands", r.array ],
            [ "initCommands", r.array ],
            [ "transitions", r.structList(EveAnimationStateTransition) ],
        ];
    }

}
