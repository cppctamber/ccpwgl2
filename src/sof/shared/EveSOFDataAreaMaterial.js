/**
 * EveSOFDataAreaMaterial
 *
 * @property {Number} colorType -
 * @property {String} material1 -
 * @property {String} material2 -
 * @property {String} material3 -
 * @property {String} material4 -
 */
export class EveSOFDataAreaMaterial
{

    colorType = 0;
    material1 = "";
    material2 = "";
    material3 = "";
    material4 = "";

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["colorType", r.uint],
            ["material1", r.string],
            ["material2", r.string],
            ["material3", r.string],
            ["material4", r.string]
        ];
    }
}