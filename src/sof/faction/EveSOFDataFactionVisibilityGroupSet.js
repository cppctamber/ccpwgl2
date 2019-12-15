import { meta } from "global";


@meta.type("EveSOFDataFactionVisibilityGroupSet", true)
export class EveSOFDataFactionVisibilityGroupSet
{

    @meta.black.listOf("EveSOFDataGenericString")
    visibilityGroups = [];

}
