import {EveSOFBaseClass} from "../EveSOFBaseClass";

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
export class EveSOFDataHullPlaneSet extends EveSOFBaseClass
{

    name = "";
    atlasSize = 0;
    items = [];
    layer1MapResPath = "";
    layer2MapResPath = "";
    maskMapResPath = "";
    skinned = false;
    usage = 0;

}

EveSOFDataHullPlaneSet.define(r =>
{
    return {
        type: "EveSOFDataHullPlaneSet",
        black: [
            ["atlasSize", r.uint],
            ["items", r.array],
            ["layer1MapResPath", r.path],
            ["layer2MapResPath", r.path],
            ["maskMapResPath", r.path],
            ["name", r.string],
            ["planeData", r.vector4],
            ["skinned", r.boolean],
            ["usage", r.uint]
        ]
    };
});