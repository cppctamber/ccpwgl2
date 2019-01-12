import {mat4, quat, vec3} from "../../../global";
import {Tw2BaseClass} from "../../../global";

/**
 * EveChildContainer
 * @implements ObjectChild
 *
 * @property {Array.<StateController>} controllers      -
 * @property {Array.<TriCurveSet>} curveSets            -
 * @property {Boolean} display                          -
 * @property {Boolean} hideOnLowQuality                 -
 * @property {Array.<Tr2PointLight>} lights             -
 * @property {mat4} localTransform                      -
 * @property {Array.<ObjectChild>} objects              -
 * @property {Array.<TriObserverLocal>} observers       -
 * @property {quat} rotation                            -
 * @property {vec3} scaling                             -
 * @property {Boolean} staticTransform                  -
 * @property {Array.<ChildModifier>} transformModifiers -
 * @property {vec3} translation                         -
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

