import { EveChild } from "./EveChild";
import { mat4, meta, quat, vec3 } from "global";


@meta.type("EveChildContainer", true)
@meta.stage(2)
export class EveChildContainer extends EveChild
{

    @meta.black.string
    name = "";

    @meta.notImplemented
    @meta.black.boolean
    alwaysOn = false;

    @meta.black.uint
    boneIndex = -1;

    @meta.notImplemented
    @meta.black.listOf("Tr2Controller")
    controllers = [];

    @meta.black.listOf("Tw2CurveSet")
    curveSets = [];

    @meta.black.boolean
    display = true;

    @meta.notImplemented
    @meta.black.object
    displayFilter = null;

    @meta.notImplemented
    @meta.black.boolean
    hideOnLowQuality = false;

    @meta.notImplemented
    @meta.black.objectOf("EveChildInheritProperties")
    inheritProperties = null;

    @meta.notImplemented
    @meta.black.listOf("Tr2PointLight")
    lights = [];

    @meta.black.matrix4
    localTransform = mat4.create();

    @meta.black.listOf("EveChild")
    objects = [];

    @meta.notImplemented
    @meta.black.listOf("TriObserverLocal")
    observers = [];

    @meta.black.quaternion
    rotation = quat.create();

    @meta.black.vector3
    scaling = vec3.fromValues(1, 1, 1);

    @meta.notImplemented
    @meta.black.boolean
    staticTransform = false;

    @meta.notImplemented
    @meta.black.listOf("EveChildModifier")
    transformModifiers = [];

    @meta.black.vector3
    translation = vec3.create();

    @meta.boolean
    useSRT = true;


    _worldTransform = mat4.create();
    _worldTransformLast = mat4.create();


    /**
     * Gets object resources
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2Resource>} [out]
     */
    GetResources(out = [])
    {
        for (let i = 0; i < this.objects.length; i++)
        {
            this.objects[i].GetResources(out);
        }
        return out;
    }

    /**
     * Per frame update
     * @param {number} dt
     * @param {mat4} parentTransform
     */
    Update(dt, parentTransform)
    {
        if (this.useSRT)
        {
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
