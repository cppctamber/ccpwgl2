import {mat4, quat, vec3} from "../../../global";
import {Tw2BaseClass} from "../../class";

/**
 * EveChildContainer
 * @implements ObjectChild
 *
 * @parameter {Array.<StateController>} controllers      -
 * @parameter {Array.<TriCurveSet>} curveSets            -
 * @parameter {Boolean} display                          -
 * @parameter {Boolean} hideOnLowQuality                 -
 * @parameter {Array.<Tr2PointLight>} lights             -
 * @parameter {mat4} localTransform                      -
 * @parameter {Array.<ObjectChild>} objects              -
 * @parameter {Array.<TriObserverLocal>} observers       -
 * @parameter {quat} rotation                            -
 * @parameter {vec3} scaling                             -
 * @parameter {Boolean} staticTransform                  -
 * @parameter {Array.<ChildModifier>} transformModifiers -
 * @parameter {vec3} translation                         -
 */
export default class EveChildContainer extends Tw2BaseClass
{

    controllers = [];
    curveSets = [];
    display = false;
    hideOnLowQuality = false;
    lights = [];
    localTransform = mat4.create();
    objects = [];
    observers = [];
    rotation = quat.create();
    scaling = vec3.fromValues(1, 1, 1);
    staticTransform = false;
    transformModifiers = [];
    translation = vec3.create();

}

Tw2BaseClass.define(EveChildContainer, Type =>
{
    return {
        isStaging: true,
        type: "EveChildContainer",
        category: "ObjectChild",
        props: {
            controllers: [["Tr2Controller"]],
            curveSets: [["TriCurveSet"]],
            display: Type.BOOLEAN,
            hideOnLowQuality: Type.BOOLEAN,
            lights: [["Tr2PointLight"]],
            localTransform: Type.TR_LOCAL,
            objects: [["EveChildContainer", "EveChildMesh", "EveChildParticleSphere", "EveChildParticleSystem", "EveChildQuad"]],
            observers: [["TriObserverLocal"]],
            rotation: Type.TR_ROTATION,
            scaling: Type.TR_SCALING,
            staticTransform: Type.BOOLEAN,
            transformModifiers: [["EveChildModifierAttachToBone", "EveChildModifierBillboard2D", "EveChildModifierBillboard3D", "EveChildModifierSRT", "EveChildModifierTranslateWithCamera"]],
            translation: Type.TR_TRANSLATION
        }
    };
});

