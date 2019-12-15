import { meta, quat, vec3 } from "global";


@meta.type("EveSOFDataHullSpriteLineSetItem", true)
export class EveSOFDataHullSpriteLineSetItem
{

    @meta.black.float
    blinkPhase = 0;

    @meta.black.float
    blinkPhaseShift = 0;

    @meta.black.float
    blinkRate = 0;

    @meta.black.uint
    boneIndex = -1;

    @meta.black.uint
    colorType = 0;

    @meta.black.float
    falloff = 0;

    @meta.black.uint
    groupIndex = -1;

    @meta.black.float
    intensity = 0;

    @meta.black.boolean
    isCircle = false;

    @meta.black.float
    maxScale = 0;

    @meta.black.float
    minScale = 0;

    @meta.black.vector3
    position = vec3.create();

    @meta.black.quaternion
    rotation = quat.create();

    @meta.black.vector3
    scaling = vec3.fromValues(1, 1, 1);

    @meta.black.float
    spacing = 0;

}
