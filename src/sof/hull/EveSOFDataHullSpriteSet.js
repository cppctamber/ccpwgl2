import {Tw2BaseClass} from "../../global";

/**
 * EveSOFDataHullSpriteSet
 *
 * @property {Array.<EveSOFDataHullSpriteSetItem>} items -
 * @property {Boolean} skinned                           -
 * @property {String} visibilityGroup                    -
 */
export default class EveSOFDataHullSpriteSet extends Tw2BaseClass
{

    items = [];
    skinned = false;
    visibilityGroup = "";

}

Tw2BaseClass.define(EveSOFDataHullSpriteSet, Type =>
{
    return {
        isStaging: true,
        type: "EveSOFDataHullSpriteSet",
        props: {
            items: [["EveSOFDataHullSpriteSetItem"]],
            skinned: Type.BOOLEAN,
            visibilityGroup: Type.STRING
        }
    };
});

