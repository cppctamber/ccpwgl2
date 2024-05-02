import { meta } from "utils";
import { vec3 } from "math";


@meta.type("EveSOFDataHullSpriteSetItem")
export class EveSOFDataHullSpriteSetItem extends meta.Model
{

    @meta.float
    blinkPhase = 0;

    @meta.float
    blinkRate = 0;

    @meta.uint
    boneIndex = 0;

    @meta.uint
    colorType = 0;

    @meta.float
    falloff = 0;

    @meta.uint
    groupIndex = -1;

    @meta.float
    intensity = 1;

    @meta.struct()
    light = null;

    @meta.float
    maxScale = 0;

    @meta.float
    minScale = 0;

    @meta.vector3
    position = vec3.create();

}
