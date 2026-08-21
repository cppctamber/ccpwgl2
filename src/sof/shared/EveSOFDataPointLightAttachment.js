import { meta } from "utils";
import { vec3, quat } from "math";
import { CjsLightData } from "../../eve/lights/CjsLightData";


@meta.type("EveSOFDataPointLightAttachment")
@meta.define({
    wgl: "EveSOFDataPointLightAttachment",
    ccp: true
})
export class EveSOFDataPointLightAttachment extends meta.Model
{

    @meta.float
    intensity = 1;

    @meta.float
    innerScaleMultiplier = 1;

    @meta.path
    lightProfilePath = "";

    @meta.float
    noiseAmplitude = 0.0;

    @meta.float
    noiseFrequency = 1;

    @meta.uint
    noiseOctaves = 1;

    @meta.float
    outerScaleMultiplier = 2;

    @meta.vector3
    translation = vec3.create();

    @meta.quaternion
    rotation = quat.create();

    @meta.float
    saturation = 1;

    /**
     * Builds the light this attachment describes, at a given scale.
     *
     * Carbon `EveSOFDataMgr::PointLightAttachment::AsLightData`
     * (`EveSOFDataMgr.cpp:109-123`). The RADII ARE DERIVED, not authored: SOF
     * carries multipliers, and the attachment item's own scale turns them into
     * world radii. Nothing read these multipliers before, so every light fell
     * back to the same radius and every falloff looked identically hard.
     *
     * `scale` is the owning item's: `max(x, y, z)` of a plane, haze or banner
     * item, and 1 for a sprite (`EveSOF.cpp:770, 1088, 1186, 1318, 1561`).
     *
     * @param {vec4} color - already saturated by the caller
     * @param {Number} [scale=1]
     * @param {CjsLightData} [out]
     * @returns {CjsLightData}
     */
    AsLightData(color, scale = 1, out = new CjsLightData())
    {
        vec3.copy(out.position, this.translation);
        quat.copy(out.rotation, this.rotation);
        if (color) out.color.set(color);

        out.radius = this.outerScaleMultiplier * scale;
        out.innerRadius = this.innerScaleMultiplier * scale;

        out.brightness = this.intensity;
        out.noiseAmplitude = this.noiseAmplitude;
        out.noiseFrequency = this.noiseFrequency;
        out.noiseOctaves = this.noiseOctaves;
        out.texturePath = this.lightProfilePath;
        return out;
    }

}