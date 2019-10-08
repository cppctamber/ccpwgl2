/**
 * Tr2ActionPlaySound
 * TODO: Implement
 * @ccp Tr2ActionPlaySound
 *
 * @property {String} emitter
 * @property {String} event
 */
export class Tr2ActionPlaySound
{

    emitter = "";
    event = "";

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "emitter", r.string ],
            [ "event", r.string ]
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}
