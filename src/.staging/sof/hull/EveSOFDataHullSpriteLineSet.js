import {Tw2BaseClass} from "../../class";

/**
 * EveSOFDataHullSpriteLineSet
 *
 * @parameter {Array.<EveSOFDataHullSpriteLineSetItem>} items -
 * @parameter {Boolean} skinned                               -
 * @parameter {String} visibilityGroup                        -
 */
export default class EveSOFDataHullSpriteLineSet extends Tw2BaseClass
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

