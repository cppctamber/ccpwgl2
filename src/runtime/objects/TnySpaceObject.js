import { isDNA, isNumber, isString, meta } from "utils";
import { box3, mat4, sph3, vec3 } from "math";
import { tw2 } from "global";
import { WglTransform } from "core/WglTransform";
import { getApiService } from "../api";
import { TnySlot } from "./TnySlot";


@meta.tny.type("TnySpaceObject")
@meta.tny.define("TnySpaceObject")
export class TnySpaceObject extends WglTransform
{

    @meta.struct()
    wrapped = null;

    @meta.plain
    custom = {};

    /** @type {Array<TnySlot>} */
    turrets = [];
    /** @type {Array<TnySlot>} */
    xlTurrets = [];
    /** @type {Array<TnySlot>} */
    launchers = [];
    /** @type {Array<TnySlot>} */
    chains = [];
    /** @type {Array<TnySlot>} */
    atomics = [];
    /** @type {Array<TnySlot>} */
    bombs = [];

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

    /**
     * The object's bounding sphere, in world space.
     *
     * Separate from `GetLongAxis` on purpose, and the difference is not
     * cosmetic: `GetLongAxis` applies only the object's *scale*, so its answer is
     * a world-sized radius around a *local* centre. That is all a caller asking
     * "how big is this" needs, and it is not enough for a caller that also has
     * to aim at it — a hull whose bounding centre sits off its own origin (which
     * is most of them) would be framed correctly and pointed at slightly wrong.
     *
     * So the full world transform is applied here. `sph3.transformMat4` carries
     * the translation into the centre and the largest axis scale into the radius,
     * which is the conservative choice under a non-uniform scale.
     *
     * ### Hulls arrive pre-centred, and that is why this looks like a no-op
     *
     * Measured on `gc1_t1` at build 3470007: the authored
     * `boundingSphereCenter` is `(13.009, -10.801, -12.468)` and the object's local
     * transform carries the translation `(-13.009, 10.801, 12.468)` — exactly its
     * negation. A loaded hull is placed so that its bounding centre sits on the
     * origin, so this returns a centre of `(0, 0, 0)` and that answer is correct
     * rather than a dropped offset.
     *
     * Worth knowing twice over: it means the transform hop below is load-bearing
     * even though it usually produces zero, and it means the *old* `Focus` got
     * away with mixing a sphere centre into a box fit, because the centre it was
     * mishandling happened to be the origin for every ship.
     *
     * @param {sph3} [out]
     * @returns {sph3|null} [x, y, z, radius], or null when there is nothing to measure
     */
    GetBoundingSphere(out = sph3.create())
    {
        if (!this.wrapped) return null;

        const { mat4_0, vec3_0, vec3_1 } = TnySpaceObject.global;

        // The value, not the key. `GetLongAxis` tests `in` and therefore accepts a
        // declared-but-unset property, which is how a bound of zero or undefined
        // reaches arithmetic that has no way to report it.
        if (Number.isFinite(this.wrapped.boundingSphereRadius)
            && this.wrapped.boundingSphereRadius > 0
            && this.wrapped.boundingSphereCenter)
        {
            sph3.fromPositionRadius(out, this.wrapped.boundingSphereCenter, this.wrapped.boundingSphereRadius);

            return sph3.transformMat4(out, out, this.GetTransform(mat4_0));
        }

        // No authored sphere: fall back to the geometry box, whose extents are
        // already scaled by `GetSize`. Half the diagonal rather than half the
        // longest edge, so the radius holds at every orientation.
        const size = this.GetSize(vec3_1);
        const radius = Math.sqrt(size[0] * size[0] + size[1] * size[1] + size[2] * size[2]) / 2;

        if (!(radius > 0)) return null;

        // Placed rather than transformed: `GetSize` has already applied scale, so
        // running the full transform would square the scale into the radius. The
        // box is measured about the geometry's own origin, so its world centre is
        // the object's world translation.
        return sph3.fromPositionRadius(out, this.GetTranslation(vec3_0), radius);
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

    /**
     * Fetches a space object async, building through tw2.Fetch so a
     * registered dna handler (lazy sof loading) is honoured.
     * @param {String|Number|Object} options - dna/res path string, typeID, or options object
     * @param {String} [options.dna]
     * @param {String} [options.resPath]
     * @param {Number} [options.typeID]        - resolved to dna via the api service
     * @param {Number} [options.skinID]
     * @param {Boolean|Function} [options.awaitResources] - await (or watch) resource loading
     * @returns {Promise<TnySpaceObject>}
     */
    static async Fetch(options = {})
    {
        if (isString(options))
        {
            options = isDNA(options) ? { dna: options } : { resPath: options };
        }
        else if (isNumber(options))
        {
            options = { typeID: options };
        }

        let { dna, resPath, typeID, skinID, awaitResources, ...values } = options;

        if (typeID !== undefined && typeID !== null)
        {
            const resolved = await getApiService().ResolveDna({ typeID, skinID });
            if (!values.name) values.name = resolved.name;
            dna = resolved.dna;
        }

        const source = dna || resPath;
        if (!source) throw new ReferenceError("Could not identify a dna or resource path");

        const wrapped = await tw2.Fetch(source, awaitResources);
        wrapped._resPath = source;
        const object = new this(wrapped, values);
        await object.RebuildSlots();
        return object;
    }

    /**
     * Reconciles the weapon/utility slot arrays from the wrapped object's
     * locators. Call again after the wrapped object (or its parts) change.
     * @param {*|Array} [parts=this.wrapped] - wrapped source object(s)
     * @returns {Promise<this>}
     */
    async RebuildSlots(parts = this.wrapped)
    {
        if (!parts) return this;
        await Promise.all([
            TnySlot.RebuildLocatorSlots(this, parts, "turret", this.turrets),
            TnySlot.RebuildLocatorSlots(this, parts, "xl", this.xlTurrets),
            TnySlot.RebuildLocatorSlots(this, parts, "launcher", this.launchers),
            TnySlot.RebuildLocatorSlots(this, parts, "chain", this.chains),
            TnySlot.RebuildLocatorSlots(this, parts, "atomic", this.atomics),
            TnySlot.RebuildLocatorSlots(this, parts, "bomb", this.bombs)
        ]);
        return this;
    }

    /**
     * Gets all slot arrays as one list
     * @param {Array} [out=[]]
     * @returns {Array<TnySlot>}
     */
    GetSlots(out = [])
    {
        out.push(...this.turrets, ...this.xlTurrets, ...this.launchers, ...this.chains, ...this.atomics, ...this.bombs);
        return out;
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
