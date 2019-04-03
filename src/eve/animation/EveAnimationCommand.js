/**
 * EveAnimationCommand
 * TODO: Identify default value of "command" property
 *
 * @property {Number} command - The command's number/ id
 */
export class EveAnimationCommand
{

    command = -1;

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["command", r.uint]
        ];
    }

}