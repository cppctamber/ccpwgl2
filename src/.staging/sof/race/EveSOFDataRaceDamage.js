import {Tw2StagingClass} from "../../class";

/**
 * EveSOFDataRaceDamage
 *
 * @parameter {Array.<EveSOFDataParameter>} armorImpactParameters  -
 * @parameter {Array.<EveSOFDataTexture>} armorImpactTextures      -
 * @parameter {Array.<EveSOFDataParameter>} shieldImpactParameters -
 * @parameter {Array.<EveSOFDataTexture>} shieldImpactTextures     -
 */
export default class EveSOFDataRaceDamage extends Tw2StagingClass
{

    armorImpactParameters = [];
    armorImpactTextures = [];
    shieldImpactParameters = [];
    shieldImpactTextures = [];

}

Tw2StagingClass.define(EveSOFDataRaceDamage, Type =>
{
    return {
        type: "EveSOFDataRaceDamage",
        props: {
            armorImpactParameters: [["EveSOFDataParameter"]],
            armorImpactTextures: [["EveSOFDataTexture"]],
            shieldImpactParameters: [["EveSOFDataParameter"]],
            shieldImpactTextures: [["EveSOFDataTexture"]]
        }
    };
});

