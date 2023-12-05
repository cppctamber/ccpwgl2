import { meta } from "utils";
import { EveSOFDataBooster } from "../shared/EveSOFDataBooster";
import { EveSOFDataRaceDamage } from "./EveSOFDataRaceDamage";


@meta.type("EveSOFDataRace")
export class EveSOFDataRace extends meta.Model
{

    @meta.string
    override = null;

    @meta.string
    name = "";

    @meta.struct("EveSOFDataBooster")
    booster = null;

    @meta.struct("EveSOFDataRaceDamage")
    damage = null;


    /**
     *
     * @param {EveSOFDataRace} a
     * @param {EveSOFDataRace} b
     * @param {EveSOFDataRace} [out]
     * @returns {EveSOFDataRace}
     */
    static combine(a, b, out)
    {
        out = out || new this();
        out.name = b.name;
        out.booster = EveSOFDataBooster.combine(a ? a.booster : null, b ? b.booster : null, out.booster);
        out.damage = EveSOFDataRaceDamage.combine(a ? a.damage : null, b ? b.damage : null, out.damage);
        return out;
    }

}
