import { meta } from "utils";


@meta.type("EveSOFDataFactionHullArea")
@meta.define({
    wgl: "EveSOFDataFactionHullArea",
    ccp: true
})
export class EveSOFDataFactionHullArea extends meta.Model
{

    @meta.string
    name = "";

    @meta.list("EveSOFDataParameter")
    parameters = [];

    /**
     * Finds a parameter by name.
     * @param {string} name
     * @returns {EveSOFDataParameter|null}
     */
    FindParameter(name)
    {
        const upper = String(name || "").toUpperCase();
        return this.parameters.find(x => String(x.name || "").toUpperCase() === upper) || null;
    }

}
