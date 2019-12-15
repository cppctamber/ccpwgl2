import { meta } from "global";


@meta.type("EveSOFDataRaceDamage", true)
export class EveSOFDataRaceDamage
{

    @meta.black.listOf("EveSOFDataParameter")
    armorImpactParameters = [];

    @meta.black.listOf("EveSOFDataTexture")
    armorImpactTextures = [];

    @meta.black.listOf("EveSOFDataParameter")
    shieldImpactParameters = [];

    @meta.black.listOf("EveSOFDataTexture")
    shieldImpactTextures = [];

}
