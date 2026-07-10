import { meta } from "utils";
import { mat4, vec3, vec4, quat } from "math";
import { ComposeNoiseBrightness, CEWG_FLAG_ENABLED, PerLightShadowSetting, LIGHT_FLAG_DEFAULT } from "./CewgLightMath";
// NOTE: `Saturate` (also exported from ./CewgLightMath, ported 1:1 from
// carbonengine math/include/Color_inline.h:161-172) is what
// `UpdateColorFromTexture` below should use once a texture average-color
// API exists - see the TODO on that method.


/**
 * Tr2TexturedPointLight
 *
 * Source: carbonengine trinity/trinity/Lights/Tr2TexturedPointLight.h/.cpp,
 * a Tr2PointLight subclass (m_type stays POINT_LIGHT) that is `m_isDynamic`
 * and, every `Update()`, overwrites its own `color` with the average color
 * of a referenced texture (`m_texture->GetAverageColor()`), saturated by an
 * internal (non-persisted, non-Blue-exposed) `m_saturation` field. Note
 * Carbon's ExposeToBlue for this class does NOT map `innerAngle`/`outerAngle`
 * (those exist only because they're part of the shared `LightData` struct;
 * see Tr2TexturedPointLight_Blue.cpp) - ccpwgl's pre-existing stub already
 * had them, and per the "do not touch black-reader property names" rule
 * they are left in place rather than removed.
 */
@meta.notImplemented
@meta.type("Tr2TexturedPointLight")
@meta.ccp.define("Tr2TexturedPointLight")
export class Tr2TexturedPointLight extends meta.Model
{

    @meta.string
    name = "";

    @meta.int32
    boneIndex = -1;

    @meta.float
    brightness = 1;

    // Carbon's PerLightShadowSetting enum (Tr2Light.h:20-25); canonical type
    // confirmed by the format-black schema (`castsShadows: enum`). Shadow
    // settings are not consumed by the CEWG tile path yet.
    @meta.notImplemented
    @meta.enums(PerLightShadowSetting)
    castsShadows = PerLightShadowSetting.DISABLED;

    // NOTE (drift): pre-existing stub used @meta.vector4 rather than
    // @meta.color (same wire bytes) - kept as observed.
    @meta.vector4
    color = vec4.fromValues(0, 0, 0, 1);

    // uint16 bitmask (Tr2LightManager.h:100-105; AFFECTS_SURFACES=1 |
    // AFFECTS_PARTICLES=2, default 1); canonical width confirmed by the
    // format-black schema. Gates which passes a light affects - not consumed
    // by the CEWG tile path yet.
    @meta.notImplemented
    @meta.ushort
    flags = LIGHT_FLAG_DEFAULT;

    @meta.notImplemented
    @meta.desc("Not exposed to Blue by Carbon's Tr2TexturedPointLight (see class doc) - kept for black-reader compatibility with ccpwgl's pre-existing stub, always 0 in practice.")
    @meta.float
    innerAngle = 0;

    @meta.float
    innerRadius = 0;

    @meta.notImplemented
    @meta.boolean
    isVolumetric = false;

    @meta.notImplemented
    @meta.desc("Tr2LightProfileResPtr - resolved from lightProfilePath. ccpwgl has no Tr2LightProfileRes resource class yet (carbonengine Resources/Tr2LightProfileRes.h). Read-only in Carbon (Be::READ).")
    @meta.struct()
    lightProfile = null;

    @meta.path
    lightProfilePath = "";

    @meta.float
    noiseAmplitude = 0;

    @meta.float
    noiseFrequency = 1;

    // uint32 (Tr2Light.h; carbonenginejs num.uint32), confirmed canonical by
    // the format-black schema. Consumed by GetComposedBrightness's noise sum.
    @meta.uint
    noiseOctaves = 1;

    @meta.notImplemented
    @meta.desc("Not exposed to Blue by Carbon's Tr2TexturedPointLight (see class doc) - kept for black-reader compatibility with ccpwgl's pre-existing stub, always 0 in practice.")
    @meta.float
    outerAngle = 0;

    @meta.vector3
    position = vec3.create();

    @meta.float
    radius = 0;

    @meta.quaternion
    rotation = quat.create();

    @meta.notImplemented
    @meta.desc("Texture resource whose average color drives `color` every Update() - ccpwgl has no equivalent Tw2TextureRes.GetAverageColor()/mip-average readback yet (carbonengine Resources/TriTextureRes, Tr2TexturedPointLight.cpp:51-56).")
    @meta.struct()
    texture = null;

    @meta.path
    texturePath = "";

    /**
     * Saturation applied to the texture's average color. NOT persisted/Blue
     * exposed in Carbon (only reachable via `SetSaturation()`, private
     * `m_saturation` field, default 1.0f - Tr2TexturedPointLight.h/.cpp).
     * @private
     */
    _saturation = 1;

    /**
     * World-space position, updated by Update()
     * @private
     */
    _worldPosition = vec3.create();

    /**
     * Seconds elapsed since construction, used as the noise time base
     * (Carbon: `BeOS->GetCurrentFrameTime() - m_startTime`, Tr2Light.cpp:45)
     * @private
     */
    _elapsed = 0;

    /**
     * Sets the saturation applied to the texture's average color
     *
     * Matches `Tr2TexturedPointLight::SetSaturation` (Tr2TexturedPointLight.cpp:37-40).
     * @param {Number} saturation
     */
    SetSaturation(saturation)
    {
        this._saturation = saturation;
    }

    /**
     * Per-frame update
     *
     * Reproduces the transform half of `Tr2Light::AddLight` (see
     * Tr2PointLight.Update), plus Carbon's `Tr2TexturedPointLight::Update`
     * override (Tr2TexturedPointLight.cpp:51-56):
     *
     *   if (m_texture) m_lightData.color = Saturate(m_texture->GetAverageColor(), m_saturation);
     *
     * TODO: recomputing `color` from the bound texture's average color is
     * NOT implemented here - it requires a GPU/resource-side "average color"
     * readback (e.g. a downsampled mip chain reduction) that ccpwgl's
     * texture resource classes (Tw2TextureRes) do not currently provide. See
     * `UpdateColorFromTexture` below, which documents the exact hook point.
     * @param {Number} dt
     * @param {mat4} parentMatrix
     * @param {Float4x3[]|mat4[]} [bones]
     */
    Update(dt, parentMatrix, bones)
    {
        this._elapsed += dt || 0;

        let worldMatrix = parentMatrix;
        if (bones && this.boneIndex >= 0 && this.boneIndex < bones.length)
        {
            worldMatrix = mat4.multiply(mat4.create(), bones[this.boneIndex], parentMatrix);
        }

        vec3.transformMat4(this._worldPosition, this.position, worldMatrix);
        this.UpdateColorFromTexture();
    }

    /**
     * TODO: port `Tr2TexturedPointLight::Update` (Tr2TexturedPointLight.cpp:51-56).
     * Requires `this.texture` to expose an average-color readback
     * equivalent to Carbon's `TriTextureRes::GetAverageColor()`
     * (carbonengine Resources/TriTextureRes.h) - no such API exists on
     * ccpwgl's texture resource classes yet. Once available, this should
     * set `this.color = Saturate(this.texture.GetAverageColor(), this._saturation)`
     * (see `Saturate` in ./CewgLightMath.js, already ported 1:1 from
     * carbonengine math/include/Color_inline.h:161-172).
     */
    UpdateColorFromTexture()
    {
        // Intentional no-op until a texture average-color API exists - see TODO above.
    }

    /**
     * Composes this light's current brightness - see Tr2PointLight.GetComposedBrightness
     * @param {Number} [parentBrightness=1]
     * @returns {Number}
     */
    GetComposedBrightness(parentBrightness = 1)
    {
        return ComposeNoiseBrightness(
            this.brightness, parentBrightness,
            this.noiseAmplitude, this.noiseFrequency, this.noiseOctaves,
            this._elapsed
        );
    }

    /**
     * Gets the light profile's texture array index, or 0 if none is bound - see Tr2PointLight.GetLightProfileIndex
     * @returns {Number}
     */
    GetLightProfileIndex()
    {
        return this.lightProfile && typeof this.lightProfile.GetTextureIndex === "function"
            ? this.lightProfile.GetTextureIndex() + 1
            : 0;
    }

    /**
     * Gets this light's simple {position, radius, color} triple - see Tr2PointLight.GetLight
     * @returns {{position: vec3, radius: Number, color: vec4}}
     */
    GetLight()
    {
        const brightness = this.GetComposedBrightness(1);
        return {
            position: vec3.clone(this._worldPosition),
            radius: this.radius,
            color: vec4.fromValues(
                this.color[0] * brightness,
                this.color[1] * brightness,
                this.color[2] * brightness,
                this.color[3]
            )
        };
    }

    /**
     * Produces the fields for a CewgLightList Buffer B entry - see
     * Tr2PointLight.GetCewgLightData (same field mapping and same
     * flags/params caveats apply; this class behaves as a point light for
     * CEWG purposes).
     * @param {Object} [options]
     * @param {Number} [options.parentBrightness=1]
     * @param {Number} [options.parentScale=1]
     * @returns {{position: Number[], radius: Number, color: Number[], flags: Number, params: Number[]}}
     */
    GetCewgLightData(options = {})
    {
        const parentBrightness = options.parentBrightness !== undefined ? options.parentBrightness : 1;
        const parentScale = options.parentScale !== undefined ? options.parentScale : 1;

        const brightness = this.GetComposedBrightness(parentBrightness);
        const radius = this.radius * parentScale;
        const enabled = radius > 0 && brightness > 0;

        return {
            position: [ this._worldPosition[0], this._worldPosition[1], this._worldPosition[2] ],
            radius,
            color: [ this.color[0] * brightness, this.color[1] * brightness, this.color[2] * brightness ],
            flags: enabled ? CEWG_FLAG_ENABLED : 0,
            params: [ this.innerRadius * parentScale, 0, 0, 0 ]
        };
    }

}
