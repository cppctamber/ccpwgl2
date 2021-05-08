import { meta } from "utils";
import { EveChild } from "eve/child";
import { vec3, vec4 } from "math";


@meta.notImplemented
@meta.type("EveChildLineSet")
export class EveChildLineSet extends EveChild
{

    @meta.string
    name = "";

    @meta.boolean
    additiveBatches = false;

    @meta.vector4
    animColor = vec4.fromValues(0,0,0,1);

    @meta.vector4
    baseColor = vec4.fromValues(0,0,0,1);

    @meta.float
    brightness = 1;

    @meta.boolean
    display = true;

    @meta.list()
    lines = [];

    @meta.struct()
    lineSet = null;

    @meta.float
    minScreenSize = 0;

    @meta.float
    scrollSpeed = 1;

    @meta.vector3
    translation= vec3.create()

}
