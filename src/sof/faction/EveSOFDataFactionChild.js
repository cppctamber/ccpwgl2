import { meta } from "utils";


@meta.type("EveSOFDataFactionChild")
@meta.define({
    wgl: "EveSOFDataFactionChild",
    ccp: true
})
export class EveSOFDataFactionChild extends meta.Model
{

    @meta.string
    name = "";

    @meta.uint
    groupIndex = -1;

    @meta.boolean
    isVisible = false;

}
