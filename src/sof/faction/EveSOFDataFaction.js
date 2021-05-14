import { meta } from "utils";
import { ErrSOFLogoSetTypeNotFound, ErrSOFAreaTypeNotFound } from "sof/shared";
import resPathInserts from "./resPathInsert.json";
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
     * @param {Object} out
     * @param {Number}[fallback]
     * @returns {Object} out
     */
    AssignAreaType(type, out, fallback)
    {
        const  areaType = this.GetAreaType(type, fallback);
        if (areaType)  areaType.Assign(out);
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
     * @param {String} hull
     * @param {String} path
     * @param {String} [resPathInsert]
     * @returns {string}
     */
    GetResPathInsert(hull, path, resPathInsert)
    {
        if (!resPathInsert || resPathInsert.toUpperCase() === "NONE")
        {
            if (!this.resPathInsert)
            {
                return path;
            }

            resPathInsert = this.resPathInsert;
        }

        if (!EveSOFDataFaction.IsValidResPathInsert(hull, resPathInsert))
        {
            tw2.Debug({
                name: "Space object factory",
                message: `ResPathInsert not found for hull ${hull}: ${resPathInsert}`
            });

            return path;
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

    /**
     * Checks if a res path insert is valid
     * @param {String} hull
     * @param {String} resPathInsert
     * @return {Boolean}
     */
    static IsValidResPathInsert(hull, resPathInsert)
    {
        const insert = resPathInserts[resPathInsert];
        return insert ? insert.includes(hull) : false;
    }

    /**
     * Gets a hull's res path inserts
     * @param {String} hull
     * @return {Array<String>}
     */
    static GetHullResPathInserts(hull)
    {
        if (!this.resPathInserts)
        {
            this.resPathInserts = Object.assign({}, resPathInserts);
        }

        const results = [];
        for (const faction in this.resPathInserts)
        {
            if (this.resPathInserts.hasOwnProperty(faction) && this.resPathInserts[faction].includes(hull))
            {
                results.push(faction);
            }
        }
        return results.sort();
    }

    /**
     * Res path inserts
     * @type {null|Object}
     */
    static resPathInserts = null;
}

