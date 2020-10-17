import { meta } from "utils";
import { vec4 } from "math";


@meta.ctor("EveSOFDataFactionSpotlightSet")
export class EveSOFDataFactionSpotlightSet
{

    @meta.string
    name = "";

    @meta.color
    coneColor = vec4.create();

    @meta.color
    flareColor = vec4.create();

    @meta.uint
    groupIndex = -1;

    @meta.color
    spriteColor = vec4.create();

}
