import { meta } from "utils";


@meta.type("EveSOFDataRace")
export class EveSOFDataRace
{

    @meta.string
    name = "";

    @meta.struct("EveSOFDataBooster")
    booster = null;

    @meta.struct("EveSOFDataRaceDamage")
    damage = null;

}
