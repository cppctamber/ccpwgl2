import {Tw2BaseClass} from "../global";

/**
 * EveSOFData
 *
 * @property {Array.<EveSOFDataFaction>} faction   -
 * @property {EveSOFDataGeneric} generic           -
 * @property {Array.<EveSOFDataHull>} hull         -
 * @property {Array.<EveSOFDataMaterial>} material -
 * @property {Array.<EveSOFDataPattern>} pattern   -
 * @property {Array.<EveSOFDataRace>} race         -
 */
export class EveSOFData extends Tw2BaseClass
{

    faction = [];
    generic = null;
    hull = [];
    material = [];
    pattern = [];
    race = [];

}

Tw2BaseClass.define(EveSOFData, Type =>
{
    return {
        isStaging: true,
        type: "EveSOFData",
        props: {
            faction: [["EveSOFDataFaction"]],
            generic: ["EveSOFDataGeneric"],
            hull: [["EveSOFDataHull"]],
            material: [["EveSOFDataMaterial"]],
            pattern: [["EveSOFDataPattern"]],
            race: [["EveSOFDataRace"]]
        }
    };
});

