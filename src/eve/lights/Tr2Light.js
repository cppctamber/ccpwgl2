// Source: E:\carbonengine\trinity\trinity\Lights\Tr2Light.h
// Source: E:\carbonengine\trinity\trinity\Lights\Tr2Light.cpp
import { meta } from "utils";
import { Tr2LightProfileRes } from "../../core/resource/Tr2LightProfileRes";
import { wstring } from "core/reader/Tw2BlackPropertyReaders";
import { mat4, vec3 } from "math";
import { CjsLightData, createCjsLightDataView, setCjsLightDataOwnerValues } from "./CjsLightData";
import { ComposeNoiseBrightness, PerLightShadowSetting } from "../../core/lighting/Tw2CarbonLightMath";
import {
    AreLightFlagsValid,
    AsPerPointLightData,
    AsPerSpotLightData,
    CreateLightRecord,
    MatrixCopyFrom3x4
} from "./lightConversion";

const TR2_LIGHT_TYPE = Object.freeze({
    UNDEFINED_LIGHT: 0,
    POINT_LIGHT: 1,
    SPOT_LIGHT: 2,
    COUNT: 3
});


/**
 * Base scene light: holds the authored light attributes, resolves its bone
 * transform, and submits a converted point or spot record to the light manager
 * each frame.
 */
@meta.define("Tr2Light", true)
export class Tr2Light extends meta.Model
{
    // Tr2Light.h declares both paths as std::wstring; their table differs
    // from the narrow name/property table in .black files.
    static blackReaders = { lightProfilePath: wstring, texturePath: wstring };

    static LightDataFields = CjsLightData.Fields;

    static LightType = TR2_LIGHT_TYPE;

    static UNDEFINED_LIGHT = 0;
    static POINT_LIGHT = 1;
    static SPOT_LIGHT = 2;
    static COUNT = 3;

    @meta.string
    name = "";

    @meta.float
    startTime = 0;

    @meta.boolean
    isDynamic = false;

    @meta.float
    brightnessMultiplier = 1;

    @meta.matrix4
    boneTransform = mat4.create();

    // Resolved runtime handle (Carbon exposes this read-only, not persisted).
    lightProfile = null;

    @meta.string
    lightProfilePath = "";

    @meta.enums(TR2_LIGHT_TYPE)
    type = Tr2Light.UNDEFINED_LIGHT;

    // Compat view over the flattened light fields (2026-07-23 flatten
    // decision): the flat decorated fields on the concrete light classes are
    // the real storage; this keeps Carbon's GetLightData() reference surface
    // and the runtime-sof separate-node hydration shape working.
    _lightDataView = null;
    _worldTransform = mat4.create();
    _worldPosition = vec3.create();
    _worldDirection = vec3.create();
    _elapsed = 0;
    _resolvedProfilePath = "";

    OnValueChanged()
    {
        if (this.lightProfilePath !== this._resolvedProfilePath)
        {
            this._resolvedProfilePath = this.lightProfilePath;
            this.lightProfile = Tr2LightProfileRes.Resolve(this.lightProfilePath);
        }
    }

    OnModified()
    {
        this.OnValueChanged();
    }

    GetResources(out = [])
    {
        for (const resource of [ this.lightProfile, this.texture ])
        {
            if (resource && !out.includes(resource)) out.push(resource);
        }
        return out;
    }

    GetLightProfileIndex()
    {
        return this.lightProfile ? this.lightProfile.GetTextureIndex() + 1 : 0;
    }

    Update(dt = 0, parentMatrix = mat4.create(), bones = null)
    {
        this._elapsed += dt;
        if (bones && typeof bones[0] === "number")
        {
            this.SetBoneMatrix(bones, bones.length / 12);
        }
        else if (bones && this.boneIndex >= 0 && this.boneIndex < bones.length)
        {
            const bone = bones[this.boneIndex];
            if (bone.length === 12) MatrixCopyFrom3x4(this.boneTransform, bone, 0);
            else mat4.copy(this.boneTransform, bone);
        }
        // Carbon bone * parent (row vectors): reverse operands for gl-matrix.
        mat4.multiply(this._worldTransform, parentMatrix, this.boneTransform);
        vec3.transformMat4(this._worldPosition, this.position, this._worldTransform);
        mat4.fromQuat(Tr2Light._rotationScratch, this.rotation);
        mat4.multiply(Tr2Light._rotationScratch, this._worldTransform, Tr2Light._rotationScratch);
        const rotation = Tr2Light._rotationScratch;
        vec3.set(this._worldDirection, -rotation[8], -rotation[9], -rotation[10]);
        vec3.normalize(this._worldDirection, this._worldDirection);
    }

    GetComposedBrightness(parentBrightness = 1)
    {
        return ComposeNoiseBrightness(this.brightness, parentBrightness * this.brightnessMultiplier,
            this.noiseAmplitude, this.noiseFrequency, this.noiseOctaves, this._elapsed);
    }

    GetCarbonLightData(options = {})
    {
        const record = CreateLightRecord();
        const features = {
            parentBrightness: 1,
            composedBrightness: this.GetComposedBrightness(options.parentBrightness ?? 1),
            parentScale: options.parentScale ?? 1
        };
        const spot = this.isSpotlight ?? (this.type === 2);
        const convert = spot ? AsPerSpotLightData : AsPerPointLightData;
        convert(record, this.lightData, this._worldTransform, features, options.shadowQuality ?? 0);
        record.flags |= this.GetLightProfileIndex() << 4;
        record.lightProfile = this.lightProfile;
        if (!AreLightFlagsValid(this.flags)) record.flags = 0;
        record.lightType = spot ? 2 : 1;
        return record;
    }

    /**
     * Compat LightData view over the concrete light's flattened fields, built on
     * first access and redirecting both reads and writes back to this object.
     */
    get lightData()
    {
        this._lightDataView ??= createCjsLightDataView(this, this.constructor.LightDataFields);
        return this._lightDataView;
    }

    /**
     * Applies a value bag, first folding any nested `lightData` bag (the
     * pre-flatten hydration shape) into the flattened fields so everything lands
     * in one schema pass.
     */
    SetValues(values = {}, options = {})
    {
        return setCjsLightDataOwnerValues(
            this,
            values,
            options,
            (ownerValues, ownerOptions) => super.SetValues(ownerValues, ownerOptions),
            this.constructor.LightDataFields
        );
    }

    /** Applies a whole LightData bag onto the flattened light fields. */
    SetLightData(lightData)
    {
        return this.SetValues({ lightData });
    }

    /**
     * Sets the parent brightness factor, which scales the authored brightness only
     * when the light record is built for submission.
     */
    SetBrightnessMultiplier(multiplier)
    {
        this.SetValues({ brightnessMultiplier: Number(multiplier) });
    }

    /** Sets the light colour, returning whether the value actually changed. */
    ChangeLightColor(color)
    {
        return this.SetValues({ color }, { returnBoolean: true });
    }

    /**
     * Returns the live LightData view, which aliases this light's fields instead
     * of copying them.
     */
    GetLightData()
    {
        return this.lightData;
    }

    /**
     * Returns the parent brightness factor applied at submission time, not the
     * authored brightness.
     */
    GetBrightnessMultiplier()
    {
        return this.brightnessMultiplier;
    }

    /** Carbon Tr2Light::SetBoneMatrix (Tr2Light.cpp:98-106): only when
     * 0 <= boneIndex < boneCount (note >= 0, unlike the packed sets' > 0 -
     * bone 0 CAN drive a Tr2Light) - the Float4x3 bone is unpacked over an
     * identity (column-stride, MatrixUtils.cpp:81-96). QUIRK: on a non-match
     * the previous boneTransform STAYS (sticky, identity initially) - it is
     * not reset per call. `bones` is a flat Float32Array, stride 12. */
    SetBoneMatrix(bones, boneCount)
    {
        const boneIndex = this.lightData.boneIndex ?? -1;
        if (bones && boneIndex >= 0 && boneIndex < boneCount)
        {
            mat4.identity(this.boneTransform);
            MatrixCopyFrom3x4(this.boneTransform, bones, boneIndex);
        }
    }

    /** Submits the same converted emitter record used by scene collection. */
    AddLight(lightManager, transform, scale, bones = null, boneCount = 0)
    {
        if (!AreLightFlagsValid(this.flags) || this.type === Tr2Light.UNDEFINED_LIGHT) return;
        if (bones && typeof bones[0] === "number" && boneCount > 0)
        {
            this.SetBoneMatrix(bones, boneCount);
            bones = null;
        }
        this.Update(0, transform, bones);
        const record = this.GetCarbonLightData({
            parentScale: scale,
            shadowQuality: lightManager?.GetCurrentSpaceSceneShadowQuality?.() ?? 0
        });
        record.lightData = this.lightData;
        record.owner = this;
        lightManager?.AddLight?.(record);
    }

    /** World-space light triple used by ccpwgl's SH lighting manager. */
    GetLight(out = { position: vec3.create(), radius: 0, color: vec3.create() })
    {
        const lightData = this.lightData;
        const position = this._worldPosition;
        if (position)
        {
            vec3.copy(out.position, position);
        }
        out.radius = lightData.radius ?? 0;
        const brightness = this.GetComposedBrightness();
        const color = lightData.color;
        out.color[0] = (color?.[0] ?? 0) * brightness;
        out.color[1] = (color?.[1] ?? 0) * brightness;
        out.color[2] = (color?.[2] ?? 0) * brightness;
        return out;
    }

    /** Resolves authored resource paths through the shared resource manager. */
    Initialize()
    {
        this.OnValueChanged();
        return true;
    }

    // Must reference the module-level enum, NOT `Tr2Light.LightType`. On a
    // DECORATED class babel hoists static field initialisers outside the class
    // body, so the class name is still unbound when this runs and a
    // self-reference throws "Cannot read properties of undefined" at import
    // time - which takes the whole library down, not just this class.
    static LIGHT_TYPE = TR2_LIGHT_TYPE;

    static PerLightShadowSetting = PerLightShadowSetting;

    static _rotationScratch = mat4.create();




}
