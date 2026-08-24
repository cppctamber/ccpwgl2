import { resMan, tw2 } from "global";
import { isString, isVector, meta } from "utils";
import { Tw2Picker, Tw2RayCaster } from "core";
import { EveSpaceScene } from "eve/EveSpaceScene";
import { TnyLensflare } from "./objects/TnyLensflare";


/**
 * Runtime scene: owns an EveSpaceScene and the runtime objects placed in it.
 *
 * The split mirrors WrappedScene: `objects` holds runtime wrappers
 * (TnyShip, TnyPlanet…) while `wrapped.objects` holds the raw eve objects
 * (EveShip2…) the scene actually renders. `Rebuild` is what keeps the second
 * list in step with the first.
 *
 * Objects must live in the scene rather than beside it: EveSpaceScene applies
 * per-frame lighting and environment data before collecting batches, so
 * anything drawn outside it comes out unlit.
 */
@meta.define("TnyScene")
export class TnyScene extends meta.Model
{

    @meta.struct()
    wrapped = null;

    @meta.list()
    objects = [];

    @meta.list()
    lensflares = [];

    /**
     * Picking, carried over from WrappedScene when that tree was retired.
     * A scene that can be rendered but not clicked is only half a scene: any
     * editor over this runtime needs to turn a pointer event into an object,
     * and the ray/AABB work belongs with the object list rather than with
     * whichever tool happens to want it.
     * @type {Tw2RayCaster}
     */
    _rayCaster = new Tw2RayCaster();

    /** @type {Tw2Picker} */
    _picker = new Tw2Picker();

    /**
     * Gizmos intersect BEFORE ordinary objects so a handle drawn on top of a
     * hull can still be grabbed - see `IntersectFromEvent`.
     */
    gizmoObjects = [];

    /**
     * Planets normally go in the scene's planet list, which renders in a
     * dedicated pass with its own depth range (zn 10000, zf 1e11) built for
     * celestials millions of metres across. A planet standing in for a prop at
     * ordinary distances belongs in the object pass instead.
     * @type {Boolean}
     */
    @meta.boolean
    get treatPlanetsAsObjects()
    {
        return this._treatPlanetsAsObjects;
    }

    set treatPlanetsAsObjects(value)
    {
        value = !!value;
        if (this._treatPlanetsAsObjects === value) return;
        this._treatPlanetsAsObjects = value;
        // The raw lists only change when they are mirrored.
        this.Rebuild();
    }

    _treatPlanetsAsObjects = false;

    get isScene()
    {
        return true;
    }

    /**
     * @param {EveSpaceScene} [wrapped]
     * @param {Object} [values]
     */
    constructor(wrapped, values)
    {
        super();
        if (values) this.SetValues(values);
        if (wrapped) this.SetWrapped(wrapped);
    }

    /**
     * @param {EveSpaceScene} wrapped
     * @returns {TnyScene}
     */
    SetWrapped(wrapped)
    {
        // Space only. The interior scene is TnyCharacterScene's to own, and a
        // wrapper that accepts both ends up speaking for neither.
        if (wrapped && !(wrapped instanceof EveSpaceScene))
        {
            throw new TypeError("TnyScene requires an EveSpaceScene");
        }

        this.wrapped = wrapped || null;
        this.Rebuild();
        return this;
    }

    /**
     * Adds a runtime object (or array of them) to the scene
     * @param {*} object
     * @returns {TnyScene}
     */
    AddObject(object)
    {
        if (Array.isArray(object))
        {
            for (let i = 0; i < object.length; i++) this.AddObject(object[i]);
            return this;
        }

        if (!object) throw new TypeError("Invalid runtime object");

        const target = object.isLensflare ? this.lensflares : this.objects;
        if (!target.includes(object))
        {
            target.push(object);
            this.Rebuild();
            this.EmitEvent("object_added", this, object);
        }
        return this;
    }

    /**
     * @param {*} object
     * @returns {TnyScene}
     */
    RemoveObject(object)
    {
        const target = object && object.isLensflare ? this.lensflares : this.objects;
        const index = target.indexOf(object);
        if (index !== -1)
        {
            target.splice(index, 1);
            this.Rebuild();
            this.EmitEvent("object_removed", this, object);
        }
        return this;
    }

    /**
     * Intersects the scene's objects with a pointer event.
     *
     * Gizmos are tested first and, unless `passthrough` is set, a gizmo hit
     * stops the search - otherwise dragging a handle would also select the
     * hull behind it.
     *
     * @param {MouseEvent} event
     * @param {HTMLElement} [element]
     * @param {Object} [options]
     * @returns {Array} intersections, nearest first
     */
    IntersectFromEvent(event, element, options)
    {
        const { altKey, ctrlKey, shiftKey } = event;
        const keys = { altKey, ctrlKey, shiftKey };
        const intersected = [];

        this._rayCaster.UpdateFromEvent(event, element, options);
        this.EmitEvent("intersecting", this, undefined, keys);

        const
            gizmoOptions = options && options.gizmos || {},
            skipGizmos = gizmoOptions.skip || this._rayCaster.GetOption("gizmos", "skip", false),
            passthroughGizmos = gizmoOptions.passthrough || this._rayCaster.GetOption("gizmos", "passthrough", false);

        if (!skipGizmos)
        {
            this._rayCaster.IntersectObjects(this.gizmoObjects, intersected);
        }

        if (!intersected.length || passthroughGizmos)
        {
            this._rayCaster.IntersectObjects(this.objects, intersected);
        }

        if (intersected.length)
        {
            this.EmitEvent("intersected_objects", this, intersected, keys);
            this.EmitEvent("intersected_closest", this, intersected[0], keys);
        }
        else
        {
            this.EmitEvent("intersected_none", this, undefined, keys);
        }

        return intersected;
    }

    /**
     * Picks from a supplied object list rather than the whole scene.
     *
     * The picker works on the RAW eve objects, so a hit comes back rooted at
     * an EveShip2 rather than the TnyShip holding it. Callers want the runtime
     * object, so the root is translated back and the raw one kept alongside.
     *
     * @param {Array} objects
     * @param {MouseEvent} event
     * @param {HTMLElement} [element]
     * @returns {?Object}
     */
    PickObjectsFromEvent(objects, event, element)
    {
        const result = this._picker.PickFromEvent(objects, event, element);
        if (result)
        {
            const root = this.objects.find(x => x.wrapped === result.root);
            if (root)
            {
                result.wrapped = result.root;
                result.root = root;
            }
        }
        return result;
    }

    /**
     * Removes objects by kind, rebuilding once at the end rather than once
     * per removal.
     * @param {Boolean} [spaceObjects] - remove everything that is not a planet
     * @param {Boolean} [planets] - remove planets
     * @returns {TnyScene}
     */
    RemoveAllObjects(spaceObjects, planets)
    {
        const keep = this.objects.filter(x => (x.isPlanet ? !planets : !spaceObjects));
        if (keep.length === this.objects.length) return this;

        const removed = this.objects.filter(x => keep.indexOf(x) === -1);
        this.objects.length = 0;
        this.objects.push(...keep);
        this.Rebuild();
        removed.forEach(x => this.EmitEvent("object_removed", this, x));
        return this;
    }

    /**
     * @param {Array} [out]
     * @returns {Array}
     */
    GetObjects(out = [])
    {
        out.push(...this.objects);
        return out;
    }

    ClearObjects()
    {
        this.objects.splice(0);
        this.lensflares.splice(0);
        this.Rebuild();
        return this;
    }

    /**
     * Mirrors the runtime object lists into the wrapped scene's raw lists.
     * @returns {TnyScene}
     */
    Rebuild()
    {
        if (!this.wrapped) return this;

        const { planets, objects, lensflares } = this.wrapped;
        if (!Array.isArray(objects)) return this;

        if (Array.isArray(planets)) planets.splice(0);
        objects.splice(0);
        if (Array.isArray(lensflares)) lensflares.splice(0);

        for (let i = 0; i < this.lensflares.length; i++)
        {
            if (Array.isArray(lensflares)) lensflares.push(this.lensflares[i].wrapped || this.lensflares[i]);
        }

        for (let i = 0; i < this.objects.length; i++)
        {
            const object = this.objects[i];
            const raw = object.wrapped || object;
            if (object.isPlanet && !this._treatPlanetsAsObjects && Array.isArray(planets)) planets.push(raw);
            else objects.push(raw);
        }

        this.EmitEvent("rebuilt", this);
        return this;
    }

    /**
     * The wrapped scene updates its own children, so this only has to update
     * the scene itself — runtime wrappers forward Update to the same objects
     * and would double-update them.
     * @param {Number} dt
     * @returns {Boolean}
     */
    Update(dt)
    {
        if (!this.wrapped) return false;
        this.wrapped.Update(dt);
        this.EmitEvent("update", this, dt);
        return true;
    }

    /**
     * @param {Number} dt
     * @returns {Boolean}
     */
    Render(dt)
    {
        if (!this.wrapped) return false;
        this.EmitEvent("render", this, dt);
        this.wrapped.Render(dt);
        return true;
    }

    /**
     * @param {Array} [out]
     * @returns {Array}
     */
    GetResources(out = [])
    {
        if (this.wrapped && this.wrapped.GetResources) this.wrapped.GetResources(out);
        for (let i = 0; i < this.objects.length; i++)
        {
            if (this.objects[i].GetResources) this.objects[i].GetResources(out);
        }
        return out;
    }

    /**
     * Fetches a lensflare and, unless told not to, adds it to this scene.
     *
     * Restored from `WrappedScene.FetchLensflare`, which went with `src/wrapped`
     * in `dc1f81d0`. tny replaced that tree but never took this method, and a
     * consumer that guards on its existence - `if (!scene?.FetchLensflare)
     * return false;` is what skindr's SunControl does - then loads nothing and
     * reports nothing. Same signature as the archived one, so such a consumer
     * needs no change.
     *
     * `AddObject` routes it by `isLensflare`, so it lands in `lensflares`
     * rather than `objects`; the scene renders those two differently.
     *
     * @param {String|Object} options - a res path, or values carrying `resPath`
     * @param {Function} [onProgress]
     * @param {Boolean} [doNotAdd] - fetch it without adding it to the scene
     * @returns {Promise<TnyLensflare>}
     */
    async FetchLensflare(options, onProgress, doNotAdd)
    {
        const lensflare = await TnyLensflare.fetch(options);

        // The archived version gated this on `this.doWatch`, which was a
        // WrappedScene property and does not exist here - reading it would have
        // made the watch dead code. TnyClient's rule is the live one: watch when
        // asked to, or whenever a progress callback was supplied, since supplying
        // one and never being called is the confusing outcome.
        //
        // Wrapped in try/catch for the same reason `Fetch` below is: a Watch
        // rejects if ANY watched resource errors, and the flare is already built
        // by then. `collectsamples.fx` is absent from shipped data, so an
        // occluder resource failing is the normal case rather than the
        // exceptional one - discarding the flare over it would mean never
        // returning one at all.
        if (this.doWatch || onProgress)
        {
            try
            {
                await resMan.Watch(lensflare, onProgress);
            }
            catch (err)
            {
                tw2.Debug({
                    name: "TnyScene",
                    message: "Lensflare loaded with failed resources",
                    data: { err }
                });
            }
        }

        if (!doNotAdd) this.AddObject(lensflare);

        return lensflare;
    }

    /**
     * Fetches a scene.
     * @param {String|Object|Array} options - res path, clear colour, or values
     * @param {Function} [onProgress]
     * @returns {Promise<TnyScene>}
     */
    static async Fetch(options = {}, onProgress)
    {
        if (isString(options)) options = { resPath: options };
        else if (isVector(options)) options = { background: options };

        const { resPath, background, ...values } = options;

        let wrapped;
        if (resPath)
        {
            // Everything ccpwgl reads is the .black container; a res path
            // authored as .red names the same asset.
            const path = resPath.replace(/\.red$/i, ".black");

            // A scene must exist even when its contents do not: a missing
            // nebula or a bad res path leaves an empty EveSpaceScene, never a
            // null scene. Everything the client renders hangs off this.
            try
            {
                // tw2.Fetch, not resMan.FetchObject: the library call is the
                // one that resolves a res path to a constructed eve object.
                wrapped = await tw2.Fetch(path);
            }
            catch (err)
            {
                tw2.Debug({
                    name: "TnyScene",
                    message: `Scene unavailable, using an empty one: ${path}`,
                    data: { err }
                });
            }

            if (wrapped) wrapped._resPath = path;
            else wrapped = new EveSpaceScene();
        }
        else
        {
            wrapped = new EveSpaceScene();
        }

        if (background)
        {
            if (!isVector(background)) throw new TypeError("Invalid background value");
            wrapped.clearColor[0] = background[0];
            wrapped.clearColor[1] = background[1];
            wrapped.clearColor[2] = background[2];
            wrapped.clearColor[3] = background[3] !== undefined ? background[3] : 1;
        }

        const scene = new this(wrapped, values);

        // Watch rejects when any watched resource errors. The scene itself is
        // already built by then, so a failed nebula texture must not discard
        // it: report and hand back the scene regardless.
        try
        {
            await resMan.Watch(scene, onProgress);
        }
        catch (err)
        {
            tw2.Debug({
                name: "TnyScene",
                message: "Scene loaded with failed resources",
                data: { err }
            });
        }

        return scene;
    }

}
