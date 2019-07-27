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
     * Reduces transforms to an array
     * @param {Array} [out=[]]
     * @returns {Array}
     */
    AssignTransforms(out = [])
    {
        if (this.transformLayer1) out[0] = this.transformLayer1.Reduce();
        if (this.transformLayer2) out[1] = this.transformLayer2.Reduce();
        return out;
    }

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