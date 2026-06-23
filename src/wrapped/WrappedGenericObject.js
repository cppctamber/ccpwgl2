import { meta } from "utils";
import { mat4, sph3, box3, vec3 } from "math";
import { ErrFeatureNotImplemented } from "core/Tw2Error";
import { Tw2Transform } from "core/Tw2Transform";


@meta.type("WrappedGenericObject")
export class WrappedGenericObject extends Tw2Transform
{

    @meta.struct()
    wrapped = null;

    @meta.plain
    custom = {};

    /**
     * Gets the object's visibility
     * @return {Boolean}
     */
    get display()
    {
        return this.wrapped.display;
    }

    /**
     * Sets the object's visibility
     * @param {Boolean} bool
     */
    set display(bool)
    {
        this.wrapped.display = bool;
    }

    /**
     * Gets batches
     * @param {Number} mode
     * @param {Tw2BatchAccumulator|Tw2BatchAccumulator2} accumulator
     * @returns {Boolean} true if batch accumulated
     */
    GetBatches(mode, accumulator)
    {
        return this.wrapped && this.wrapped.GetBatches ? this.wrapped.GetBatches(mode, accumulator) : false;
    }

    /**
     * Intersects the object
     * @param {RayCaster} ray
     * @param {Array} intersects
     */
    Intersect(ray, intersects)
    {
        return this.wrapped ? !!this.wrapped.Intersect(ray, intersects, { root: this }) : false;
    }

    /**
     * Gets the object's long axis  (the value shown in eve)
     * @return {number}
     */
    GetLongAxis()
    {
        if ("boundingSphereRadius" in this.wrapped)
        {
            const { mat4_0, sph3_0, vec3_0 } = WrappedGenericObject.global;
            this.GetScale(vec3_0);
            mat4.fromScaling(mat4_0, vec3_0);
            sph3.fromPositionRadius(sph3_0, this.wrapped.boundingSphereCenter, this.wrapped.boundingSphereRadius);
            sph3.transformMat4(sph3_0, sph3_0, mat4_0);
            return Math.round(sph3_0[3] * 2);
        }
        return 0;
    }

    /**
     * Gets the object's width
     * @return {Number}
     */
    GetWidth()
    {
        return this.GetSize(WrappedGenericObject.global.vec3_1)[0];
    }

    /**
     * Gets the object's height
     * @return {Number}
     */
    GetHeight()
    {
        return this.GetSize(WrappedGenericObject.global.vec3_1)[1];
    }

    /**
     * Gets the object's length
     * @return {Number}
     */
    GetLength()
    {
        return this.GetSize(WrappedGenericObject.global.vec3_1)[2];
    }

    /**
     * Gets the object's size
     * @param out
     * @return {vec3}
     * @constructor
     */
    GetSize(out=vec3.create())
    {
        const { box3_0, vec3_0 } = WrappedGenericObject.global;
        const res = this.wrapped && this.wrapped.mesh ? this.wrapped.mesh.GetGeometryRes() : null;

        box3.fromBounds(box3_0, res.minBounds, res.maxBounds);
        box3.getSize(out, box3_0);

        this.GetScale(vec3_0);
        return vec3.multiply(out, out, vec3_0);
    }

    /**
     * Gets the object's center
     * @param {Vec3} out
     * @return {vec3}
     */
    GetCenter(out=vec3.create())
    {
        const { mat4_0, box3_0 } = WrappedGenericObject.global;
        const res = this.wrapped && this.wrapped.mesh ? this.wrapped.mesh.GetGeometryRes() : null;

        box3.fromBounds(box3_0, res.minBounds, res.maxBounds);
        box3.getCenter(out, box3_0);

        this.GetTransform(mat4_0);
        return vec3.transformMat4(out, out, mat4_0);
    }

    /**
     * Fires on world transform modified
     * @param {mat4} world
     */
    OnWorldTransformModified(world)
    {
        this.wrapped.SetTransform(world);
        this.EmitEvent("transform_modified");
    }

    /**
     * Per frame update
     * @param {Number} dt
     */
    Update(dt)
    {
        this.EmitEvent("update", dt);
    }

    /**
     * Gets the object's resources
     * @param {Array} [out=[]]
     * @return {Array} out
     */
    GetResources(out = [])
    {
        return this.wrapped.GetResources(out);
    }

    /**
     * Fires on transform updates
     * @param {mat4} world
     */
    _OnTransformUpdated(world)
    {
        this.wrapped.SetTransform(world);
    }

    /**
     * [ WARNING: THIS SHOULD BE MULTIPLIED BY THE OBJECT'S LOCAL TRANSFORM!!!]
     * @returns {Number}
     * @constructor
     */
    GetBoundingSphereRadius()
    {
        return this.wrapped.GetBoundingSphereRadius();
    }

    /**
     * [ WARNING: THIS SHOULD BE MULTIPLIED BY THE OBJECT'S LOCAL TRANSFORM!!!]
     * @returns {Number}
     * @constructor
     */
    GetBoundingSphere(out)
    {
        return this.wrapped.GetBoundingSphere(out);
    }

    /**
     * Fetches object sync
     * @param {Object} values
     * @param {Object} opt
     */
    static from(values, opt)
    {
        throw new ErrFeatureNotImplemented();
    }

    /**
     * Fetches object async
     * @param {Object} values
     * @param {EveSOFData} eveSof
     * @return {Promise<*>}
     */
    static async fetch(values, eveSof)
    {
        throw new ErrFeatureNotImplemented();
    }

    static global = {
        mat4_0: mat4.create(),
        sph3_0: sph3.create(),
        box3_0: box3.create(),
        vec3_0: vec3.create(),
        vec3_1: vec3.create()
    }

}
