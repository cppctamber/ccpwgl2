import { EveChild } from "./EveChild";
import { meta } from "utils";
import { mat4, quat, vec3 } from "math";


@meta.type("EveChildContainer", true)
@meta.stage(2)
export class EveChildContainer extends EveChild
{

    @meta.string
    name = "";

    @meta.notImplemented
    @meta.boolean
    alwaysOn = false;

    @meta.uint
    boneIndex = -1;

    @meta.notImplemented
    @meta.list("Tr2Controller")
    controllers = [];

    @meta.list("Tw2CurveSet")
    curveSets = [];

    @meta.boolean
    display = true;

    @meta.notImplemented
    @meta.struct()
    displayFilter = null;

    @meta.notImplemented
    @meta.boolean
    hideOnLowQuality = false;

    @meta.notImplemented
    @meta.struct("EveChildInheritProperties")
    inheritProperties = null;

    @meta.notImplemented
    @meta.list("Tr2PointLight")
    lights = [];

    @meta.matrix4
    localTransform = mat4.create();

    @meta.list("EveChild")
    objects = [];

    @meta.notImplemented
    @meta.list("TriObserverLocal")
    observers = [];

    @meta.quaternion
    rotation = quat.create();

    @meta.vector3
    scaling = vec3.fromValues(1, 1, 1);

    @meta.notImplemented
    @meta.boolean
    staticTransform = false;

    @meta.notImplemented
    @meta.list("EveChildModifier")
    transformModifiers = [];

    @meta.vector3
    translation = vec3.create();

    @meta.boolean
    useSRT = true;


    _worldTransform = mat4.create();
    //_worldTransformLast = mat4.create();

    /**
     * Resets lod
     */
    ResetLod()
    {
        this._lod = 3;

        for (let i = 0; i < this.objects.length; i++)
        {
            this.objects[i].ResetLod();
        }
    }

    /**
     * Updates lod
     * @param {Tw2Frustum} frustum
     * @param {Number} parentLod
     */
    UpdateLod(frustum, parentLod)
    {
        this._lod = parentLod;

        for (let i = 0; i < this.objects.length; i++)
        {
            this.objects[i].UpdateLod(frustum, this._lod);
        }
    }

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
     * @param {Tw2PerObjectData} perObjectData
     */
    Update(dt, parentTransform, perObjectData)
    {
        if (this.useSRT)
        {
            mat4.fromRotationTranslationScale(this.localTransform, this.rotation, this.translation, this.scaling);
        }
        // TODO: Figure out how this should work
        if (this.transformModifiers.length)
        {
            for (let i = 0; i < this.transformModifiers.length; i++)
            {
                if ("Modify" in this.transformModifiers[i])
                {
                    this.transformModifiers[i].Modify(this, perObjectData);
                }
            }
        }

        // Not used
        //mat4.copy(this._worldTransformLast, this._worldTransform);

        // Are there still bone indexes directly on the container??
        if (this.boneIndex > -1)
        {
            const { mat4_0 } = EveChild.global;
            const bones = perObjectData.Get("JointMat");
            mat4.fromJointMatIndex(mat4_0, bones, this.boneIndex);
            mat4.multiply(mat4_0, mat4_0, this.localTransform);
            mat4.multiply(this._worldTransform, parentTransform, mat4_0);
        }
        else
        {
            mat4.multiply(this._worldTransform, parentTransform, this.localTransform);
        }


        for (let i = 0; i < this.curveSets.length; i++)
        {
            this.curveSets[i].Update(dt);
        }

        for (let i = 0; i < this.objects.length; i++)
        {
            this.objects[i].Update(dt, this._worldTransform, perObjectData);
        }

        /*
        for (let i = 0; i < this.lights.length; i++)
        {
            this.lights[i].Update(dt, this._worldTransform, perObjectData);
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
