/**
 * EveSOFDataRaceDamage
 *
 * @property {Array.<EveSOFDataParameter>} armorImpactParameters  -
 * @property {Array.<EveSOFDataTexture>} armorImpactTextures      -
 * @property {Array.<EveSOFDataParameter>} shieldImpactParameters -
 * @property {Array.<EveSOFDataTexture>} shieldImpactTextures     -
 */
export class EveSOFDataRaceDamage
{

    armorImpactParameters = [];
    armorImpactTextures = [];
    shieldImpactParameters = [];
    shieldImpactTextures = [];

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "armorImpactParameters", r.array ],
            [ "armorImpactTextures", r.array ],
            [ "shieldImpactParameters", r.array ],
            [ "shieldImpactTextures", r.array ]
        ];
    }
}
