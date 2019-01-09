import {quat, vec3, vec4} from "../../global";
import {Tw2BaseClass} from "../class";

/**
 * EveSpaceScene
 *
 * @parameter {vec4} ambientColor                                                     -
 * @parameter {Tr2Effect} backgroundEffect                                            -
 * @parameter {Array.<EveObject>} backgroundObjects                                   -
 * @parameter {Boolean} backgroundRenderingEnabled                                    -
 * @parameter {Array.<TriCurveSet>} curveSets                                         -
 * @parameter {Boolean} enableShadows                                                 -
 * @parameter {String} envMap1ResPath                                                 -
 * @parameter {String} envMap2ResPath                                                 -
 * @parameter {String} envMapResPath                                                  -
 * @parameter {quat} envMapRotation                                                   -
 * @parameter {Array.<Parameter>} externalParameters                                  -
 * @parameter {vec4} fogColor                                                         -
 * @parameter {Number} fogEnd                                                         -
 * @parameter {Number} fogMax                                                         -
 * @parameter {Number} fogStart                                                       -
 * @parameter {Number} nebulaIntensity                                                -
 * @parameter {Array.<EveEffectRoot2|EveRootTransform|EveObject|EveStation2>} objects -
 * @parameter {String} postProcessPath                                                -
 * @parameter {Boolean} selfShadowOnly                                                -
 * @parameter {Tr2ShLightingManager} shLightingManager                                -
 * @parameter {Number} shadowFadeThreshold                                            -
 * @parameter {Number} shadowThreshold                                                -
 * @parameter {EveStarfield} starfield                                                -
 * @parameter {vec4} sunDiffuseColor                                                  -
 * @parameter {vec4} sunDiffuseColorWithDynamicLights                                 -
 * @parameter {vec3} sunDirection                                                     -
 * @parameter {Boolean} useSunDiffuseColorWithDynamicLights                           -
 */
export default class EveSpaceScene extends Tw2BaseClass
{

    ambientColor = vec4.create();
    backgroundEffect = null;
    backgroundObjects = [];
    backgroundRenderingEnabled = false;
    curveSets = [];
    enableShadows = false;
    envMap1ResPath = "";
    envMap2ResPath = "";
    envMapResPath = "";
    envMapRotation = quat.create();
    externalParameters = [];
    fogColor = vec4.create();
    fogEnd = 0;
    fogMax = 0;
    fogStart = 0;
    nebulaIntensity = 0;
    objects = [];
    postProcessPath = "";
    selfShadowOnly = false;
    shLightingManager = null;
    shadowFadeThreshold = 0;
    shadowThreshold = 0;
    starfield = null;
    sunDiffuseColor = vec4.create();
    sunDiffuseColorWithDynamicLights = vec4.create();
    sunDirection = vec3.create();
    useSunDiffuseColorWithDynamicLights = false;

}

Tw2BaseClass.define(EveSpaceScene, Type =>
{
    return {
        isStaging: true,
        type: "EveSpaceScene",
        props: {
            ambientColor: Type.RGBA_LINEAR,
            backgroundEffect: ["Tr2Effect"],
            backgroundObjects: [["EveTransform"]],
            backgroundRenderingEnabled: Type.BOOLEAN,
            curveSets: [["TriCurveSet"]],
            enableShadows: Type.BOOLEAN,
            envMap1ResPath: Type.PATH,
            envMap2ResPath: Type.PATH,
            envMapResPath: Type.PATH,
            envMapRotation: Type.TR_ROTATION,
            externalParameters: [["Tr2ExternalParameter"]],
            fogColor: Type.RGBA_LINEAR,
            fogEnd: Type.NUMBER,
            fogMax: Type.NUMBER,
            fogStart: Type.NUMBER,
            nebulaIntensity: Type.NUMBER,
            objects: [["EveEffectRoot2", "EveRootTransform", "EveShip2", "EveStation2", "EveTransform"]],
            postProcessPath: Type.PATH,
            selfShadowOnly: Type.BOOLEAN,
            shLightingManager: ["Tr2ShLightingManager"],
            shadowFadeThreshold: Type.NUMBER,
            shadowThreshold: Type.NUMBER,
            starfield: ["EveStarfield"],
            sunDiffuseColor: Type.RGBA_LINEAR,
            sunDiffuseColorWithDynamicLights: Type.RGBA_LINEAR,
            sunDirection: Type.VECTOR3,
            useSunDiffuseColorWithDynamicLights: Type.BOOLEAN
        }
    };
});

