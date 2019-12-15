import { meta } from "global";


@meta.type("EveSOFDataRace", true)
export class EveSOFDataRace
{

    @meta.black.string
    name = "";

    @meta.black.objectOf("EveSOFDataBooster")
    booster = null;

    @meta.black.objectOf("EveSOFDataRaceDamage")
    damage = null;

}
