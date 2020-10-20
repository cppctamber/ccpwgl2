import { meta } from "utils";


@meta.type("EveSOFDataFactionVisibilityGroupSet")
export class EveSOFDataFactionVisibilityGroupSet
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

}
