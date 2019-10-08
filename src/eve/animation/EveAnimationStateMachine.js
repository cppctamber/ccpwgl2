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
export class EveAnimationStateMachine
{

    name = "";
    autoPlayDefault = true;
    states = [];
    transitions = [];
    trackMask = "";
    defaultAnimation = "";


    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "name", r.string ],
            [ "autoPlayDefault", r.boolean ],
            [ "states", r.array ],
            [ "transitions", r.array ],
            [ "trackMask", r.string ],
            [ "defaultAnimation", r.string ]
        ];
    }

}
