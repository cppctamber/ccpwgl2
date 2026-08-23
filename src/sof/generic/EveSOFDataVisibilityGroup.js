import { meta } from "utils";


@meta.define("EveSOFDataVisibilityGroup", true)
export class EveSOFDataVisibilityGroup extends meta.Model
{

    @meta.string
    name = "";

    @meta.string
    description = "";

}
