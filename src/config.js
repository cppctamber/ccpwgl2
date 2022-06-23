import * as core from "./core";
import * as curve from "./curve";
import * as eve from "./eve";
import * as particle from "./particle";
import * as sof from "./sof";
import * as unsupported from "./unsupported";
import { DeviceTextureQuality, DeviceShaderQuality } from "constant/ccpwgl";

import { vec4, mat4 } from "math";


/****************** TEMPORARY *************************/

// TODO: Fix .dds files we know cause issues
const Rerouted = [
    "cdn:/texture/global/noise.dds",
    "cdn:/texture/global/spotramp.dds",
    "cdn:/texture/global/whitesharp.dds",
    "cdn:/texture/particle/whitesharp.dds",
    "cdn:/dx9/scene/starfield/stars01_tile2.dds"
];


/****************** TEMPORARY *************************/

/**
 * Register global configurations
 */
export const config = {

    // Enables library debugging
    debug: false,

    // The paths in the black files must be changed
    black: {

        // Exchange "res" prefix in .black files with "cdn" so there are no conflicts with ccpwgl paths
        "*": path => path.replace("res:/", "cdn:/").toLowerCase(),

        "dds": path =>
        {
            /*
            // Use old ccpwgl resource paths when we know a resource provided in a .black file doesn't work
            if (Rerouted.includes(path))
            {
                return path.replace("cdn:/", "res:/") + ".0.png";
            }
            // Handle cube maps that we can't load yet
            else if (path.split(".").pop() === "dds" && path.includes("_cube"))
            {
                return path.replace(".dds", ".qube");
            }
            return path;
             */

            if (path.split(".").pop() === "dds" && path.includes("_cube"))
            {
                return path.replace(".dds", ".qube");
            }

            //return path.replace("cdn:/", "test:/").replace("res:/", "rest:/");
            return path.replace(".dds", ".png");
        },

        // Replace .gr2 paths with interim .cake format (new sof will try to fall back to wbg if not found)
        // Cake format doesn't support any animations
        "gr2": path => path.replace(".gr2", ".gr2_json"),

        // Replace all .red files provided in .black files as they are actually .black files
        "red": path => path.replace(".red", ".black")

    },

    // Sets the default webgl context parameters
    "glParams": {

        // If the value is true, the drawing buffer has an alpha channel for the purposes of performing OpenGL
        // destination alpha operations and compositing with the page. If the value is false,
        // no alpha buffer is available.
        // - Disabled by default due to issues with artifacts in ccpwgl
        alpha: false,

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
        preserveDrawingBuffer: false,

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
        descynchronized : false

    },

    device: {

        // Defines the default texture quality (HIGH, MEDIUM, LOW) - Doesn't work with CDN resources yet
        "textureQuality": DeviceTextureQuality.HIGH,

        // Defines the default shader quality (HIGH or LOW)
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
        "systemMirror": false,

        // Enables auto purging of resources that aren't used
        // If set to false resources must be manually removed when no longer required
        "autoPurgeResources": false,

        // The amount of time to wait before purging an unused resource
        "purgeTime": 60,

        // The maximum time for preparing resources per frame
        "maxPrepareTime": 0.05,

        // Objects who have child resources can be optionally watched to monitor their load progress
        // The max frames an object can be watched for, before it is forced to resolve
        "maxWatchedFramed": 500,

        // The maximum objects to watch per frame
        "maxWatchedCount": 10,

        // The maximum time to monitor watched objects
        "maxWatchTime": 0.05

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
            "warning": false,
            "log": false,
            "info": false,
            "debug": false
        }

    },

    paths: {

        // The last ccpwgl path to be updated by ccp
        "res": "https://developers.eveonline.com/ccpwgl/assetpath/1097993/",

        // Local resource server (not provided with this library)
        "cdn": "http://localhost:3000/",

        //"test": "http://localhost:8080/builds/2021621/res/"

    },

    extensions: {
        "sm_json": core.Tw2EffectRes,
        "sm_depth": core.Tw2EffectRes,
        "sm_hi": core.Tw2EffectRes,
        "sm_lo": core.Tw2EffectRes,
        "fx": core.Tw2EffectRes,
        "gr2_json" : core.Tw2GeometryRes,
        "wbg": core.Tw2GeometryRes,
        "cake": core.Tw2GeometryRes,
        "obj": core.Tw2GeometryRes,
        "png": core.Tw2TextureRes,
        "dds": core.Tw2TextureRes,
        "cube": core.Tw2TextureRes,
        "qube": core.Tw2TextureRes,
        "mp4": core.Tw2VideoRes,
        "ogg": core.Tw2VideoRes,
        "webm": core.Tw2VideoRes,
        "black": core.Tw2LoadingObject,
        "red": core.Tw2LoadingObject
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
        "EveSpaceSceneShadowMap": "",
        "EveSpaceSceneDepthMap" : "",           // Custom
        "EnvMap1": "",
        "EnvMap2": "",
        "EnvMap3": "",
        "ShadowLightness": 0,
        "OccluderValue": vec4.fromValues(1, 1, 0, 0),
        "LensflareFxOccScale": vec4.fromValues(1, 1, 0, 0),
        "LensflareFxDirectionScale": vec4.create(),
    }
};
