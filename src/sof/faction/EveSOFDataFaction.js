/**
 * EveSOFDataFaction
 *
 * @property {String} name                                            -
 * @property {EveSOFDataArea} areaTypes                               -
 * @property {Array.<EveSOFDataFactionChild>} children                -
 * @property {EveSOFDataFactionColorSet} colorSet                     -
 * @property {Array.<EveSOFDataFactionDecal>} decals                  -
 * @property {EveSOFDataPatternLayer} defaultPattern                  -
 * @property {String} defaultPatternLayer1MaterialName                -
 * @property {String} description                                     -
 * @property {EveSOFDataLogoSet} logoSet                              -
 * @property {Number} materialUsageMtl1                               -
 * @property {Number} materialUsageMtl2                               -
 * @property {Number} materialUsageMtl3                               -
 * @property {Number} materialUsageMtl4                               -
 * @property {Array.<EveSOFDataFactionPlaneSet>} planeSets            -
 * @property {String} resPathInsert                                   -
 * @property {Array.<EveSOFDataFactionSpotlightSet>} spotlightSets    -
 * @property {EveSOFDataFactionVisibilityGroupSet} visibilityGroupSet -
 */
export class EveSOFDataFaction
{

    name = "";
    areaTypes = null;
    children = [];
    colorSet = null;
    defaultPattern = null;
    defaultPatternLayer1MaterialName = "";
    description = "";
    logoSet = null;
    materialUsageMtl1 = 0;
    materialUsageMtl2 = 0;
    materialUsageMtl3 = 0;
    materialUsageMtl4 = 0;
    planeSets = [];
    resPathInsert = "";
    spotlightSets = [];
    visibilityGroupSet = null;

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "areas", r.array ],
            [ "areaTypes", r.object ],
            [ "colorSet", r.object ],
            [ "children", r.array ],
            [ "defaultPattern", r.object ],
            [ "defaultPatternLayer1MaterialName", r.string ],
            [ "description", r.string ],
            [ "logoSet", r.object ],
            [ "materialUsageMtl1", r.uint ],
            [ "materialUsageMtl2", r.uint ],
            [ "materialUsageMtl3", r.uint ],
            [ "materialUsageMtl4", r.uint ],
            [ "name", r.string ],
            [ "planeSets", r.array ],
            [ "resPathInsert", r.string ],
            [ "spotlightSets", r.array ],
            [ "spriteSets", r.array ],
            [ "visibilityGroupSet", r.object ],
        ];
    }

}

