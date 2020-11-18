import * as core from "./core";
import * as curve from "./curve";
import * as eve from "./eve";
import * as particle from "./particle";
import * as sof from "./sof";
import * as unsupported from "./unsupported";

import { vec4, mat4 } from "math";


/****************** TEMPORARY *************************/

// TODO: Fix .dds files we know cause issues
const Rerouted = [
    "cdn:/texture/global/noise.dds",
    "cdn:/texture/global/spotramp.dds",
    "cdn:/texture/global/whitesharp.dds",
    "cdn:/texture/particle/whitesharp.dds",
];

/****************** TEMPORARY *************************/


/**
 * Register global configurations
 */
export const config = {

    debug: false,

    // The paths in the black files must be changed
    black: {
        "*":  path => path.replace("res:/", "cdn:/").toLowerCase(),
        "dds": path => Rerouted.includes(path) ? path.replace("cdn:/", "res:/") + ".0.png" : path,
        "gr2": path => path.replace(".gr2", ".cake")
    },

    device: {
        "textureQuality": 0,
        "shaderQuality": "hi",
        "antialiasing": true,
        "anisotropicFiltering": true,
        "webgl2": true,
        "webvr": false,
        "performanceClock": true
    },

    resMan: {
        "systemMirror": false,
        "autoPurgeResources": true,
        "purgeTime": 60,
        "maxPrepareTime": 0.05,
        "maxWatchedFramed" : 500,
        "maxWatchedCount" : 10,
        "maxWatchTime" : 0.05
    },

    logger: {
        "name": "CCPWGL2",
        "history": 50,
        "throttle": 10,
        "display": true,
        "visible": {
            "error": true,
            "warning": false,
            "log": false,
            "info": false,
            "debug": false
        }
    },

    store: {

        paths: {
            "res": "https://developers.eveonline.com/ccpwgl/assetpath/1097993/",
            "cdn": "http://localhost:3000/"
        },

        extensions: {
            "sm_json": core.Tw2EffectRes,
            "sm_hi": core.Tw2EffectRes,
            "sm_lo": core.Tw2EffectRes,
            "fx" : core.Tw2EffectRes,
            "wbg": core.Tw2GeometryRes,
            "cake": core.Tw2GeometryRes,
            "png": core.Tw2TextureRes,
            "dds": core.Tw2TextureRes,
            "cube": core.Tw2TextureRes,
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
            "EnvMap1": "",
            "EnvMap2": "",
            "EnvMap3": "",
            "ShadowLightness": 0,
            "OccluderValue": vec4.fromValues(1, 1, 0, 0),
            "LensflareFxOccScale": vec4.fromValues(1, 1, 0, 0),
            "LensflareFxDirectionScale": vec4.create()
        }
    }

};
