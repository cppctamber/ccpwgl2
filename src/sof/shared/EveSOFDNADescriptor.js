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
    faction = "";

    @meta.string
    material1 = "";

    @meta.string
    material2 = "";

    @meta.string
    material3 = "";

    @meta.string
    material4 = "";

}
