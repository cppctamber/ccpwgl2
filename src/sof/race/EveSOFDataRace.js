import {EveSOFBaseClass} from "../EveSOFBaseClass";

/**
 * EveSOFDataRace
 *
 * @property {String} name                 -
 * @property {EveSOFDataBooster} booster   -
 * @property {EveSOFDataRaceDamage} damage -
 */
export class EveSOFDataRace extends EveSOFBaseClass
{

    name = "";
    booster = null;
    damage = null;

}

EveSOFDataRace.define(r =>
{
    return {
        type: "EveSOFDataRace",
        black: [
            ["booster", r.object],
            ["damage", r.object],
            ["name", r.string],
        ]
    };
});