import {Tw2BaseClass} from "../../global";

/**
 * EveSOFDataRaceDamage
 *
 * @property {Array.<EveSOFDataParameter>} armorImpactParameters  -
 * @property {Array.<EveSOFDataTexture>} armorImpactTextures      -
 * @property {Array.<EveSOFDataParameter>} shieldImpactParameters -
 * @property {Array.<EveSOFDataTexture>} shieldImpactTextures     -
 */
export class EveSOFDataRaceDamage extends Tw2BaseClass
{

    armorImpactParameters = [];
    armorImpactTextures = [];
    shieldImpactParameters = [];
    shieldImpactTextures = [];

}

Tw2BaseClass.define(EveSOFDataRaceDamage, Type =>
{
    return {
        isStaging: true,
        type: "EveSOFDataRaceDamage",
        props: {
            armorImpactParameters: [["EveSOFDataParameter"]],
            armorImpactTextures: [["EveSOFDataTexture"]],
            shieldImpactParameters: [["EveSOFDataParameter"]],
            shieldImpactTextures: [["EveSOFDataTexture"]]
        }
    };
});

