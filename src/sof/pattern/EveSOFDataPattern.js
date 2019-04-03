/**
 * EveSOFDataPattern
 *
 * @property {String} name                                  -
 * @property {EveSOFDataPatternLayer} layer1                -
 * @property {EveSOFDataPatternLayer} layer2                -
 * @property {Array.<EveSOFDataPatternPerHull>} projections -
 */
export class EveSOFDataPattern
{

    name = "";
    layer1 = null;
    layer2 = null;
    projections = [];

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["name", r.string],
            ["layer1", r.object],
            ["layer2", r.object],
            ["projections", r.array]
        ];
    }
}