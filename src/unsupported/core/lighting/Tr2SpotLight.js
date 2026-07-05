import { meta } from "utils";
import { mat4, vec3, vec4, quat } from "math";
import { ComposeNoiseBrightness, CEWG_FLAG_ENABLED } from "./CewgLightMath";


/**
 * Tr2SpotLight
 *
 * Source: carbonengine trinity/trinity/Lights/Tr2SpotLight.h/.cpp (thin
 * subclass, m_type = SPOT_LIGHT), sharing its persisted property set with
 * the abstract base `Tr2Light` (see Tr2PointLight.js for the shared-property
 * rationale - ccpwgl has no Tr2Light base class file).
 */
@meta.notImplemented
@meta.type("Tr2SpotLight")
@meta.ccp.define("Tr2SpotLight")
export class Tr2SpotLight extends meta.Model
{

    @meta.string
    name = "";

    @meta.int32
    boneIndex = -1;

    @meta.float
    brightness = 1;

    // NOTE (drift): Carbon's castsShadows is the PerLightShadowSetting enum
    // (0=DISABLED, 1=ENABLED_ONLY_ON_HIGH_QUALITY, 2=ALWAYS_ENABLED,
    // Tr2Light.h:20-25). The decorator type below is the black WIRE format
    // ccpwgl's reader was already using (black readers dispatch on decorator
    // type) and must not be changed without re-verifying against real .black
    // data.
    @meta.notImplemented
    @meta.float
    castsShadows = false;

    @meta.color
    color = vec4.fromValues(0, 0, 0, 1);

    // NOTE (drift): Carbon's flags is a uint16 bitmask
    // (Tr2LightManager::FLAG_AFFECTS_SURFACES=1 | FLAG_AFFECTS_PARTICLES=2,
    // default FLAG_DEFAULT=1, Tr2LightManager.h:100-105). ccpwgl's black
    // reader observed this property as a string on the wire - decorator type
    // kept as-is (see castsShadows note above).
    @meta.notImplemented
    @meta.string
    flags = "";

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

    // NOTE (drift): Carbon type is uint32_t (carbonenginejs: num.uint32) but
    // the pre-existing ccpwgl stub read this as float - decorator kept as
    // the observed wire format (see castsShadows note above).
    @meta.float
    noiseOctaves = 1;

    @meta.float
    outerAngle = 0;

    @meta.vector3
    position = vec3.create();

    @meta.float
    radius = 0;

    @meta.quaternion
    rotation = quat.create();

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
     * Per-frame update - see Tr2PointLight.Update for the reproduced Carbon logic
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
     * src/core/cewg/CewgLightList.js `SetLights`/`_writeLight`.
     *
     * Position/radius/color reproduce `LightData::AsPerSpotLightData`
     * (carbonengine trinity/trinity/Lights/Tr2Light.cpp:71-80, which calls
     * through to AsPerPointLightData:37-69 for position/color/radius, then
     * overrides angle-related fields).
     *
     * TODO(cone data): Carbon's spotlight PerLightData additionally carries
     * a direction vector and cos(inner/outerAngle) (Tr2Light.cpp:75-77), but
     * CewgLightList's Buffer B struct has only 4 spare `params` floats total
     * and no confirmed field for a 3-component direction alongside those
     * angles (see CewgLightMath.js `CEWG_FLAG_ENABLED` doc - only bit
     * 0x10000 of `flags` and no specific `params` layout are confirmed from
     * the shipped bytecode). It is not yet known whether the CEWG tiled
     * shader path supports spotlight cones at all (it may treat every light
     * as an omnidirectional point light). Until that is reverse engineered,
     * this deliberately returns the same point-light-shaped fields as
     * Tr2PointLight.GetCewgLightData (innerRadius passed through as
     * params[0]) rather than guessing a cone-angle packing.
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
