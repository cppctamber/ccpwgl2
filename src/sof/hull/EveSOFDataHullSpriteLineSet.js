import {EveSOFBaseClass} from "../EveSOFBaseClass";

/**
 * EveSOFDataHullSpriteLineSet
 *
 * @property {String} name                                   -
 * @property {Array.<EveSOFDataHullSpriteLineSetItem>} items -
 * @property {Boolean} skinned                               -
 * @property {String} visibilityGroup                        -
 */
export class EveSOFDataHullSpriteLineSet extends EveSOFBaseClass
{

    name = "";
    items = [];
    skinned = false;
    visibilityGroup = "";

}

EveSOFDataHullSpriteLineSet.define(r =>
{
    return {
        type: "EveSOFDataHullSpriteLineSet",
        black: [
            ["items", r.array],
            ["name", r.string],
            ["skinned", r.boolean],
            ["visibilityGroup", r.string]
        ]
    };
});