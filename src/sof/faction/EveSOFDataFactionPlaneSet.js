import { meta, vec4 } from "global";


@meta.ctor("EveSOFDataFactionPlaneSet", true)
export class EveSOFDataFactionPlaneSet
{

    @meta.string
    name = "";

    @meta.color
    color = vec4.create();

    @meta.uint
    groupIndex = -1;

}
