import { meta } from "global";
import { ErrSOFLogoSetUsageTypeNotFound, ErrSOFAreaUsageTypeNotFound } from "sof/shared";


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

    
    /**
     * Checks if a color usage Type exists
     * @param {Number} usageType
     * @returns {Boolean}
     */
    HasColorType(usageType)
    {
        return this.colorSet.Has(usageType);
    }

    /**
     * Gets a color by usage type
     * @param {Number} usageType
     * @param {vec4} out
     * @returns {vec4} out
     */
    GetColorType(usageType, out)
    {
        return this.colorSet.Get(usageType, out);
    }

    /**
     * Checks if an area exists by usage type
     * @param {Number} usageType
     * @returns {Boolean}
     */
    HasAreaType(usageType)
    {
        return this.areaTypes ? this.areaTypes.Has(usageType) : false;
    }

    /**
     * Gets an area by usage type
     * @param {Number} usageType
     * @returns {Boolean}
     */
    GetAreaType(usageType)
    {
        if (!this.areaTypes)
        {
            throw new ErrSOFAreaUsageTypeNotFound({ usageType });
        }
        
        return this.areaTypes.Get(usageType);
    }

    /**
     * Checks if a logo exists by usage type
     * @param {Number} usageType
     * @returns {Boolean}
     */
    HasLogoType(usageType)
    {
        return this.logoSet ? this.logoSet.Has(usageType) : false;
    }

    /**
     * Gets a logo by usage type
     * @param {Number} usageType
     * @returns {EveSOFDataLogo}
     */
    GetLogoType(usageType)
    {
        if (!this.logoSet)
        {
            throw new ErrSOFLogoSetUsageTypeNotFound({ usageType });
        }
        
        return this.logoSet.Get(usageType);
    }

    /**
     * Checks if a visibility group exists
     * @param {String} name
     * @returns {Boolean}
     */
    HasVisibilityGroup(name)
    {
        return this.visibilityGroupSet ? this.visibilityGroupSet.Has(name) : false;
    }

    /**
     * Gets a resPathInsert
     * @param {String} path
     * @param {String} [resPathInsert]
     * @returns {string}
     */
    @meta.todo("Check if the 'this.resPathInsert' value is always valid")
    GetResPathInsert(path, resPathInsert)
    {
        if (!resPathInsert || resPathInsert.toUpperCase() === "NONE")
        {
            if (!this.resPathInsert)
            {
                return path;
            }

            resPathInsert = this.resPathInsert;
        }

        let index = path.lastIndexOf("/");
        if (index >= 0)
        {
            path = path.substr(0, index + 1) + resPathInsert + "/" + path.substr(index + 1);
        }

        index = path.lastIndexOf("_");
        if (index >= 0)
        {
            path = path.substr(0, index) + "_" + resPathInsert + path.substr(index);
        }

        return path;
    }

    /**
     * Finds a plane set group by it's index
     * @param {Number} groupIndex
     * @returns {EveSOFDataFactionPlaneSet}
     */
    FindPlaneSetByGroupIndex(groupIndex)
    {
        for (let i = 0; i < this.planeSets.length; i++)
        {
            if (this.planeSets[i].groupIndex === groupIndex)
            {
                return this.planeSets[i];
            }
        }
    }

    /**
     * Finds a plane set group by it's index
     * @param {Number} groupIndex
     * @returns {EveSOFDataFactionSpotlightSet}
     */
    FindSpotlightSetByGroupIndex(groupIndex)
    {
        for (let i = 0; i < this.spotlightSets.length; i++)
        {
            if (this.spotlightSets[i].groupIndex === groupIndex)
            {
                return this.spotlightSets[i];
            }
        }
    }
    
}

