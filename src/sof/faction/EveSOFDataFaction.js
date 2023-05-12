import { meta } from "utils";
import { ErrSOFLogoSetTypeNotFound, ErrSOFAreaTypeNotFound } from "sof/shared";
import { tw2 } from "global/tw2";


@meta.type("EveSOFDataFaction")
export class EveSOFDataFaction extends meta.Model
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
     * @param {Number} type
     * @returns {Boolean}
     */
    HasColorType(type)
    {
        return this.colorSet.Has(type);
    }

    /**
     * Gets a color by type
     * @param {Number} type
     * @param {vec4} out
     * @param {Number} [fallback]
     * @returns {vec4} out
     */
    GetColorType(type, out, fallback)
    {
        if (this.HasColorType(type))
        {
            return this.colorSet.Get(type, out);
        }
        else if (fallback !== undefined && this.HasColorType(fallback))
        {
            tw2.Debug({
                name: "Space object factory",
                message: "Using fallback value, could not resolve color type: " + type
            });
            return this.colorSet.Get(fallback, out);
        }

        tw2.Debug({
            name: "Space object factory",
            message: "Could not resolve color type: " + type
        });

        // Default to white?
        out[0] = out[1] = out[2] = out[3] = 1;
        return out;
    }

    /**
     * Checks if an area exists by type
     * @param {Number} type
     * @returns {Boolean}
     */
    HasAreaType(type)
    {
        return this.areaTypes ? this.areaTypes.Has(type) : false;
    }

    /**
     * Gets an area by type
     * @param {Number} type
     * @param {Number} [fallback]
     * @returns {Boolean}
     */
    GetAreaType(type, fallback)
    {
        if (!this.areaTypes)
        {
            throw new ErrSOFAreaTypeNotFound({ type });
        }

        if (this.HasAreaType(type))
        {
            return this.areaTypes.Get(type);
        }
        else if (fallback !== undefined && this.HasAreaType(fallback))
        {
            tw2.Debug({
                name: "Space object factory",
                message: "Using fallback value, could not resolve area type: " + type
            });
            return this.areaTypes.Get(fallback);
        }

        tw2.Debug({
            name: "Space object factory",
            message: "Could not resolve area type: " + type
        });
    }

    /**
     * Assigns an area type
     * @param {Number} type
     * @param {Object} [out={}]
     * @param {Boolean} [inheritFromPrimary]
     * @returns {Object} out
     */
    AssignAreaType(type, out = {}, inheritFromPrimary)
    {
        if (type !== 0 && !inheritFromPrimary) this.AssignAreaType(0, out, false);
        const areaType = this.GetAreaType(type);
        if (areaType) areaType.Assign(out);
        return out;
    }

    /**
     * Checks if a logo exists by type
     * @param {Number} type
     * @returns {Boolean}
     */
    HasLogoType(type)
    {
        return this.logoSet ? this.logoSet.Has(type) : false;
    }

    /**
     * Gets a logo by type
     * @param {Number} type
     * @param {Number} [fallback]
     * @returns {EveSOFDataLogo}
     */
    GetLogoType(type, fallback)
    {
        if (!this.logoSet)
        {
            throw new ErrSOFLogoSetTypeNotFound({ type });
        }

        if (this.HasLogoType(type))
        {
            return this.logoSet.Get(type);
        }
        else if (fallback !== undefined && this.HasAreaType(fallback))
        {
            tw2.Debug({
                name: "Space object factory",
                message: "Using fallback value, could not resolve area type: " + type
            });
            return this.areaTypes.Get(fallback);
        }

        tw2.Debug({
            name: "Space object factory",
            message: "Could not resolve logo type: " + type
        });

    }

    /**
     * Assigns a logo type
     * @param {Number} type
     * @param {Object} out
     * @param {Number} fallback
     * @return {Object} out
     */
    AssignLogoType(type, out, fallback)
    {
        const logoType = this.GetLogoType(type, fallback);
        if (logoType)
        {
            logoType.Assign(out);
            return out;
        }
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

