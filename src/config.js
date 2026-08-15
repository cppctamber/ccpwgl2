import * as core from "./core";
import * as curve from "./curve";
import * as eve from "./eve";
import * as interior from "./interior";
import * as particle from "./particle";
import * as sof from "./sof";
import * as state from "./state";
import * as unsupported from "./unsupported";
import { PT } from "constant/type";
import * as MT from "global/meta/types";
import { DeviceTextureQuality, DeviceShaderQuality } from "constant/ccpwgl";
import { vec4, mat4 } from "math";
import { tw2BatchSorter } from "core/batch";

const typedArray = ctor => ({ type: MT.WglTypedArray, ctor });

// Default resource serving (the local tools-core service, not provided with
// this library). Routes are /{target}/{build}/{topic} throughout. They were
// split - provider routes ("ccp") for the res:/ file tree, target routes
// ("eve") for topics like audio - which meant knowing two keys for one service.
// A target is the identity; a provider is something it has. Only one build is
// passed everywhere.
//
// 5510 is the service's OWN default port, so this matches a plain
// `cjs-tools-service` with no arguments. It also has to agree with the ESI
// callback the service registers (`http://localhost:5510/v1/auth/esi/callback`),
// which EVE matches exactly - running the service on another port to suit this
// file breaks the login rather than the resources, and the service warns about
// it at startup.
const RES_SERVER = "http://127.0.0.1:5510/";
const RES_TARGET = "eve";
const RES_BUILD = "latest";

/**
 * Register global configurations
 */
export const config = {


    // Enables library debugging
    debug: false,

    // Enables audio on initialization: the library fetches the audio
    // library document (aud:/library.json) and enables the audio manager,
    // with audible output starting on the first user gesture
    audioEnabled: false,

    // Enables experimental EveSpaceScene shadow rendering path
    enableExperimentalShadows: false,

    // Enables experimental Carbon-shaped render batch context
    enableExperimentalBatchContext: false,

    // Sets the default render batch sorter
    renderBatchSorter: tw2BatchSorter,

    // Registers and processes capability providers during initialization
    capabilities: {

        // Processes all registered providers by default
        // - false: skip automatic processing
        // - { keys: "texture.formats" } or { keys: [ ... ] }: process selected providers
        process: true,

        providers: [
            core.Tw2TextureRes.GetCapabilityProvider(),
            // Inline entry: Tw2AudioMan is in the tw2 module cycle, so its
            // class binding isn't initialized when this literal evaluates
            {
                key: "audio.media",
                name: "audio.media",
                category: "audio",
                label: "Audio media sourcing",
                description: "Whether the configured aud:/ tools-core endpoint is reachable and supports exact Range requests",
                resolve: context => context.tw2.audMan.DetectMediaSourcing()
            }
        ]

    },

    // The paths in the black files must be changed
    black: {

        // Normalize casing in .black-authored paths. No prefix rewrite is
        // needed - everything uses "res:/" directly and "cdn:/" is retired.
        "*": path => path.toLowerCase(),

        // DDS is the authored source. TextureFormatDDS uploads its compressed
        // payload when supported and decodes the same bytes to RGBA otherwise.
        "dds": path => path,

        // PNG has no cubemap header, so authored _cube names select the
        // legacy six-face ".cube" image strip. Native DDS cubemaps are
        // identified independently from DDSCAPS2_CUBEMAP by TextureFormatDDS.
        "png": path => path.includes("_cube") ? path.replace(".png", ".qube") : path,

        // Replace gr2 extension with gr2_json
        //"gr2": path => path.replace(".gr2", ".gr2_json"),

        // Replace red extension with black (they're all black files)
        "red": path => path.replace(".red", ".black")

    },

    // Sets the default webgl context parameters
    "glParams": {

        // If the value is true, the drawing buffer has an alpha channel for the purposes of performing OpenGL
        // destination alpha operations and compositing with the page. If the value is false,
        // no alpha buffer is available.
        // - Disabled by default due to issues with artifacts in ccpwgl
        alpha: true,

        // If the value is true, the drawing buffer has a depth buffer of at least 16 bits. If the value is false,
        // no depth buffer is available.
        depth: true,

        // If the value is true, the drawing buffer has a stencil buffer of at least 8 bits. If the value is false,
        // no stencil buffer is available.
        stencil: false,

        // If the value is true and the implementation supports antialiasing the drawing buffer will perform
        // antialiasing using its choice of technique (multisample/supersample) and quality. If the value is false
        // or the implementation does not support antialiasing, no antialiasing is performed.
        antialias: true,

        // If the value is true the page compositor will assume the drawing buffer contains colors with premultiplied
        // alpha. If the value is false the page compositor will assume that colors in the drawing buffer are not
        // premultiplied. This flag is ignored if the alpha flag is false.
        premultipliedAlpha: false,

        // If false, once the drawing buffer is presented as described in theDrawing Buffer section, the contents of
        // the drawing buffer are cleared to their default values. All elements of the drawing buffer (color, depth
        // and stencil) are cleared. If the value is true the buffers will not be cleared and will preserve their
        // values until cleared or overwritten by the author.
        preserveDrawingBuffer: true,

        // Provides a hint to the user agent indicating what configuration of GPU is suitable for this WebGL context.
        // This may influence which GPU is used in a system with multiple GPUs. For example, a dual-GPU system might
        // have one GPU that consumes less power at the expense of rendering performance. Note that this property
        // is only a hint and a WebGL implementation may choose to ignore it.
        // - default
        // - high-performance
        powerPreference: "default",

        // If the value is true, context creation will fail if the implementation determines that the performance of
        // the created WebGL context would be dramatically lower than that of a native application making equivalent
        // OpenGL calls
        failIfMajorPerformanceCaveat: false,

        // If the value is true, then the user agent may optimize the rendering of the canvas to reduce the latency,
        // as measured from input events to rasterization, by desynchronizing the canvas paint cycle from the event
        // loop, bypassing the ordinary user agent rendering algorithm, or both. Insofar as this mode involves
        // bypassing the usual paint mechanisms, rasterization, or both, it might introduce visible tearing artifacts.
        descynchronized: false

    },

    device: {

        // Defines the default texture quality (HIGH, MEDIUM, LOW) - Doesn't work with CDN resources yet
        "textureQuality": DeviceTextureQuality.HIGH,

        // Defines the default shader quality (HIGH, MEDIUM or LOW)
        "shaderQuality": DeviceShaderQuality.MEDIUM,

        // Selects the protected compiled-effect namespace
        // ("effect.dx11" routes hull shaders through the Carbon path,
        // "effect.gles2" the legacy/manual path)
        "effectProfile": "effect.gles2",

        // Enables antialiasing (can affect performance)
        "antialiasing": true,

        // Enables anisotropic filtering (can affect performance)
        "anisotropicFiltering": true,

        // Enables webgl2 if supported
        "webgl2": true,

        // Enables webvr if supported (not implemented on this version of the library)
        "webvr": false,

        // Enables performance clock if it exists
        "performanceClock": true

    },

    resMan: {

        // Keeps a copy of vertex data in geometry
        // Geometry loaded when false will not store vertex data after this is enabled
        "systemMirror": true,

        // Enables auto purging of resources that aren't used
        // If set to false resources must be manually removed when no longer required
        "autoPurgeResources": true,

        // The amount of time to wait before purging an unused resource
        "purgeTime": 60,

        // The amount of parallel raw loads allowed at once
        "maxConcurrentLoads": 8,

        // The maximum time for preparing resources per frame
        "maxPrepareTime": 0.05,

        // Optional worker loader url, defaults to null
        "workerLoaderUrl": null,

        // Toggles using worker-backed raw loads
        "useWorkerLoading": false,
        // Alternate alias for backwards compatibility; prefer useWorkerLoading
        "workerLoading": false,

        // Objects who have child resources can be optionally watched to monitor their load progress
        // The max time in seconds an object can be watched for, before it is forced to resolve
        "maxWatchedTime": 240,

        // The maximum objects to watch per frame
        "maxWatchedCount": 10,

        // The maximum time to monitor watched objects
        "maxWatchedUpdateTime": 0.05,

        // The minimum time between watched updates in seconds; 0 means every frame
        "minimumWatchUpdate": 0,

        // Minimum time between automatic reload checks in seconds
        "minimumAutoReloadSeconds": 1,

        // Maximum number of auto-reloads processed per tick; 0 means unlimited
        "maxAutoReloadsPerTick": 0

    },

    audMan: {

        // Preferred language for localized embedded media variants
        "language": "en-us",

        // World units to WebAudio panner units
        "distanceScale": 1,

        // The listener follows the device's camera pose (viewInverse) each
        // tick. Multi-camera hosts should disable this and drive the
        // listener manually (SetAudioLocation/SetAudioLocationFromPoseMatrix),
        // since only the host knows which camera is the ears.
        "listenerFromCamera": true,

        // Allows exact Range requests for embedded media in original banks.
        // When false, original banks are fetched whole and sliced locally.
        "allowOffsets": true

    },

    logger: {

        // The name to use in console outputs
        "name": "CCPWGL2",

        // The amount of logs to keep in history
        "history": 50,

        // The amount of logs to keep when checking for repeated log outputs
        "throttle": 10,

        // Toggles console outputs
        "display": true,

        // Controls visibility for console outputs based on type
        "visible": {
            "error": true,
            "warn": false,
            "log": false,
            "info": false,
            "debug": false
        }

    },

    paths: {

        "api": `${RES_SERVER}${RES_TARGET}/${RES_BUILD}/`,
        "res": `${RES_SERVER}${RES_TARGET}/${RES_BUILD}/resources/`,

        // The audio route family root. "res" must remain the standard eve
        // resource path; "aud" can target a tools-core audio endpoint root.
        // The runtime requests exact path/ records and optional ranges; media
        // selection remains in runtime-audio.
        "aud": `${RES_SERVER}${RES_TARGET}/${RES_BUILD}/audio/`,

    },

    extensions: {
        
        // Shader
        "sm_json": core.Tw2EffectRes,
        "sm_depth": core.Tw2EffectRes,
        "sm_hi": core.Tw2EffectRes,
        "sm_lo": core.Tw2EffectRes,
        "fx": core.Tw2EffectRes,
        "carbon": core.Tw2EffectRes, // Carbon packages (see Tw2EffectRes.PrepareCarbon) - same class, format detected by magic bytes

        //Geometry
        "gr2": core.Tw2GeometryRes,
        "gr2_json": core.Tw2GeometryRes,
        "gsf": core.Tw2GeometryRes,
        "wbg": core.Tw2GeometryRes,
        "obj": core.Tw2GeometryRes,

        // Texture
        "png": core.Tw2TextureRes,
        "jpg": core.Tw2TextureRes,
        "jpeg": core.Tw2TextureRes,
        "webp": core.Tw2TextureRes,
        "avif": core.Tw2TextureRes,
        "dds": core.Tw2TextureRes,
        "cube": core.Tw2TextureRes,
        "qube": core.Tw2TextureRes,
        "tga" : core.Tw2TextureRes,
        "mp4": core.Tw2TextureRes,
        "webm": core.Tw2TextureRes,

        // Object
        "black": core.Tw2LoadingObject,
        "red": core.Tw2LoadingObject,

        // Audio
        "mp3": core.Tw2AudioRes,
        "wav": core.Tw2AudioRes,
        // Assumes audio...
        "ogg": core.Tw2AudioRes,
        // Wwise media and banks (raw bytes, decoded via runtime-resource)
        "wem": core.Tw2AudioRes,
        "bnk": core.Tw2AudioRes,

        // Generated json artifacts (e.g. aud:/library.json)
        "json": core.Tw2JsonRes,
    },

    constructors: [
        { ...core },
        { ...curve },
        { ...eve },
        { ...interior },
        { ...particle },
        { ...sof },
        { ...state },
        { ...unsupported }
    ],

    variableTypes: {
        "float": core.Tw2FloatParameter,
        "number": core.Tw2FloatParameter,
        "texture": core.Tw2TextureParameter,
        "vector2": core.Tw2Vector2Parameter,
        "vector3": core.Tw2Vector3Parameter,
        "vector4": core.Tw2Vector4Parameter,
        "matrix4": core.Tw2Matrix4Parameter
    },

    propertyTypes: {
        [PT.UNKNOWN]: MT.WglUnknown,

        [PT.BOOLEAN]: MT.WglBoolean,
        [PT.ENUM]: MT.WglPlain,

        [PT.STRING]: MT.WglString,
        [PT.PATH]: MT.WglPath,
        [PT.EXPRESSION]: MT.WglExpression,
        [PT.BYTE]: MT.WglUInt8,
        [PT.UINT]: MT.WglUInt32,
        [PT.USHORT]: MT.WglUInt16,
        [PT.FLOAT]: MT.WglFloat32,
        [PT.INT64]: MT.WglInt64,
        [PT.INT32]: MT.WglInt32,

        [PT.STRUCT]: MT.WglStruct,
        [PT.STRUCT_RAW]: MT.WglStruct,
        [PT.STRUCT_LIST]: MT.WglStructList,
        [PT.PLAIN]: MT.WglPlain,
        [PT.ARRAY]: MT.WglArray,

        [PT.VECTOR]: { type: MT.WglVector,ctor: Float32Array },
        [PT.VECTOR2]: { type: MT.WglVector,ctor: Float32Array, length: 2 },
        [PT.VECTOR3]: { type: MT.WglVector, ctor: Float32Array, length: 3 },
        [PT.VECTOR4]: { type: MT.WglVector, ctor: Float32Array, length: 4 },
        [PT.COLOR]: { type: MT.WglVector, ctor: Float32Array, length: 4 },
        [PT.QUATERNION]: { type: MT.WglVector, ctor: Float32Array, length: 4 },
        [PT.MATRIX3]: { type: MT.WglVector, ctor: Float32Array, length: 9 },
        [PT.MATRIX4]: { type: MT.WglVector, ctor: Float32Array, length: 16 },

        [PT.TRANSLATION]: { type: MT.WglVector, ctor: Float32Array, length: 3 },
        [PT.SCALING]: { type: MT.WglVector, ctor: Float32Array, length: 3 },
        [PT.ROTATION]: { type: MT.WglVector, ctor: Float32Array,length: 4 },

        [PT.UINT8_ARRAY]: typedArray(Uint8Array),
        [PT.UINT8_CLAMPED_ARRAY]: typedArray(Uint8ClampedArray),
        [PT.UINT16_ARRAY]: typedArray(Uint16Array),
        [PT.UINT32_ARRAY]: typedArray(Uint32Array),
        [PT.INT8_ARRAY]: typedArray(Int8Array),
        [PT.INT16_ARRAY]: typedArray(Int16Array),
        [PT.INT32_ARRAY]: typedArray(Int32Array),
        [PT.FLOAT32_ARRAY]: typedArray(Float32Array),
        [PT.FLOAT64_ARRAY]: typedArray(Float64Array)
    },

    variables: {
        "WorldMat": mat4.create(),
        "ViewMat": mat4.create(),
        "ProjectionMat": mat4.create(),
        "ViewProjectionMat": mat4.create(),
        "ViewportSize": vec4.create(),
        "Time": vec4.create(),
        "u_DecalMatrix": mat4.create(),
        "u_InvDecalMatrix": mat4.create(),
        "EveSpaceSceneEnvMap": "",
        // WHITE, not black: this is a shadow *visibility* map (1 = fully
        // lit). The translated Carbon Main pixel shader multiplies the
        // entire direct-sun term (diffuse + specular) by this texel, so a
        // black default silently kills all sunlight and the hull is lit
        // only by the env cubemap ("melted brown" look). White matches
        // both the old hslswebgl adapter's forced per-effect fallback and
        // EveSpaceSceneShadowHandler's own resets ("dynamic:/color/1,1,1,1").
        // A dynamic colour rather than a file: the old "rgba:/" branch of
        // Tw2TextureParameter builds a GL texture during construction, which
        // at module-load time is before device.gl exists, and builds a
        // separate one per parameter besides. "dynamic:/color/..." resolves
        // through the resource manager like any other path, so it is created
        // once the device exists and every user of the colour shares it.
        // Carbon spells it the same way (trinity SolidColorTexture).
        "EveSpaceSceneShadowMap": "dynamic:/color/1,1,1,1",

        // WHITE, and 2D: Carbon declares this Texture2D (type 2) in all 8
        // shaders that take it, all volumetric clouds, and they sample it as
        // cascade DEPTH - not as the visibility the map above carries.
        //
        // Same arithmetic as the DepthMap note below: 0 is the near plane, so
        // black reads as "everything is occluding" and 1 is the far plane,
        // which is the only value meaning "nothing casts here".
        //
        // Carbon registers this one with no fallback at all
        // (Tr2ShadowMap.cpp:288, EveSpaceScene.cpp:4258) - unlike
        // EveSpaceSceneShadowMap and EveSpaceSceneDynamicShadowMap, which both
        // get an explicit white 1x1 R8 - so there is no Carbon value to copy
        // and the neutral has to be reasoned from what the consumer does.
        //
        // EveSpaceSceneShadowHandler resets this to black, and that is NOT the
        // authority here: it attaches its light-space atlas to this slot and to
        // the screen-space visibility slot alike, which cannot both be right.
        "EveSpaceSceneCascadedShadowMap": "dynamic:/color/1,1,1,1",

        // WHITE, for the same reason the shadow map above is white, but with
        // different arithmetic behind it. Carbon's `DepthMap` is a scene depth
        // sample; the soft-particle shaders linearise it as
        // `sceneZ = m32 / (sample - m22)` and fade the particle out as the
        // scene approaches it. 0 resolves to the NEAR plane, so a black or
        // unbound default means "fully occluded" and the quad softs render at
        // zero brightness. 1 resolves to the far plane - nothing in front -
        // which is the only value meaning "always visible".
        //
        // Carbon itself leaves this null outside impostor atlas updates, where
        // it points at the impostor item depth-stencil; ccpwgl runs no depth
        // pass at all, so the neutral value is what we want permanently.
        "DepthMap": "dynamic:/color/1,1,1,1",

        // Carbon per-effect SSAO map has no producer yet; default to the same
        // shared white the shadow and depth maps use above (no occlusion).
        "SSAOMap": "dynamic:/color/1,1,1,1",

        "EnvMap1": "",
        "EnvMap2": "",
        "EnvMap3": "",
        "ShadowLightness": 0,

        "OccluderValue": [ 1, 1, 0, 0 ],
        // The Y IS AN INDEX, NOT A SCALE, and it is bit-reinterpreted. The god
        // ray shader ends with
        //   texelFetch(bt0, ivec2(floatBitsToInt(y) & 2047, floatBitsToInt(y) >> 11))
        // so the float's BIT PATTERN addresses a width-2048-wrapped buffer.
        // A y of 1.0 reads as 1065353216, which is texel (0, 520192) - far
        // outside the 1x1 FlareOcclusionBuffer, and an out-of-range texelFetch
        // returns 0, which multiplies the whole god ray pass to black. Only 0.0
        // addresses texel (0, 0), which is the entire buffer we have.
        //
        // Carbon stores a per-flare counter index here, so this is right only
        // while there is one occlusion slot. See EveLensflare, which writes the
        // occlusion intensity into X and must leave Y alone for the same reason.
        "LensflareFxOccScale": [ 1, 0, 0, 0 ],
        "LensflareFxDirectionScale": [ 0, 0, 0, 0 ],

        // WHITE, and the one global here whose neutral is not black. Carbon
        // declares it a Buffer (type 6), which the WebGL emitter reads with a
        // width-wrapped texelFetch on an ordinary 2D texture, so a 1x1 colour
        // is the right shape. The god ray shader ends with
        // `output *= texelFetch(FlareOcclusionBuffer, LensflareFxOccScale.y)`,
        // so 0 here multiplies god rays to black with nothing to attribute it
        // to. 1 means "unoccluded", which is also all we can honestly claim:
        // the real buffer is written by lensflareoccludert with atomic_iadd,
        // which has no WebGL2 lowering and no working ccpwgl equivalent.
        "FlareOcclusionBuffer": "dynamic:/color/1,1,1,1",

        // OcclusionFogWeight is deliberately absent. It reads like a texture
        // slot but Carbon registers it as a FLOAT, per-draw, inside
        // EveOccluder::RunQuery - and only lensflareoccludert consumes it.
        // Declaring it here as a path would give it the wrong type globally.

        // Custom
        "g_pixel_adjustment": [ 0.05, 1, 1, 1 ],
        "g_wreckShaderAdjustments": [ 1.1, 3.0, 0.1, 0 ],
        "g_banner": [
            1.0, // Brightness
            0.0,
            0.0,
            0.0
        ],
        "g_transparent_background": [ 0, 0.3, 0, 0 ],

        // Custom shader stuff - should delete
        "SelectorColor": [ 0.5, 0.25, 0.0, 1.0 ],
        
        
        "EveSpaceSceneDepthMap": "",
        "EveSpaceSceneNormalMap": "",

        // BLACK, and a 2D ARRAY rather than a plain colour. 47 shaders take
        // this as an autoregistered input - particles, stretch, boosters,
        // wormholes, atmosphere, plane glow, the ubershaders - and every one
        // of them declares it a `sampler2DArray`, so `dynamic:/color/` would
        // bind a 1x1 2D texture to an array sampler and fail the draw.
        //
        // Black is the absent value: Carbon's froxel sibling falls back to a
        // 1x1x1 black volume (Tr2VolumetricsRenderer::GetEmptyFogTexture)
        // rather than leaving the slot unbound. The real map is written by
        // Tr2VolumetricsRenderer, which we do not have - not by the
        // post-process fog effect.
        "EveSceneFogVolumeMap": "dynamic:/colorarray/0,0,0,0",

        // The froxel sibling of the above, and a THIRD target again: Carbon
        // declares it Texture3D (type 3). Only clipspherecloud and applyfroxels
        // read it. Same producer, same absence, same black.
        "EveSceneFroxelFogMap": "dynamic:/colorvolume/0,0,0,0",

        // Mie scattering environment for the same two volumetric shaders, and
        // a CUBE (type 4). Black is no scattering contribution.
        "EveSceneMieEnvironmentMap": "dynamic:/colorcube/0,0,0,0"
    }
};

