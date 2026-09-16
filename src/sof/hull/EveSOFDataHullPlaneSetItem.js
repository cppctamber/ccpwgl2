import { meta } from "utils";
import { vec3, vec4, quat } from "math";


@meta.define("EveSOFDataHullPlaneSetItem", true)
export class EveSOFDataHullPlaneSetItem extends meta.Model
{

    @meta.float
    blinkRate = 0;

    @meta.float
    blinkPhase = 0;

    @meta.alias("phase")
    get phase()
    {
        return this.blinkPhase;
    }

    set phase(value)
    {
        this.blinkPhase = value;
    }

    @meta.uint
    blinkMode = 0;

    @meta.int32
    boneIndex = -1;

    // Carbon defaults (EveSOFData.cpp:602-624); SOF data omits default values.
    @meta.color
    color = vec4.fromValues(1, 1, 1, 1);

    @meta.uint
    colorType = 0; // Assumes the default colour type is "Primary"

    @meta.float
    dutyCycle = 1;

    @meta.int32
    groupIndex = -1;

    @meta.float
    intensity = 1;

    @meta.vector4
    layer1Scroll = vec4.create();

    @meta.vector4
    layer1Transform = vec4.create();

    @meta.vector4
    layer2Scroll = vec4.create();

    @meta.vector4
    layer2Transform = vec4.create();

    /**
     * The lights each item of this set emits. Typed so the reader hydrates real
     * attachments rather than plain bags - an untyped list leaves them without
     * `AsLightData`, and the consumer skips what it cannot convert.
     */
    @meta.list("EveSOFDataPointLightAttachment")
    lights = [];

    @meta.uint
    maskMapAtlasIndex = 0;

    @meta.vector3
    position = vec3.create();

    @meta.float
    rate = 1;

    @meta.quaternion
    rotation = quat.create();

    @meta.float
    saturation = 1;

    @meta.vector3
    scaling = vec3.fromValues(1, 1, 1);

}
