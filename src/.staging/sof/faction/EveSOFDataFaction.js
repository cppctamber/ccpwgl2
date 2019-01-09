import {Tw2BaseClass} from "../../class";

/**
 * EveSOFDataFaction
 *
 * @parameter {EveSOFDataArea} areaTypes                               -
 * @parameter {Array.<EveSOFDataFactionChild>} children                -
 * @parameter {EveSOFDataFactionColorSet} colorSet                     -
 * @parameter {Array.<EveSOFDataFactionDecal>} decals                  -
 * @parameter {EveSOFDataPatternLayer} defaultPattern                  -
 * @parameter {String} defaultPatternLayer1MaterialName                -
 * @parameter {String} description                                     -
 * @parameter {Number} materialUsageMtl1                               -
 * @parameter {Number} materialUsageMtl2                               -
 * @parameter {Number} materialUsageMtl3                               -
 * @parameter {Number} materialUsageMtl4                               -
 * @parameter {Array.<EveSOFDataFactionPlaneSet>} planeSets            -
 * @parameter {String} resPathInsert                                   -
 * @parameter {Array.<EveSOFDataFactionSpotlightSet>} spotlightSets    -
 * @parameter {EveSOFDataFactionVisibilityGroupSet} visibilityGroupSet -
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

