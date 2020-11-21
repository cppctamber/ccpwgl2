import { resMan } from "global";
import { meta, isFunction } from "utils";
import { Tw2Error } from "../Tw2Error";
import { Tw2Notifications } from "./Tw2Notifications";


@meta.type("Tw2Resource")
export class Tw2Resource extends Tw2Notifications
{
    path = "";
    activeFrame = 0;
    doNotPurge = 0;

    _state = Tw2Resource.State.NO_INIT;
    _errors = [];
    _requested = null;
    _requestResponseType = null;

    /**
     * Gets the request response type
     * @returns {null|String}
     */
    get requestResponseType()
    {
        return this._requestResponseType;
    }

    /**
     * Checks if the resource has errors
     * @returns {Boolean}
     */
    HasErrored()
    {
        return this._state === Tw2Resource.State.ERROR;
    }

    /**
     * Checks if the resource has completed all processing
     * @returns {Boolean}
     */
    HasCompleted()
    {
        return this.HasErrored() || this.IsPurged() || this.HasPrepared();
    }

    /**
     * Checks if the resource has been requested
     * @return {boolean}
     */
    HasRequested()
    {
        return this._state === Tw2Resource.State.REQUESTED ||  this.HasLoaded();
    }

    /**
     * Checks if the resource has loaded
     * @return {boolean}
     */
    HasLoaded()
    {
        return this._state === Tw2Resource.State.LOADED || this._state === Tw2Resource.State.PREPARED;
    }

    /**
     * Checks if the resource has been prepared
     * @returns {boolean}
     */
    HasPrepared()
    {
        return this._state === Tw2Resource.State.PREPARED;
    }

    /**
     * Checks if the resource is good and keeps it alive
     * @returns {boolean}
     */
    IsGood()
    {
        this.KeepAlive();
        return this.HasLoaded();
    }

    /**
     * Checks if the resource has been unloaded
     * @returns {boolean}
     */
    IsUnloaded()
    {
        return this._state === Tw2Resource.State.UNLOADED;
    }

    /**
     * Checks to see if the resource has been purged
     * @returns {Boolean}
     */
    IsPurged()
    {
        return this._state === Tw2Resource.State.PURGED;
    }

    /**
     * Unloads the resource
     * @param {*} [log]
     * @returns {Boolean}
     */
    Unload(log)
    {
        return false;
    }

    /**
     * Reloads the resource
     * @param {*} [log]
     */
    Reload(log)
    {
        if (this.HasLoaded())
        {
            this.Unload({ hide: true, detail: "reloading" });
        }

        if (this.IsPurged() || this.IsUnloaded())
        {
            resMan.LoadResource(this, log);
        }
    }

    /**
     * Keeps the resource from being purged
     */
    KeepAlive()
    {
        this.activeFrame = resMan.activeFrame;
        if (this.IsPurged() || this.IsUnloaded())
        {
            this.Reload({ hide: true, detail: "inuse" });
        }
    }

    /**
     * Gets the resource's errors
     * @returns {?Array<Tw2Error|Error>}
     */
    GetErrors()
    {
        return Array.from(this._errors);
    }

    /**
     * Gets the resource's last error
     * @returns {undefined|Tw2Error|Error}
     */
    GetLastError()
    {
        return this._errors[0];
    }

    /**
     * Fires on warnings
     * @param {*} [log]
     */
    OnWarning(log)
    {
        resMan.OnPathEvent(this.path, "warning", log);
        this.UpdateNotifications(Tw2Resource.Callback.WARNING);
    }

    /**
     * Fires on debugs
     * @param {*} [log]
     */
    OnDebug(log)
    {
        resMan.OnPathEvent(this.path, "debug", log);
        this.UpdateNotifications(Tw2Resource.Callback.DEBUG);
    }

    /**
     * Fires on errors
     * @param {Error} err
     * @returns {Error}
     */
    OnError(err = new Tw2Error())
    {
        let wasGood = this.HasLoaded();

        if (!this._errors.includes(err))
        {
            this._errors.unshift(err);
        }

        this._SetState(Tw2Resource.State.ERROR);

        if (wasGood)
        {
            this.Unload({ hide: true, detail: "errored" });
        }

        resMan.OnPathEvent(this.path, "error", err);
        this.UpdateNotifications(Tw2Resource.Callback.ERROR, err);
        return err;
    }

    /**
     * LoadStarted
     * @param {*} [log]
     */
    OnRequested(log)
    {
        const stateName = this._state === Tw2Resource.State.NO_INIT ? "REQUESTED" : "RELOADING";
        if (this._SetState(Tw2Resource.State.REQUESTED))
        {
            this._requested = Date.now();
            resMan.OnPathEvent(this.path, stateName.toLowerCase(), log);
            this.UpdateNotifications(Tw2Resource.Callback[stateName]);
        }
    }

    /**
     * LoadFinished
     * @param {*} [log]
     */
    OnLoaded(log = {})
    {
        if (this._SetState(Tw2Resource.State.LOADED))
        {
            if (this._requested === null)  this._requested = Date.now();
            log.time = (Date.now() - this._requested) * 0.001;
            resMan.OnPathEvent(this.path, "loaded", log);
            this.UpdateNotifications(Tw2Resource.Callback.LOADED);
        }
    }

    /**
     * PrepareFinished
     * @param {*} [log]
     */
    OnPrepared(log = {})
    {
        if (this._SetState(Tw2Resource.State.PREPARED))
        {
            if (this._requested === null) this._requested = Date.now();
            log.time = (Date.now() - this._requested) * 0.001;
            resMan.OnPathEvent(this.path, "prepared", log);
            this.UpdateNotifications(Tw2Resource.Callback.PREPARED);
        }
    }

    /**
     * Fires when the resource has been unloads
     * @param {*} [log]
     */
    OnUnloaded(log)
    {
        if (this._SetState(Tw2Resource.State.UNLOADED))
        {
            resMan.OnPathEvent(this.path, "unloaded", log);
            this.UpdateNotifications(Tw2Resource.Callback.UNLOADED);
        }
    }

    /**
     * Fires when the resource is purged
     * @param {*} [log]
     */
    OnPurged(log)
    {
        this._SetState(Tw2Resource.State.PURGED);
        resMan.OnPathEvent(this.path, "purged", log);
        this.UpdateNotifications(Tw2Resource.Callback.PURGED, this.GetLastError());
    }

    /**
     * Sets state
     * @param state
     * @returns {boolean}
     */
    _SetState(state)
    {
        if (this._state !== Tw2Resource.State.ERROR)
        {
            //this._lastState = this._state;
            this._state = state;
            return true;
        }
        return false;
    }

    /**
     * Wraps callbacks as a notification
     * - The notification is removed as soon as the resource is prepared or errored
     * @param {Function} [onResolved] - Callback fired when prepared or purged
     * @param {Function} [onRejected] - Callback fired when errored
     */
    RegisterCallbacks(onResolved, onRejected)
    {
        this.KeepAlive();
        if (!onResolved && !onRejected) return;

        /**
         * Handles resource events
         * @param {Tw2Resource} res
         * @param {Tw2Error} err
         * @returns {Boolean}
         */
        const handler = function(res, err)
        {
            if (res.HasCompleted())
            {
                if (err)
                {
                    if (onRejected) onRejected(err);
                }
                else
                {
                    if (onResolved) onResolved(res);
                }
                return true;
            }
            return false;
        };

        this.RegisterNotification(handler);
    }

    /**
     * Registers a notification
     * @param {Tw2Resource} resource
     * @param {*} notification
     */
    static onNotification(resource, notification)
    {
        let funcName, err;
        switch (resource._state)
        {
            case Tw2Resource.State.ERROR:
                funcName = Tw2Resource.Callback.ERROR;
                err = resource.GetLastError();
                break;

            case Tw2Resource.State.REQUESTED:
                funcName = Tw2Resource.Callback.REQUESTED;
                break;

            case Tw2Resource.State.LOADED:
                funcName = Tw2Resource.Callback.LOADED;
                break;

            case Tw2Resource.State.PREPARED:
                funcName = Tw2Resource.Callback.PREPARED;
                break;

            case Tw2Resource.State.UNLOADED:
                funcName = Tw2Resource.Callback.UNLOADED;
                break;

            case Tw2Resource.State.PURGED:
                funcName = Tw2Resource.Callback.PURGED;
                err = resource.GetLastError();
                break;
        }

        // Don't add notification if it returns true
        if (isFunction(notification))
        {
            return !!notification(resource, err, funcName);
        }
        // Specific function on notification
        else if (funcName && funcName in notification)
        {
            return !!notification[funcName](resource, err);
        }
        // Catch all function on notification
        else if ("OnResEvent" in notification)
        {
            return !!notification.OnResEvent(resource, err);
        }
        return false;
    }

    /**
     * Handles the parent's resource events
     * // Temporary
     * @param {*} parent
     * @param {String} target
     * @param {Tw2Resource} res
     * @param {Error} [err]
     */
    static parentOnResEvent(parent, target, res, err)
    {
        // Ignore old res that are still firing
        if (parent[target] !== res)
        {
            res.UnregisterNotification(parent);
            return;
        }

        const { Event, State } = this;
        let completed = false;

        switch (res._state)
        {
            case State.ERROR:
                parent.EmitEvent(Event.RES_ERROR, parent, res, err);
                completed = true;
                break;

            case State.PURGED:
                parent.EmitEvent(Event.RES_PURGED, parent, res);
                break;

            case State.UNLOADED:
                parent.EmitEvent(Event.RES_UNLOADED, parent, res);
                break;

            case State.REQUESTED:
                parent.EmitEvent(Event.RES_REQUESTED, parent, res);
                break;

            case State.LOADED:
                parent.EmitEvent(Event.RES_LOADED, parent, res);
                break;

            case State.PREPARED:
                parent.EmitEvent(Event.RES_PREPARED, parent, res);
                completed = true;
                break;
        }

        if (completed)
        {
            parent.EmitEvent(Event.RES_COMPLETED, parent, res, err);
            res.UnregisterNotification(parent);
        }
    }

    /**
     * Handles events added to a parent after an internal event has already happened
     * // Temporary
     * @param {*} parent
     * @param {String} target
     * @param {String} eventName
     * @param {Function} listener
     * @param {*} context
     * @return {boolean}
     */
    static parentOnListener(parent, target, eventName,  listener,  context)
    {
        const res = parent[target];
        if (!res) return false;

        const { Event } = Tw2Resource;

        let doCall;
        switch (eventName)
        {
            case Event.RES_COMPLETED:
                if (res.HasCompleted())
                {
                    listener.call(context, parent, res, res.GetLastError());
                }
                return false;

            case Event.RES_ERROR:
                if (res.HasErrored())
                {
                    listener.call(context, parent, res, res.GetLastError());
                    return true;
                }
                return false;

            case Event.RES_UNLOADED:
                if (res.IsUnloaded()) doCall = true;
                break;

            case Event.RES_PURGED:
                if (res.IsPurged()) doCall = true;
                break;

            case Event.RES_REQUESTED:
                if (res.HasRequested()) doCall = true;
                break;

            case Event.RES_LOADED:
                if (res.HasLoaded()) doCall = true;
                break;

            case Event.RES_PREPARED:
                if (res.HasPrepared()) doCall = true;
        }

        if (doCall)
        {
            listener.call(context, parent, res);
            return true;
        }

        return false;
    }

    /**
     * Resource states
     * @type {*}
     */
    static State = {
        ERROR: -3,
        PURGED: -2,
        UNLOADED: -1,
        NO_INIT: 0,
        REQUESTED: 1,
        LOADED: 2,
        PREPARED: 3
    };

    /**
     * Notification callback names
     * Todo: Remove notifications and replace with events
     * @type {*}
     */
    static Callback = {
        ERROR: "OnResError",
        PURGED: "OnResPurged",
        UNLOADED: "OnResUnloaded",
        REQUESTED: "OnResRequested",
        LOADED: "OnResLoaded",
        PREPARED: "OnResPrepared",
        WARNING: "OnResWarning",
        DEBUG: "OnResDebug"
    };

    /**
     * Event names
     * @type {*}
     */
    static Event = {
        RES_UNLOADED: "unloaded",
        RES_PURGED: "purged",
        RES_ERROR: "error",
        RES_REQUESTED: "requested",
        RES_LOADED: "loaded",
        RES_PREPARED: "prepared",
        RES_REMOVED: "removed",
        RES_COMPLETED: "completed"
    };

}

/**
 * An optional function for when the resource handles it's own loading
 * -  If the method returns false then the resource manager will handle the http request
 * @type {?Function}
 * @returns {Boolean}
 */
Tw2Resource.prototype.DoCustomLoad = null;


/**
 * Throws in invalid resource formats
 */
export class ErrResourceFormatInvalid extends Tw2Error
{
    constructor(data)
    {
        super(data, "Resource format invalid: %format% (%reason=unknown%)");
    }
}

/**
 * Throws in invalid resource formats
 */
export class ErrResourceFormatUnsupported extends Tw2Error
{
    constructor(data)
    {
        super(data, "Resource format not supported: %format% (%reason=unknown%)");
    }
}

/**
 * Throws in invalid resource formats
 */
export class ErrResourceFormatNotImplemented extends Tw2Error
{
    constructor(data)
    {
        super(data, "Resource format not implemented: %format% (%reason=unknown%)");
    }
}


