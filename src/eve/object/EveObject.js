/* eslint no-unused-vars:0 */
import { isArray, meta } from "utils";
import { mat4, vec3, sph3, box3 } from "math";


export class EveObject extends meta.Model
{

    @meta.string
    name = "";

    @meta.boolean
    display = true;

    _lod = 3;
    _boundsDirty = false;   // Don't build unless asked for
    _boundingBox = null;
    _boundingSphere = null;

    /**
     * Sets the local transform
     * @param {mat4} m
     */
    @meta.abstract
    SetTransform(m)
    {

    }

    /**
     * Gets the local transform
     * @param {mat4} out
     */
    @meta.abstract
    GetTransform(out)
    {

    }

    /**
     * Gets the world transform
     * @param {mat4}  out
     */
    @meta.abstract
    GetWorldTransform(out)
    {

    }

    /**
     * Rebuilds bounds
     * @param {Boolean} [force]
     **/
    RebuildBounds(force)
    {
        // Don't use the built in bounding sphere as it isn't geometrically correct
        if (!this._boundingSphere || !this._boundingBox)
        {
            this._boundsDirty = true;
            this._boundingSphere = sph3.create();
            this._boundingBox = box3.create();
        }
    }

    /**
     * Gets bounding box
     * @param {box3} out
     * @param {Boolean} [force]
     * @return {boolean}
     */
    GetBoundingBox(out, force)
    {
        this.RebuildBounds(force);
        box3.copy(out, this._boundingBox);
        return this._boundsDirty ? null : out;
    }

    /**
     * Gets bounding sphere
     * @param {sph3} out
     * @param {Boolean} [force]
     * @return {boolean}
     */
    GetBoundingSphere(out, force)
    {
        this.RebuildBounds(force);
        sph3.copy(out, this._boundingSphere);
        return this._boundsDirty ? null : out;
    }

    /**
     * Gets world bounding box
     * @param {box3} out
     * @return {box3|null}
     */
    GetWorldBoundingBox(out)
    {
        if (this.GetBoundingBox(out))
        {
            const world = this.GetWorldTransform(EveObject.global.mat4_0);
            box3.transformMat4(out, out, world);
            return out;
        }

        return null;
    }

    /**
     * Gets world bounding sphere
     * @param {sph3} out
     * @return {sph3|null}
     */
    GetWorldBoundingSphere(out)
    {
        if (this.GetBoundingSphere(out))
        {
            const world = this.GetWorldTransform(EveObject.global.mat4_0);
            sph3.transformMat4(out, out, world);
            return out;
        }

        return null;
    }

    /**
     * Resets LOD
     */
    ResetLod()
    {
        this._lod = 3;
    }

    /**
     * Updates LOD
     * @param {Tw2Frustum} frustum
     */
    UpdateLod(frustum)
    {
        this._lod = 3;
    }

    /**
     * Gets object resources
     * @param {Array} [out=[]]
     * @returns {Array<Tw2Resource>} out
     */
    @meta.abstract
    GetResources(out = [])
    {

    }

    /**
     * Per frame update
     * @param {number} dt - delta time
     */
    @meta.abstract
    Update(dt)
    {

    }

    /**
     * Accumulates batches
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     */
    @meta.abstract
    GetBatches(mode, accumulator)
    {

    }

    /**
     * Global and scratch variables
     * @type {*}
     */
    static global = {
        vec3_0: vec3.create(),
        vec3_1: vec3.create(),
        vec3_2: vec3.create(),
        vec3_3: vec3.create(),
        vec3_4: vec3.create(),
        vec3_5: vec3.create(),
        vec3_6: vec3.create(),
        vec3_7: vec3.create(),
        mat4_0: mat4.create(),
        mat4_1: mat4.create(),
        mat4_2: mat4.create(),
        mat4_ID: mat4.create(),
        box3_0: box3.create(),
        sph3_0: sph3.create()
    };

}

