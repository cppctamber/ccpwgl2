import {EveSOFBaseClass} from "../EveSOFBaseClass";

/**
 * EveSOFDataRaceDamage
 *
 * @property {Array.<EveSOFDataParameter>} armorImpactParameters  -
 * @property {Array.<EveSOFDataTexture>} armorImpactTextures      -
 * @property {Array.<EveSOFDataParameter>} shieldImpactParameters -
 * @property {Array.<EveSOFDataTexture>} shieldImpactTextures     -
 */
export class EveSOFDataRaceDamage extends EveSOFBaseClass
{

    armorImpactParameters = [];
    armorImpactTextures = [];
    shieldImpactParameters = [];
    shieldImpactTextures = [];

}

EveSOFDataRaceDamage.define(r =>
{
    return {
        type: "EveSOFDataRaceDamage",
        black: [
            ["armorImpactParameters", r.array],
            ["armorImpactTextures", r.array],
            ["shieldImpactParameters", r.array],
            ["shieldImpactTextures", r.array]
        ]
    };
});