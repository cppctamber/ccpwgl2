import {Tw2StagingClass} from "../../class";

/**
 * EveSOFDataRace
 *
 * @parameter {EveSOFDataBooster} booster   -
 * @parameter {EveSOFDataRaceDamage} damage -
 */
export default class EveSOFDataRace extends Tw2StagingClass
{

    booster = null;
    damage = null;

}

Tw2StagingClass.define(EveSOFDataRace, Type =>
{
    return {
        type: "EveSOFDataRace",
        props: {
            booster: ["EveSOFDataBooster"],
            damage: ["EveSOFDataRaceDamage"]
        }
    };
});

