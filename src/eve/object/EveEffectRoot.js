import { meta, vec3, quat, mat4 } from "global";
import { Tw2PerObjectData } from "core";
import { EveObject } from "./EveObject";
import { EveSpaceObject } from "./EveSpaceObject";


@meta.type("EveEffectRoot", true)
@meta.todo("Implement LOD")
export class EveEffectRoot extends EveObject
{

    @meta.listOf("Tw2CurveSet")
    curveSets = [];

    @meta.listOf("EveMeshOverlayEffect")
    effectChildren = [];

    @meta.float
    duration = 0;

    @meta.vector3
    scaling = vec3.fromValues(1, 1, 1);

    @meta.quaternion
    rotation = quat.create();

    @meta.vector3
    translation = vec3.create();

    @meta.matrix4
    @meta.isPrivate
    localTransform = mat4.create();

    @meta.vector3
    @meta.isPrivate
    boundingSphereCenter = vec3.create();

    @meta.float
    @meta.isPrivate
    boundingSphereRadius = 0;


    _worldTransform = mat4.create();
    _perObjectData = Tw2PerObjectData.from(EveSpaceObject.perObjectData);


    /**
     * Sets the object's local transform
     * @param {mat4} m
     */
    SetTransform(m)
    {
        mat4.getRotation(this.rotation, m);
        mat4.getScaling(this.scaling, m);
        mat4.getTranslation(this.translation, m);
    }

    /**
     * Gets effect root res objects
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2EffectRes|Tw2TextureRes>} [out]
     */
    GetResources(out = [])
    {
        for (let i = 0; i < this.effectChildren.length; ++i)
        {
            this.effectChildren[i].GetResources(out);
        }
        return out;
    }

    /**
     * Starts playing the effectRoot's curveSets if they exist
     */
    Start()
    {
        for (let i = 0; i < this.curveSets.length; ++i)
        {
            this.curveSets[i].Play();
        }
    }

    /**
     * Stops the effectRoot's curveSets from playing
     */
    Stop()
    {
        for (let i = 0; i < this.curveSets.length; ++i)
        {
            this.curveSets[i].Stop();
        }
    }

    /**
     * Internal per frame update
     * @param {undefined|mat4} parentTransform
     */
    UpdateViewDependentData(parentTransform)
    {
        mat4.fromRotationTranslationScale(this.localTransform, this.rotation, this.translation, this.scaling);

        if (parentTransform)
        {
            mat4.multiply(this._worldTransform, parentTransform, this.localTransform);
        }
        else
        {
            mat4.copy(this._worldTransform, this.localTransform);
        }
    }

    /**
     * Internal per frame update
     * @param {number} dt - Delta Time
     */
    Update(dt)
    {
        for (let i = 0; i < this.curveSets.length; ++i)
        {
            this.curveSets[i].Update(dt);
        }

        for (let i = 0; i < this.effectChildren.length; ++i)
        {
            this.effectChildren[i].Update(dt, this._worldTransform);
        }
    }

    /**
     * Gets render batches
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     */
    GetBatches(mode, accumulator)
    {
        if (!this.display) return;

        for (let i = 0; i < this.effectChildren.length; ++i)
        {
            this.effectChildren[i].GetBatches(mode, accumulator, this._perObjectData);
        }
    }

}
