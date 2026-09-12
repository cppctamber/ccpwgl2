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

    /**
     * Consumers this prepare is draining. Populated from `_waiting` when
     * `Prepare` starts, and emptied as each is answered.
     * @type {Array}
     */
    _objects = [];

    /**
     * Consumers that arrived since the current drain began, or after the last
     * one finished. Kept SEPARATE from `_objects` so that a request made while
     * constructing cannot extend the list being walked - which is how one
     * `Prepare` came to build a whole layout in a single synchronous call.
     * @type {Array}
     */
    _waiting = [];

    _requeued = false;
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

        // Onto the waiting list, never onto the list a drain is walking.
        this._waiting.push({ onResolved, onRejected });

        // Already constructed, so no `Prepare` is coming on its own: the object
        // left the prepare queue when it finished and nothing puts it back.
        // Ask for one.
        //
        // Through the QUEUE rather than constructing here. Construction is
        // prepare work - it belongs to `maxPrepareTime` and gets spread across
        // frames. Answering inline is what this did first and it froze the
        // page: every consumer of a retained object was served without ever
        // returning to the event loop, so a build wanting hundreds of them ran
        // as one unbroken run with no paint and no input.
        //
        // Before retention this could not happen at all: `OnPrepared` dropped
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
        const started = resMan.tw2.now;
        const budget = Math.max(0, resMan._prepareBudget) * 1000;
        const dot = this.path.lastIndexOf(".");
        if (dot === -1) return null;
        const ext = this.path.substr(dot + 1);
        let first;

        // Resume unfinished work before taking the waiting list. Requests from
        // here on lands on a fresh `_waiting` and is served by a later prepare,
        // so this walk has a fixed size no matter what construction asks for.
        this._requeued = false;
        if (!this._objects.length && this._waiting.length)
        {
            this._objects = this._waiting;
            this._waiting = [];
        }

        if (this._constructor === null)
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

            // Test construction once for errors??
            first = this._constructor.Construct();
        }

        // Popped as they are answered, so the list IS the outstanding work and
        // nothing has to track a cursor into it.
        while (this._objects.length)
        {
            const object = this._objects.shift();

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

            // A retained layout piece can have hundreds of waiting copies.
            // Give the manager its budget check between constructions, keeping
            // older consumers ahead of requests made during this slice.
            if (this._objects.length && resMan.tw2.now - started > budget)
            {
                if (!this._requeued)
                {
                    this._requeued = true;
                    resMan.Queue(this, this._view);
                }
                return;
            }
        }

        // Consumers that arrived while this drain ran get the next one, so a
        // long cascade is spread across frames and charged to the prepare
        // budget rather than held in one call.
        if (this._waiting.length && !this._requeued)
        {
            this._requeued = true;
            resMan.Queue(this, this._view);
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

        // Both lists: the one a drain was working through, and anything that
        // arrived since. Missing the second would leave those promises unsettled.
        const pending = this._objects.concat(this._waiting);
        this._objects.splice(0);
        this._waiting.splice(0);

        for (let i = 0; i < pending.length; i++)
        {
            if (pending[i].onRejected)
            {
                pending[i].onRejected(err);
            }
        }

        resMan.RemoveResource(this.path);
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

        // `Prepare` pops as it goes and owns the re-queue for anything still
        // waiting, so there is nothing to clear here. Clearing would DISCARD
        // consumers that arrived during the drain.
        super.OnPrepared(eventLog);
    }

    /**
     * Identifies a loading object
     * @type {Boolean}
     */
    static isLoadingObject = true;

}
