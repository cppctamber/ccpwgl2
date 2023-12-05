import { __get, meta } from "utils";


@meta.type("EveSOFDataFactionVisibilityGroupSet")
export class EveSOFDataFactionVisibilityGroupSet extends meta.Model
{

    @meta.list("EveSOFDataGenericString")
    visibilityGroups = [];

    /**
     * Checks if a visibility group exits
     * @param {String} name
     * @returns {boolean}
     */
    Has(name)
    {
        name = name.toUpperCase();
        for (let i = 0; i < this.visibilityGroups.length; i++)
        {
            if (this.visibilityGroups[i].str.toUpperCase() === name)
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
