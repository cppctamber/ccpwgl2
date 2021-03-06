import { meta } from "utils";
import { vec4 } from "math";


@meta.type("EveSOFDataFactionPlaneSet")
export class EveSOFDataFactionPlaneSet extends meta.Model
{

    @meta.string
    name = "";

    @meta.color
    color = vec4.create();

    @meta.uint
    groupIndex = -1;

}
