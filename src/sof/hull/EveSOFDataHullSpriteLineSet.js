import {Tw2BaseClass} from "../../global";

/**
 * EveSOFDataHullSpriteLineSet
 *
 * @property {Array.<EveSOFDataHullSpriteLineSetItem>} items -
 * @property {Boolean} skinned                               -
 * @property {String} visibilityGroup                        -
 */
export class EveSOFDataHullSpriteLineSet extends Tw2BaseClass
{

    items = [];
    skinned = false;
    visibilityGroup = "";

}

Tw2BaseClass.define(EveSOFDataHullSpriteLineSet, Type =>
{
    return {
        isStaging: true,
        type: "EveSOFDataHullSpriteLineSet",
        props: {
            items: [["EveSOFDataHullSpriteLineSetItem"]],
            skinned: Type.BOOLEAN,
            visibilityGroup: Type.STRING
        }
    };
});

