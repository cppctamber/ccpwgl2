import {Tw2BaseClass} from "../class";

/**
 * EveSOFData
 *
 * @parameter {Array.<EveSOFDataFaction>} faction   -
 * @parameter {EveSOFDataGeneric} generic           -
 * @parameter {Array.<EveSOFDataHull>} hull         -
 * @parameter {Array.<EveSOFDataMaterial>} material -
 * @parameter {Array.<EveSOFDataPattern>} pattern   -
 * @parameter {Array.<EveSOFDataRace>} race         -
 */
export default class EveSOFData extends Tw2BaseClass
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

