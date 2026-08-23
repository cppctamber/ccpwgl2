import { meta } from "utils";
import { vec4 } from "math";


@meta.define({
    wgl: "EveSOFDataFactionPlaneSet",
    ccp: true
})
export class EveSOFDataFactionPlaneSet extends meta.Model
{

    @meta.string
    name = "";

    @meta.color
    color = vec4.create();

    @meta.int32
    groupIndex = -1;

}
