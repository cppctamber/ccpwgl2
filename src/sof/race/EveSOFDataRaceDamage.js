import { meta } from "global";


@meta.ctor("EveSOFDataRaceDamage")
export class EveSOFDataRaceDamage
{

    @meta.list("EveSOFDataParameter")
    armorImpactParameters = [];

    @meta.list("EveSOFDataTexture")
    armorImpactTextures = [];

    @meta.list("EveSOFDataParameter")
    shieldImpactParameters = [];

    @meta.list("EveSOFDataTexture")
    shieldImpactTextures = [];

}
