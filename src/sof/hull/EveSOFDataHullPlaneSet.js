/**
 * EveSOFDataHullPlaneSet
 *
 * @property {String} name                              -
 * @property {Number} atlasSize                         -
 * @property {Array.<EveSOFDataHullPlaneSetItem>} items -
 * @property {String} layer1MapResPath                  -
 * @property {String} layer2MapResPath                  -
 * @property {String} maskMapResPath                    -
 * @property {Boolean} skinned                          -
 * @property {Number} usage                             -
 */
export class EveSOFDataHullPlaneSet
{

    name = "";
    atlasSize = 0;
    items = [];
    layer1MapResPath = "";
    layer2MapResPath = "";
    maskMapResPath = "";
    skinned = false;
    usage = 0;

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["atlasSize", r.uint],
            ["items", r.array],
            ["layer1MapResPath", r.path],
            ["layer2MapResPath", r.path],
            ["maskMapResPath", r.path],
            ["name", r.string],
            ["planeData", r.vector4],
            ["skinned", r.boolean],
            ["usage", r.uint]
        ];
    }
}