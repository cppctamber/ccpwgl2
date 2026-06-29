import { meta } from "utils";


@meta.type("EveSOFDataPatternApplicationGroup")
@meta.define({
    wgl: "EveSOFDataPatternApplicationGroup",
    ccp: true
})
export class EveSOFDataPatternApplicationGroup extends meta.Model
{

    @meta.string
    name = "";

    @meta.struct("EveSOFDataPatternLayerProperties")
    layer1Properties = null;

    @meta.struct("EveSOFDataPatternLayerProperties")
    layer2Properties = null;

    @meta.list("EveSOFDataPatternPerHull")
    projections = [];

    /**
     * Finds a per-hull projection by name.
     * @param {string} hullName
     * @returns {EveSOFDataPatternPerHull|null}
     */
    FindProjection(hullName)
    {
        const name = String(hullName || "").toUpperCase();
        return this.projections.find(x => String(x.name || "").toUpperCase() === name) || null;
    }

}
