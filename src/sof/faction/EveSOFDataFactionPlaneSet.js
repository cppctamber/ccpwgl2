import { meta } from "utils";
import { vec4 } from "math";


@meta.ctor("EveSOFDataFactionPlaneSet")
export class EveSOFDataFactionPlaneSet
{

    @meta.string
    name = "";

    @meta.color
    color = vec4.create();

    @meta.uint
    groupIndex = -1;

}
