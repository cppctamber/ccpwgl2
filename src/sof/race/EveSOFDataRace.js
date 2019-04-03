/**
 * EveSOFDataRace
 *
 * @property {String} name                 -
 * @property {EveSOFDataBooster} booster   -
 * @property {EveSOFDataRaceDamage} damage -
 */
export class EveSOFDataRace
{

    name = "";
    booster = null;
    damage = null;

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["booster", r.object],
            ["damage", r.object],
            ["name", r.string],
        ];
    }
}