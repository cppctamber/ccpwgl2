import {EveSOFBaseClass} from "../EveSOFBaseClass";

/**
 * EveSOFDataHullSpriteSet
 *
 * @property {String} name                               -
 * @property {Array.<EveSOFDataHullSpriteSetItem>} items -
 * @property {Boolean} skinned                           -
 * @property {String} visibilityGroup                    -
 */
export class EveSOFDataHullSpriteSet extends EveSOFBaseClass
{

    name = "";
    items = [];
    skinned = false;
    visibilityGroup = "";

}

EveSOFDataHullSpriteSet.define(r =>
{
    return {
        type: "EveSOFDataHullSpriteSet",
        black: [
            ["name", r.string],
            ["items", r.array],
            ["skinned", r.boolean],
            ["visibilityGroup", r.string]
        ]
    };
});