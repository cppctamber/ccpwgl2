import { meta, vec4 } from "global";


@meta.type("EveSOFDataFactionPlaneSet", true)
export class EveSOFDataFactionPlaneSet
{

    @meta.black.string
    name = "";

    @meta.black.color
    color = vec4.create();

    @meta.black.uint
    groupIndex = -1;

}
