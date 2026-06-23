import { isString } from "utils";
import { ErrHTTPStatus } from "./Tw2ResMan";


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
