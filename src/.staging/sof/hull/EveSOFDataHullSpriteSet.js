import {Tw2StagingClass} from "../../class";

/**
 * EveSOFDataHullSpriteSet
 *
 * @parameter {Array.<EveSOFDataHullSpriteSetItem>} items -
 * @parameter {Boolean} skinned                           -
 * @parameter {String} visibilityGroup                    -
 */
export default class EveSOFDataHullSpriteSet extends Tw2StagingClass
{

    items = [];
    skinned = false;
    visibilityGroup = "";

}

Tw2StagingClass.define(EveSOFDataHullSpriteSet, Type =>
{
    return {
        type: "EveSOFDataHullSpriteSet",
        props: {
            items: [["EveSOFDataHullSpriteSetItem"]],
            skinned: Type.BOOLEAN,
            visibilityGroup: Type.STRING
        }
    };
});

