import { meta } from "utils";
import { vec3 } from "math";


@meta.type("EveSOFDataSpotLightAttachment")
@meta.define({
    wgl: "EveSOFDataSpotLightAttachment",
    ccp: true
})
export class EveSOFDataSpotLightAttachment extends meta.Model
{

    @meta.float
    intensity = 0.0;

    @meta.float
    innerAngleMultiplier = 0.0;

    @meta.float
    innerScaleMultiplier = 0.0;

    @meta.float
    outerScaleMultiplier = 0.0;

    @meta.float
    outerAngleMultiplier = 0.0;

    @meta.float
    noiseAmplitude = 0.0;

    @meta.float
    noiseFrequency = 0.0;

    @meta.int32
    noiseOctaves = 0;

    @meta.path
    lightProfilePath = "";

    @meta.vector3
    translation = vec3.create();

    @meta.float
    saturation = 0.0;

}

@meta.type("EveSOFDataSpotlightAttachment")
@meta.define({
    wgl: "EveSOFDataSpotlightAttachment",
    ccp: true
})
export class EveSOFDataSpotlightAttachment extends EveSOFDataSpotLightAttachment
{

}
