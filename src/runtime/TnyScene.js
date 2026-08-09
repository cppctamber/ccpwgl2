import { resMan, tw2 } from "global";
import { isString, isVector, meta } from "utils";
import { EveSpaceScene } from "eve/EveSpaceScene";
import { Tr2InteriorScene } from "interior/scene/Tr2InteriorScene";


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
@meta.tny.type("TnyScene")
@meta.tny.define("TnyScene")
export class TnyScene extends meta.Model
{

    @meta.struct()
    wrapped = null;

    @meta.list()
    objects = [];

    @meta.list()
    lensflares = [];

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
        // There are two scenes: space and interior.
        if (wrapped && !(wrapped instanceof EveSpaceScene) && !(wrapped instanceof Tr2InteriorScene))
        {
            throw new TypeError("Invalid wrapped scene");
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
