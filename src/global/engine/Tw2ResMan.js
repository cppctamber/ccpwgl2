import {Tw2MotherLode} from "./Tw2MotherLode";
import {Tw2LoadingObject} from "../../core/resource/Tw2LoadingObject";
import {Tw2EventEmitter} from "../class/Tw2EventEmitter";
import {
    Tw2Error,
    //ErrHTTPInstance,
    //ErrHTTPReadyState,
    //ErrHTTPRequestSend,
    ErrHTTPStatus,
    ErrFeatureNotImplemented,
    ErrResourceExtensionUndefined,
    ErrResourceExtensionUnregistered,
    ErrResourcePrefixUndefined,
    ErrResourcePrefixUnregistered
} from "../../core";
import {assignIfExists, isError, isFunction} from "../util";

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
 * @property {Number} _pendingLoads - a count of how many things are pending load
 * @property {Number} _noLoadFrames
 * @class
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
    _pendingLoads = 0;
    _noLoadFrames = 0;
    _tw2 = null;

    /**
     *
     * @param tw2
     */
    constructor(tw2)
    {
        super();
        this._tw2 = tw2;
    }

    /**
     * Sets resource manager options
     * @param {*} [opt]
     */
    Register(opt)
    {
        if (!opt) return;
        assignIfExists(this, opt, ["systemMirror", "maxPrepareTime", "autoPurgeResources", "purgeTime"]);
    }


    /**
     * Fires on resource errors
     * - Used when a resource can only be identified by it's path
     * @param {String} path
     * @param {Error} err
     * @returns {Error} err
     */
    OnResError(path, err = new Tw2Error({path}))
    {
        path = Tw2ResMan.NormalizePath(path);
        const res = this.motherLode.Find(path);
        if (res)
        {
            res.OnError(err);
        }
        else
        {
            this.OnResEvent("error", path, err);
        }
        return err;
    }

    /**
     * Fires on resource events
     * @param {String} eventName - The event's name
     * @param {String} path      - The resource's path
     * @param {*} [log={}]       - The event's log
     */
    OnResEvent(eventName, path, log = {})
    {
        const defaultLog = Tw2ResMan.DefaultLog[eventName.toUpperCase()];
        if (defaultLog)
        {
            const eventData = {res: this.motherLode.Find(path), path};

            if (isError(log))
            {
                const err = eventData.err = log;
                this.motherLode.AddError(path, err);
                log = Object.assign({}, defaultLog, {message: err.message, err});
            }
            else
            {
                log = Object.assign({}, defaultLog, log);
            }

            eventData.log = log;
            log.message = log.message.includes(path) ? log.message : log.message += ` "${path}"`;
            this.emit(eventName.toLowerCase(), eventData);
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
     */
    Clear()
    {
        this.motherLode.Clear();
    }

    /**
     * Unloads and Clears the motherLode {@link Tw2MotherLode}
     */
    UnloadAndClear()
    {
        this.motherLode.UnloadAndClear();
    }

    /**
     * Internal update function. It is called every frame.
     * @param {Tw2Device} device
     * @returns {Boolean}
     */
    Tick(device)
    {
        if (this._prepareQueue.length === 0 && this._pendingLoads === 0)
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
            }
            catch (err)
            {
                res.OnError(err);
            }

            this._prepareBudget -= (device.now - startTime) * 0.001;
            if (this._prepareBudget < 0) break;
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
        this._prepareQueue.push([res, response, meta]);
    }

    /**
     * Gets a resource
     * @param {String} path
     * @returns {Tw2Resource|*} resource
     */
    GetResource(path)
    {
        let res;
        path = Tw2ResMan.NormalizePath(path);

        // Check if already loaded
        res = this.motherLode.Find(path);
        if (res)
        {
            if (res.IsPurged()) res.Reload();
            return res;
        }

        // Check if errored
        if (this.motherLode.HasErrors(path))
        {
            this.OnResError(path, this.motherLode.GetLastError(path));
            return null;
        }

        if (path.indexOf("dynamic:/") === 0)
        {
            this.OnResError(path, new ErrFeatureNotImplemented({feature: "Dynamic resources"}));
            return null;
        }

        const extension = Tw2ResMan.GetPathExt(path);
        if (extension === null)
        {
            this.OnResError(path, new ErrResourceExtensionUndefined({path}));
            return null;
        }

        const Constructor = this._tw2.store.extensions.Get(extension);
        if (!Constructor)
        {
            this.OnResError(path, new ErrResourceExtensionUnregistered({path, extension}));
            return null;
        }

        res = new Constructor();
        res.path = path;
        return this.LoadResource(res);
    }

    /**
     * Gets a resource object
     * @param {String} path
     * @param {Function} onResolved - Callback fired when the object has loaded
     * @param {Function} onRejected - Callback fired when the object fails to load
     */
    GetObject(path, onResolved, onRejected)
    {
        path = Tw2ResMan.NormalizePath(path);

        // Check if already exists
        let res = this.motherLode.Find(path);
        if (res)
        {
            res.AddObject(onResolved, onRejected);
            return;
        }

        // Check if already failed
        if (this.motherLode.HasErrors(path))
        {
            const lastError = this.motherLode.GetLastError(path);
            this.OnResError(path, lastError);
            if (onRejected) onRejected(lastError);
            return;
        }

        res = new Tw2LoadingObject();
        res.path = path;
        res.AddObject(onResolved, onRejected);
        this.LoadResource(res);
    }

    /**
     * Gets a promise that will resolve into an object
     * @param {String} path
     * @returns {Promise<any>}
     */
    GetObjectAsync(path)
    {
        return new Promise((resolve, reject) =>
        {
            this.GetObject(path, resolve, reject);
        });
    }

    /**
     * Reloads a resource
     * @param {Tw2Resource} resource
     * @returns {Tw2Resource} resource
     */
    ReloadResource(resource)
    {
        if (resource.IsPurged() || resource.HasErrors())
        {
            this.LoadResource(resource);
        }
        return resource;
    }

    /**
     * Loads a resource
     * TODO: Create a res object for each quality level rather than just one
     * @param {Tw2Resource|*} res
     */
    LoadResource(res)
    {
        let url,
            promise;

        this.motherLode.Add(res.path, res);
        res.OnRequested();

        try
        {
            url = this.BuildUrl(res.path);
            if (res.DoCustomLoad && res.DoCustomLoad(url, Tw2ResMan.GetPathExt(url)))
            {
                return res;
            }
        }
        catch (err)
        {
            res.OnError(err);
            return res;
        }

        this._pendingLoads++;

        this.Fetch(url, res.requestResponseType)
            .then(response =>
            {
                this._pendingLoads--;
                res.OnLoaded();
                this.Queue(res, response);
            })
            .catch(err =>
            {
                this._pendingLoads--;
                res.OnError(err);
            });

        return res;
    }

    /**
     * Fetches cache
     * @param {String} url
     * @param {String|Function} responseType
     * @returns {Promise}
     */
    Fetch(url, responseType)
    {
        this._pendingLoads++;

        return fetch(url)
            .then(response =>
            {
                if (!response.ok)
                {
                    throw new ErrHTTPStatus({status: response.status, url});
                }

                if (isFunction(responseType))
                {
                    return responseType(response);
                }

                switch (responseType)
                {
                    case "arraybuffer":
                        return response.arrayBuffer();

                    case "body":
                        return response.body();

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
            .then(response =>
            {
                this._pendingLoads--;
                return response;
            })
            .catch(err =>
            {
                this._pendingLoads++;
                throw err;
            });
    }

    /**
     * Builds a url from a resource path
     * @param {String} path
     * @returns {String}
     */
    BuildUrl(path)
    {
        const prefixIndex = path.indexOf(":/");
        if (prefixIndex === -1)
        {
            throw new ErrResourcePrefixUndefined({path});
        }

        const prefix = path.substr(0, prefixIndex);
        if (prefix === "http" || prefix === "https")
        {
            return path;
        }

        const fullPrefix = this._tw2.store.paths.Get(prefix);
        if (!fullPrefix)
        {
            throw new ErrResourcePrefixUnregistered({path, prefix});
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
     * Gets a path's extension
     * @param {String} path
     * @returns {?String}
     */
    static GetPathExt(path)
    {
        const dot = path.lastIndexOf(".");
        if (dot === -1) return null;
        return path.substr(dot + 1);
    }

    // Default log outputs for resource events
    static DefaultLog = {
        ERROR: {type: "error", message: "Uncaught error"},
        WARNING: {type: "warn", message: "Undefined warning"},
        REQUESTED: {type: "info", message: "Requested"},
        RELOADING: {type: "info", message: "Reloading"},
        LOADED: {type: "info", message: "Loaded"},
        PREPARED: {type: "log", message: "Prepared"},
        PURGED: {type: "info", message: "Purged"},
        UNLOADED: {type: "info", message: "Unloaded"},
        DEBUG: {type: "debug", message: "Debug"}
    };

    /**
     * Class category
     * @type {String}
     */
    static category = "resource_manager";

}


// Global instance of Tw2ResMan
export const resMan = new Tw2ResMan();
