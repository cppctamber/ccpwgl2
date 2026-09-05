// Carbon Lights/Tr2FactionLight.h/.cpp and Tr2FactionLight_Blue.cpp.
// Authored fields remain flat; Tr2Light owns shared emitter behaviour.
import { meta } from "utils";
import { Tr2Light } from "../../eve/lights/Tr2Light";
import { vec3, vec4, quat } from "math";
import { Saturate, PerLightShadowSetting, LIGHT_FLAG_DEFAULT } from "./Tw2CarbonLightMath";

@meta.define("Tr2FactionLight", true)
export class Tr2FactionLight extends Tr2Light
{
    type = 1;

    get color()
    {
        return this._color;
    }

    OnValueChanged()
    {
        super.OnValueChanged();
        this.type = this.isSpotlight ? 2 : 1;
        this.SetLightColorFromFactionColor();
    }

    @meta.vector3
    position = vec3.create();

    @meta.rotation
    rotation = quat.create();

    @meta.int32
    boneIndex = -1;

    @meta.float
    brightness = 1;

    @meta.int32
    castsShadows = PerLightShadowSetting.DISABLED;

    @meta.int32
    factionColor = -1;

    @meta.ushort
    flags = LIGHT_FLAG_DEFAULT;

    @meta.float
    innerAngle = 0;

    @meta.float
    innerRadius = 0;

    @meta.boolean
    isSpotlight = false;

    @meta.boolean
    isVolumetric = false;

    @meta.path
    lightProfilePath = "";

    @meta.string
    name = "";

    @meta.float
    noiseAmplitude = 0;

    @meta.float
    noiseFrequency = 1;

    @meta.uint
    noiseOctaves = 1;

    @meta.float
    outerAngle = 0;

    @meta.float
    radius = 0;

    @meta.float
    saturation = 1;

    _parentColorSet = null;

    _resolvedFactionColor = vec4.create();

    _color = vec4.fromValues(0, 0, 0, 1);

    SetLightColorFromFactionColor()
    {
        if (!this._parentColorSet || this.factionColor < 0) return;

        const names = this._parentColorSet.constructor && this._parentColorSet.constructor.Type;

        if (names && typeof this._parentColorSet.Get === "function")
        {
            if (this.factionColor < names.length && this._parentColorSet.Has(this.factionColor))
            {
                Saturate(this._parentColorSet.Get(this.factionColor, this._resolvedFactionColor), this.saturation, this._color);
            }
        }
        else if (this.factionColor < this._parentColorSet.length)
        {
            Saturate(this._parentColorSet[this.factionColor], this.saturation, this._color);
        }
    }

    SetInheritProperties(colorSet)
    {
        if (colorSet)
        {
            this._parentColorSet = colorSet;
            this.SetLightColorFromFactionColor();
        }
    }

    GetSelectedColor()
    {
        return this._color;
    }

    OnModified(propertyName)
    {
        super.OnModified(propertyName);
        if (propertyName === "factionColor" || propertyName === "saturation")
        {
            this.SetLightColorFromFactionColor();
        }
    }

    RenderDebugInfo()
    {

    }

}
