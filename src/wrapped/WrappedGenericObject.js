import { meta } from "utils";
import { mat4, sph3 } from "math";
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
    @meta.boolean
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
     * Gets the object's long axis
     * @return {number}
     */
    GetLongAxis()
    {
        if ("boundingSphereRadius" in this.wrapped)
        {
            const
                mat4_0 = this.GetWorldTransform([]),
                sph3_0 = sph3.fromPositionRadius([], this.wrapped.boundingSphereCenter, this.wrapped.boundingSphereRadius);

            sph3.transformMat4(sph3_0, sph3_0, mat4_0);
            return Math.round(sph3_0[3] * 2);
        }
        return 0;
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

}
