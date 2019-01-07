import {Tw2StagingClass} from "../../class";

/**
 * EveSOFDataHullSpotlightSet
 *
 * @parameter {String} coneTextureResPath                    -
 * @parameter {String} glowTextureResPath                    -
 * @parameter {Array.<EveSOFDataHullSpotlightSetItem>} items -
 * @parameter {Boolean} skinned                              -
 * @parameter {Number} zOffset                               -
 */
export default class EveSOFDataHullSpotlightSet extends Tw2StagingClass
{

    coneTextureResPath = "";
    glowTextureResPath = "";
    items = [];
    skinned = false;
    zOffset = 0;

}

Tw2StagingClass.define(EveSOFDataHullSpotlightSet, Type =>
{
    return {
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

