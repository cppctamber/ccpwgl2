import { meta } from "global";


@meta.ctor("EveSOFDataFaction", true)
export class EveSOFDataFaction
{

    @meta.string
    name = "";

    @meta.struct("EveSOFDataArea")
    areaTypes = null;

    @meta.list("EveSOFDataFactionChild")
    children = [];

    @meta.struct("EveSOFDataFactionColorSet")
    colorSet = null;

    @meta.struct("EveSOFDataPatternLayer")
    defaultPattern = null;

    @meta.string
    defaultPatternLayer1MaterialName = "";

    @meta.string
    description = "";

    @meta.struct("EveSOFDataLogoSet")
    logoSet = null;

    @meta.uint
    materialUsageMtl1 = 0;

    @meta.uint
    materialUsageMtl2 = 0;

    @meta.uint
    materialUsageMtl3 = 0;

    @meta.uint
    materialUsageMtl4 = 0;

    @meta.list("EveSOFDataFactionPlaneSet")
    planeSets = [];

    @meta.string
    resPathInsert = "";

    @meta.list("EveSOFDataFactionSpotlightSet")
    spotlightSets = [];

    @meta.struct("EveSOFDataFactionVisibilityGroupSet")
    visibilityGroupSet = null;

}

