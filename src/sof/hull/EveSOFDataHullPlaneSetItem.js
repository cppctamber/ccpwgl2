import { meta } from "utils";
import { vec3, vec4, quat } from "math";


@meta.type("EveSOFDataHullPlaneSetItem")
export class EveSOFDataHullPlaneSetItem extends meta.Model
{

    @meta.float
    blinkRate = 0;

    @meta.float
    blinkPhase = 0;

    @meta.uint
    blinkMode = 0;

    @meta.uint
    boneIndex = 0;

    @meta.color
    color = vec4.create();

    @meta.uint
    colorType = 0; // Assumes the default colour type is "Primary"

    @meta.float
    dutyCycle = 0;

    @meta.uint
    groupIndex = -1;

    @meta.float
    intensity = 0.0;

    @meta.vector4
    layer1Scroll = vec4.create();

    @meta.vector4
    layer1Transform = vec4.create();

    @meta.vector4
    layer2Scroll = vec4.create();

    @meta.vector4
    layer2Transform = vec4.create();

    @meta.list()
    lights = [];

    @meta.uint
    maskMapAtlasIndex = 0;

    @meta.vector3
    position = vec3.create();

    @meta.float
    rate = 0;

    @meta.quaternion
    rotation = quat.create();

    @meta.float
    saturation = 0.0;

    @meta.vector3
    scaling = vec3.fromValues(1, 1, 1);

}
