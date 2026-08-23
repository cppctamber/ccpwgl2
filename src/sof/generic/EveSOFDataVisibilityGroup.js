import { meta } from "utils";


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
