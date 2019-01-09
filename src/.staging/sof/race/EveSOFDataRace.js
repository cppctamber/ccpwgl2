import {Tw2BaseClass} from "../../class";

/**
 * EveSOFDataRace
 *
 * @parameter {EveSOFDataBooster} booster   -
 * @parameter {EveSOFDataRaceDamage} damage -
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

