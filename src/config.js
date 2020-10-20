import * as core from "./core";
import * as curve from "./curve";
import * as eve from "./eve";
import * as particle from "./particle";
import * as sof from "./sof";
import * as unsupported from "./unsupported";

import { path } from "./core/reader/Tw2BlackPropertyReaders";
import { vec4, mat4 } from "math";

/**
 * Black property path  handler
 * @param {String} filepath
 * @returns {String}
 */
path.handler = function(filepath)
{
    filepath = filepath.toLowerCase();

    // Because there are two sources for "res:" now we need to replace
    // any references from the eve cdn with a new res path mapping

    let ext = "";
    const dot = filepath.lastIndexOf(".");
    if (dot !== -1) ext = filepath.substr(dot + 1).toLowerCase();

    if (filepath in remapTextures)
    {
        filepath = remapTextures[filepath];
    }
    else
    {
        filepath = filepath.replace("res:", "cdn:");

        if (filepath.includes(".gr2"))
        {
            filepath = filepath.replace("gr2", "cake");
        }
    }

    return filepath;
};


const remapTextures = {
    "res:/texture/global/noise.dds": "res:/texture/global/noise.dds.0.png",
    "res:/texture/global/spotramp.dds": "res:/texture/global/spotramp.dds.0.png",
    "res:/texture/global/whitesharp.dds": "res:/texture/particle/whitesharp.dds.0.png",
    "res:/texture/particle/whitesharp.dds": "res:/texture/particle/whitesharp.dds.0.png",
    "res:/dx9/texture/decal/deck_01_cube.dds": "cdn:/dx9/texture/decal/deck_01_cube.dds.0.png"
};

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

        paths: {
            "res": "https://developers.eveonline.com/ccpwgl/assetpath/1097993/",
            "cdn": "http://localhost:3000"
        },

        extensions: {
            "sm_hi": core.Tw2EffectRes,
            "sm_lo": core.Tw2EffectRes,
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
