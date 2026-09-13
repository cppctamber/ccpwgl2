import { isString } from "utils";
import { ErrHTTPStatus } from "./Tw2ResMan";
import { Tw2ResourceLoaderWorker } from "./Tw2ResourceLoaderWorker";

// The worker file ships beside the bundle as `ccpwgl2_resman.worker.js`, like
// `ccpwgl2_gr2.worker.js`. Resolved at bundle evaluation, the only time
// `document.currentScript` is the bundle's own <script>; null when the bundle
// is imported as a module, in which case the blob fallback is used.
const script = typeof document !== "undefined" ? document.currentScript?.src : null;
const defaultWorkerUrl = script ? new URL("ccpwgl2_resman.worker.js", script).href : null;


export class Tw2ResManWorkerLoader
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
        this._usedFallback = false;
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
            this.url = workerUrl || defaultWorkerUrl || this.constructor.CreateObjectUrl();
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
            // Kept with the request so a fallback worker can be sent it again.
            const message = { url, responseType, fetchOptions: this.resMan.GetFetchOptions(url) };
            this._pending.set(id, { url, resolve, reject, message });

            try
            {
                this.worker.postMessage({ id, ...message });
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
        // A worker FILE can fail to load - a deployment without
        // ccpwgl2_resman.worker.js, or a wrong workerLoaderUrl. The same body is
        // inlined, so switch to a blob worker once and resend what is in flight
        // rather than dropping worker loading altogether.
        if (!this._usedFallback && this.url && this.url.indexOf("blob:") !== 0)
        {
            this._usedFallback = true;
            try
            {
                if (this.worker) this.worker.terminate();
                this.url = this.constructor.CreateObjectUrl();
                this.worker = new Worker(this.url);
                this.worker.onmessage = event => this.OnMessage(event.data);
                this.worker.onerror = error => this.OnWorkerError(error);
                this._pending.forEach((request, id) => this.worker.postMessage({ id, ...request.message }));
                return;
            }
            catch (fallbackError)
            {
                err = fallbackError;
            }
        }

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

    /** The worker file URL resolved beside the bundle, or null. */
    static defaultWorkerUrl = defaultWorkerUrl;
}
