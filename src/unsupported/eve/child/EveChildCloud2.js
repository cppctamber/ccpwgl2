import { meta } from "utils";
import { EveChild } from "eve/child";
import { vec3, quat } from "math";


@meta.notImplemented
@meta.type("EveChildCloud2")
@meta.define({
    wgl: "EveChildCloud2",
    ccp: true
})
export class EveChildCloud2 extends EveChild
{

    @meta.string
    name = ""

    @meta.struct()
    effect = null;

    @meta.list()
    lights = [];

    @meta.float
    minScreenSize = 0;

    @meta.vector3
    scaling = vec3.create();

    @meta.vector3
    translation = vec3.create();

    @meta.quaternion
    rotation = quat.create();

    @meta.struct()
    reflectionEffect = null;

    @meta.int32
    reflectionMode = 3;

}
