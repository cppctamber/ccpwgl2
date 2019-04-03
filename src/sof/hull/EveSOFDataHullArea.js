/**
 * EveSOFDataHullArea
 *
 * @property {String} name                            -
 * @property {Number} areaType                        -
 * @property {Number} blockedMaterials                -
 * @property {Number} count                           -
 * @property {Number} index                           -
 * @property {Array.<EveSOFDataParameter>} parameters -
 * @property {String} shader                          -
 * @property {Array.<EveSOFDataTexture>} textures     -
 */
export class EveSOFDataHullArea
{

    name = "";
    areaType = 0;
    blockedMaterials = 0;
    count = 0;
    index = 0;
    parameters = [];
    shader = "";
    textures = [];

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["areaType", r.uint],
            ["blockedMaterials", r.uint],
            ["count", r.uint],
            ["index", r.uint],
            ["name", r.string],
            ["parameters", r.array],
            ["shader", r.string],
            ["textures", r.array]
        ];
    }
}