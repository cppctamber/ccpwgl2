import { meta, mat4, vec3 } from "global";


@meta.type("EveSOFDataHullSpotlightSetItem", true)
export class EveSOFDataHullSpotlightSetItem
{

    @meta.black.uint
    boneIndex = -1;

    @meta.black.boolean
    boosterGainInfluence = false;

    @meta.black.float
    coneIntensity = 0;

    @meta.black.float
    flareIntensity = 0;

    @meta.black.uint
    groupIndex = -1;

    @meta.black.float
    spriteIntensity = 0;

    @meta.black.vector3
    spriteScale = vec3.fromValues(1, 1, 1);

    @meta.black.matrix4
    transform = mat4.create();

}
