import { meta } from "global";


@meta.type("EveSOFDataFactionChild", true)
export class EveSOFDataFactionChild
{

    @meta.black.string
    name = "";

    @meta.black.uint
    groupIndex = -1;

    @meta.black.boolean
    isVisible = false;

}
