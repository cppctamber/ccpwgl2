import {quat, vec3, vec4} from "../../../global";
import {Tw2BaseClass} from "../../class";

/**
 * EveEffectRoot2
 *
 * @parameter {vec3} boundingSphereCenter            -
 * @parameter {Number} boundingSphereRadius          -
 * @parameter {Array.<TriCurveSet>} curveSets        -
 * @parameter {Number} duration                      -
 * @parameter {Boolean} dynamicLOD                   -
 * @parameter {Array.<ObjectChild>} effectChildren   -
 * @parameter {Array.<Tr2PointLight>} lights         -
 * @parameter {Array} observers                      -
 * @parameter {quat} rotation                        -
 * @parameter {vec3} scaling                         -
 * @parameter {vec4} secondaryLightingEmissiveColor  -
 * @parameter {Number} secondaryLightingSphereRadius -
 * @parameter {vec3} translation                     -
 */
export default class EveEffectRoot2 extends Tw2BaseClass
{

    boundingSphereCenter = vec3.create();
    boundingSphereRadius = 0;
    curveSets = [];
    duration = 0;
    dynamicLOD = false;
    effectChildren = [];
    lights = [];
    observers = [];
    rotation = quat.create();
    scaling = vec3.fromValues(1, 1, 1);
    secondaryLightingEmissiveColor = vec4.create();
    secondaryLightingSphereRadius = 0;
    translation = vec3.create();

}

Tw2BaseClass.define(EveEffectRoot2, Type =>
{
    return {
        isStaging: true,
        type: "EveEffectRoot2",
        props: {
            boundingSphereCenter: Type.VECTOR3,
            boundingSphereRadius: Type.NUMBER,
            curveSets: [["TriCurveSet"]],
            duration: Type.NUMBER,
            dynamicLOD: Type.BOOLEAN,
            effectChildren: Type.ARRAY,
            lights: [["Tr2PointLight"]],
            observers: Type.ARRAY,
            rotation: Type.TR_ROTATION,
            scaling: Type.TR_SCALING,
            secondaryLightingEmissiveColor: Type.RGBA_LINEAR,
            secondaryLightingSphereRadius: Type.NUMBER,
            translation: Type.TR_TRANSLATION
        }
    };
});

