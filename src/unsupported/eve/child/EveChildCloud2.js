import { meta } from "utils";
import { EveChild } from "eve/child";
import { vec3, quat } from "math";


@meta.notImplemented
@meta.define("EveChildCloud2", true)
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

    @meta.uint
    noiseTextureSize = 32;

    @meta.vector3
    scaling = vec3.fromValues(1, 1, 1);

    @meta.vector3
    translation = vec3.create();

    @meta.quaternion
    rotation = quat.create();

    @meta.struct()
    reflectionEffect = null;

    @meta.int32
    reflectionMode = 3;

    @meta.uint
    minVisibleQuality = 0;

    @meta.boolean
    display = true;

    @meta.boolean
    castShadows = true;

    @meta.boolean
    receiveShadows = true;

    @meta.float
    sortingModifier = 1;

}
