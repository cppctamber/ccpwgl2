import { meta } from "utils";
import { ErrSOFLogoSetTypeNotFound, ErrSOFAreaTypeNotFound } from "sof/shared";


@meta.type("EveSOFDataFaction")
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
     * @returns {vec4} out
     */
    GetColorType(type, out)
    {
        return this.colorSet.Get(type, out);
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
     * @returns {Boolean}
     */
    GetAreaType(type)
    {
        if (!this.areaTypes)
        {
            throw new ErrSOFAreaTypeNotFound({ type });
        }

        return this.areaTypes.Get(type);
    }

    /**
     * Assigns an area type
     * @param {Number} type
     * @param {Object} out
     * @returns {Object} out
     */
    AssignAreaType(type, out)
    {
        return this.GetAreaType(type).Assign(out);
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
     * @returns {EveSOFDataLogo}
     */
    GetLogoType(type)
    {
        if (!this.logoSet)
        {
            throw new ErrSOFLogoSetTypeNotFound({ type });
        }

        return this.logoSet.Get(type);
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

