import {Tw2BaseClass} from "../../../global";

/**
 * EveSOFDataRace
 *
 * @property {EveSOFDataBooster} booster   -
 * @property {EveSOFDataRaceDamage} damage -
 */
export default class EveSOFDataRace extends Tw2BaseClass
{

    booster = null;
    damage = null;

}

Tw2BaseClass.define(EveSOFDataRace, Type =>
{
    return {
        isStaging: true,
        type: "EveSOFDataRace",
        props: {
            booster: ["EveSOFDataBooster"],
            damage: ["EveSOFDataRaceDamage"]
        }
    };
});

