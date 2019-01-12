import {Tw2BaseClass} from "../../../global";

/**
 * EveSOFDataFaction
 *
 * @property {EveSOFDataArea} areaTypes                               -
 * @property {Array.<EveSOFDataFactionChild>} children                -
 * @property {EveSOFDataFactionColorSet} colorSet                     -
 * @property {Array.<EveSOFDataFactionDecal>} decals                  -
 * @property {EveSOFDataPatternLayer} defaultPattern                  -
 * @property {String} defaultPatternLayer1MaterialName                -
 * @property {String} description                                     -
 * @property {Number} materialUsageMtl1                               -
 * @property {Number} materialUsageMtl2                               -
 * @property {Number} materialUsageMtl3                               -
 * @property {Number} materialUsageMtl4                               -
 * @property {Array.<EveSOFDataFactionPlaneSet>} planeSets            -
 * @property {String} resPathInsert                                   -
 * @property {Array.<EveSOFDataFactionSpotlightSet>} spotlightSets    -
 * @property {EveSOFDataFactionVisibilityGroupSet} visibilityGroupSet -
 */
export default class EveSOFDataFaction extends Tw2BaseClass
{

    areaTypes = null;
    children = [];
    colorSet = null;
    decals = [];
    defaultPattern = null;
    defaultPatternLayer1MaterialName = "";
    description = "";
    materialUsageMtl1 = 0;
    materialUsageMtl2 = 0;
    materialUsageMtl3 = 0;
    materialUsageMtl4 = 0;
    planeSets = [];
    resPathInsert = "";
    spotlightSets = [];
    visibilityGroupSet = null;

}

Tw2BaseClass.define(EveSOFDataFaction, Type =>
{
    return {
        isStaging: true,
        type: "EveSOFDataFaction",
        props: {
            areaTypes: ["EveSOFDataArea"],
            children: [["EveSOFDataFactionChild"]],
            colorSet: ["EveSOFDataFactionColorSet"],
            decals: [["EveSOFDataFactionDecal"]],
            defaultPattern: ["EveSOFDataPatternLayer"],
            defaultPatternLayer1MaterialName: Type.STRING,
            description: Type.STRING,
            materialUsageMtl1: Type.NUMBER,
            materialUsageMtl2: Type.NUMBER,
            materialUsageMtl3: Type.NUMBER,
            materialUsageMtl4: Type.NUMBER,
            planeSets: [["EveSOFDataFactionPlaneSet"]],
            resPathInsert: Type.PATH,
            spotlightSets: [["EveSOFDataFactionSpotlightSet"]],
            visibilityGroupSet: ["EveSOFDataFactionVisibilityGroupSet"]
        }
    };
});

