import { meta, vec3 } from "global";


@meta.ctor("EveSOFDataHullSpriteSetItem")
export class EveSOFDataHullSpriteSetItem
{

    @meta.float
    blinkPhase = 0;

    @meta.float
    blinkRate = 0;

    @meta.uint
    boneIndex = -1;

    @meta.uint
    colorType = 0;

    @meta.float
    falloff = 0;

    @meta.uint
    groupIndex = -1;

    @meta.float
    intensity = 0;

    @meta.float
    maxScale = 0;

    @meta.float
    minScale = 0;

    @meta.vector3
    position = vec3.create();

}
