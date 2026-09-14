import { meta } from "utils";
import { quat, vec3 } from "math";


@meta.define("EveSOFDataHullHazeSetItem", true)
export class EveSOFDataHullHazeSetItem extends meta.Model
{

    @meta.int32
    boneIndex = -1;

    @meta.boolean
    boosterGainInfluence = false;

    @meta.uint
    colorType = 0;

    // Carbon defaults (EveSOFData.cpp:672-685). SOF data omits default values,
    // so a 0 here reached the shader as a flat, falloff-less haze.
    @meta.float
    hazeBrightness = 1;

    @meta.float
    hazeFalloff = 6;

    /**
     * The lights each item of this set emits. Typed so the reader hydrates real
     * attachments rather than plain bags - an untyped list leaves them without
     * `AsLightData`, and the consumer skips what it cannot convert.
     */
    @meta.list("EveSOFDataPointLightAttachment")
    lights = [];

    @meta.vector3
    position = vec3.create();

    @meta.quaternion
    rotation = quat.create();

    @meta.float
    saturation = 1;

    @meta.vector3
    scaling = vec3.fromValues(1, 1, 1);

    @meta.float
    sourceBrightness = 2;

    @meta.float
    sourceSize = 0.2;

}
