/**
 * EveSOFDataPatternPerHull
 *
 * @property {String} name                                -
 * @property {EveSOFDataPatternTransform} transformLayer1 -
 * @property {EveSOFDataPatternTransform} transformLayer2 -
 */
export class EveSOFDataPatternPerHull
{

    name = "";
    transformLayer1 = null;
    transformLayer2 = null;

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["name", r.string],
            ["transformLayer1", r.object],
            ["transformLayer2", r.object]
        ];
    }
}