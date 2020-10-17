import { meta } from "utils";


@meta.ctor("EveSOFDataFactionChild")
export class EveSOFDataFactionChild
{

    @meta.string
    name = "";

    @meta.uint
    groupIndex = -1;

    @meta.boolean
    isVisible = false;

}
