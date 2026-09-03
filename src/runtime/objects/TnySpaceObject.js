import { isNumber, isString, meta } from "utils";
import { box3, mat4, sph3, vec3 } from "math";
import { tw2 } from "global";
import { WglTransform } from "core/WglTransform";
import { getApiService } from "../api";


@meta.define("TnySpaceObject")
export class TnySpaceObject extends WglTransform
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

    static fromWrapped(wrapped, values)
    {
        return new this(wrapped, values);
    }

    /**
     * Works out WHAT to build, without building it.
     *
     * Four ways to name a thing, in resolution order: a SKINR design id, a
     * typeID, a graphicID, or dna/res path directly. All but a bare res path
     * resolve to DNA - a SKINR design resolves to dna too, once its pattern is
     * injected - so nearly everything ends up on the same path.
     *
     * Split out from `fetch` because the sof `buildClass` lives in the DNA, so
     * anything wanting to choose a CLASS from the data has to resolve first and
     * build second - see `TnyScene.FetchDNA`. Doing it inside `fetch` would
     * mean resolving twice for a SKINR design: two api round trips and a double
     * pattern registration.
     *
     * The result is itself valid `options`, and re-resolving it is a no-op: it
     * carries `dna` and none of the id forms, so every branch below is skipped.
     *
     * A bare string is dispatched by shape - a UUID is a SKINR design, dna
     * looks like dna, anything else is a res path - and a bare number is a
     * typeID. graphicID has to be named, because it is a number too and
     * guessing between the two would be wrong half the time.
     *
     * @param {String|Number|Object} options - dna/res path/SKINR id string, typeID, or options
     * @param {String} [options.dna]
     * @param {String} [options.resPath]
     * @param {Number} [options.typeID]        - resolved to dna via the api service
     * @param {Number} [options.graphicID]     - resolved to sof dna or a graphic file
     * @param {String} [options.skinrUUID]     - a SKINR design id
     * @param {Number} [options.skinID]
     * @param {Array} [options.position]       - alias for `translation`
     * @param {Array} [options.translation]
     * @param {Array} [options.rotation]
     * @param {Boolean|Function} [options.awaitResources] - await (or watch) resource loading
     * @returns {Promise<Object>} `{ dna, resPath, blendMode, awaitResources, ...values }`
     */
    static async resolve(options = {})
    {
        // Polymorphic by shape. Each form is identified POSITIVELY, in order,
        // so that dna - the one with the loosest shape - is what is left over
        // rather than something guessed at:
        //
        //   UUID      a SKINR design id
        //   digits    a typeID, as a number OR a string; ids arrive from urls
        //             and json as strings often enough that reading "587" as
        //             a path would be a trap
        //   prefix:/  a res path - res, local, http, https, any res index -
        //             recognised by the `:/` sitting near the front
        //   otherwise dna
        //
        // graphicID is NOT here and cannot be: it is a plain number,
        // indistinguishable from a typeID, so it has to be named.
        if (isString(options))
        {
            const value = options.trim();
            options = this.isSkinrID(value) ? { skinrUUID: value }
                : /^[0-9]+$/.test(value) ? { typeID: Number(value) }
                    : this.isResPath(value) ? { resPath: value }
                        : { dna: value };
        }
        else if (isNumber(options))
        {
            options = { typeID: options };
        }

        let {
            dna, resPath, typeID, graphicID, skinID, skinrUUID,
            awaitResources, position, blendMode = null, ...values
        } = options;

        // `position` and `translation` are both accepted; the wrapped object
        // only knows `translation`, so an unaliased `position` would be set
        // on nothing and silently do nothing.
        if (position !== undefined && values.translation === undefined)
        {
            values.translation = position;
        }

        if (skinrUUID)
        {
            // GenerateSkinrDnaFromId, not GenerateDnaFromId. The facade has
            // never had the latter, so this threw for every SKINR id until
            // 2026-09-03; nothing had exercised the path.
            const design = await getApiService().GenerateSkinrDnaFromId(skinrUUID);
            dna = design.dna;
            blendMode = design.blendMode;
            if (!values.name && design.name) values.name = design.name;

            // The generated pattern has to be registered BEFORE the fetch: sof
            // resolves pattern names while building, so a design whose pattern
            // arrives late draws as an unpatterned hull - which looks like the
            // skin failing rather than a missing registration.
            if (design.pattern) this.registerPattern(design.pattern);
        }
        else if (typeID !== undefined && typeID !== null)
        {
            const resolved = await getApiService().ResolveDna({ typeID, skinID });
            if (!values.name) values.name = resolved.name;
            dna = resolved.dna;
        }
        else if (graphicID !== undefined && graphicID !== null)
        {
            // Returns sof dna for a hull, or a graphic file for the things that
            // are not sof at all - so it feeds whichever of the two applies.
            const path = await getApiService().GetResPathFromGraphicID(graphicID);
            if (!path) throw new ReferenceError(`Graphic ${graphicID} has no SOF DNA or graphic file`);
            if (this.isResPath(path)) resPath = path; else dna = path;
        }

        if (!dna && !resPath) throw new ReferenceError("Could not identify a dna or resource path");

        return { dna, resPath, blendMode, awaitResources, ...values };
    }

    /**
     * Fetches a space object async, building through tw2.Fetch so a registered
     * dna handler (lazy sof loading) is honoured.
     *
     * Takes anything `resolve` takes, including a spec `resolve` already
     * returned - re-resolving one is a no-op.
     *
     * @param {String|Number|Object} options - see `resolve`
     * @returns {Promise<TnySpaceObject>}
     */
    static async fetch(options = {})
    {
        const { dna, resPath, blendMode, awaitResources, ...values } = await this.resolve(options);
        const source = dna || resPath;

        const wrapped = await tw2.Fetch(source, awaitResources);
        wrapped._resPath = source;
        const object = new this(wrapped, values);

        // Carbon compiles the blend mode in as a permutation, so it cannot ride
        // along in the dna. Left unset, a SKINR design falls back to overlay on
        // dx11 while gles2 - which reads it from a constant buffer - looks
        // right, and the two profiles disagree over one design.
        if (blendMode && wrapped.SetBlendMode) wrapped.SetBlendMode(blendMode);

        // Slots live on TnyMobile and below - a station or a jump gate has
        // none, and Carbon puts turrets on EveMobile for the same reason.
        if (object.RebuildSlots) await object.RebuildSlots();
        return object;
    }

    /**
     * True for a resource path: a `prefix:/` at the FRONT of the string -
     * `res:/`, `local:/`, `http(s)://`, or any other res index.
     *
     * Deliberately not checking that the prefix is registered. An
     * unregistered one is still a path, and failing the fetch with a name
     * says so; quietly treating it as dna would report the wrong thing.
     * `near the front` is what makes it a prefix rather than a colon that
     * happens to appear inside some longer string.
     *
     * @param {String} value
     * @returns {Boolean}
     */
    /**
     * How far into a string a `:/` can sit and still be a prefix. The
     * longest in use is `dynamic` at seven; sixteen leaves room without
     * letting a colon deep inside some other string qualify.
     * @type {Number}
     */
    static RES_PREFIX_MAX_LENGTH = 16;

    static isResPath(value)
    {
        if (!isString(value)) return false;

        const index = value.indexOf(":/");
        if (index === -1) return false;

        return index <= this.RES_PREFIX_MAX_LENGTH;
    }

    /**
     * A SKINR design id is a UUID; dna and res paths never are.
     * @param {String} value
     * @returns {Boolean}
     */
    static isSkinrID(value)
    {
        return isString(value) &&
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.trim());
    }

    /**
     * Registers a generated pattern on the active sof data, replacing any
     * pattern of the same name - a SKINR id names one design, so a re-fetch
     * has to overwrite rather than accumulate.
     * @param {Object} pattern
     * @returns {?Object} the registered pattern
     */
    static registerPattern(pattern)
    {
        const sof = tw2.eveSof;
        if (!sof || !Array.isArray(sof.pattern) || !pattern || !isString(pattern.name))
        {
            return null;
        }

        const name = pattern.name.toLowerCase();
        const index = sof.pattern.findIndex(x => x && isString(x.name) && x.name.toLowerCase() === name);
        if (index === -1) sof.pattern.push(pattern); else sof.pattern[index] = pattern;
        return pattern;
    }

    static getWrapped(item)
    {
        return item ? item.wrapped || null : null;
    }

    static hasWrapped(item)
    {
        return !!this.getWrapped(item);
    }

    static clearWrapped(item)
    {
        if (item && item.SetWrapped)
        {
            item.SetWrapped(null);
        }

        return item;
    }

    static getParts(item, out = [])
    {
        const wrapped = this.getWrapped(item);
        if (wrapped)
        {
            out.push(wrapped);
        }

        return out;
    }

    static getPart(item, index = 0)
    {
        return index === 0 ? this.getWrapped(item) : null;
    }

    static forEachPart(item, callback)
    {
        const wrapped = this.getWrapped(item);
        if (wrapped && callback)
        {
            callback(wrapped, 0, "wrapped");
        }

        return item;
    }

    static hasWrappedValue(item, name)
    {
        const wrapped = this.getWrapped(item);
        return !!(wrapped && name in wrapped);
    }

    static getWrappedValue(item, name, fallback)
    {
        const wrapped = this.getWrapped(item);
        return wrapped && name in wrapped ? wrapped[name] : fallback;
    }

    static getWrappedValues(item, out = {}, opt)
    {
        const wrapped = this.getWrapped(item);
        return wrapped && wrapped.GetValues ? wrapped.GetValues(out, opt) : out;
    }

    static setWrappedValue(item, name, value)
    {
        const wrapped = this.getWrapped(item);
        if (!wrapped || !(name in wrapped))
        {
            return false;
        }

        wrapped[name] = value;
        return true;
    }

    static setWrappedValues(item, values, opt)
    {
        if (!values)
        {
            return false;
        }

        const wrapped = this.getWrapped(item);
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
                updated = this.setWrappedValue(item, name, values[name]) || updated;
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
