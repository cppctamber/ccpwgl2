import {Tw2BaseClass} from "../../class";

/**
 * EveSOFDataHullSpotlightSet
 *
 * @parameter {String} coneTextureResPath                    -
 * @parameter {String} glowTextureResPath                    -
 * @parameter {Array.<EveSOFDataHullSpotlightSetItem>} items -
 * @parameter {Boolean} skinned                              -
 * @parameter {Number} zOffset                               -
 */
export default class EveSOFDataHullSpotlightSet extends Tw2BaseClass
{

    coneTextureResPath = "";
    glowTextureResPath = "";
    items = [];
    skinned = false;
    zOffset = 0;

}

Tw2BaseClass.define(EveSOFDataHullSpotlightSet, Type =>
{
    return {
        isStaging: true,
        type: "EveSOFDataHullSpotlightSet",
        props: {
            coneTextureResPath: Type.PATH,
            glowTextureResPath: Type.PATH,
            items: [["EveSOFDataHullSpotlightSetItem"]],
            skinned: Type.BOOLEAN,
            zOffset: Type.NUMBER
        }
    };
});

