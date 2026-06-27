import { meta } from "utils";
import { box3, mat4, sph3, vec3 } from "math";
import { Tw2Transform } from "core/Tw2Transform";


@meta.tny.type("TnySpaceObject")
@meta.tny.define("TnySpaceObject")
export class TnySpaceObject extends Tw2Transform
{

    @meta.struct()
    wrapped = null;

    @meta.plain
    custom = {};

    get display()
    {
        return this.wrapped && "display" in this.wrapped ? this.wrapped.display : true;
    }

    set display(value)
    {
        if (this.wrapped && "display" in this.wrapped)
        {
            this.wrapped.display = value;
        }
    }

    constructor(wrapped, values)
    {
        super();

        if (wrapped)
        {
            this.SetWrapped(wrapped);
        }

        if (values)
        {
            this.SetValues(values);
        }
    }

    SetWrapped(wrapped)
    {
        this.wrapped = wrapped || null;
        this._boundsDirty = true;
        this.RebuildTransforms({ force: true, skipUpdate: true });
        return this;
    }

    GetVisibility(name, fallback = true)
    {
        if (name === "display")
        {
            return this.display;
        }

        const visible = this.wrapped && this.wrapped.visible;
        return visible && name in visible ? visible[name] : fallback;
    }

    SetVisibility(name, value)
    {
        if (name === "display")
        {
            this.display = value;
            return true;
        }

        const visible = this.wrapped && this.wrapped.visible;
        if (!visible || !(name in visible))
        {
            return false;
        }

        visible[name] = value;
        return true;
    }

    SetDisplay(value)
    {
        this.display = value;
        return this;
    }

    GetBatches(mode, accumulator)
    {
        return this.wrapped && this.wrapped.GetBatches ? this.wrapped.GetBatches(mode, accumulator) : false;
    }

    Intersect(ray, intersects)
    {
        return this.wrapped && this.wrapped.Intersect ? !!this.wrapped.Intersect(ray, intersects, { root: this }) : false;
    }

    GetResources(out = [])
    {
        return this.wrapped && this.wrapped.GetResources ? this.wrapped.GetResources(out) : out;
    }

    GetGeometryResource()
    {
        const mesh = this.wrapped && this.wrapped.mesh;
        if (!mesh) return null;
        if (mesh.GetGeometryRes) return mesh.GetGeometryRes();
        return mesh.geometryResource || null;
    }

    GetLongAxis()
    {
        if (!this.wrapped) return 0;

        if ("boundingSphereRadius" in this.wrapped)
        {
            const { mat4_0, sph3_0, vec3_0 } = TnySpaceObject.global;

            this.GetScale(vec3_0);
            mat4.fromScaling(mat4_0, vec3_0);
            sph3.fromPositionRadius(sph3_0, this.wrapped.boundingSphereCenter, this.wrapped.boundingSphereRadius);
            sph3.transformMat4(sph3_0, sph3_0, mat4_0);
            return Math.round(sph3_0[3] * 2);
        }

        return this.GetBoundingSphereRadius() * 2;
    }

    GetWidth()
    {
        return this.GetSize(TnySpaceObject.global.vec3_1)[0];
    }

    GetHeight()
    {
        return this.GetSize(TnySpaceObject.global.vec3_1)[1];
    }

    GetLength()
    {
        return this.GetSize(TnySpaceObject.global.vec3_1)[2];
    }

    GetSize(out = vec3.create())
    {
        const res = this.GetGeometryResource();
        if (!res || !res.minBounds || !res.maxBounds)
        {
            return vec3.set(out, 0, 0, 0);
        }

        const { box3_0, vec3_0 } = TnySpaceObject.global;
        box3.fromBounds(box3_0, res.minBounds, res.maxBounds);
        box3.getSize(out, box3_0);

        this.GetScale(vec3_0);
        return vec3.multiply(out, out, vec3_0);
    }

    GetCenter(out = vec3.create())
    {
        const res = this.GetGeometryResource();
        if (!res || !res.minBounds || !res.maxBounds)
        {
            return this.GetWorldTranslation(out);
        }

        const { mat4_0, box3_0 } = TnySpaceObject.global;
        box3.fromBounds(box3_0, res.minBounds, res.maxBounds);
        box3.getCenter(out, box3_0);

        this.GetWorldTransform(mat4_0);
        return vec3.transformMat4(out, out, mat4_0);
    }

    CenterFromBounds(centerOffset)
    {
        if (!this.wrapped) return this;

        try
        {
            this.Translate(this.GetOffsetFromBoundsCenter(TnySpaceObject.global.vec3_0, centerOffset))
                .UpdateValues();
        }
        catch (err)
        {
            // Bounds may not exist until resources finish loading.
        }

        return this;
    }

    SetParameter(name, value)
    {
        const mesh = this.wrapped && this.wrapped.mesh;
        if (!mesh || !mesh.FindParameters) return false;

        const parameters = mesh.FindParameters(name);
        for (let i = 0; i < parameters.length; i++)
        {
            if (parameters[i].SetValue)
            {
                parameters[i].SetValue(value);
            }
            else
            {
                parameters[i].value = value;
            }
        }

        return parameters.length > 0;
    }

    OnWorldTransformModified(world)
    {
        if (this.wrapped && this.wrapped.SetTransform)
        {
            this.wrapped.SetTransform(world);
        }

        this.EmitEvent("transform_modified", this, world);
    }

    OnRebuildBounds()
    {
        if (
            this.wrapped &&
            this.wrapped.GetBoundingBox &&
            this.wrapped.GetBoundingSphere &&
            this.wrapped.GetBoundingBox(this._boundingBox, true) &&
            this.wrapped.GetBoundingSphere(this._boundingSphere, true)
        )
        {
            this._boundsDirty = false;
            return;
        }

        super.OnRebuildBounds();
    }

    Update(dt)
    {
        if (this.wrapped && this.wrapped.Update)
        {
            this.wrapped.Update(dt);
        }

        this.EmitEvent("update", this, dt);
        return true;
    }

    _OnTransformUpdated(world)
    {
        if (this.wrapped && this.wrapped.SetTransform)
        {
            this.wrapped.SetTransform(world);
        }
    }

    static FromWrapped(wrapped, values)
    {
        return new this(wrapped, values);
    }

    static GetWrapped(item)
    {
        return item ? item.wrapped || null : null;
    }

    static HasWrapped(item)
    {
        return !!this.GetWrapped(item);
    }

    static ClearWrapped(item)
    {
        if (item && item.SetWrapped)
        {
            item.SetWrapped(null);
        }

        return item;
    }

    static GetParts(item, out = [])
    {
        const wrapped = this.GetWrapped(item);
        if (wrapped)
        {
            out.push(wrapped);
        }

        return out;
    }

    static GetPart(item, index = 0)
    {
        return index === 0 ? this.GetWrapped(item) : null;
    }

    static ForEachPart(item, callback)
    {
        const wrapped = this.GetWrapped(item);
        if (wrapped && callback)
        {
            callback(wrapped, 0, "wrapped");
        }

        return item;
    }

    static HasWrappedValue(item, name)
    {
        const wrapped = this.GetWrapped(item);
        return !!(wrapped && name in wrapped);
    }

    static GetWrappedValue(item, name, fallback)
    {
        const wrapped = this.GetWrapped(item);
        return wrapped && name in wrapped ? wrapped[name] : fallback;
    }

    static GetWrappedValues(item, out = {}, opt)
    {
        const wrapped = this.GetWrapped(item);
        return wrapped && wrapped.GetValues ? wrapped.GetValues(out, opt) : out;
    }

    static SetWrappedValue(item, name, value)
    {
        const wrapped = this.GetWrapped(item);
        if (!wrapped || !(name in wrapped))
        {
            return false;
        }

        wrapped[name] = value;
        return true;
    }

    static SetWrappedValues(item, values, opt)
    {
        if (!values)
        {
            return false;
        }

        const wrapped = this.GetWrapped(item);
        if (!wrapped)
        {
            return false;
        }

        if (wrapped.SetValues)
        {
            return !!wrapped.SetValues(values, opt);
        }

        let updated = false;
        for (const name in values)
        {
            if (values.hasOwnProperty(name))
            {
                updated = this.SetWrappedValue(item, name, values[name]) || updated;
            }
        }

        return updated;
    }

    static global = {
        box3_0: box3.create(),
        mat4_0: mat4.create(),
        sph3_0: sph3.create(),
        vec3_0: vec3.create(),
        vec3_1: vec3.create()
    };

}
