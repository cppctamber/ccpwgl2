import { Tw2MotherLode } from "./Tw2MotherLode";
import { Tw2LoadingObject } from "../../core/resource/Tw2LoadingObject";
import { Tw2EventEmitter } from "../class/Tw2EventEmitter";
import {
    Tw2Error,
    ErrHTTPStatus,
    ErrFeatureNotImplemented,
    ErrResourceExtensionUndefined,
    ErrResourceExtensionUnregistered,
    ErrResourcePrefixUndefined,
    ErrResourcePrefixUnregistered
} from "../../core";
import { assignIfExists, getPathExtension, isBoolean, isError, isFunction } from "../util";

/**
 * Resource Manager
 *
 * @property {Tw2MotherLode} motherLode
 * @property {Boolean} systemMirror - Toggles whether {@link Tw2GeometryRes} Index and Buffer data arrays are visible
 * @property {Number} maxPrepareTime
 * @property {Boolean} autoPurgeResources=true - Sets whether resources should be purged automatically
 * @property {Number} purgeTime=30 = Sets how long resources can remain inactive before they are purged
 * @property {Number} activeFrame
 * @property {Number} _prepareBudget
 * @property {Array} _prepareQueue
 * @property {Number} _purgeTime
 * @property {Number} _purgeFrame
 * @property {Number} _purgeFrameLimit
 * @property {Array<String>} _pendingLoads - an array of pending loads
 * @property {Number} _noLoadFrames
 */
export class Tw2ResMan extends Tw2EventEmitter
{

    motherLode = new Tw2MotherLode();
    systemMirror = false;
    maxPrepareTime = 0.05;
    autoPurgeResources = true;
    activeFrame = 0;
    purgeTime = 30;

    _prepareBudget = 0;
    _prepareQueue = [];
    _purgeTime = 0;
    _purgeFrame = 0;
    _purgeFrameLimit = 1000;
    _pendingLoads = [];
    _noLoadFrames = 0;

    tw2 = null;

    /**
     * Gets a count of pending loads
     * @returns {number}
     */
    get pendingLoads()
    {
        return this._pendingLoads.length;
    }

    /**
     * Constructor
     * @param {Tw2Library} tw2
     */
    constructor(tw2)
    {
        super();
        tw2.SetLibrary(this);
    }

    /**
     * Sets resource manager options
     * @param {*} [opt]
     */
    Register(opt)
    {
        if (!opt) return;
        assignIfExists(this, opt, [ "systemMirror", "maxPrepareTime", "autoPurgeResources", "purgeTime" ]);
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
     */
    OnPathEvent(path, eventName, log = {})
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

        this.emit(eventName, path, res, err)
            .msg(Tw2ResMan.LogType[eventName.toUpperCase()], log);
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
     * Internal update function. It is called every frame.
     * @param {Tw2Device} device
     * @returns {Boolean}
     */
    Tick(device)
    {
        if (this._prepareQueue.length === 0 && this._pendingLoads.length === 0)
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

        const startTime = device.now;
        while (this._prepareQueue.length)
        {
            const
                res = this._prepareQueue[0][0],
                data = this._prepareQueue[0][1],
                xml = this._prepareQueue[0][2];

            this._prepareQueue.shift();

            try
            {
                res.Prepare(data, xml);
                this._prepareBudget -= (device.now - startTime) * 0.001;
                if (this._prepareBudget < 0) break;
            }
            catch (err)
            {
                this._prepareBudget = 0;
                res.OnError(err);
            }
        }

        this._purgeTime += device.dt;

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

        // Check if already loaded
        res = this.motherLode.Find(path);
        if (res)
        {
            res.RegisterCallbacks(onResolved, onRejected);
            return res;
        }

        try
        {
            const Constructor = this.GetResourceConstructor(path);
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
     * Loads a resource
     * TODO: Create a res object for each quality level rather than just one
     * @param {Tw2Resource|*} res
     * @param {eventLog} [eventLog]
     */
    LoadResource(res, eventLog)
    {
        this.motherLode.Add(res.path, res);

        // Don't load if already errored
        if (res.HasErrors())
        {
            return res;
        }

        try
        {
            const url = this.BuildUrl(res.path);

            res.OnRequested(eventLog);

            if (res.DoCustomLoad && res.DoCustomLoad(url, getPathExtension(url)))
            {
                return res;
            }

            if (!res.HasErrors())
            {
                this.Fetch(url, res.requestResponseType)
                    .then(response =>
                    {
                        res.OnLoaded();
                        this.Queue(res, response);
                    })
                    .catch(err =>
                    {
                        res.OnError(err);
                    });
            }
        }
        catch (err)
        {
            res.OnError(err);
        }

        return res;
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
     * Fetches cache
     * @param {String} url
     * @param {String|Function} responseType
     * @returns {Promise}
     */
    async Fetch(url, responseType)
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
     * Gets a resource constructor
     * @param {String} path
     * @returns {Tw2Resource}
     * @throws {ErrFeatureNotImplemented} When passed an unsupported resource prefix
     * @throws {ErrResourceExtensionUndefined} When passed a resource without an extension
     * @throws {ErrResourceExtensionUnregistered} When passed a resource extension that isn't registered/ supported
     */
    GetResourceConstructor(path)
    {
        path = Tw2ResMan.NormalizePath(path);

        if (path.indexOf("dynamic:/") === 0)
        {
            throw new ErrFeatureNotImplemented({ feature: "Dynamic resources" });
        }

        const extension = getPathExtension(path);
        if (extension === null)
        {
            throw new ErrResourceExtensionUndefined({ path });
        }

        const Constructor = this.tw2.GetExtension(extension);
        if (!Constructor)
        {
            throw new ErrResourceExtensionUnregistered({ path, extension });
        }

        return Constructor;
    }


    /**
     * Builds a url from a resource path
     * @param {String} path
     * @returns {String}
     * @throws {ErrResourcePrefixUndefined} When passed a url without a resource prefix
     * @throws {ErrResourcePrefixUnregistered} When passed a url with an unregistered resource prefix
     */
    BuildUrl(path)
    {
        const prefixIndex = path.indexOf(":/");
        if (prefixIndex === -1)
        {
            throw new ErrResourcePrefixUndefined({ path });
        }

        const prefix = path.substr(0, prefixIndex);
        if (prefix === "http" || prefix === "https")
        {
            return path;
        }

        const fullPrefix = this.tw2.GetPath(prefix);
        if (!fullPrefix)
        {
            throw new ErrResourcePrefixUnregistered({ path, prefix });
        }

        return fullPrefix + path.substr(prefixIndex + 2);
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

    /**
     * Logger category
     * @type {String}
     */
    static __category = "Resource Manager";

}
