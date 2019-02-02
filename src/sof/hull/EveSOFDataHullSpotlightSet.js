import {Tw2BaseClass} from "../../global";

/**
 * EveSOFDataHullSpotlightSet
 *
 * @property {String} coneTextureResPath                    -
 * @property {String} glowTextureResPath                    -
 * @property {Array.<EveSOFDataHullSpotlightSetItem>} items -
 * @property {Boolean} skinned                              -
 * @property {Number} zOffset                               -
 */
export class EveSOFDataHullSpotlightSet extends Tw2BaseClass
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

