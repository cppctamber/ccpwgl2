// Ported from CarbonEngine (MIT, (c) 2026 CCP Games) - https://github.com/carbonengine/trinity
//   trinity/trinity/Lights/Tr2Light.cpp (LightData::AsPerPointLightData cpp:37-69,
//     AsPerSpotLightData cpp:71-80)
//   trinity/trinity/Tr2LightManager.h (PerLightData h:55-85, flags h:100-105,
//     ShadowQuality h:25-31) and Tr2LightManager.cpp (AreLightFlagsValid cpp:677-680)
//
// The LightData -> PerLightData conversion core shared by Tr2Light.AddLight and
// the packed-set GetLights family. The produced record follows the
// EveSmartLightPointLight convention: typed CPU floats only (no Float_16/
// Vector3_16 packing), flags unpacked, the light profile carried by reference
// instead of Carbon's profileIndex << 4 flag packing - physical packing is a
// renderer-backend concern. Records are scratch; a manager must copy (Carbon's
// Tr2LightManager::AddLight copies by value).
//
// This module exports FUNCTIONS ONLY and must never be re-exported from a
// barrel that feeds tw2.Register's constructor store, which rejects non-class
// members.
import { mat4, vec3 } from "math";
import { LightDataFlags, LIGHT_FLAG_DEFAULT } from "core/lighting/Tw2CarbonLightMath";


/**
 * Carbon's shadow quality tiers (Tr2LightManager.h:25-31). Inlined because
 * ccpwgl has no generated trinity enum module; the scene authors the same
 * meanings by hand where it needs them.
 * @enum {Number}
 */
export const ShadowQuality = {
    SHADOW_DISABLED: 0,
    SHADOW_LOW: 1,
    SHADOW_HIGH: 2,
    SHADOW_RAYTRACED: 3
};

export { LIGHT_FLAG_DEFAULT };


/**
 * Carbon Tr2LightManager::AreLightFlagsValid (Tr2LightManager.cpp:677-680).
 * A light that affects neither surfaces nor particles has nothing to light.
 * @param {Number} flags
 * @returns {Boolean}
 */
export function AreLightFlagsValid(flags)
{
    return (flags & (LightDataFlags.AFFECTS_SURFACES | LightDataFlags.AFFECTS_PARTICLES)) !== 0;
}


/**
 * A fresh per-light record in the EveSmartLightPointLight shape
 * (Tr2LightManager::PerLightData, h:55-85, plus the JS-side owner/profile refs)
 * @returns {Object}
 */
export function CreateLightRecord()
{
    return {
        owner: null,
        lightData: null,
        lightProfile: null,
        lightType: 0,
        position: vec3.create(),
        direction: vec3.create(),
        color: vec3.create(),
        radius: 0,
        innerRadius: 0,
        flags: 0,
        outerAngle: 0,
        innerAngle: 0,
        projectionPlaneDistance: 0
    };
}


const IDENTITY_ROTATION = new Float32Array([ 0, 0, 0, 1 ]);
const ROTATION_SCRATCH = mat4.create();
const LIGHT_ROTATION_SCRATCH = mat4.create();
const DIRECTION_SCRATCH = vec3.create();


/**
 * Carbon LightData::AsPerPointLightData (Tr2Light.cpp:37-69), writing into the
 * caller's record (returned). `lightData` is any duck with the CjsLightData
 * field surface; `features` is {parentBrightness, parentScale}.
 *
 * Compositions: cpp:55 `RotationMatrix(rotation) * transform` is row-vector, so
 * the rotation applies FIRST and the gl operands SWAP -
 * `mat4.multiply(out, transform, rotationMatrix)`. cpp:53's TransformCoord and
 * cpp:56's w=0 basis transform are single-matrix applications; the latter reads
 * the basis rows directly because `vec3.transformMat4` would add the
 * translation.
 *
 * ADAPTATION, documented once here for every consumer: Carbon's Perlin noise
 * brightness flicker (cpp:43-47) reads the global frame clock, which is an
 * engine seam, so the base brightness is used until that lands. ccpwgl already
 * has the faithful flicker in `Tw2CarbonLightMath.ComposeNoiseBrightness` if a
 * caller wants it. Carbon's Float_16 narrowing is omitted (typed CPU floats).
 *
 * @param {Object} record - from CreateLightRecord
 * @param {Object} lightData
 * @param {mat4} transform
 * @param {{parentBrightness: Number, parentScale: Number}} features
 * @param {Number} shadowQuality
 * @returns {Object} record
 */
export function AsPerPointLightData(record, lightData, transform, features, shadowQuality)
{
    // cpp:42 - composed brightness (noise flicker: see the adaptation note)
    const composedBrightness = (lightData.brightness ?? 0) * features.parentBrightness;

    // cpp:48 - color.rgb * composedBrightness
    const color = lightData.color;
    record.color[0] = (color?.[0] ?? 0) * composedBrightness;
    record.color[1] = (color?.[1] ?? 0) * composedBrightness;
    record.color[2] = (color?.[2] ?? 0) * composedBrightness;

    // cpp:49-50 - radii scaled by the parent scale
    record.radius = (lightData.radius ?? 0) * features.parentScale;
    record.innerRadius = (lightData.innerRadius ?? 0) * features.parentScale;

    // cpp:51-52 - Carbon packs profileIndex << 4 into the flags; the JS record
    // carries the profile by reference (set by the caller), flags unpacked
    record.flags = lightData.flags ?? 0;

    // cpp:53 - TransformCoord: single-matrix point transform
    vec3.transformMat4(record.position, lightData.position, transform);

    // cpp:55 - COMPOSITION (row-vector, rotation first): operands swap
    mat4.fromQuat(ROTATION_SCRATCH, lightData.rotation ?? IDENTITY_ROTATION);
    mat4.multiply(LIGHT_ROTATION_SCRATCH, transform, ROTATION_SCRATCH);

    // cpp:56 - Transform((0,0,-1,0), lightRotation): w = 0, basis rows only
    const m = LIGHT_ROTATION_SCRATCH;
    DIRECTION_SCRATCH[0] = -m[8];
    DIRECTION_SCRATCH[1] = -m[9];
    DIRECTION_SCRATCH[2] = -m[10];
    vec3.normalize(record.direction, DIRECTION_SCRATCH);

    // cpp:58-60 - point defaults; 1/tan(45deg) = 1
    record.outerAngle = 0;
    record.innerAngle = 0;
    record.projectionPlaneDistance = 1 / Math.tan(2 * Math.PI * 45 / 360);

    // cpp:62-66 - shadow and volumetric flags
    const castsShadows = lightData.castsShadows ?? 0;

    if (castsShadows === 2
        || (castsShadows === 1 && (shadowQuality === ShadowQuality.SHADOW_HIGH || shadowQuality === ShadowQuality.SHADOW_RAYTRACED)))
    {
        record.flags |= LightDataFlags.CASTS_SHADOWS;
    }

    record.flags |= lightData.isVolumetric ? LightDataFlags.IS_VOLUMETRIC : 0;

    return record;
}


/**
 * Carbon LightData::AsPerSpotLightData (Tr2Light.cpp:71-80): the point
 * conversion, then cos-of-degree angles and 1/tan(outerAngle deg) - which is
 * Infinity at outerAngle 0, exactly as Carbon ships it.
 * @param {Object} record
 * @param {Object} lightData
 * @param {mat4} transform
 * @param {{parentBrightness: Number, parentScale: Number}} features
 * @param {Number} shadowQuality
 * @returns {Object} record
 */
export function AsPerSpotLightData(record, lightData, transform, features, shadowQuality)
{
    AsPerPointLightData(record, lightData, transform, features, shadowQuality);

    record.outerAngle = Math.cos(2 * Math.PI * (lightData.outerAngle ?? 0) / 360);
    record.innerAngle = Math.cos(2 * Math.PI * (lightData.innerAngle ?? 0) / 360);
    record.projectionPlaneDistance = 1 / Math.tan(2 * Math.PI * (lightData.outerAngle ?? 0) / 360);

    return record;
}


/**
 * A scratch plain LightData copy for by-value loop mutation - Carbon's
 * `auto light` / `lightDataCopy` pattern in the EvePlaneSet/EveBannerSet
 * GetLights family, where the STORED items must not be mutated. Holds exactly
 * the fields the conversions read.
 * @returns {Object}
 */
export function CreateLightDataScratch()
{
    return {
        position: vec3.create(),
        color: new Float32Array(4),
        brightness: 0,
        radius: 0,
        innerRadius: 0,
        rotation: new Float32Array([ 0, 0, 0, 1 ]),
        outerAngle: 0,
        innerAngle: 0,
        flags: 0,
        castsShadows: 0,
        isVolumetric: false
    };
}


/**
 * Copies the conversion-read fields of a CjsLightData-shaped source into a
 * CreateLightDataScratch record
 * @param {Object} out
 * @param {Object} lightData
 * @returns {Object} out
 */
export function CopyLightData(out, lightData)
{
    vec3.copy(out.position, lightData.position);

    out.color[0] = lightData.color?.[0] ?? 0;
    out.color[1] = lightData.color?.[1] ?? 0;
    out.color[2] = lightData.color?.[2] ?? 0;
    out.color[3] = lightData.color?.[3] ?? 1;

    out.brightness = lightData.brightness ?? 0;
    out.radius = lightData.radius ?? 0;
    out.innerRadius = lightData.innerRadius ?? 0;

    const rotation = lightData.rotation ?? IDENTITY_ROTATION;
    out.rotation[0] = rotation[0];
    out.rotation[1] = rotation[1];
    out.rotation[2] = rotation[2];
    out.rotation[3] = rotation[3];

    out.outerAngle = lightData.outerAngle ?? 0;
    out.innerAngle = lightData.innerAngle ?? 0;
    out.flags = lightData.flags ?? 0;
    out.castsShadows = lightData.castsShadows ?? 0;
    out.isVolumetric = !!lightData.isVolumetric;

    return out;
}


/**
 * Carbon TriMatrixCopyFrom3x4 (Utilities/MatrixUtils.cpp:81-96): unpacks a
 * 12-float Float4x3 bone into a mat4, leaving the 4th column untouched. The
 * bone elements are COLUMN-strided (`elements[b*4+r]`), which is the trap -
 * gl m[0]=e[0], m[4]=e[1], m[8]=e[2], m[12]=e[3], and so on per row.
 * @param {mat4} out
 * @param {Float32Array} bones - flat, stride 12
 * @param {Number} boneIndex
 * @returns {mat4} out
 */
export function MatrixCopyFrom3x4(out, bones, boneIndex)
{
    const base = boneIndex * 12;

    out[0] = bones[base + 0];
    out[4] = bones[base + 1];
    out[8] = bones[base + 2];
    out[12] = bones[base + 3];
    out[1] = bones[base + 4];
    out[5] = bones[base + 5];
    out[9] = bones[base + 6];
    out[13] = bones[base + 7];
    out[2] = bones[base + 8];
    out[6] = bones[base + 9];
    out[10] = bones[base + 10];
    out[14] = bones[base + 11];

    return out;
}
