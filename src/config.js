import * as core from "./core";
import * as curve from "./curve";
import * as eve from "./eve";
import * as particle from "./particle";
import * as sof from "./sof";
import * as unsupported from "./unsupported";
import { PT } from "constant/type";
import * as MT from "global/meta/types";
import { DeviceTextureQuality, DeviceShaderQuality } from "constant/ccpwgl";
import { vec4, mat4 } from "math";
import { tw2BatchSorter } from "core/batch";

const typedArray = ctor => ({ type: MT.WglTypedArray, ctor });

/**
 * Register global configurations
 */
export const config = {


    // Enables library debugging
    debug: false,

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
            core.Tw2TextureRes.GetCapabilityProvider()
        ]

    },

    // The paths in the black files must be changed
    black: {

        // Normalize casing in .black-authored paths to match the lowercase
        // resfileindex keys. No prefix rewrite needed any more - everything
        // uses "res:/" directly now, "cdn:/" has been retired.
        "*": path => path.toLowerCase(),

        // Replace dds extension  with pngs
        "dds": path =>
        {
            const
                support = core.Tw2TextureRes.GetFormatSupport(),
                isSupported = support.dds && support.dds.supported;

            if (path.includes("_cube"))
            {
                const supportsBC6H = isSupported &&
                    support.dds.formats &&
                    support.dds.formats.bc6h &&
                    support.dds.formats.bc6h.declared;

                return supportsBC6H ? path : path.replace(".dds", ".qube");
            }

            return isSupported ? path : path.replace(".dds", ".png");

        },

        // PNG skyboxes are backed by legacy ".cube" image strips
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

        // Defines the default shader quality (DEPTH, HIGH or LOW)
        "shaderQuality": DeviceShaderQuality.HIGH,

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

        // Local resource server (not provided with this library)
        "res": "http://127.0.0.1:3000/",

    },

    extensions: {
        
        // Shader
        "sm_json": core.Tw2EffectRes,
        "sm_depth": core.Tw2EffectRes,
        "sm_hi": core.Tw2EffectRes,
        "sm_lo": core.Tw2EffectRes,
        "fx": core.Tw2EffectRes,
        "cewg": core.Tw2EffectRes, // CEWG packages (see Tw2EffectRes.PrepareCEWG) - same class, format detected by magic bytes

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
    },

    constructors: [
        core,
        curve,
        eve,
        particle,
        sof,
        unsupported
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
        // lit). The translated CEWG Main pixel shader multiplies the
        // entire direct-sun term (diffuse + specular) by this texel, so a
        // black default silently kills all sunlight and the hull is lit
        // only by the env cubemap ("melted brown" look). White matches
        // both the old hslswebgl adapter's forced per-effect fallback and
        // EveSpaceSceneShadowHandler's own resets ("rgba:/255,255,255,255").
        // Real file path (not "rgba:/...") so it resolves lazily through
        // the resource pipeline instead of eagerly creating a GL texture
        // at module-load time, before device.gl exists.
        "EveSpaceSceneShadowMap": "res:/texture/global/white.png",
        "EveSpaceSceneCascadedShadowMap": "",

        // CEWG per-effect SSAO map has no producer yet; default to the
        // same real white texture EveSpaceScene.GetEmptyTexture() style
        // code already relies on (no occlusion), lazily resolved.
        "SSAOMap": "res:/texture/global/white.png",

        "EnvMap1": "",
        "EnvMap2": "",
        "EnvMap3": "",
        "ShadowLightness": 0,
        "OccluderValue": [ 1, 1, 0, 0 ],
        "LensflareFxOccScale": [ 1, 1, 0, 0 ],
        "LensflareFxDirectionScale": [ 0, 0, 0, 0 ],

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
        "EveSpaceSceneDepthMap": "",
        "EveSpaceSceneNormalMap": "",
        "SelectorColor": [ 0.5, 0.25, 0.0, 1.0 ]
    }
};

