import { meta } from "utils";


@meta.define("EveSOFDataFactionChild", true)
export class EveSOFDataFactionChild extends meta.Model
{

    @meta.string
    name = "";

    @meta.int32
    groupIndex = -1;

    @meta.boolean
    isVisible = false;

}
