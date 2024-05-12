import { __get, isString, meta } from "utils";
import { tw2 } from "global";


@meta.type("EveSOFDataFactionVisibilityGroupSet")
export class EveSOFDataFactionVisibilityGroupSet extends meta.Model
{

    @meta.list("EveSOFDataGenericString")
    visibilityGroups = [];

    /**
     * Check if an object's visibility group is visible
     * @param {Object} obj
     * @param {String} obj.visibilityGroup
     * @returns {boolean}
     * @throws if no object or object is missing the "visibilityGroup" property
     */
    IsObjectVisible(obj)
    {
        if (!obj || !("visibilityGroup" in obj))
        {
            tw2.Error({
                name: "Space object factory",
                message: "Invalid object for visibility group",
                data: obj
            });
            return false;
        }
        return this.Has(obj.visibilityGroup);
    }

    /**
     * Checks if a visibility group exits
     * @param {String} visibilityGroup
     * @returns {boolean}
     */
    Has(visibilityGroup)
    {
        if (!isString(visibilityGroup))
        {
            tw2.Error({
                name: "Space object factory",
                message: "Invalid property type for visibility group, expected string",
                data: { visibilityGroup }
            });
            return false;
        }
        // Primary and empty string are the same
        visibilityGroup = visibilityGroup ? visibilityGroup.toUpperCase() : "PRIMARY";
        for (let i = 0; i < this.visibilityGroups.length; i++)
        {
            if (this.visibilityGroups[i].str.toUpperCase() === visibilityGroup)
            {
                return true;
            }
        }
        return false;
    }

    /**
     *
     * @param a
     * @param b
     * @param dest
     * @returns {EveSOFDataFactionVisibilityGroupSet}
     */
    static combine(a, b, dest)
    {
        dest = dest || new this();
        dest.visibilityGroups.splice(0);
        if (!a) a = dest;
        __get(b, "visibilityGroups", a).forEach(x => dest.visibilityGroups.push(x));
        return dest;
    }
}
