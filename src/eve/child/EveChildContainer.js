import {EveChild} from "./EveChild";
import {mat4, quat, vec3} from "../../global";

/**
 * Container for other child effects
 * TODO: Implement "controllers"
 * TODO: Implement "hideOnLowQuality"
 * TODO: Implement "lights"
 * TODO: Implement "observers"
 * TODO: Implement "staticTransform"
 * TODO: Implement "transformModifiers"
 *
 * @property {Array.<StateController>} controllers      -
 * @property {Array.<Tw2CurveSet>} curveSets            -
 * @property {Boolean} display                          -
 * @property {Boolean} hideOnLowQuality                 -
 * @property {Array.<Tr2PointLight>} lights             -
 * @property {mat4} localTransform                      -
 * @property {Array.<EveChild>} objects                 -
 * @property {Array.<TriObserverLocal>} observers       -
 * @property {quat} rotation                            -
 * @property {vec3} scaling                             -
 * @property {Boolean} staticTransform                  -
 * @property {Array.<ChildModifier>} transformModifiers -
 * @property {vec3} translation                         -
 * @property {mat4} _worldTransform                     -
 * @property {mat4} _worldTransformLast                 -
 */
export class EveChildContainer extends EveChild
{

    // ccp
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

    // ccpwgl
    _worldTransform = mat4.create();
    _worldTransformLast = mat4.create();


    /**
     * Per frame update
     * @param {number} dt
     * @param {mat4} parentTransform
     */
    Update(dt, parentTransform)
    {
        if (this.useSRT)
        {
            quat.normalize(this.rotation, this.rotation);
            mat4.fromRotationTranslationScale(this.localTransform, this.rotation, this.translation, this.scaling);
        }

        /*
        for (let i = 0; i < this.transformModifiers.length; i++)
        {
            this.transformModifiers.Update(dt, this.localTransform);
        }
        */

        mat4.copy(this._worldTransformLast, this._worldTransform);
        mat4.multiply(this._worldTransform, parentTransform, this.localTransform);

        for (let i = 0; i < this.curveSets.length; i++)
        {
            this.curveSets[i].Update(dt);
        }

        for (let i = 0; i < this.objects.length; i++)
        {
            this.objects[i].Update(dt, this._worldTransform);
        }

        /*
        for (let i = 0; i < this.lights.length; i++)
        {
            this.lights[i].Update(dt, this._worldTransform);
        }
        */
    }

    /**
     * Gets render batches
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     */
    GetBatches(mode, accumulator, perObjectData)
    {
        if (this.display)
        {
            for (let i = 0; i < this.objects.length; i++)
            {
                this.objects[i].GetBatches(mode, accumulator, perObjectData);
            }

            /*
            for (let i = 0; i < this.lights.length; i++)
            {
                this.lights[i].GetBatches(mode, accumulator, perObjectData);
            }
            */
        }
    }

}

EveChild.define(EveChildContainer, Type =>
{
    return {
        isStaging: true,
        type: "EveChildContainer",
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
        },
        notImplemented: [
            "controllers",
            "hideOnLowQuality",
            "lights",
            "observers",
            "staticTransform",
            "transformModifiers"
        ]
    };
});

