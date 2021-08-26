import { meta } from "utils";
import { vec3, quat, mat4, sph3, box3 } from "math";
import { Tw2PerObjectData } from "core";
import { EveObject } from "./EveObject";
import { EveSpaceObject } from "./EveSpaceObject";


@meta.type("EveEffectRoot")
@meta.todo("Implement LOD")
export class EveEffectRoot extends EveObject
{

    @meta.list("Tw2CurveSet")
    curveSets = [];

    @meta.list("EveMeshOverlayEffect")
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
    _boundsDirty = true;
    _boundingSphere = null;
    _boundingBox = null;

    /**
     * Rebuild bounds
     * TODO: Recalculate bounds from children
     * @param {boolean} force
     */
    RebuildBounds(force)
    {
        super.RebuildBounds(force);

        if (force || this._boundsDirty)
        {
            // TODO: Recalculate from children
            sph3.fromPositionRadius(this._boundingSphere, this.boundingSphereCenter, this.boundingSphereRadius);
            box3.fromSph3(this._boundingBox, this._boundingSphere);
            this._boundsDirty = false;
        }
    }

    /**
     * Sets children lod
     * @param {Number} lod
     */
    SetChildrenLod(lod)
    {
        for (let i = 0; i < this.effectChildren.length; i++)
        {
            if (this.effectChildren[i].SetLod)
            {
                this.effectChildren[i].SetLod(lod);
            }
        }
    }

    /**
     * Resets Lod
     */
    ResetLod()
    {
        this._lod = 3;

        for (let i = 0; i < this.children.length; i++)
        {
            if (this.children[i].ResetLod)
            {
                this.children[i].ResetLod();
            }
        }
    }

    /**
     * Updates lod
     * @param {Tw2Frustum} frustum
     */
    UpdateLod(frustum)
    {
        this._lod = 3;

        for (let i = 0; i < this.children.length; i++)
        {
            if (this.children[i].UpdateLod)
            {
                this.children[i].UpdateLod(frustum, this._lod);
            }
        }
    }

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
     * Gets the object's transform
     * @param {mat4} out
     * @returns {mat4} out
     */
    GetTransform(out)
    {
        return mat4.copy(out, this.localTransform);
    }

    /**
     * Gets the object's world transform
     * @param {mat4} out
     * @returns {mat4} out
     */
    GetWorldTransform(out)
    {
        return mat4.copy(out, this._worldTransform);
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
