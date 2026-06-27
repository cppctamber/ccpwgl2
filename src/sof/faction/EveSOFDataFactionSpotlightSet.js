import { meta } from "utils";
import { vec4 } from "math";


@meta.type("EveSOFDataFactionSpotlightSet")
@meta.define({
    wgl: "EveSOFDataFactionSpotlightSet",
    ccp: true
})
export class EveSOFDataFactionSpotlightSet extends meta.Model
{

    @meta.string
    name = "";

    @meta.color
    coneColor = vec4.create();

    @meta.color
    flareColor = vec4.create();

    @meta.int32
    groupIndex = -1;

    @meta.color
    spriteColor = vec4.create();

}
