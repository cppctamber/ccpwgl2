import { meta, quat, vec3, vec4 } from "global";


@meta.ctor("EveSOFDataHullPlaneSetItem")
export class EveSOFDataHullPlaneSetItem
{

    @meta.uint
    boneIndex = -1;

    @meta.color
    color = vec4.create();

    @meta.float
    dutyCycle = 0;

    @meta.uint
    groupIndex = -1;

    @meta.vector4
    layer1Scroll = vec4.create();

    @meta.vector4
    layer1Transform = vec4.create();

    @meta.vector4
    layer2Scroll = vec4.create();

    @meta.vector4
    layer2Transform = vec4.create();

    @meta.uint
    maskMapAtlasIndex = 0;

    @meta.vector3
    position = vec3.create();

    @meta.float
    rate = 0;

    @meta.quaternion
    rotation = quat.create();

    @meta.vector3
    scaling = vec3.fromValues(1, 1, 1);

}
