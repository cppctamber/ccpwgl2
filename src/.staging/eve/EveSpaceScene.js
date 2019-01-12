import {quat, vec3, vec4} from "../../global";
import {Tw2BaseClass} from "../../global";

/**
 * EveSpaceScene
 *
 * @property {vec4} ambientColor                                                     -
 * @property {Tr2Effect} backgroundEffect                                            -
 * @property {Array.<EveObject>} backgroundObjects                                   -
 * @property {Boolean} backgroundRenderingEnabled                                    -
 * @property {Array.<TriCurveSet>} curveSets                                         -
 * @property {Boolean} enableShadows                                                 -
 * @property {String} envMap1ResPath                                                 -
 * @property {String} envMap2ResPath                                                 -
 * @property {String} envMapResPath                                                  -
 * @property {quat} envMapRotation                                                   -
 * @property {Array.<Parameter>} externalParameters                                  -
 * @property {vec4} fogColor                                                         -
 * @property {Number} fogEnd                                                         -
 * @property {Number} fogMax                                                         -
 * @property {Number} fogStart                                                       -
 * @property {Number} nebulaIntensity                                                -
 * @property {Array.<EveEffectRoot2|EveRootTransform|EveObject|EveStation2>} objects -
 * @property {String} postProcessPath                                                -
 * @property {Boolean} selfShadowOnly                                                -
 * @property {Tr2ShLightingManager} shLightingManager                                -
 * @property {Number} shadowFadeThreshold                                            -
 * @property {Number} shadowThreshold                                                -
 * @property {EveStarfield} starfield                                                -
 * @property {vec4} sunDiffuseColor                                                  -
 * @property {vec4} sunDiffuseColorWithDynamicLights                                 -
 * @property {vec3} sunDirection                                                     -
 * @property {Boolean} useSunDiffuseColorWithDynamicLights                           -
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

