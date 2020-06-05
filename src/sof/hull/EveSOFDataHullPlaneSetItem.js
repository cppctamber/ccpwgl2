import { meta, quat, vec3, vec4 } from "global";


@meta.type("EveSOFDataHullPlaneSetItem", true)
export class EveSOFDataHullPlaneSetItem
{

    @meta.black.uint
    boneIndex = -1;

    @meta.black.color
    color = vec4.create();

    @meta.black.float
    dutyCycle = 0;

    @meta.black.uint
    groupIndex = -1;

    @meta.black.vector4
    layer1Scroll = vec4.create();

    @meta.black.vector4
    layer1Transform = vec4.create();

    @meta.black.vector4
    layer2Scroll = vec4.create();

    @meta.black.vector4
    layer2Transform = vec4.create();

    @meta.black.uint
    maskMapAtlasIndex = 0;

    @meta.black.vector3
    position = vec3.create();

    @meta.black.float
    rate = 0;

    @meta.black.quaternion
    rotation = quat.create();

    @meta.black.vector3
    scaling = vec3.fromValues(1, 1, 1);

}
