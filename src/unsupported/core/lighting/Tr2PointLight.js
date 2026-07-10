import { meta } from "utils";
import { mat4, vec3, vec4, quat } from "math";
import { device } from "global";
import { Tw2RenderBatch } from "core/batch";
import { ComposeNoiseBrightness, CEWG_FLAG_ENABLED, PerLightShadowSetting, LIGHT_FLAG_DEFAULT } from "./CewgLightMath";


export class EvePointLightBatch extends Tw2RenderBatch
{

    light = null;

    /**
     * Commits the light for rendering
     * @param {String} [technique] - technique name
     * @returns {Boolean} true if rendered
     */
    Commit(technique)
    {
        return this.light.Render(technique);
    }

    /**
     * Checks if the render batch supports a technique
     * @param {String} technique
     * @returns {boolean}
     */
    HasTechnique(technique)
    {
        return this.light && this.light._effect && this.light._effect.HasTechnique(technique);
    }

}


/**
 * Tr2PointLight
 *
 * Source: carbonengine trinity/trinity/Lights/Tr2PointLight.h/.cpp (thin
 * subclass, m_type = POINT_LIGHT), sharing its persisted property set with
 * the abstract base `Tr2Light` (trinity/trinity/Lights/Tr2Light.h, struct
 * `LightData`) via `Tr2PointLight_Blue.cpp`'s ExposeToBlue(). ccpwgl has no
 * shared Tr2Light base class file, so (matching the pre-existing style of
 * this folder) the full LightData-derived property set is declared flatly
 * on each of Tr2PointLight/Tr2SpotLight/Tr2TexturedPointLight/Tr2FactionLight.
 */
@meta.notImplemented
@meta.type("Tr2PointLight")
@meta.ccp.define("Tr2PointLight")
export class Tr2PointLight extends meta.Model
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

    @meta.color
    color = vec4.create();

    // uint16 bitmask (Tr2LightManager.h:100-105; AFFECTS_SURFACES=1 |
    // AFFECTS_PARTICLES=2, default 1); canonical width confirmed by the
    // format-black schema. Gates which passes a light affects - not consumed
    // by the CEWG tile path yet.
    @meta.notImplemented
    @meta.ushort
    flags = LIGHT_FLAG_DEFAULT;

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

    @meta.vector3
    position = vec3.create();

    @meta.float
    radius = 0;

    @meta.quaternion
    rotation = quat.create();

    /**
     * Light effect
     * @type {Tw2Effect}
     * @private
     */
    _effect = null;

    _worldPosition = vec3.create();
    _indexBuffer = null;

    /**
     * Seconds elapsed since construction, used as the noise time base
     * (Carbon: `BeOS->GetCurrentFrameTime() - m_startTime`, Tr2Light.cpp:45)
     * @private
     */
    _elapsed = 0;

    /**
     * Unloads the light's buffers
     * @param {Boolean} skipEvent
     */
    Unload(skipEvent)
    {
        if (this._indexBuffer)
        {
            device.gl.deleteBuffer(this._indexBuffer);
            this._indexBuffer = null;
        }

        super.Unload(skipEvent);
    }

    Rebuild()
    {

    }

    /**
     * Per-frame update
     *
     * Reproduces the transform half of `Tr2Light::AddLight`
     * (carbonengine trinity/trinity/Lights/Tr2Light.cpp:119-149): the light's
     * local position is transformed by its bone matrix (if `boneIndex` is
     * valid and `bones` are supplied) composed with `parentMatrix`, then
     * accumulates elapsed time for noise-modulated brightness.
     * @param {Number} dt
     * @param {mat4} parentMatrix
     * @param {Float4x3[]|mat4[]} [bones] optional bone matrices, indexed by `boneIndex`
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
        if (this._dirty) this.Rebuild();
    }

    /**
     * Composes this light's current brightness (parent multiplier * noise modulation)
     *
     * Reproduces `LightData::AsPerPointLightData`'s brightness composition
     * (carbonengine trinity/trinity/Lights/Tr2Light.cpp:42-47).
     * @param {Number} [parentBrightness=1] Carbon: `LightFeatures.parentBrightness` (owner's brightness multiplier / activation strength)
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
     * Gets the light profile's texture array index, or 0 if none is bound
     *
     * Reproduces `features.profileIndex = m_lightProfile ? m_lightProfile->GetTextureIndex() + 1 : 0;`
     * (carbonengine trinity/trinity/Lights/Tr2Light.cpp:137). ccpwgl has no
     * Tr2LightProfileRes class yet (see `lightProfile` property above), so
     * this will always return 0 until one exists.
     * @returns {Number}
     */
    GetLightProfileIndex()
    {
        return this.lightProfile && typeof this.lightProfile.GetTextureIndex === "function"
            ? this.lightProfile.GetTextureIndex() + 1
            : 0;
    }

    /**
     * Gets this light's simple {position, radius, color} triple
     *
     * Reproduces `Tr2Light::GetLight` (carbonengine trinity/trinity/Lights/Tr2Light.cpp:152-163),
     * used by Tr2ShLightingManager as a "primary light" secondary-lighting
     * source. Carbon uses the current absolute frame time for its noise
     * sample here (not elapsed-since-start, unlike `AddLight`'s path) - we
     * approximate that with the same `_elapsed` accumulator used everywhere
     * else in this port, since ccpwgl has no equivalent global frame clock
     * threaded through to this layer yet.
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
     * Produces the fields for a CewgLightList Buffer B entry
     * (see src/core/cewg/CewgLightList.js `SetLights`/`_writeLight`).
     *
     * Position/radius/color reproduce `LightData::AsPerPointLightData`
     * (carbonengine trinity/trinity/Lights/Tr2Light.cpp:37-69): world
     * position, radius*parentScale, color.rgb*composedBrightness.
     *
     * TODO(flags/params): CewgLightList's flags/params were reverse
     * engineered from shipped DX11 bytecode and only bit 0x10000 (enabled)
     * is confirmed (see CewgLightMath.js `CEWG_FLAG_ENABLED` doc). Carbon's
     * own PerLightData additionally packs shadow-casting/volumetric flag
     * bits and a light-profile index into `flags` (Tr2LightManager.h:100-105,
     * Tr2Light.cpp:52,64,66) and packs innerRadius/direction/angles into
     * separate PerLightData fields that CewgLightList's 4-float `params`
     * has no confirmed layout for. Until the CEWG tile shader's actual
     * flags/params usage is reverse engineered further, this only sets the
     * enabled bit and passes `innerRadius` through as `params[0]`.
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

    GetBatches(mode, accumulator, perObjectData)
    {
        if (this.display && mode === device.RM_ADDITIVE &&  this._indexBuffer && this._indexBuffer.count)
        {
            const batch = new EvePointLightBatch();
            batch.renderMode = device.RM_ADDITIVE;
            batch.light = this;
            batch.perObjectData = perObjectData;
            accumulator.Commit(batch);
            return true;
        }

        return false;
    }

    Render(technique)
    {
        if (!this._effect || !this._effect.IsGood() || !this.buffer) return false;

        const d = device,
            gl = d.gl,
            stride = 0 * 4;

        d.SetStandardStates(d.RM_ADDITIVE);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        for (let pass = 0; pass < this._effect.GetPassCount(technique); ++pass)
        {
            this.effect.ApplyPass(technique, pass);
            d.ApplyShadowState();
            d.gl.drawElements(gl.TRIANGLES, this.buffer["count"], gl.UNSIGNED_SHORT, 0);
        }
        return false;
    }

    static vertexDeclarations = [
        { usage: "POSITION", usageIndex: 0, elements: 3 },
        { usage: "POSITION", usageIndex: 1, elements: 3 },
        { usage: "POSITION", usageIndex: 2, elements: 3 },
        { usage: "POSITION", usageIndex: 3, elements: 3 },
        { usage: "POSITION", usageIndex: 4, elements: 3 },
        { usage: "POSITION", usageIndex: 5, elements: 3 },
        { usage: "TEXCOORD", usageIndex: 6, elements: 1 },
        { usage: "TEXCOORD", usageIndex: 7, elements: 1 },
        { usage: "TEXCOORD", usageIndex: 8, elements: 1 },
    ]
}
