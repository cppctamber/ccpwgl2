import { meta } from "utils";


@meta.type("EveSOFDataVisibilityGroup")
@meta.define({
    wgl: "EveSOFDataVisibilityGroup",
    ccp: true
})
export class EveSOFDataVisibilityGroup extends meta.Model
{

    @meta.string
    name = "";

    @meta.string
    description = "";

}
