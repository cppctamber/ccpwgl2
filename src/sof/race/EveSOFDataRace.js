import { meta } from "utils";
import { EveSOFDataBooster } from "../shared/EveSOFDataBooster";
import { EveSOFDataRaceDamage } from "./EveSOFDataRaceDamage";


@meta.type("EveSOFDataRace")
@meta.define({
    wgl: "EveSOFDataRace",
    ccp: true
})
export class EveSOFDataRace extends meta.Model
{

    @meta.string
    name = "";

    @meta.struct("EveSOFDataBooster")
    booster = null;

    @meta.uint
    hullPrimaryHeatColorType = 6;

    @meta.uint
    hullReactorHeatColorType = 9;

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
        out.hullPrimaryHeatColorType = b && b.hullPrimaryHeatColorType !== undefined ? b.hullPrimaryHeatColorType : a && a.hullPrimaryHeatColorType !== undefined ? a.hullPrimaryHeatColorType : out.hullPrimaryHeatColorType;
        out.hullReactorHeatColorType = b && b.hullReactorHeatColorType !== undefined ? b.hullReactorHeatColorType : a && a.hullReactorHeatColorType !== undefined ? a.hullReactorHeatColorType : out.hullReactorHeatColorType;
        out.damage = EveSOFDataRaceDamage.combine(a ? a.damage : null, b ? b.damage : null, out.damage);
        return out;
    }

}
