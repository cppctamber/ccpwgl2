import {Tw2StagingClass} from "../../class";

/**
 * EveSOFDataHullSpriteLineSet
 *
 * @parameter {Array.<EveSOFDataHullSpriteLineSetItem>} items -
 * @parameter {Boolean} skinned                               -
 * @parameter {String} visibilityGroup                        -
 */
export default class EveSOFDataHullSpriteLineSet extends Tw2StagingClass
{

    items = [];
    skinned = false;
    visibilityGroup = "";

}

Tw2StagingClass.define(EveSOFDataHullSpriteLineSet, Type =>
{
    return {
        type: "EveSOFDataHullSpriteLineSet",
        props: {
            items: [["EveSOFDataHullSpriteLineSetItem"]],
            skinned: Type.BOOLEAN,
            visibilityGroup: Type.STRING
        }
    };
});

