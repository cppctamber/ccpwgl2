import {EveSOFBaseClass} from "./EveSOFBaseClass";

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
export class EveSOFData extends EveSOFBaseClass
{

    faction = [];
    generic = null;
    hull = [];
    material = [];
    pattern = [];
    race = [];

}

EveSOFData.define(r =>
{
    return {
        type: "EveSOFData",
        black: [
            ["faction", r.array],
            ["generic", r.object],
            ["hull", r.array],
            ["material", r.array],
            ["pattern", r.array],
            ["race", r.array]
        ]
    };
});