import { meta } from "global";


@meta.type("EveSOFDataFaction", true)
export class EveSOFDataFaction
{

    @meta.black.string
    name = "";

    @meta.black.objectOf("EveSOFDataArea")
    areaTypes = null;

    @meta.black.listOf("EveSOFDataFactionChild")
    children = [];

    @meta.black.objectOf("EveSOFDataFactionColorSet")
    colorSet = null;

    @meta.black.objectOf("EveSOFDataPatternLayer")
    defaultPattern = null;

    @meta.black.string
    defaultPatternLayer1MaterialName = "";

    @meta.black.string
    description = "";

    @meta.black.objectOf("EveSOFDataLogoSet")
    logoSet = null;

    @meta.black.uint
    materialUsageMtl1 = 0;

    @meta.black.uint
    materialUsageMtl2 = 0;

    @meta.black.uint
    materialUsageMtl3 = 0;

    @meta.black.uint
    materialUsageMtl4 = 0;

    @meta.black.listOf("EveSOFDataFactionPlaneSet")
    planeSets = [];

    @meta.black.string
    resPathInsert = "";

    @meta.black.listOf("EveSOFDataFactionSpotlightSet")
    spotlightSets = [];

    @meta.black.objectOf("EveSOFDataFactionVisibilityGroupSet")
    visibilityGroupSet = null;

}

