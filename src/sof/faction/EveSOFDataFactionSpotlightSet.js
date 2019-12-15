import { meta, vec4 } from "global";


@meta.type("EveSOFDataFactionSpotlightSet", true)
export class EveSOFDataFactionSpotlightSet
{

    @meta.black.string
    name = "";

    @meta.black.color
    coneColor = vec4.create();

    @meta.black.color
    flareColor = vec4.create();

    @meta.black.uint
    groupIndex = -1;

    @meta.black.color
    spriteColor = vec4.create();

}
