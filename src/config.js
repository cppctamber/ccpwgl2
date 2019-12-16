import * as core from "./core";
import * as curve from "./curve";
import * as eve from "./eve";
import * as particle from "./particle";
import * as sof from "./sof";
import * as unsupported from "./unsupported";
import { Tw2EventEmitter, Tw2Notifications } from "./global/class";

import { vec4, mat4 } from "./global/math";

/**
 * Register global configurations
 */
export const config = {

    debug: false,

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
        "maxPrepareTime": 0.05
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

        path: {
            "res": "https://developers.eveonline.com/ccpwgl/assetpath/1097993/",
            // Set to you local cdn cache server path
            "cdn": "http://localhost:3000/"
        },

        extension: {
            "sm_hi": core.Tw2EffectRes,
            "sm_lo": core.Tw2EffectRes,
            "wbg": core.Tw2GeometryRes,
            "png": core.Tw2TextureRes,
            "dds": core.Tw2TextureRes,
            "cube": core.Tw2TextureRes,
            "mp4": core.Tw2VideoRes,
            "ogg": core.Tw2VideoRes,
            "webm": core.Tw2VideoRes,
            "black": core.Tw2LoadingObject,
            "red": core.Tw2LoadingObject
        },

        class: [
            core,
            curve,
            eve,
            particle,
            sof,
            unsupported,
            { Tw2EventEmitter, Tw2Notifications }
        ],

        type: {
            "float": core.Tw2FloatParameter,
            "number": core.Tw2FloatParameter,
            "texture": core.Tw2TextureParameter,
            "vector2": core.Tw2Vector2Parameter,
            "vector3": core.Tw2Vector3Parameter,
            "vector4": core.Tw2Vector4Parameter,
            "matrix4": core.Tw2Matrix4Parameter
        },

        variable: {
            "WorldMat": mat4.create(),
            "ViewMat": mat4.create(),
            "ProjectionMat": mat4.create(),
            "ViewProjectionMat": mat4.create(),
            "ViewportSize": vec4.create(),
            "Time": vec4.create(),
            "u_DecalMatrix": mat4.create(),
            "u_InvDecalMatrix": mat4.create(),
            "EveSpaceSceneEnvMap": "",
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
