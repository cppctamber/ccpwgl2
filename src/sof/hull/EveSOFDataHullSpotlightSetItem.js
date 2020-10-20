import { meta } from "utils";
import { mat4, vec3 } from "math";


@meta.type("EveSOFDataHullSpotlightSetItem")
export class EveSOFDataHullSpotlightSetItem
{

    @meta.uint
    boneIndex = -1;

    @meta.boolean
    boosterGainInfluence = false;

    @meta.float
    coneIntensity = 0;

    @meta.float
    flareIntensity = 0;

    @meta.uint
    groupIndex = -1;

    @meta.float
    spriteIntensity = 0;

    @meta.vector3
    spriteScale = vec3.fromValues(1, 1, 1);

    @meta.matrix4
    transform = mat4.create();

}
