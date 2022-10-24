import { meta } from "utils";


@meta.type("EveSOFDNADescriptor")
export class EveSOFDNADescriptor extends meta.Model
{
    @meta.string
    hull = "";

    @meta.string
    layout = "";

    @meta.string
    race = "";

    @meta.string
    faction = ""

}
