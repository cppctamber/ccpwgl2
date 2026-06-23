import { Tw2MotherLode } from "./Tw2MotherLode";
import { Tw2LoadingObject } from "../resource/Tw2LoadingObject";
import { Tw2GeometryRes } from "../resource/Tw2GeometryRes";
import { Tw2EventEmitter } from "../Tw2EventEmitter";
import { Tw2Error, ErrFeatureNotImplemented } from "../Tw2Error";
import { assignIfExists, getPathExtension, isBoolean, isError, isFunction, isString } from "utils";



export class Tw2ResMan extends Tw2EventEmitter
{

    motherLode = new Tw2MotherLode();
    maxPrepareTime = 0.05;
    maxConcurrentLoads = 8;
    useWorkerLoading = false;
    workerLoaderUrl = null;
    autoPurgeResources = true;
    activeFrame = 0;
    purgeTime = 30;

    maxWatchedUpdateTime = 0.05;
    maxWatchedCount = 0;
    maxWatchedTime = 240;

    _prepareBudget = 0;
    _prepareQueue = [];
    _loadQueue = [];
    _activeLoads = [];
    _purgeTime = 0;
    _purgeFrame = 0;
    _purgeFrameLimit = 1000;
    _pendingLoads = [];
    _noLoadFrames = 0;
    _systemMirror = false;

    _autoReload = [];
    minimumAutoReloadSeconds = 1;
    _mainThreadLoader = null;
    _workerLoader = null;
    loader = null;

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
     * Gets a count of pending loads
     * @returns {number}
     */
    get pendingLoads()
    {
        return this._pendingLoads.length + this._loadQueue.length;
    }

    /**
     * Constructor
     * @param {Tw2Library} tw2
     */
    constructor(tw2)
    {
        super();
        this.tw2 = tw2;
        this._mainThreadLoader = new Tw2MainThreadResourceLoader(this);
        this._workerLoader = new Tw2WorkerResourceLoader(this);
        this.loader = this._mainThreadLoader;
    }

    /**
     * Sets resource manager options
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
            "autoPurgeResources",
            "purgeTime",
            "maxWatchedTime",
            "maxWatchedCount",
            "maxWatchedUpdateTime"
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
            this._autoReload.splice(this._autoReload.indexOf(res), 1);
            return false;
        }

        const
            ms = Math.max(this.minimumAutoReloadSeconds, seconds) * 1000,
            found = this._autoReload.find(x => x.res === res);

        // Update
        if (found)
        {
            found.ms = ms;
            found.last = 0;
        }
        // Add
        else
        {
            this._autoReload.push({ res, ms, last: 0 });
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

        if (this._prepareQueue.length === 0 && this.pendingLoads === 0)
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
        while (this._prepareQueue.length)
        {
            const [ res, data, xml ] = this._prepareQueue[0];

            this._prepareQueue.shift();

            try
            {
                res.Prepare(data, xml);
                this._prepareBudget -= (this.tw2.now - startTime) * 0.001;
                if (this._prepareBudget < 0) break;
            }
            catch (err)
            {
                this._prepareBudget = 0;
                res.OnError(err);
            }
        }

        for (let i = 0; i < this._autoReload.length; i++)
        {
            if (startTime - this._autoReload[i].last >= this._autoReload[i].ms)
            {
                this._autoReload[i].last = startTime;
                this._autoReload[i].res.Reload({
                    hide: true,
                    message: "Auto reload"
                });
            }
        }

        this.motherLode.UpdateWatched(this.maxWatchedUpdateTime, this.maxWatchedCount, this.maxWatchedTime);

        this._purgeTime += this.tw2.dt;

        if (this._purgeTime > 1)
        {
            this.activeFrame += 1;
            this._purgeTime -= Math.floor(this._purgeTime);
            this._purgeFrame += 1;

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
            this.loader = this._mainThreadLoader;
            return false;
        }

        if (this._workerLoader.Enable(this.workerLoaderUrl))
        {
            this.loader = this._workerLoader;
            return true;
        }

        this.useWorkerLoading = false;
        this.loader = this._mainThreadLoader;
        return false;
    }

    /**
     * Pumps queued raw load tasks up to the configured concurrency limit
     */
    PumpLoadQueue()
    {
        while (this._loadQueue.length && this._activeLoads.length < this.maxConcurrentLoads)
        {
            const task = this._loadQueue.shift();
            this._activeLoads.push(task);

            task.StartRawLoad()
                .then(response =>
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
                    const index = this._activeLoads.indexOf(task);
                    if (index !== -1)
                    {
                        this._activeLoads.splice(index, 1);
                    }
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

        // TODO: Dynamic resources
        if (path.indexOf("dynamic:/") === 0)
        {
            throw new ErrFeatureNotImplemented({ feature: "Dynamic resources" });
        }

        // Check if already loaded
        res = this.motherLode.Find(path);
        if (res)
        {
            res.RegisterCallbacks(onResolved, onRejected);
            return res;
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
            res.AddObject(onResolved, onRejected);
            return;
        }

        res = new Tw2LoadingObject();
        res.path = path;
        res.AddObject(onResolved, onRejected);
        this.LoadResource(res);
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

        try
        {
            const url = this.tw2.GetURL(res.path);

            res.OnRequested(eventLog);

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
     * Queues a raw resource load
     * @param {Tw2Resource} res
     * @param {String} url
     * @param {String|Function|null} responseType
     * @returns {Tw2LoadingObject}
     */
    QueueLoad(res, url, responseType)
    {
        const task = new Tw2LoadingObject();
        task.ConfigureRawLoad(res, url, responseType, this.loader);
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
        this._pendingLoads.push(url);
    }

    /**
     * Removes a pending url
     * @param {String} url
     */
    RemovePendingLoad(url)
    {
        const index = this._pendingLoads.indexOf(url);
        if (index !== -1)
        {
            this._pendingLoads.splice(index, 1);
        }
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

        return fetch(url)
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
        path = path.toLowerCase();
        path = path.replace("\\", "/");
        return path;
    }

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


export class Tw2MainThreadResourceLoader
{
    /**
     * Constructor
     * @param {Tw2ResMan} resMan
     */
    constructor(resMan)
    {
        this.resMan = resMan;
    }

    /**
     * Fetches raw resource data
     * @param {String} url
     * @param {String|Function|null} responseType
     * @returns {Promise<*>}
     */
    Fetch(url, responseType)
    {
        return this.resMan.FetchRaw(url, responseType);
    }
}


export class Tw2WorkerResourceLoader
{
    /**
     * Constructor
     * @param {Tw2ResMan} resMan
     */
    constructor(resMan)
    {
        this.resMan = resMan;
        this.worker = null;
        this.url = null;
        this._nextId = 1;
        this._pending = new Map();
        this._failed = false;
    }

    /**
     * Enables the worker
     * @param {String|null} [workerUrl]
     * @returns {Boolean}
     */
    Enable(workerUrl)
    {
        if (this.worker) return true;
        if (this._failed) return false;
        if (typeof Worker === "undefined") return false;

        try
        {
            this.url = workerUrl || this.constructor.CreateObjectUrl();
            this.worker = new Worker(this.url);
            this.worker.onmessage = event => this.OnMessage(event.data);
            this.worker.onerror = err => this.OnWorkerError(err);
            return true;
        }
        catch (err)
        {
            this.Disable(err);
            return false;
        }
    }

    /**
     * Disables the worker and rejects pending worker requests
     * @param {*} [err]
     */
    Disable(err)
    {
        if (this.worker)
        {
            this.worker.terminate();
            this.worker = null;
        }

        if (this.url && this.url.indexOf("blob:") === 0 && typeof URL !== "undefined" && URL.revokeObjectURL)
        {
            URL.revokeObjectURL(this.url);
        }

        this.url = null;
        this._failed = !!err;

        if (err)
        {
            this._pending.forEach(request =>
            {
                this.resMan.RemovePendingLoad(request.url);
                request.reject(this.constructor.NormalizeError(err));
            });
            this._pending.clear();
        }
    }

    /**
     * Fetches raw resource data
     * @param {String} url
     * @param {String|Function|null} responseType
     * @returns {Promise<*>}
     */
    Fetch(url, responseType)
    {
        if (!this.CanFetch(responseType))
        {
            return this.resMan._mainThreadLoader.Fetch(url, responseType);
        }

        if (!this.Enable(this.resMan.workerLoaderUrl))
        {
            return this.resMan._mainThreadLoader.Fetch(url, responseType);
        }

        this.resMan.AddPendingLoad(url);

        return new Promise((resolve, reject) =>
        {
            const id = this._nextId++;
            this._pending.set(id, { url, resolve, reject });

            try
            {
                this.worker.postMessage({ id, url, responseType });
            }
            catch (err)
            {
                this._pending.delete(id);
                this.resMan.RemovePendingLoad(url);
                reject(err);
            }
        });
    }

    /**
     * Checks if a response type can be loaded in the worker
     * @param {*} responseType
     * @returns {Boolean}
     */
    CanFetch(responseType)
    {
        return isString(responseType)
            && this.constructor.ResponseTypes.includes(responseType);
    }

    /**
     * Handles worker messages
     * @param {*} data
     */
    OnMessage(data)
    {
        const request = data && this._pending.get(data.id);
        if (!request) return;

        this._pending.delete(data.id);
        this.resMan.RemovePendingLoad(request.url);

        if (data.ok)
        {
            request.resolve(data.result);
        }
        else
        {
            request.reject(this.constructor.NormalizeError(data.error));
        }
    }

    /**
     * Handles worker errors
     * @param {*} err
     */
    OnWorkerError(err)
    {
        this.Disable(err);
        this.resMan.UseWorkerLoading(false);
    }

    /**
     * Creates a worker object url
     * @returns {String}
     */
    static CreateObjectUrl()
    {
        if (typeof Blob === "undefined" || typeof URL === "undefined" || !URL.createObjectURL)
        {
            throw new ReferenceError("Worker object urls are not supported");
        }

        const blob = new Blob([ `(${Tw2ResourceLoaderWorker.toString()}());` ], { type: "application/javascript" });
        return URL.createObjectURL(blob);
    }

    /**
     * Normalizes worker errors
     * @param {*} error
     * @returns {Error}
     */
    static NormalizeError(error)
    {
        if (error instanceof Error) return error;

        if (error && (error.name === "ErrHTTPStatus" || error.status !== undefined))
        {
            return new ErrHTTPStatus({
                status: error.status,
                statusText: error.statusText || error.message,
                json: error.json
            });
        }

        const err = new Error(error && error.message || "Worker resource load failed");
        err.name = error && error.name || "WorkerResourceLoadError";

        if (error)
        {
            err.status = error.status;
            err.statusText = error.statusText;
            err.json = error.json;
        }

        return err;
    }

    static ResponseTypes = [ "arraybuffer", "text", "json", "blob" ];
}


/**
 * Data-only worker body for resource fetches
 */
function Tw2ResourceLoaderWorker()
{
    self.onmessage = function(event)
    {
        const data = event.data;

        fetch(data.url)
            .then(function(response)
            {
                if (!response.ok)
                {
                    return response.text()
                        .then(function(text)
                        {
                            let statusText = response.statusText;
                            let json = null;

                            try
                            {
                                json = JSON.parse(text);
                                statusText = json.message || json.msg || json.error || json.err || statusText;
                            }
                            catch (err)
                            {
                                statusText = statusText || "Failed to fetch resource";
                            }

                            throw {
                                name: "ErrHTTPStatus",
                                message: statusText,
                                status: response.status,
                                statusText,
                                json
                            };
                        });
                }

                switch (data.responseType)
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
                        throw {
                            name: "ErrResourceLoaderType",
                            message: "Invalid fetch type: " + data.responseType
                        };
                }
            })
            .then(function(result)
            {
                const transfer = result instanceof ArrayBuffer ? [ result ] : [];
                self.postMessage({ id: data.id, ok: true, result }, transfer);
            })
            .catch(function(err)
            {
                self.postMessage({
                    id: data.id,
                    ok: false,
                    error: {
                        name: err && err.name || "WorkerResourceLoadError",
                        message: err && err.message || String(err),
                        status: err && err.status,
                        statusText: err && err.statusText,
                        json: err && err.json
                    }
                });
            });
    };
}
