import { resMan, tw2 } from "global";
import { isString, isVector, meta } from "utils";
import { Tw2Picker, Tw2RayCaster } from "core";
import { EveSpaceScene } from "eve/EveSpaceScene";
import { TnyClient } from "./TnyClient";
import { TnyLensflare } from "./objects/TnyLensflare";
import { TnyPlanet } from "./objects/TnyPlanet";
import { TnyShip } from "./objects/TnyShip";
import { TnySpaceObject } from "./objects/TnySpaceObject";
import { TnyStationary } from "./objects/TnyStationary";
import { TnyStrategicCruiser } from "./objects/TnyStrategicCruiser";


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
        // Space only. Interior scenes own their character-placeable lifecycle;
        // the standalone character demo supplies its own scene wrapper.
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

            if (object instanceof TnyStrategicCruiser)
            {
                object.GetParts(objects);
                continue;
            }

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
     * Await an object's resources before it goes into the scene.
     *
     * Moved here from TnyClient with the rest of the fetch family. With it
     * set, a hull is fully built before anything can draw it; without it the
     * object is added straight away and fills in as it loads, which is what
     * makes something appear immediately.
     *
     * `FetchLensflare` used to read this off the scene while it only existed
     * on the client, so the flare watch was dead code. It is a real property
     * now.
     * @type {Boolean}
     */
    doWatch = false;

    /**
     * Resolves a runtime class by name.
     *
     * The store is class-level on `TnyClient`, so this works without a client
     * instance - a scene is reachable before any client has seen it, and one
     * that could not resolve its own classes could not fetch into itself.
     * @param {String} name
     * @returns {?Function}
     */
    GetClass(name)
    {
        return TnyClient.getClass(name);
    }

    /**
     * True if a class name is registered.
     *
     * Asked before `GetClass`, because the store THROWS its own
     * `ErrStoreKeyUnregistered` on a miss. Letting that out of a scene fetch
     * reports an engine store key rather than the bad `type` the caller wrote.
     * @param {String} name
     * @returns {Boolean}
     */
    HasClass(name)
    {
        return TnyClient.hasClass(name);
    }

    /**
     * Fetches by NAMED type, and unless told not to, puts it in THIS scene.
     *
     * The scene owns this, not the client. A client holds whichever scene is
     * active; it does not get to decide that the active one is the right home
     * for an object being built. A consumer with several scenes alive - a page
     * that swaps backdrops, a preview beside a stage - would otherwise have
     * every fetch land wherever the last swap left the client, which is a race
     * rather than a choice.
     *
     * `tw2.Fetch` already builds from either a dna string or a res path, so
     * there is one path here and not two. Resolve whatever the caller named
     * down to a source, build it, then look at the eve root class that came
     * back and wrap it in the matching Tny class.
     *
     * Inferring AFTER the build is what makes the named fetchers unnecessary
     * as dispatch: the object says what it is. `type` is still accepted for a
     * caller that wants to force a wrapper.
     *
     *     scene.Fetch(dna)                  // -> TnyShip / TnyStationary / ...
     *     scene.Fetch(typeID)               // resolves to dna first
     *     scene.Fetch(skinrUUID)            // ditto, pattern injected
     *     scene.Fetch("res:/.../x.black")   // -> whatever it built
     *     scene.Fetch([ a, b ])             // an array in, an array out
     *     scene.Fetch(dna, null, true)      // built, not added
     *
     * Signature follows WrappedScene's fetchers - `(options, onProgress,
     * doNotAdd)` - because callers of those already know it. Passing
     * `onProgress` turns watching on for that fetch: asking to be told about
     * loading is asking for the load to be waited on.
     *
     * @param {String|Number|Object|Array} options - see TnySpaceObject.resolve
     * @param {String} [options.type] - force a registered class instead of inferring
     * @param {Function} [onProgress] - resource watcher callback; implies doWatch
     * @param {Boolean} [doNotAdd] - hand it back without adding it
     * @returns {Promise<*|Array>} the object, or an array of them
     */
    async Fetch(options, onProgress, doNotAdd)
    {
        if (Array.isArray(options))
        {
            return Promise.all(options.map(x => this.Fetch(x, onProgress, doNotAdd)));
        }

        // A named type skips inference entirely and uses that class's own
        // fetch - which is how a celestial gets here, since it assembles from
        // sde parts rather than from one resource.
        if (options && typeof options === "object" && options.type)
        {
            const { type, ...rest } = options;
            if (!this.HasClass(type)) throw new TypeError(`Unregistered object type: ${type}`);
            return this.constructor._fetch(this, this.GetClass(type), rest, onProgress, doNotAdd);
        }

        const { dna, resPath, blendMode, awaitResources, ...values } = await TnySpaceObject.resolve(options);
        const source = dna || resPath;

        const wrapped = await tw2.Fetch(source, awaitResources);
        wrapped._resPath = source;

        // Carbon compiles the blend mode in as a permutation, so it cannot ride
        // along in the dna.
        if (blendMode && wrapped.SetBlendMode) wrapped.SetBlendMode(blendMode);

        const object = this.constructor.getTnyClass(wrapped).fromWrapped(wrapped, values);
        if (object.RebuildSlots) await object.RebuildSlots();

        return this.constructor._attach(this, object, onProgress, doNotAdd);
    }

    /**
     * The Tny class that wraps a built eve object.
     *
     * The name at each level comes from `meta.Model.getClassName`, which reads
     * the `"type"` metadata `@meta.define` stamped on the class - a real
     * string that minification cannot rewrite, unlike `constructor.name`. It
     * is not asked of the constructor store either: a class is registered
     * there under both its internal name and the name CCP knows it by, so
     * "the" name of a constructor is not a well-defined question of the store.
     * The class reports its own.
     *
     * Walks up the prototype chain rather than using `instanceof`. ccpwgl's
     * `EveStation2` extends `EveShip2`, so an `instanceof` ladder silently
     * depends on being written most-specific-first; the walk cannot get that
     * wrong, and it carries a consumer's own subclass - which reports its own
     * name and so misses the map - up to its base's wrapper.
     *
     * @param {*} wrapped - a built eve object
     * @returns {Function} a Tny class
     */
    static getTnyClass(wrapped)
    {
        let proto = wrapped && Object.getPrototypeOf(wrapped);
        while (proto && proto.constructor)
        {
            const Class = this.EVE_CLASS[meta.Model.getClassName(proto.constructor)];
            if (Class) return Class;
            proto = Object.getPrototypeOf(proto);
        }
        return TnySpaceObject;
    }

    /**
     * Eve root class to the Tny class that wraps it.
     *
     * KNOWN LIMIT: ccpwgl's sof builder has one branch,
     * `buildClass === 2 ? new EveStation2() : new EveShip2()`
     * (`src/sof/EveSOFData.js:1209`), so buildClass 1 (mobile), 3 (swarm) and
     * 4 (extension) all arrive here as `EveShip2` and come back `TnyShip`.
     * A citadel therefore wraps as a ship. It still WORKS - `TnyShip` extends
     * `TnyMobile`, so the turret slots a citadel needs are there - but the
     * class is not what Carbon would have built. The fix belongs in the
     * builder: teach it `EveMobile` and `EveSwarm` and this map is right for
     * free, with no dispatch table to keep in step.
     *
     * Keyed by the eve class's own reported name (`@meta.define`), valued with
     * the Tny class itself - these are all imported here anyway, so there is
     * nothing for a name to buy on that side.
     * @type {Object<String, Function>}
     */
    static EVE_CLASS = {
        EvePlanet: TnyPlanet,
        EveOldPlanet: TnyPlanet,
        EveLensflare: TnyLensflare,
        EveStation2: TnyStationary,
        EveShip2: TnyShip,
        EveShip: TnyShip,
        EveSpaceObject: TnySpaceObject,
        EveEffectRoot2: TnySpaceObject,
        EveEffectRoot: TnySpaceObject,
        EveTransform: TnySpaceObject
    };

    /**
     * The body every fetcher here shares: build an unattached object through
     * the class's own static `fetch`, optionally wait on its resources, add it.
     *
     * Static, and the scene is an argument rather than `this`, so the scene an
     * object lands in is named at the call site every time. That is the whole
     * point of the change this belongs to - a fetch must never resolve its
     * destination from ambient state.
     *
     * @param {TnyScene} scene - the scene the result belongs to
     * @param {Function} Constructor - a runtime class with a static fetch
     * @param {String|Number|Object} [options]
     * @param {Function} [onProgress]
     * @param {Boolean} [doNotAdd]
     * @returns {Promise<*>}
     */
    static async _fetch(scene, Constructor, options, onProgress, doNotAdd)
    {
        if (!Constructor || !Constructor.fetch) throw new TypeError("Unfetchable object type");
        return this._attach(scene, await Constructor.fetch(options), onProgress, doNotAdd);
    }

    /**
     * The tail every fetcher shares: optionally wait on resources, then add.
     *
     * Separate from `_fetch` because `FetchResPath` has to BUILD before it can
     * know which class to wrap in, so it arrives here with an object already
     * in hand.
     *
     * @param {TnyScene} scene - the scene the object belongs to
     * @param {*} object
     * @param {Function} [onProgress]
     * @param {Boolean} [doNotAdd]
     * @returns {Promise<*>}
     */
    static async _attach(scene, object, onProgress, doNotAdd)
    {
        if (!scene || !scene.AddObject) throw new TypeError("Invalid scene");

        if (scene.doWatch || onProgress)
        {
            await this.watchQuietly(object, onProgress);
        }

        if (!doNotAdd) scene.AddObject(object);
        return object;
    }

    /**
     * Watches an object's resources without letting one bad resource throw.
     *
     * `resMan.Watch` rejects when ANY watched resource errors. The object is
     * built by then, so a failed texture would otherwise discard a usable
     * hull - report it and carry on, which is what `Fetch` does with a failed
     * nebula and `FetchLensflare` with an absent occluder.
     *
     * @param {*} object
     * @param {Function} [onProgress]
     * @returns {Promise<*>} the object
     */
    static async watchQuietly(object, onProgress)
    {
        try
        {
            await resMan.Watch(object, onProgress || undefined);
        }
        catch (err)
        {
            tw2.Debug({
                name: "TnyScene",
                message: "Object loaded with failed resources",
                data: { err }
            });
        }
        return object;
    }

    /**
     * Fetches a ship. An alias for `Fetch`, kept because callers say it and it
     * reads better at a call site that knows what it is asking for - but the
     * built object still decides its own class.
     * @param {String|Number|Object} options - see TnySpaceObject.resolve
     * @param {Function} [onProgress]
     * @param {Boolean} [doNotAdd]
     * @returns {Promise<*>}
     */
    async FetchShip(options, onProgress, doNotAdd)
    {
        return this.Fetch(options, onProgress, doNotAdd);
    }

    /**
     * Fetches a celestial - planet, moon or sun.
     *
     * One method, because there is one class. Carbon has a single celestial
     * class and a sun is one of them; kind is content, not type. Pass
     * `moonID` or `planetID` and the SDE decides what gets assembled - see
     * `TnyPlanet`.
     *
     * @param {Number|Object} options - see TnyPlanet.fetch
     * @param {Function} [onProgress] - resource watcher callback
     * @param {Boolean} [doNotAdd] - hand it back without adding it
     * @returns {Promise<TnyPlanet>}
     */
    async FetchPlanet(options, onProgress, doNotAdd)
    {
        return this.constructor._fetch(this, TnyPlanet, options, onProgress, doNotAdd);
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
        // Shares the body with every other member of the family, so the watch
        // rule and the failed-resource tolerance are stated once.
        //
        // Tolerating a failed resource matters more here than anywhere else:
        // `collectsamples.fx` is absent from shipped data, so an occluder
        // failing is the NORMAL case. Letting a Watch rejection through would
        // mean never returning a flare at all.
        return this.constructor._fetch(this, TnyLensflare, options, onProgress, doNotAdd);
    }

    /**
     * Adopts another scene's SKY, without replacing this scene.
     *
     * A nebula ships as a serialised `EveSpaceScene` (`res:/.../x_cube.black`)
     * that exists only to carry a sky: three environment maps, a background
     * effect, and the scene values authored to light a hull standing in it.
     * This fetches that scene and copies those onto `wrapped`, so everything
     * already in this scene stays exactly where it is - which is the whole
     * point, and why this is not `TnyScene.fetch`.
     *
     * THE VALUES COME WITH THE PICTURE. Adopting the maps alone leaves the
     * scene on its constructor defaults - intensity 1, reflection 1, a black
     * ambient - while the backdrop changes, so the hull ends up lit for a sky
     * it is no longer in. The SUN is part of that: every nebula is authored
     * with a light that suits it. A caller that keeps a sun of its own must
     * re-assert it AFTER this resolves, and the same goes for anything written
     * into the background effect - stars, fog - because this replaces it.
     *
     * Values are COPIED, never assigned across. They are typed arrays on the
     * fetched nebula, so handing this scene the same array means a later edit
     * to the scene's sun silently rewrites the cached nebula, and the next
     * fetch of that sky arrives already wearing the change.
     *
     * @param {String} path - res path of a nebula scene
     * @param {Boolean} [awaitResources] - wait for the environment maps
     * @returns {Promise<Boolean>} false when there was nothing to adopt
     */
    async FetchNebula(path, awaitResources)
    {
        const scene = this.wrapped;

        if (!scene || !path) return false;

        // A cube map is a sky too, but it is a PICTURE rather than a scene: it
        // carries no values to adopt, and its reflection and blur are sibling
        // files (`_cube_refl`, `_cube_blur`) whose absence must fall back to
        // black rather than to the plain cube. Only a caller that knows which
        // cubes it has can choose those, so it sets the three maps itself.
        if (/\.(?:dds|png|qube)$/i.test(path))
        {
            throw new TypeError(`Not a nebula scene: "${path}" - `
                + "set SetEnvMapReflection/Diffuse/Blur directly for a cube map");
        }

        // As everywhere else here, `.red` names the same asset as `.black`.
        const nebula = await tw2.Fetch(path.replace(/\.red$/i, ".black"));

        if (!nebula) return false;

        // `envMap1ResPath`, NOT `envMapRes1Path`. The transposed spelling reads
        // undefined, so the diffuse environment falls back to black - which
        // shows as black patches on reflective hulls, worst on Amarr.
        await Promise.all([
            scene.SetEnvMapReflection(nebula.envMapResPath, awaitResources),
            scene.SetEnvMapDiffuse(nebula.envMap1ResPath, awaitResources),
            scene.SetEnvMapBlur(nebula.envMap2ResPath, awaitResources)
        ]);

        if (scene.backgroundEffect && nebula.backgroundEffect)
        {
            scene.backgroundEffect.SetTextures(nebula.backgroundEffect.GetTextures());
            scene.backgroundEffect.SetParameters(nebula.backgroundEffect.GetParameters());
        }

        for (const key of TnyScene.NEBULA_VALUES)
        {
            const value = nebula[key];

            if (value === undefined) continue;

            if (ArrayBuffer.isView(value) || Array.isArray(value))
            {
                const held = scene[key];

                if (held && held.set && held.length >= value.length) held.set(value);
                else scene[key] = value.slice();

                continue;
            }

            scene[key] = value;
        }

        scene.UpdateValues();

        return true;
    }

    /**
     * The scene values a nebula authors for itself, adopted with its picture.
     * @type {Array<String>}
     */
    static NEBULA_VALUES = [
        "nebulaIntensity",
        "reflectionIntensity",
        "sunDirection",
        "sunDiffuseColor",
        "ambientColor",
        "fogColor",
        "fogStart",
        "fogEnd",
        "fogMax"
    ];

    /**
     * Fetches a SCENE - the static, as against the instance `Fetch` above,
     * which puts something into a scene that already exists.
     * @param {String|Object|Array} options - res path, clear colour, or values
     * @param {Function} [onProgress]
     * @returns {Promise<TnyScene>}
     */
    static async fetch(options = {}, onProgress)
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
