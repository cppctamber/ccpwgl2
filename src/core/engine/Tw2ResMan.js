import { Tr2LightProfileRes } from "../resource/Tr2LightProfileRes";
import { Tw2MotherLode } from "./Tw2MotherLode";
import { Tw2ResManMainThreadLoader } from "./Tw2ResManMainThreadLoader";
import { Tw2ResManWorkerLoader } from "./Tw2ResManWorkerLoader";
import { Tw2LoadingObject } from "../resource/Tw2LoadingObject";
import { Tw2GeometryRes } from "../resource/Tw2GeometryRes";
import { Tw2ColorTextureRes } from "../resource/Tw2ColorTextureRes";
import { Tw2TextureArrayRes } from "../resource/Tw2TextureArrayRes";
import { Tw2TextureAtlasArrayRes } from "../resource/Tw2TextureAtlasArrayRes";
import { Tw2TextureRes } from "../resource/Tw2TextureRes";
import { Tw2EventEmitter } from "../Tw2EventEmitter";
import { Tw2Error, ErrFeatureNotImplemented } from "../Tw2Error";
import { assignIfExists, getPathExtension, isBoolean, isError, isFunction, normalizeResourcePath } from "utils";



export class Tw2ResMan extends Tw2EventEmitter
{
    /** Resource cache and lifecycle root owned by this manager. */
    motherLode = new Tw2MotherLode();
    /** Max seconds per frame spent preparing loaded resources. */
    /**
     * Seconds of resource preparation allowed per frame.
     *
     * Lowered from 0.05 when the budget arithmetic was fixed, and the two go
     * together. 0.05s is three whole 60Hz frames, and the check is post-hoc -
     * taken AFTER a resource returns - so the old value only ever looked
     * survivable because the quadratic drain cut the loop short long before it
     * was reached. Correct arithmetic against 0.05 would genuinely spend 50ms
     * in a 16.7ms frame and stall visibly.
     * @type {Number}
     */
    maxPrepareTime = 0.01;
    /** Maximum number of in-flight raw loads at once. */
    maxConcurrentLoads = 8;
    /** Whether to use worker loader for raw fetch/parse operations. */
    useWorkerLoading = false;
    /** Decode GR2 data in a bounded worker pool when its script is available. */
    useGeometryWorkers = true;
    geometryWorkerUrl = undefined;
    /** Worker script URL used when worker loading is enabled. */
    workerLoaderUrl = null;
    /** RequestInit object or URL-scoped resolver used by all raw fetches. */
    fetchOptions = null;
    /** Auto purge resources when they are no longer watched. */
    autoPurgeResources = true;
    /** Monotonic frame counter used by purge scheduling. */
    activeFrame = 0;
    /** Seconds a resource can stay unused before purge triggers, minimum threshold. */
    purgeTime = 30;

    /**
     * Keeps a `Tw2LoadingObject` after it prepares, so the same `.black` asked
     * for again is constructed from what is already in memory.
     *
     * A loading object used to remove itself from the motherlode the instant it
     * prepared, which is right for something read once and never again, and
     * wrong the moment two consumers are more than a frame apart: each later
     * one re-fetches and re-PARSES a file already read. A layout is the extreme
     * case - a hangar shares its ads, banners and logos across hundreds of
     * placements spread over minutes - but anything building the same object
     * twice pays it.
     *
     * Held objects are cheap. These files are kilobytes (EVE's hangar `.black`
     * run 1.5-5.4 kB), and what is retained is the raw bytes plus a reader over
     * them, not the constructed objects - those belong to whoever asked.
     * @type {Boolean}
     */
    retainLoadingObjects = true;

    /**
     * Optional idle backstop, in seconds since a retained object was last
     * requested. ZERO, and off by default, because elapsed time carries no
     * information about whether a file will be wanted again.
     *
     * A hangar cycles random adverts: the same `.black` may be needed again in
     * thirty seconds, or in ten minutes, and nothing at load time can tell
     * which. Any window wide enough to cover the long gaps is indistinguishable
     * from never evicting, and any window narrow enough to bound memory
     * guarantees a refetch of something still in use. Capacity is the honest
     * bound - see `maxRetainedBytes` - and it is what Carbon uses
     * (MotherLode.h:36, oldest-first over a memory limit).
     *
     * Set it only for a workload known to be one-shot.
     * @type {Number}
     */
    retainedObjectTime = 0;

    /**
     * Bytes of retained source data held before the least recently REQUESTED
     * objects are dropped. Carbon's rule, with the same reasoning: what a cache
     * can measure is what it costs, not whether it will be wanted.
     *
     * Counts the raw bytes each loading object holds, which is what retention
     * actually keeps alive; the objects constructed from them belong to their
     * callers. EVE's hangar `.black` run 1.5-5.4 kB, so this holds thousands.
     * @type {Number}
     */
    maxRetainedBytes = 32 * 1024 * 1024;

    /**
     * Per-sweep time allowance, in seconds, matching `maxPrepareTime`.
     * @type {Number}
     */
    maxRetainedSweepTime = 0.01;

    /** Max milliseconds spent updating watched objects per frame. */
    maxWatchedUpdateTime = 0.05;
    /** Max number of watched objects processed per update pass. */
    maxWatchedCount = 0;
    /** Max wall time in seconds watched updates can run. */
    maxWatchedTime = 240;
    /** Minimum seconds between watched-update sweeps (0 = every frame). */
    minimumWatchUpdate = 0;
    /** Minimum seconds between automatic resource reload checks. */
    minimumAutoReloadSeconds = 1;
    /** Maximum number of auto-reloads started per tick. 0 means unlimited. */
    maxAutoReloadsPerTick = 0;

    /** Remaining prepare time for current tick (seconds). */
    _prepareBudget = 0;
    /** Queue of resources waiting to run Prepare(). */
    _prepareQueue = [];
    /** Index of next _prepareQueue item to process. */
    _prepareQueueHead = 0;
    /** Queue of raw-load tasks waiting for worker/main-thread fetch. */
    _loadQueue = [];
    /** Index of next raw-load task in _loadQueue. */
    _loadQueueHead = 0;
    /** Active raw-load tasks currently processing. */
    _activeLoads = new Set();
    /** Time accumulator for purge cadence, in seconds. */
    _purgeTime = 0;

    /** Retained loading objects, path -> last requested time in ms. */
    _retained = new Map();
    /** Frame counter used for periodic purge window checks. */
    _purgeFrame = 0;
    /** Frame interval threshold before purge runs. */
    _purgeFrameLimit = 1000;
    /** Set of in-flight fetch urls currently awaiting FetchRaw resolution. */
    _pendingLoads = new Set();
    /** Prevents enqueuing duplicate raw-load requests for same resource. */
    _queuedLoads = new Set();
    /**
     * Nothing is fetched until tw2.Initialize opens this gate. Registration is
     * declarative: tw2.Register(config) runs at import and builds parameters
     * whose values are resource paths, and those constructors reach
     * GetResource() -> LoadResource(). Loading there would resolve every url
     * against whatever paths the library happens to ship with, freezing them
     * before the host application has had a chance to configure anything -
     * which is how a public page ended up requesting textures from the
     * developer's local resource server.
     */
    _loadGateOpen = false;
    /** Resources registered before the gate opened, loaded when it does. */
    _deferredLoads = new Set();
    /** Constructors for `dynamic:/<name>/<query>` resources, keyed by name. */
    _dynamicConstructors = new Map();
    /** Consecutive-frame counter used by IsLoading(). */
    _noLoadFrames = 0;
    /** Backing field for system mirror toggle. */
    _systemMirror = false;
    /** Timestamp for next watch sweep when minimumWatchUpdate > 0. */
    _nextWatchUpdate = 0;
    /** Resources currently configured for auto-reload, keyed by resource instance. */
    _autoReload = new Map();
    /** Main-thread raw loader strategy instance. */
    _mainThreadLoader = null;
    /** Worker raw loader strategy instance. */
    _workerLoader = null;
    /** Active raw loader strategy used by QueueLoad(). */
    _loader = null;

    /**
     * Temporary
     */
    set systemMirror(bool)
    {
        this.tw2.Warning({
            name: "System Mirror",
            message: "resMan.systemMirror is deprecated, use resMan.SetSystemMirror instead "
        });

        this._systemMirror = !!bool;
    }

    /**
     * Temporary
     * @returns {*|boolean}
     */
    get systemMirror()
    {
        this.tw2.Warning({
            name: "System Mirror",
            message: "resMan.systemMirror is deprecated, use resMan.GetSystemMirror instead "
        });

        return this._systemMirror;
    }

    /**
     * Gets a count of outstanding work: bytes still arriving, AND resources
     * that have arrived but are still waiting to be built.
     *
     * The prepare queue counts. A resource whose bytes have landed is not
     * ready - it has no mesh, no texture, no constructed object yet - and
     * leaving it out let this read zero while a scene was still assembling.
     * Anything driving a progress bar, or deciding a build had finished, was
     * told so early; a texture still queued reads as done and draws white.
     * @returns {number}
     */
    get pendingLoads()
    {
        return this._pendingLoads.size
            + (this._loadQueue.length - this._loadQueueHead)
            + this.pendingPrepares;
    }

    /**
     * Gets a count of resources waiting to be built.
     * @returns {number}
     */
    get pendingPrepares()
    {
        return this._prepareQueue.length - this._prepareQueueHead;
    }

    /**
     * Constructor
     * @param {Tw2Library} tw2
     */
    constructor(tw2)
    {
        super();
        this.tw2 = tw2;
        this._mainThreadLoader = new Tw2ResManMainThreadLoader(this);
        this._workerLoader = new Tw2ResManWorkerLoader(this);
        this._loader = this._mainThreadLoader;

        this.RegisterResourceConstructor("lightprofile", Tr2LightProfileRes);

        // Built in, as Carbon registers its own from a static constructor.
        //
        // One generated colour per target. They are separate names rather than
        // one adaptive resource because the target has to be pinned before the
        // first bind: dynamic resources are shared, and Tw2TextureRes.Bind
        // adopts the first consumer's sampler type when none is set, so an
        // adaptive colour would hand one consumer's guess to all the others.
        for (const [ name, dimension ] of [
            [ "color", "2d" ],
            [ "colorcube", "cube" ],
            [ "colorarray", "2darray" ],
            [ "colorvolume", "3d" ]
        ])
        {
            this.RegisterResourceConstructor(name, {
                GetResource: query => Tw2ColorTextureRes.FromQuery(query, dimension)
            });
        }

        // Ordered layer paths -> one shared 2D array texture. Keying the
        // cache on the full ordered path list is the point: two effects
        // naming the same detail maps resolve to the same array.
        this.RegisterResourceConstructor("texturearray", {
            GetResource: query => Tw2TextureArrayRes.FromQuery(query)
        });

        // One strip of tiles -> one shared 2D array texture. Same cache
        // reasoning as above, with the tile count part of the key because the
        // same file sliced two ways is two different arrays.
        this.RegisterResourceConstructor("textureatlasarray", {
            GetResource: query => Tw2TextureAtlasArrayRes.FromQuery(query)
        });
    }

    /**
     * Sets resource manager options.
     * Register is a partial config setter: only provided values are applied.
     * Runtime-safe values are updated directly here; bootstrap-only validation/switches are handled via
     * dedicated methods when needed.
     *
     * Note:
     * - A future metadata/decorator system may explicitly mark options that are not safe to change after
     *   initialization.
     *
     * @param {*} [opt]
     */
    Register(opt)
    {
        if (!opt) return;

        if ("events" in opt) this.AddEvents(opt.events);

        assignIfExists(this, opt, [
            "maxPrepareTime",
            "maxConcurrentLoads",
            "workerLoaderUrl",
            "useGeometryWorkers",
            "geometryWorkerUrl",
            "fetchOptions",
            "autoPurgeResources",
            "purgeTime",
            "retainLoadingObjects",
            "retainedObjectTime",
            "maxRetainedBytes",
            "maxRetainedSweepTime",
            "minimumAutoReloadSeconds",
            "maxAutoReloadsPerTick",
            "maxWatchedTime",
            "maxWatchedCount",
            "maxWatchedUpdateTime",
            "minimumWatchUpdate"
        ]);

        if (opt.useWorkerLoading !== undefined)
        {
            this.UseWorkerLoading(opt.useWorkerLoading);
        }
        else if (opt.workerLoading !== undefined)
        {
            this.UseWorkerLoading(opt.workerLoading);
        }

        if (opt.systemMirror !== undefined)
        {
            this.SetSystemMirror(opt.systemMirror)
                .catch(err =>
                {
                    throw err;
                });
        }
    }

    /**
     * Sets system mirror
     * @param {Boolean} bool
     * @returns {Promise<void>}
     */
    async SetSystemMirror(bool)
    {
        this._systemMirror = !!bool;

        const
            geometries = this.motherLode.Filter((key, object) => object instanceof Tw2GeometryRes ? object : null),
            data = [];

        await Promise.all(geometries.map(x => x.SetSystemMirror(this._systemMirror).catch(err => data.push(err))));

        if (data.length)
        {
            this.tw2.Error({
                name: "System Mirror",
                message: "Errors while setting system mirror",
                data
            });
        }
    }

    /**
     * Checks if system mirror is enabled
     * @returns {Boolean}
     */
    IsSystemMirrorEnabled()
    {
        return this._systemMirror;
    }

    /**
     * Sets debug mode
     * @param {Boolean} bool
     */
    SetDebugMode(bool)
    {
        // If debug is true, turn system mirror on
        if (bool)
        {
            this.SetSystemMirror(bool)
                .catch(err =>
                {
                    throw err;
                });
        }
    }

    /**
     * Gets the current debug mode
     * @param {Boolean} bool
     * @return {boolean}
     */
    GetDebugMode(bool)
    {
        return this._systemMirror;
    }

    /**
     * Watches an object and resolves when all of it's resources have completed processing
     * @param {*} object
     * @param {Function} [onProgress]
     * @return {Promise<*>}
     */
    async Watch(object, onProgress)
    {
        return this.motherLode.Watch(object, onProgress);
    }

    /**
     * Unwatches an object and forces its promise to resolve
     * @param {*}  object
     * @return {boolean}
     */
    UnWatch(object)
    {
        return this.motherLode.UnWatch(object);
    }

    /**
     * Purges all watches objects and forces their promises to resolve
     */
    PurgeWatched()
    {
        return this.motherLode.PurgeWatched();
    }

    /**
     * Fires on resource errors
     * - Used when a resource can only be identified by it's path
     * @param {String} path
     * @param {Error} err
     * @returns {Error} err
     */
    OnPathError(path, err = new Tw2Error({ path }))
    {
        path = Tw2ResMan.NormalizePath(path);
        const res = this.motherLode.Find(path);
        if (res) return res.OnError(err);

        this.OnPathEvent(path, "error", err);
        return err;
    }

    /**
     * Removes a resource from the cache.
     *
     * Here rather than on the library: what is cached, and under what key, is
     * the manager's business. The library knows about SOF and dna; the manager
     * knows only paths, and nothing above it needs a way to evict one.
     *
     * @param {String} path
     * @returns {Boolean} true when something was removed
     */
    RemoveResource(path)
    {
        return this.motherLode.Remove(path);
    }

    /**
     * Fires on path events
     * @param {String} path      - Resource path
     * @param {String} eventName - Resource state name
     * @param {*} [log={}]       - Resource log
     * @param {Boolean}          - skipLogging
     */
    OnPathEvent(path, eventName, log = {}, skipLogging)
    {
        const
            res = this.motherLode.Find(path),
            err = isError(log) ? log : undefined;

        if (err)
        {
            this.motherLode.AddError(path, err);
            log = { err, message: err.message };
        }

        log.path = path;
        log.message = log.message || eventName;
        log.name = "Resource manager";

        this.EmitEvent(eventName, path, res, err);

        if (!skipLogging)
        {
            this.tw2.logger.Add(Tw2ResMan.LogType[eventName.toUpperCase()], log);
        }
    }

    /**
     * IsLoading
     * @returns {Boolean}
     *
     */
    IsLoading()
    {
        return this._noLoadFrames < 2;
    }

    /**
     * Clears the motherLode {@link Tw2MotherLode}
     * @param {Function} [onClear] - An optional function which is called on each cleared resource
     */
    Clear(onClear)
    {
        this.motherLode.Clear(onClear);
    }

    /**
     * Unloads and Clears the motherLode {@link Tw2MotherLode}
     * @param {Function} [onClear] - An optional function which is called on each cleared resource
     * @param {eventLog} [eventLog]
     */
    UnloadAndClear(onClear, eventLog)
    {
        this.motherLode.UnloadAndClear(onClear, eventLog);
    }

    /**
     * Sets a resource to auto reload
     * @param {Tw2Resource} res
     * @param {Number|null|undefined} seconds
     * @returns {Boolean} true if auto reloading
     */
    SetAutoReload(res, seconds)
    {
        // Remove
        if (!seconds)
        {
            this._autoReload.delete(res);
            return false;
        }

        const
            ms = Math.max(this.minimumAutoReloadSeconds, seconds) * 1000,
            found = this._autoReload.get(res);

        // Update
        if (found)
        {
            found.ms = ms;
            found.last = this.tw2.now;
        }
        // Add
        else
        {
            this._autoReload.set(res, { ms, last: this.tw2.now });
        }

        return true;
    }

    /**
     * Internal update function. It is called every frame.
     * @returns {Boolean}
     */
    Tick()
    {
        this.PumpLoadQueue();

        // `pendingLoads` now covers the prepare queue as well, so this is the
        // one question it always meant to ask: is there any outstanding work.
        if (this.pendingLoads === 0)
        {
            if (this._noLoadFrames < 2)
            {
                this._noLoadFrames++;
            }
        }
        else
        {
            this._noLoadFrames = 0;
        }

        this._prepareBudget = this.maxPrepareTime;

        const startTime = this.tw2.now;
        while (this._prepareQueue.length > this._prepareQueueHead)
        {
            const [ res, data, xml ] = this._prepareQueue[this._prepareQueueHead];
            this._prepareQueueHead += 1;

            try
            {
                res.Prepare(data, xml);

                // Against the elapsed total, not by subtracting it each time.
                // `startTime` is fixed before the loop, so the old
                // `budget -= (now - startTime)` charged item one's cost again
                // for every later item and the budget drained quadratically:
                // with 0.05s it managed about 20 items a frame where 200 fit,
                // and the cheaper the resources the worse the penalty.
                this._prepareBudget = this.maxPrepareTime - (this.tw2.now - startTime) * 0.001;
                if (this._prepareBudget < 0) break;
            }
            catch (err)
            {
                this._prepareBudget = 0;
                res.OnError(err);
            }
        }

        this._compactQueues();

        let reloadCount = 0;
        for (const [ res, reload ] of this._autoReload)
        {
            if (res.HasErrored())
            {
                this._autoReload.delete(res);
                continue;
            }

            if (this.maxAutoReloadsPerTick > 0 && reloadCount >= this.maxAutoReloadsPerTick)
            {
                break;
            }

            if (startTime - reload.last >= reload.ms)
            {
                reload.last = startTime;
                reloadCount += 1;
                res.Reload({
                    hide: true,
                    message: "Auto reload"
                });
            }
        }

        if (!this.minimumWatchUpdate || this.tw2.now >= this._nextWatchUpdate)
        {
            this.motherLode.UpdateWatched(this.maxWatchedUpdateTime, this.maxWatchedCount, this.maxWatchedTime);
            this._nextWatchUpdate = this.minimumWatchUpdate > 0 ? this.tw2.now + (this.minimumWatchUpdate * 1000) : 0;
        }

        this._purgeTime += this.tw2.dt;

        if (this._purgeTime > 1)
        {
            this.activeFrame += 1;
            this._purgeTime -= Math.floor(this._purgeTime);
            this._purgeFrame += 1;

            // Not while the manager is still working. Anything loading or
            // waiting to prepare is part of a build in progress, and a build is
            // precisely when an already-read file is most likely to be wanted
            // again - evicting during one is how retention ends up fetching the
            // same file twice. Sweeping resumes once things go quiet.
            if (this.retainLoadingObjects && !this.IsLoading())
            {
                this.SweepRetainedObjects(this.maxRetainedSweepTime);
            }

            if (this._purgeFrame >= 5)
            {
                if (this.autoPurgeResources)
                {
                    this.motherLode.PurgeInactive(this._purgeFrame, this._purgeFrameLimit, this.purgeTime);
                }
            }
        }

        return true;
    }

    /**
     * Enables/disables worker backed raw resource loading
     * @param {Boolean} bool
     * @returns {Boolean} true if the worker loader is active
     */
    UseWorkerLoading(bool)
    {
        this.useWorkerLoading = !!bool;

        if (!this.useWorkerLoading)
        {
            this._loader = this._mainThreadLoader;
            return false;
        }

        if (this._workerLoader.Enable(this.workerLoaderUrl))
        {
            this._loader = this._workerLoader;
            return true;
        }

        this.useWorkerLoading = false;
        this._loader = this._mainThreadLoader;
        return false;
    }

    /**
     * Pumps queued raw load tasks up to the configured concurrency limit
     */
    PumpLoadQueue()
    {
        while (this._loadQueue.length > this._loadQueueHead && this._activeLoads.size < this.maxConcurrentLoads)
        {
            const task = this._loadQueue[this._loadQueueHead];
            this._loadQueueHead += 1;
            this._activeLoads.add(task);

            let request;
            try
            {
                request = task.StartRawLoad();
            }
            catch (err)
            {
                this._activeLoads.delete(task);
                this._queuedLoads.delete(task.targetResource);
                this._compactQueues();
                this.PumpLoadQueue();
                if (task.targetResource) task.targetResource.OnError(err);
                continue;
            }

            request.then(response =>
            {
                const res = task.targetResource;
                if (!res || res.HasErrored()) return;

                res.OnLoaded();
                this.Queue(res, response);
            })
                .catch(err =>
                {
                    const res = task.targetResource;
                    if (res) res.OnError(err);
                })
                .finally(() =>
                {
                    this._activeLoads.delete(task);
                    this._queuedLoads.delete(task.targetResource);
                    this._compactQueues();
                    this.PumpLoadQueue();
                });
        }
    }

    /**
     * Adds a resource and response to the prepare queue
     * @param {Tw2Resource} res
     * @param {*} response
     * @param {*} [meta]
     */
    Queue(res, response, meta)
    {
        this._prepareQueue.push([ res, response, meta ]);
    }

    /**
     * Compacts queue arrays by removing consumed items
     */
    _compactQueues()
    {
        if (this._loadQueueHead > 256 && this._loadQueueHead > this._loadQueue.length * 0.5)
        {
            this._loadQueue = this._loadQueue.slice(this._loadQueueHead);
            this._loadQueueHead = 0;
        }

        if (this._prepareQueueHead > 256 && this._prepareQueueHead > this._prepareQueue.length * 0.5)
        {
            this._prepareQueue = this._prepareQueue.slice(this._prepareQueueHead);
            this._prepareQueueHead = 0;
        }
    }

    /**
     * Gets a resource
     * @param {String} path           - The path to load
     * @param {Function} [onResolved] - Callback fired when the object has loaded
     * @param {Function} [onRejected] - Callback fired when the object fails to load
     * @returns {Tw2Resource|*} resource
     */
    GetResource(path, onResolved, onRejected)
    {
        let res;
        path = Tw2ResMan.NormalizePath(path);

        // Check if already loaded
        res = this.motherLode.Find(path);
        if (res)
        {
            res.RegisterCallbacks(onResolved, onRejected);
            return res;
        }

        // Dynamic resources: `dynamic:/<name>/<query>` is handed to whichever
        // constructor registered <name>, and the result is cached under the
        // full path like any other resource - so identical queries share one
        // resource instead of each building its own. This has to sit BELOW the
        // cache lookup, as it does in Carbon's BlueResMan, or every request
        // constructs another copy and the sharing is lost.
        if (path.indexOf(Tw2ResMan.DYNAMIC_PREFIX) === 0)
        {
            const
                rest = path.substring(Tw2ResMan.DYNAMIC_PREFIX.length),
                slash = rest.indexOf("/"),
                name = slash === -1 ? rest : rest.substring(0, slash),
                query = slash === -1 ? "" : rest.substring(slash + 1),
                constructor = this._dynamicConstructors.get(name);

            if (!constructor)
            {
                const err = new ErrFeatureNotImplemented({ feature: `Dynamic resource "${name}"` });
                this.OnPathError(path, err);
                if (onRejected) onRejected(err);
                return null;
            }

            res = constructor.GetResource(query);
            if (!res)
            {
                const err = new Tw2Error({ message: `Could not construct dynamic resource: ${path}` });
                this.OnPathError(path, err);
                if (onRejected) onRejected(err);
                return null;
            }

            res.path = path;
            res.RegisterCallbacks(onResolved, onRejected);
            return this.LoadResource(res);
        }

        // Manually created resources
        if (path.indexOf("manual:/") === 0)
        {
            throw new ErrFeatureNotImplemented({ feature: "Manually created resource" });
        }

        try
        {
            const Constructor = this.tw2.GetExtensionFromPath(path);
            res = new Constructor();
        }
        catch (err)
        {
            this.OnPathError(path, err);
            if (onRejected) onRejected(err);
            return null;
        }

        res.path = path;
        res.RegisterCallbacks(onResolved, onRejected);
        return this.LoadResource(res);
    }

    /**
     * Fetches a resource
     * @param {String} path
     * @returns {Promise<Tw2Resource|null>}
     */
    async FetchResource(path)
    {
        return new Promise((resolve, reject) =>
        {
            this.GetResource(path, resolve, reject);
        });
    }

    /**
     * Gets a resource object
     * @param {String} path           - The path to load
     * @param {Function} [onResolved] - Callback fired when the object has loaded
     * @param {Function} [onRejected] - Callback fired when the object fails to load
     */
    GetObject(path, onResolved, onRejected)
    {
        path = Tw2ResMan.NormalizePath(path);

        // Check if already loaded
        let res = this.motherLode.Find(path);
        if (res)
        {
            // A retained object that is asked for again is in use, whatever the
            // inactivity purge thinks: nothing ever binds a loading object.
            if (this._retained.has(path)) this._retained.set(path, this.tw2.now);
            res.AddObject(onResolved, onRejected);
            return;
        }

        res = new Tw2LoadingObject();
        res.path = path;
        res.AddObject(onResolved, onRejected);
        this.LoadResource(res);
    }

    /**
     * Keeps a prepared loading object instead of dropping it.
     *
     * Called by `Tw2LoadingObject.OnPrepared` in place of the self-eviction it
     * used to do unconditionally. Locked so the inactivity purge cannot take it
     * - the retained sweep owns its lifetime instead, on its own timer.
     *
     * @param {Tw2LoadingObject} res
     * @returns {Boolean} true when retained
     */
    RetainLoadingObject(res)
    {
        if (!this.retainLoadingObjects || !res || !res.path) return false;
        if (res.HasErrored()) return false;
        if (this._retained.has(res.path)) return true;

        res.Lock();
        this._retained.set(res.path, this.tw2.now);
        return true;
    }

    /**
     * Drops one retained loading object and removes it from the motherlode.
     * @param {String} path
     * @returns {Boolean} true when something was dropped
     */
    ReleaseLoadingObject(path)
    {
        if (!this._retained.has(path)) return false;

        const res = this.motherLode.Find(path);
        this._retained.delete(path);
        if (res) res.Unlock();
        this.RemoveResource(path);
        return true;
    }

    /**
     * Drops retained loading objects once they cost more than `maxRetainedBytes`,
     * least recently REQUESTED first, and any past an optional idle backstop.
     *
     * Oldest-first over a size limit is Carbon's rule (MotherLode.h:36) and the
     * only one that survives a workload whose reuse gaps are unpredictable - a
     * hangar re-showing a random advert minutes later is not a stale entry, it
     * is the entry the cache exists for.
     *
     * Budgeted per sweep like the prepare queue: a scene holding thousands of
     * files must not pay for all of them in one frame. Whatever is not reached
     * waits for the next sweep, which costs only the bytes it is still holding.
     *
     * @param {Number} budget - seconds
     * @returns {Number} how many were dropped
     */
    SweepRetainedObjects(budget)
    {
        if (!this._retained.size) return 0;

        const
            startTime = this.tw2.now,
            entries = [],
            expired = [];

        let totalBytes = 0;

        for (const [ path, lastRequested ] of this._retained)
        {
            const res = this.motherLode.Find(path);

            // Never drop one that still owes somebody an object. A long build
            // can queue a request and not reach the construction for it until
            // much later - the prepare queue is budgeted, so a backlog is
            // normal - and the clock runs from the REQUEST. Dropping it in that
            // window would take the reader out from under waiting consumers.
            if (res && ((res._objects && res._objects.length) || (res._waiting && res._waiting.length))) continue;

            const bytes = res && res._view && res._view.byteLength ? res._view.byteLength : 0;
            totalBytes += bytes;
            entries.push({ path, lastRequested, bytes });
        }

        // The idle backstop, off unless someone sets it.
        if (this.retainedObjectTime > 0)
        {
            const deadline = this.retainedObjectTime * 1000;
            for (let i = 0; i < entries.length; i++)
            {
                if (startTime - entries[i].lastRequested >= deadline) expired.push(entries[i]);
            }
        }

        // Then oldest-first until back under the size limit. Sorted only when
        // over it, so the common case walks the map once and stops.
        if (totalBytes > this.maxRetainedBytes)
        {
            const byAge = entries
                .filter(entry => !expired.includes(entry))
                .sort((a, b) => a.lastRequested - b.lastRequested);

            let over = totalBytes - this.maxRetainedBytes;
            for (let i = 0; i < byAge.length && over > 0; i++)
            {
                expired.push(byAge[i]);
                over -= byAge[i].bytes;
            }
        }

        let dropped = 0;
        for (let i = 0; i < expired.length; i++)
        {
            this.ReleaseLoadingObject(expired[i].path);
            dropped++;

            // Charged from the top of the sweep, so the budget is what the
            // sweep has spent rather than what this one drop cost.
            if ((this.tw2.now - startTime) / 1000 >= budget) break;
        }

        return dropped;
    }

    /**
     * Fetches an object
     * @param {String} path
     * @returns {Promise<any>}
     */
    async FetchObject(path)
    {
        return new Promise((resolve, reject) =>
        {
            this.GetObject(path, resolve, reject);
        });
    }

    /**
     * Fetches a resource or loading object
     * @param {String} path
     * @param {String|Function} [responseType] Deprecated raw fetch compatibility
     * @returns {Promise<Tw2Resource|Object|*>}
     */
    async Fetch(path, responseType)
    {
        if (responseType !== undefined)
        {
            return this.FetchRaw(path, responseType);
        }

        path = Tw2ResMan.NormalizePath(path);
        const ext = getPathExtension(path);

        if (this.tw2.extensions.IsLoadingObject(ext))
        {
            return this.FetchObject(path);
        }

        return this.FetchResource(path);
    }

    /**
     * Loads a resource
     * TODO: Create a res object for each quality level rather than just one
     * @param {Tw2Resource|*} res
     * @param {eventLog} [eventLog]
     */
    LoadResource(res, eventLog)
    {
        this.motherLode.Add(res.path, res);

        // Don't load if already errored
        if (res.HasErrored())
        {
            return res;
        }
        if (res.HasRequested() || this._queuedLoads.has(res))
        {
            return res;
        }

        // Before tw2.Initialize, hold the resource without touching the
        // network: its url is resolved when the gate opens, by which point
        // paths are final. See _loadGateOpen.
        if (!this._loadGateOpen)
        {
            this._deferredLoads.add(res);
            return res;
        }

        try
        {
            // A dynamic resource rasterizes itself from its own path; there is
            // no url to resolve, and asking for one throws on the prefix.
            const url = res.path.indexOf(Tw2ResMan.DYNAMIC_PREFIX) === 0
                ? res.path
                : this.tw2.GetURL(res.path);

            if (!res.OnRequested(eventLog))
            {
                return res;
            }

            if (res.DoCustomLoad && res.DoCustomLoad(url, getPathExtension(url)))
            {
                return res;
            }

            if (res.HasErrored())
            {
                return res;
            }

            this.QueueLoad(res, url, res.requestResponseType);
        }
        catch (err)
        {
            res.OnError(err);
        }

        return res;
    }

    /**
     * Registers a constructor for `dynamic:/<name>/<query>` resources. The
     * constructor is handed the query and returns an unloaded resource; it
     * must not touch the device, since registration can happen before one
     * exists. Mirrors Carbon's IBlueResMan::RegisterResourceConstructor.
     * @param {String} name
     * @param {{ GetResource: Function }} constructor
     */
    RegisterResourceConstructor(name, constructor)
    {
        if (!constructor || !isFunction(constructor.GetResource))
        {
            throw new Tw2Error({ message: `Dynamic resource constructor "${name}" must implement GetResource` });
        }
        this._dynamicConstructors.set(name.toLowerCase(), constructor);
    }

    /**
     * Registers a lazy, shared dynamic video playlist.
     * Browser adaptation of videoplayer/playlistresource.py's resource
     * constructor and shuffled_videos. The host supplies paths; registration
     * does no loading. A single texture/decoder is shared per dynamic path.
     * Re-registration changes future resources; existing cached ones retain
     * their playlist until unloaded and removed from the resource cache.
     * @param {String} name Name following dynamic:/, e.g. hangarvideos
     * @param {Array<String>} paths Browser-playable video resource paths
     * @returns {String} First path in the shuffled playlist
     */
    RegisterVideoPlaylist(name, paths)
    {
        const videos = paths.filter(path => /\.(webm|mp4|ogg)$/i.test(path));
        if (!videos.length) throw new Tw2Error({ message: "Video playlist requires a playable video path" });
        for (let i = videos.length - 1; i > 0; i--)
        {
            const j = Math.floor(Math.random() * (i + 1));
            [ videos[i], videos[j] ] = [ videos[j], videos[i] ];
        }
        const manager = this;
        this.RegisterResourceConstructor(name, {
            /** Creates the shared texture without starting playback. */
            GetResource()
            {
                const resource = new Tw2TextureRes();
                let index = -1;
                let failures = 0;
                resource.DoCustomLoad = function ()
                {
                    index = (index + 1) % videos.length;
                    const sourcePath = videos[index];
                    // Resolve when the load gate opens, against the host's
                    // final paths. Keep this.path as the shared dynamic key.
                    const url = manager.tw2.GetURL(sourcePath);
                    const loading = Tw2TextureRes.prototype.DoCustomLoad.call(
                        this, url, getPathExtension(sourcePath)
                    );
                    const runtime = this._runtime;
                    runtime.cycle = false;
                    runtime.onEnded = () => this.Reload();
                    const video = runtime.el;
                    video.addEventListener("playing", () => { failures = 0; });
                    const onError = video.onerror;
                    video.onerror = () =>
                    {
                        if (this._runtime !== runtime || runtime.el !== video) return;
                        // Deliberate browser deviation: Carbon retries forever.
                        // Stop after a completely failed cycle to avoid endless
                        // network traffic for an unavailable application list.
                        if (++failures >= videos.length) return onError();
                        manager.RemovePendingLoad(url);
                        this.Unload({ hide: true });
                        manager.LoadResource(this);
                    };
                    return loading;
                };
                return resource;
            }
        });
        return videos[0];
    }

    /**
     * Removes a dynamic resource constructor
     * @param {String} name
     * @returns {Boolean} whether one was registered
     */
    UnregisterResourceConstructor(name)
    {
        return this._dynamicConstructors.delete(name.toLowerCase());
    }

    /**
     * Opens the load gate and flushes everything registered before it, so the
     * urls are resolved against the paths the host application configured
     * rather than the library's shipped defaults. Called by tw2.Initialize
     * once paths are registered and the device exists; safe to call again.
     * @returns {Number} how many held resources were released
     */
    OpenLoadGate()
    {
        if (this._loadGateOpen) return 0;
        this._loadGateOpen = true;

        const held = [ ...this._deferredLoads ];
        this._deferredLoads.clear();
        for (const res of held) this.LoadResource(res);
        return held.length;
    }

    /**
     * Queues a raw resource load
     * @param {Tw2Resource} res
     * @param {String} url
     * @param {String|Function|null} responseType
     * @returns {Tw2LoadingObject}
     */
    QueueLoad(res, url, responseType)
    {
        if (this._queuedLoads.has(res))
        {
            return null;
        }

        const task = new Tw2LoadingObject();
        task.ConfigureRawLoad(res, url, responseType, this._loader);
        this._queuedLoads.add(res);
        this._loadQueue.push(task);
        this.PumpLoadQueue();
        return task;
    }

    /**
     * Adds a pending url
     * @param {String} url
     */
    AddPendingLoad(url)
    {
        this._pendingLoads.add(url);
    }

    /**
     * Removes a pending url
     * @param {String} url
     */
    RemovePendingLoad(url)
    {
        this._pendingLoads.delete(url);
    }

    /**
     * Fetches raw data
     * @param {String} url
     * @param {String|Function} responseType
     * @returns {Promise}
     */
    async FetchRaw(url, responseType)
    {
        this.AddPendingLoad(url);

        return fetch(url, this.GetFetchOptions(url))
            .then(response =>
            {
                if (!response.ok)
                {
                    throw response;
                }

                if (isFunction(responseType))
                {
                    return responseType(response);
                }

                switch (responseType)
                {
                    case "arraybuffer":
                        return response.arrayBuffer();

                    case "text":
                        return response.text();

                    case "json":
                        return response.json();

                    case "blob":
                        return response.blob();

                    default:
                        throw new Error("Invalid fetch type: " + responseType);
                }
            })
            .then(result =>
            {
                this.RemovePendingLoad(url);
                return result;
            })
            .catch(err =>
            {
                this.RemovePendingLoad(url);

                if (err.text)
                {
                    return err.text()
                        .then(text =>
                        {
                            let { status, statusText } = err;
                            let json;

                            try
                            {
                                json = JSON.parse(text);
                                statusText = json.message || json.msg || json.error || json.err;
                                if (isBoolean(statusText)) statusText = undefined;
                            }
                            catch (err)
                            {
                                statusText = "Failed to fetch resource";
                            }

                            throw new ErrHTTPStatus({ status, statusText, json });
                        });
                }
                else
                {
                    throw err;
                }
            });
    }

    GetFetchOptions(url)
    {
        const options = isFunction(this.fetchOptions)
            ? this.fetchOptions(url)
            : this.fetchOptions;

        if (options !== null && options !== undefined && typeof options !== "object")
        {
            throw new TypeError("Resource fetch options must be an object or URL resolver");
        }

        return options || undefined;
    }

    /**
     * Builds a url from a resource path
     * @param {String} path
     * @returns {String}
     * @throws {ErrStoreKeyUnregistered} When passed a url with an unregistered resource prefix
     */
    BuildUrl(path)
    {
        return this.tw2.GetURL(path);
    }

    /**
     * Normalizes a file path by making it lower case and replaces all '\\' with '/'
     * @param {String} path
     * @returns {String}
     */
    static NormalizePath(path)
    {
        return normalizeResourcePath(path);
    }

    /**
     * Path prefix for resources built by a registered constructor rather than
     * fetched, as in Carbon: `dynamic:/<name>/<query>`
     * @type {String}
     */
    static DYNAMIC_PREFIX = "dynamic:/";

    /**
     * Log type
     * @type {*}
     */
    static LogType = {
        ERROR: "error",
        PURGED: "info",
        UNLOADED: "info",
        REQUESTED: "info",
        RELOADING: "info",
        LOADED: "info",
        PREPARED: "log",
        WARNING: "warn",
        DEBUG: "debug"
    };

}

/**
 * Throws on http request errors
 */
export class ErrHTTPRequest extends Tw2Error
{
    constructor(data)
    {
        super(data, "Communication error while requesting resource");
    }
}

/**
 * Throws on http status errors
 */
export class ErrHTTPStatus extends Tw2Error
{
    constructor(data)
    {
        super(data, "%statusText=Communication status error while loading resource% (%status%)");
    }
}
