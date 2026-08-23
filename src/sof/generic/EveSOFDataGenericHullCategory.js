import { meta } from "utils";
import { vec2, vec4 } from "math";


@meta.define({
    wgl: "EveSOFDataGenericHullCategory",
    ccp: true
})
export class EveSOFDataGenericHullCategory extends meta.Model
{

    @meta.string
    name = "";

    @meta.uint
    reflectionMode = 0;

}