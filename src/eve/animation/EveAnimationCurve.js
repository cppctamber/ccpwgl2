/**
 * EveAnimationCurve
 *
 * @property {String} name - The name of the target animation curve?
 */
export class EveAnimationCurve
{

    name = "";

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "name", r.string ]
        ];
    }

}
