import { meta } from "utils";
import { vec3 } from "math";
import { CjsLightData } from "../../eve/lights/CjsLightData";


@meta.type("EveSOFDataSpotLightAttachment")
@meta.define({
    wgl: "EveSOFDataSpotLightAttachment",
    ccp: true
})
export class EveSOFDataSpotLightAttachment extends meta.Model
{

    @meta.float
    intensity = 1;

    @meta.float
    innerAngleMultiplier = 0.5;

    @meta.float
    innerScaleMultiplier = 1;

    @meta.float
    outerScaleMultiplier = 1;

    @meta.float
    outerAngleMultiplier = 1;

    @meta.float
    noiseAmplitude = 0.0;

    @meta.float
    noiseFrequency = 1;

    @meta.int32
    noiseOctaves = 1;

    @meta.path
    lightProfilePath = "";

    @meta.vector3
    translation = vec3.create();

    @meta.float
    saturation = 1;

    /**
     * Builds the light this attachment describes, at a given scale and cone.
     *
     * Carbon `EveSOFDataMgr::SpotLightAttachment::AsLightData`
     * (`EveSOFDataMgr.cpp:140-160`). Both the RADII and the ANGLES are derived
     * from multipliers: the radii from the spotlight item's scale - Carbon uses
     * its Z, not a max - and the angles from the item's own cone
     * (`EveSOF.cpp:922`). None of these multipliers were read before, so every
     * spotlight shared one radius and one cone.
     *
     * @param {vec4} color - already saturated by the caller
     * @param {Number} [scale=1] - the item's scale Z
     * @param {Number} [innerAngle=0]
     * @param {Number} [outerAngle=0]
     * @param {CjsLightData} [out]
     * @returns {CjsLightData}
     */
    AsLightData(color, scale = 1, innerAngle = 0, outerAngle = 0, out = new CjsLightData())
    {
        vec3.copy(out.position, this.translation);
        if (color) out.color.set(color);

        out.innerAngle = this.innerAngleMultiplier * innerAngle;
        out.outerAngle = this.outerAngleMultiplier * outerAngle;
        out.innerRadius = this.innerScaleMultiplier * scale;
        out.radius = this.outerScaleMultiplier * scale;

        out.brightness = this.intensity;
        out.noiseAmplitude = this.noiseAmplitude;
        out.noiseFrequency = this.noiseFrequency;
        out.noiseOctaves = this.noiseOctaves;
        out.texturePath = this.lightProfilePath;
        return out;
    }

}

@meta.type("EveSOFDataSpotlightAttachment")
@meta.define({
    wgl: "EveSOFDataSpotlightAttachment",
    ccp: true
})
export class EveSOFDataSpotlightAttachment extends EveSOFDataSpotLightAttachment
{

}
