import {Tw2BaseClass} from "../../class";

/**
 * EveSOFDataRaceDamage
 *
 * @parameter {Array.<EveSOFDataParameter>} armorImpactParameters  -
 * @parameter {Array.<EveSOFDataTexture>} armorImpactTextures      -
 * @parameter {Array.<EveSOFDataParameter>} shieldImpactParameters -
 * @parameter {Array.<EveSOFDataTexture>} shieldImpactTextures     -
 */
export default class EveSOFDataRaceDamage extends Tw2BaseClass
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

