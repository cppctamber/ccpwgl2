import { meta } from "utils";
import { vec3, quat, mat4, sph3, box3 } from "math";
import { Tw2PerObjectData } from "core";
import { EveObject } from "./EveObject";


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

    /**
     * Alias for _localTransform
     * @returns {mat4}
     */
    @meta.matrix4
    @meta.isPrivate
    get localTransform()
    {
        return this._localTransform;
    }

    set localTransform(m)
    {
        mat4.copy(this._localTransform, m);
    }

    @meta.vector3
    @meta.isPrivate
    boundingSphereCenter = vec3.create();

    @meta.float
    @meta.isPrivate
    boundingSphereRadius = 0;


    _parentTransform = mat4.create();
    _perObjectData = Tw2PerObjectData.from(this.constructor.perObjectData);


    /**
     * Fires when bounds need to be rebuilt
     */
    OnRebuildBounds()
    {
        const { box3_0, sph3_0 } = EveObject.global;

        for (let i = 0; i < this.effectChildren.length; i++)
        {
            let bounds;
            if (this.effectChildren[i].GetBoundingBox)
            {
                this.effectChildren[i].GetBoundingBox(box3_0);
                sph3.fromBox3(sph3_0, box3_0);
                bounds = true;
            }
            else if (this.effectChildren[i].GetBoundingSphere)
            {
                this.effectChildren[i].GetBoundingSphere(sph3_0);
                bounds = true;
            }

            if (bounds)
            {
                sph3.union(this._boundingSphere, this._boundingSphere, sph3_0);
            }
        }

        // Union the local bounds data for now...
        sph3.unionPositionRadius(this._boundingSphere, this._boundingSphere, this.boundingSphereCenter,this.boundingSphereRadius);

        box3.fromSph3(this._boundingBox, this._boundingSphere);
        this._boundsDirty = false;
    }

    /**
     * Resets Lod
     */
    ResetLod()
    {
        this._lod = 3;

        for (let i = 0; i < this.children.length; i++)
        {
            if (this.effectChildren[i].ResetLod)
            {
                this.effectChildren[i].ResetLod();
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
            if (this.effectChildren[i].UpdateLod)
            {
                this.effectChildren[i].UpdateLod(frustum, this._lod);
            }
        }
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
        mat4.copy(this._parentTransform, parentTransform);
        this.RebuildTransforms({ force: true, skipUpdate: true });
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
            if (this.effectChildren[i]._boundsDirty) this._boundsDirty = true;
        }
    }

    /**
     * Gets render batches
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @returns {Boolean} true if batches accumulated
     */
    GetBatches(mode, accumulator)
    {
        if (!this.display) return false;

        const c = accumulator.length;
        for (let i = 0; i < this.effectChildren.length; ++i)
        {
            this.effectChildren[i].GetBatches(mode, accumulator, this._perObjectData);
        }
        return accumulator.length !== c;
    }

    /**
     * Per object data
     * @type {{vs: *[], ps: *[]}}
     */
    static perObjectData = {
        vs: [
            [ "WorldMat", 16 ],
            [ "WorldMatLast", 16 ],
            [ "Shipdata", [ 0, 1, 0, -10 ] ],
            [ "Clipdata1", 4 ],
            [ "EllipsoidRadii", 4 ],
            [ "EllipsoidCenter", 4 ],
            [ "CustomMaskMatrix0", mat4.identity([]) ],
            [ "CustomMaskMatrix1", mat4.identity([]) ],
            [ "CustomMaskData0", [ 1, 0, 0, 0 ] ],
            [ "CustomMaskData1", [ 1, 0, 0, 0 ] ],
            [ "JointMat", 696 ]
        ],
        ps: [
            [ "Shipdata", [ 0, 1, 0, 1 ] ],
            [ "Clipdata1", 4 ],
            [ "Clipdata2", 4 ],
            [ "ShLighting", 4 * 7 ],
            [ "CustomMaskMaterialID0", 4 ],
            [ "CustomMaskMaterialID1", 4 ],
            [ "CustomMaskTarget0", 4 ],
            [ "CustomMaskTarget1", 4 ]
        ]
    };

}
