import { meta } from "utils";


@meta.type("EveSOFDataRace")
export class EveSOFDataRace extends meta.Model
{

    @meta.string
    name = "";

    @meta.struct("EveSOFDataBooster")
    booster = null;

    @meta.struct("EveSOFDataRaceDamage")
    damage = null;

}
