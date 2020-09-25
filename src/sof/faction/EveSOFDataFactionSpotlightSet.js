import { meta, vec4 } from "global";


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
