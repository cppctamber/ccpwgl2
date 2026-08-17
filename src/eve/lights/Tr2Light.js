// Source: E:\carbonengine\trinity\trinity\Lights\Tr2Light.h
// Source: E:\carbonengine\trinity\trinity\Lights\Tr2Light.cpp
import { meta } from "utils";
import { mat4, vec3 } from "math";
import { createCjsLightDataView, setCjsLightDataOwnerValues } from "./CjsLightData";
import { PerLightShadowSetting } from "../../core/lighting/Tw2CarbonLightMath";
// TODO(port): lightConversion.js (AreLightFlagsValid, AsPerPointLightData,
// AsPerSpotLightData, CreateLightRecord, MatrixCopyFrom3x4) does not exist in
// ccpwgl and is out of scope for this port - it was not one of the five files
// requested. Kept as the faithful import path from runtime-trinity; the
// methods that use it (AddLight, GetLight, SetBoneMatrix) are unresolved
// until it is ported. Nothing currently in ccpwgl calls them: the ported
// smart-light classes (EveSmartLightPointLight/SpotLight) only read the
// POINT_LIGHT/SPOT_LIGHT static constants below.
import {
    AreLightFlagsValid,
    AsPerPointLightData,
    AsPerSpotLightData,
    CreateLightRecord,
    MatrixCopyFrom3x4
} from "./lightConversion";


/**
 * Base scene light: holds the authored light attributes, resolves its bone
 * transform, and submits a converted point or spot record to the light manager
 * each frame.
 */
@meta.type("Tr2Light")
@meta.ccp.define("Tr2Light")
export class Tr2Light extends meta.Model
{
    static LightDataFields = [];

    static LightType = Object.freeze({
        UNDEFINED_LIGHT: 0,
        POINT_LIGHT: 1,
        SPOT_LIGHT: 2,
        COUNT: 3
    });

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

    @meta.struct("Tr2LightProfileRes")
    lightProfile = null;

    @meta.string
    lightProfilePath = "";

    @meta.enums(Tr2Light.LightType)
    type = Tr2Light.UNDEFINED_LIGHT;

    // Compat view over the flattened light fields (2026-07-23 flatten
    // decision): the flat decorated fields on the concrete light classes are
    // the real storage; this keeps Carbon's GetLightData() reference surface
    // and the runtime-sof separate-node hydration shape working.
    _lightDataView = null;

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

    /** Carbon Tr2Light::AddLight (Tr2Light.cpp:119-149): dynamic update hook,
     * the ONLY entity-side flag validity check in the light family
     * (AreLightFlagsValid, cpp:126-129), the bone refresh, then
     * lightTransform = boneTransform * transform - Carbon row-vector, bone
     * first, so the gl-matrix operands SWAP (cpp:132) - and the point/spot
     * conversion submitted to the duck manager. QUIRKS: UNDEFINED_LIGHT
     * submits NOTHING (a deserialized base light is silently inert); Carbon's
     * profileIndex here is GetTextureIndex() + 1 while the packed sets use no
     * +1 - moot in JS (the profile rides the record by reference) but
     * recorded. The record is scratch; the manager must copy.
     *
     * The profile-index flag packing and half-float narrowing are
     * renderer-backend concerns (record carries the profile by reference);
     * the Perlin brightness flicker awaits the frame-clock seam (see
     * lightConversion.js).
     */
    AddLight(lightManager, transform, scale, bones = null, boneCount = 0)
    {
        if (this.isDynamic)
        {
            this.Update?.();
        }
        if (!AreLightFlagsValid(this.lightData.flags ?? 0))
        {
            return;
        }

        this.SetBoneMatrix(bones, boneCount);
        // Carbon (row-vector): m_boneTransform * transform - bone first.
        mat4.multiply(Tr2Light._lightTransformScratch, transform, this.boneTransform);

        const features = Tr2Light._featuresScratch;
        features.parentBrightness = this.brightnessMultiplier;
        features.parentScale = scale;

        const record = Tr2Light._lightRecord;
        if (this.type === Tr2Light.POINT_LIGHT)
        {
            AsPerPointLightData(record, this.lightData, Tr2Light._lightTransformScratch, features,
                lightManager?.GetCurrentSpaceSceneShadowQuality?.() ?? 0);
        }
        else if (this.type === Tr2Light.SPOT_LIGHT)
        {
            AsPerSpotLightData(record, this.lightData, Tr2Light._lightTransformScratch, features,
                lightManager?.GetCurrentSpaceSceneShadowQuality?.() ?? 0);
        }
        else
        {
            return;
        }
        record.lightType = this.type;
        record.lightData = this.lightData;
        record.lightProfile = this.lightProfile;
        record.owner = this;
        lightManager?.AddLight?.(record);
    }

    /** Carbon Tr2Light::GetLight (Tr2Light.cpp:152-163): position and radius
     * straight from the light data, color = authored rgb * brightness. Carbon's
     * three reference out-params become one out record (JS out-params go last
     * and are returned). The color is the rgb triple - the alpha channel is
     * unused by every Carbon consumer of this method (EveChildCloud2's light
     * block takes GetXYZ).
     *
     * The Perlin noise flicker (cpp:157-161) reads the global frame clock
     * (BeOS GetCurrentFrameTime) - an engine seam; the base brightness is
     * used until it lands.
     */
    GetLight(out = { position: vec3.create(), radius: 0, color: vec3.create() })
    {
        const lightData = this.lightData;
        const position = lightData.position;
        if (position)
        {
            vec3.copy(out.position, position);
        }
        out.radius = lightData.radius ?? 0;
        const brightness = lightData.brightness ?? 0;
        const color = lightData.color;
        out.color[0] = (color?.[0] ?? 0) * brightness;
        out.color[1] = (color?.[1] ?? 0) * brightness;
        out.color[2] = (color?.[2] ?? 0) * brightness;
        return out;
    }

    /**
     * Reports the light ready; resolving the light profile is left to the
     * resource/runtime adapter, so this always succeeds.
     */
    Initialize()
    {
        // Light-profile resolution is supplied by the resource/runtime adapter.
        return true;
    }

    static LIGHT_TYPE = Tr2Light.LightType;

    static PerLightShadowSetting = PerLightShadowSetting;

    static _lightTransformScratch = mat4.create();

    static _featuresScratch = { parentBrightness: 1, parentScale: 1 };

    static _lightRecord = CreateLightRecord();

}
