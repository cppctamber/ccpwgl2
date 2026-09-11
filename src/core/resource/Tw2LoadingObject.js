import { resMan } from "global";
import { ErrResourceFormatUnsupported, Tw2Resource } from "./Tw2Resource";
import { Tw2ObjectReader } from "../reader/Tw2ObjectReader";
import { Tw2BlackReader } from "../reader/Tw2BlackReader";


export class Tw2LoadingObject extends Tw2Resource
{

    path = "";
    url = "";
    responseType = null;
    targetResource = null;
    loader = null;

    _view = null;
    _requeued = false;
    _inPrepare = null;
    _objects = [];
    _constructor = null;
    _requestResponseType = "arraybuffer";

    /**
     * Configures the loading object as an internal raw resource load task
     * @param {Tw2Resource} res
     * @param {String} url
     * @param {String|Function|null} responseType
     * @param {*} loader
     * @returns {Tw2LoadingObject}
     */
    ConfigureRawLoad(res, url, responseType, loader)
    {
        this.path = res.path;
        this.url = url;
        this.responseType = responseType;
        this.targetResource = res;
        this.loader = loader;
        return this;
    }

    /**
     * Starts an internal raw data load
     * @returns {Promise<*>}
     */
    StartRawLoad()
    {
        if (!this.loader || !this.loader.Fetch)
        {
            throw new ReferenceError("Invalid resource loader");
        }

        return this.loader.Fetch(this.url, this.responseType, this);
    }

    /**
     * Adds a child object
     * @param {Function} onResolved
     * @param {Function} onRejected
     * @returns {Object}
     */
    AddObject(onResolved, onRejected)
    {
        const err = this.GetLastError();
        if (err)
        {
            if (onRejected)
            {
                onRejected(err);
            }
            return;
        }

        this._objects.push({ onResolved, onRejected });

        // Already prepared, so no `Prepare` is coming on its own - the object
        // left the prepare queue when it finished and nothing puts it back.
        // Re-queue it, and `Prepare` walks the consumers added since.
        //
        // Through the QUEUE rather than constructing here, which is what this
        // did first and was wrong. Construction is prepare work: it is charged
        // to `maxPrepareTime` and spread across frames. Doing it inline made
        // every fetch of a retained object resolve as a microtask, and a build
        // awaiting hundreds of them then ran as one unbroken microtask chain -
        // no macrotask, so no paint, no input, not even a tab close. The
        // network used to provide that yield by accident; retaining the object
        // took it away, and the queue is where it properly belongs.
        //
        // Before retention this branch was unreachable: `OnPrepared` dropped
        // the object from the motherlode, so no one could find one to add to.
        if (this._constructor && !this._requeued)
        {
            this._requeued = true;
            resMan.Queue(this, this._view);
        }
    }

    /**
     * Prepare
     * @param response
     */
    Prepare(response)
    {
        const dot = this.path.lastIndexOf(".");
        if (dot === -1) return null;
        const ext = this.path.substr(dot + 1);
        let first;

        if (this._inPrepare === null)
        {
            this._view = response;

            switch (ext)
            {
                case "red":
                    try
                    {
                        this._constructor = new Tw2ObjectReader(response);
                    }
                    catch(originalError)
                    {
                        // Some files are passed as .red but they are actually .black
                        try
                        {
                            this._constructor = new Tw2BlackReader(response);
                        }
                        catch(err)
                        {
                            throw originalError;
                        }
                    }
                    break;

                case "black":
                    this._constructor = new Tw2BlackReader(response);
                    break;

                default:
                    throw new ErrResourceFormatUnsupported({ format: ext });
            }

            this._inPrepare = 0;
            // Test construction once for errors??
            first = this._constructor.Construct();
        }

        while (this._inPrepare < this._objects.length)
        {
            const object = this._objects[this._inPrepare];

            try
            {
                if (first)
                {
                    object.onResolved(first);
                    first = null;
                }
                else
                {
                    object.onResolved(this._constructor.Construct());
                }
            }
            catch (err)
            {
                if (object.onRejected)
                {
                    object.onRejected(err);
                    object.onRejected = null; // Only fire once
                }

                this.OnWarning({ err, message: "Error preparing child object" });
            }

            this._inPrepare++;
        }

        this.OnPrepared();
    }

    /**
     * Fires on errors
     * @param {Error} err
     * @returns {Error}
     */
    OnError(err)
    {
        super.OnError(err);
        for (let i = 0; i < this._objects.length; i++)
        {
            if (this._objects[i].onRejected)
            {
                this._objects[i].onRejected(err);
            }
        }
        resMan.RemoveResource(this.path);
        this._objects.splice(0);
        return err;
    }

    /**
     * Fires when prepared
     * @param {eventLog} eventLog
     */
    OnPrepared(eventLog)
    {
        // Retained rather than dropped, when the manager is retaining: the
        // reader stays so the next consumer of this path constructs from memory
        // instead of re-fetching and re-parsing the file. `RetainLoadingObject`
        // declines for a raw load task (no path) or anything errored, and those
        // drop out as they always did.
        if (!resMan.RetainLoadingObject(this))
        {
            resMan.RemoveResource(this.path);
        }

        // The consumers queued for this prepare have all been served. Reset the
        // cursor with the list: `AddObject` re-queues later arrivals and
        // `Prepare` walks them from the start of the emptied list, so the two
        // must agree or a re-queued prepare would walk nothing and those
        // consumers would never settle.
        this._objects.splice(0);
        if (this._inPrepare !== null) this._inPrepare = 0;
        this._requeued = false;
        super.OnPrepared(eventLog);
    }

    /**
     * Identifies a loading object
     * @type {Boolean}
     */
    static isLoadingObject = true;

}
