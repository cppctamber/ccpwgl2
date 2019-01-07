import {mat4, quat, vec3} from "../../../global";
import {Tw2StagingClass} from "../../class";

/**
 * EveChildContainer
 * @implements ObjectChild
 *
 * @parameter {Array.<StateController>} controllers      -
 * @parameter {Array.<Tw2CurveSet>} curveSets            -
 * @parameter {Boolean} display                          -
 * @parameter {Boolean} hideOnLowQuality                 -
 * @parameter {Array.<Tw2PointLight>} lights             -
 * @parameter {mat4} localTransform                      -
 * @parameter {Array.<ObjectChild>} objects              -
 * @parameter {Array.<Tw2ObserverLocal>} observers       -
 * @parameter {quat} rotation                            -
 * @parameter {vec3} scaling                             -
 * @parameter {Boolean} staticTransform                  -
 * @parameter {Array.<ChildModifier>} transformModifiers -
 * @parameter {vec3} translation                         -
 */
export default class EveChildContainer extends Tw2StagingClass
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

Tw2StagingClass.define(EveChildContainer, Type =>
{
    return {
        type: "EveChildContainer",
        category: "ObjectChild",
        props: {
            controllers: [["Tw2Controller"]],
            curveSets: [["Tw2CurveSet"]],
            display: Type.BOOLEAN,
            hideOnLowQuality: Type.BOOLEAN,
            lights: [["Tw2PointLight"]],
            localTransform: Type.TR_LOCAL,
            objects: [["EveChildContainer", "EveChildMesh", "EveChildParticleSphere", "EveChildParticleSystem", "EveChildQuad"]],
            observers: [["Tw2ObserverLocal"]],
            rotation: Type.TR_ROTATION,
            scaling: Type.TR_SCALING,
            staticTransform: Type.BOOLEAN,
            transformModifiers: [["EveChildModifierAttachToBone", "EveChildModifierBillboard2D", "EveChildModifierBillboard3D", "EveChildModifierSRT", "EveChildModifierTranslateWithCamera"]],
            translation: Type.TR_TRANSLATION
        }
    };
});

