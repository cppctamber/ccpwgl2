/**
 * EveAnimation
 * TODO: Identify default value for "loop" property
 *
 * @property {String} name  - The animation's name
 * @property {Number} loops - The amount of time the animation should loop
 */
export class EveAnimation
{

    name = "";
    loops = 0;

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["name", r.string],
            ["loops", r.uint]
        ];
    }

}