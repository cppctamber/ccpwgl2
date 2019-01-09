import {Tw2BaseClass} from "../../class";

/**
 * EveSOFDataHullSpriteSet
 *
 * @parameter {Array.<EveSOFDataHullSpriteSetItem>} items -
 * @parameter {Boolean} skinned                           -
 * @parameter {String} visibilityGroup                    -
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

