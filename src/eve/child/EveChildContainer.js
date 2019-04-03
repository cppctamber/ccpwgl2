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
 * @property {Array.<StateController>} controllers         -
 * @property {Array.<Tw2CurveSet>} curveSets               -
 * @property {Boolean} display                             -
 * @property {Boolean} hideOnLowQuality                    -
 * @property {EveChildInheritProperties} inheritProperties -
 * @property {Array.<Tr2PointLight>} lights                -
 * @property {mat4} localTransform                         -
 * @property {Array.<EveChild>} objects                    -
 * @property {Array.<TriObserverLocal>} observers          -
 * @property {quat} rotation                               -
 * @property {vec3} scaling                                -
 * @property {Boolean} staticTransform                     -
 * @property {Array.<ChildModifier>} transformModifiers    -
 * @property {vec3} translation                            -
 * @property {mat4} _worldTransform                        -
 * @property {mat4} _worldTransformLast                    -
 */
export class EveChildContainer extends EveChild
{

    controllers = [];
    curveSets = [];
    display = true;
    hideOnLowQuality = false;
    inheritProperties = null;
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

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["boneIndex", r.uint],
            ["controllers", r.array],
            ["display", r.boolean],
            ["localTransform", r.matrix],
            ["name", r.string],
            ["curveSets", r.array],
            ["hideOnLowQuality", r.boolean],
            ["inheritProperties", r.object],
            ["lights", r.array],
            ["observers", r.array],
            ["objects", r.array],
            ["rotation", r.vector4],
            ["scaling", r.vector3],
            ["staticTransform", r.boolean],
            ["transformModifiers", r.array],
            ["translation", r.vector3]
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     * @private
     */
    static __isStaging = 2;

}
