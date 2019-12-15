import { meta, vec3 } from "global";


@meta.type("EveSOFDataHullSpriteSetItem", true)
export class EveSOFDataHullSpriteSetItem
{

    @meta.black.float
    blinkPhase = 0;

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

    @meta.black.float
    maxScale = 0;

    @meta.black.float
    minScale = 0;

    @meta.black.vector3
    position = vec3.create();

}
