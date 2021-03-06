import { tw2 } from "global";
import { ErrResourceFormatUnsupported, Tw2Resource } from "./Tw2Resource";
import { Tw2ObjectReader } from "../reader/Tw2ObjectReader";
import { Tw2BlackReader } from "../reader/Tw2BlackReader";


export class Tw2LoadingObject extends Tw2Resource
{

    path = "";
    _view = null;
    _inPrepare = null;
    _objects = [];
    _constructor = null;
    _requestResponseType = "arraybuffer";

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
        }
        else
        {
            this._objects.push({ onResolved, onRejected });
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
        tw2.RemoveResource(this.path);
        this._objects.splice(0);
        return err;
    }

    /**
     * Fires when prepared
     * @param {eventLog} eventLog
     */
    OnPrepared(eventLog)
    {
        tw2.RemoveResource(this.path);
        this._objects.splice(0);
        super.OnPrepared(eventLog);
    }

    /**
     * Identifies a loading object
     * @type {Boolean}
     */
    static isLoadingObject = true;

}
