import { meta } from "utils";
import { mat4, vec3 } from "math";


@meta.type("EveSOFDataHullSpotlightSetItem")
export class EveSOFDataHullSpotlightSetItem extends meta.Model
{

    @meta.uint
    boneIndex = 0;

    @meta.boolean
    boosterGainInfluence = false;

    @meta.uint
    colorType = 0;

    @meta.float
    coneIntensity = 0;

    @meta.float
    flareIntensity = 0;

    @meta.uint
    groupIndex = -1;

    @meta.struct()
    light = null;

    @meta.float
    saturation = 0;

    @meta.float
    spriteIntensity = 0;

    @meta.vector3
    spriteScale = vec3.fromValues(1, 1, 1);

    @meta.matrix4
    transform = mat4.create();

}
