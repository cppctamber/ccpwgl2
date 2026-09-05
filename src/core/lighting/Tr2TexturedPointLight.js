// Carbon Lights/Tr2TexturedPointLight.h/.cpp and Tr2TexturedPointLight_Blue.cpp.
// Authored fields remain flat; Tr2Light owns shared emitter behaviour.
import { meta } from "utils";
import { resMan } from "global";
import { Tr2PointLight } from "./Tr2PointLight";
import { vec3, vec4, quat } from "math";
import { Saturate, PerLightShadowSetting, LIGHT_FLAG_DEFAULT } from "./Tw2CarbonLightMath";

@meta.define("Tr2TexturedPointLight", true)
export class Tr2TexturedPointLight extends Tr2PointLight
{
    type = 1;
    isDynamic = true;
    _resolvedTexturePath = "";

    OnValueChanged()
    {
        super.OnValueChanged();
        if (this.texturePath !== this._resolvedTexturePath)
        {
            this._resolvedTexturePath = this.texturePath;
            this.texture = this.texturePath ? resMan.GetResource(this.texturePath) : null;
        }
    }

    Update(dt, parentMatrix, bones)
    {
        super.Update(dt, parentMatrix, bones);
        this.UpdateColorFromTexture();
    }

    SetTexturePath(path)
    {
        this.texturePath = path;
        this.OnValueChanged();
    }

    @meta.string
    name = "";

    @meta.int32
    boneIndex = -1;

    @meta.float
    brightness = 1;

    @meta.int32
    castsShadows = PerLightShadowSetting.DISABLED;

    @meta.vector4
    color = vec4.fromValues(0, 0, 0, 1);

    @meta.ushort
    flags = LIGHT_FLAG_DEFAULT;

    @meta.float
    innerAngle = 0;

    @meta.float
    innerRadius = 0;

    @meta.boolean
    isVolumetric = false;

    @meta.path
    lightProfilePath = "";

    @meta.float
    noiseAmplitude = 0;

    @meta.float
    noiseFrequency = 1;

    @meta.uint
    noiseOctaves = 1;

    @meta.float
    outerAngle = 0;

    @meta.vector3
    position = vec3.create();

    @meta.float
    radius = 0;

    @meta.quaternion
    rotation = quat.create();

    texture = null;

    @meta.path
    texturePath = "";

    _saturation = 1;

    SetSaturation(saturation)
    {
        this._saturation = saturation;
    }

    UpdateColorFromTexture()
    {
        if (this.texture) Saturate(this.texture.GetAverageColor(), this._saturation, this.color);
    }

}
