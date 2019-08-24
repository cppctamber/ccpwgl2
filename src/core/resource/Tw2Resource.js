import {resMan} from "../../global";
import {Tw2Error} from "../Tw2Error";
import {isError, isFunction} from "../../global/util";

/**
 * Tw2Resource base class
 *
 * @property {Number} activeFrame
 * @property {Number} doNotPurge
 * @property {String} path
 * @property {Set} _notifications
 * @property {Number} _state
 * @property {Array<Error>} _errors
 */
export class Tw2Resource
{
    path = "";
    activeFrame = 0;
    doNotPurge = 0;

    _notifications = new Set();
    _state = Tw2Resource.State.NO_INIT;
    //_lastState = Tw2Resource.State.NO_INIT;
    _errors = [];
    _requested = 0;

    /**
     * Checks if the resource is good and keeps it alive
     * @returns {boolean}
     */
    IsGood()
    {
        this.KeepAlive();
        return this.IsPrepared() || this.IsLoaded();
    }

    /**
     * Checks to see if the resource is loading
     * @returns {Boolean}
     */
    IsRequested()
    {
        return this._state === Tw2Resource.State.REQUESTED;
    }

    /**
     * Checks if the resource has been loaded
     * @returns {boolean}
     */
    IsLoaded()
    {
        return this._state === Tw2Resource.State.LOADED;
    }

    /**
     * Checks if the resource has been prepared
     * @returns {boolean}
     */
    IsPrepared()
    {
        return this._state === Tw2Resource.State.PREPARED;
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
     * Checks if the resource has errors
     * @returns {Boolean}
     */
    HasErrors()
    {
        return this._state === Tw2Resource.State.ERROR;
    }

    /**
     * Checks if the resource has completed all processing
     * @returns {Boolean}
     */
    HasCompleted()
    {
        return this.HasErrors() || this.IsPurged() || this.IsPrepared();
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
        if (this.IsLoaded() || this.IsPrepared())
        {
            this.Unload({hide: true, detail: "reloading"});
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
            this.Reload({hide: true, detail: "inuse"});
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
        this.UpdateNotifications("WARNING", undefined, log);
    }

    /**
     * Fires on debugs
     * @param {*} [log]
     */
    OnDebug(log)
    {
        this.UpdateNotifications("DEBUG", undefined, log);
    }

    /**
     * Fires on errors
     * @param {Error} err
     * @returns {Error}
     */
    OnError(err = new Tw2Error())
    {
        let wasGood = this.IsLoaded() || this.IsPrepared();

        if (!this._errors.includes(err))
        {
            this._errors.unshift(err);
        }

        this._SetState(Tw2Resource.State.ERROR);

        if (wasGood)
        {
            this.Unload({hide: true, detail: "errored"});
        }

        this.UpdateNotifications("ERROR", err, err);
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
            this.UpdateNotifications(stateName, undefined, log);
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
            log.time = (Date.now() - this._requested) * 0.001;
            this.UpdateNotifications("LOADED", undefined, log);
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
            log.time = (Date.now() - this._requested) * 0.001;
            this.UpdateNotifications("PREPARED", undefined, log);
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
            this.UpdateNotifications("UNLOADED", undefined, log);
        }
    }

    /**
     * Fires when the resource is purged
     * @param {*} [log]
     */
    OnPurged(log)
    {
        this._SetState(Tw2Resource.State.PURGED);
        this.UpdateNotifications("PURGED", this.GetLastError(), log);
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
         * @param {Error} [err]
         * @returns {Boolean}
         */
        const handler = function(res, err)
        {
            if (res.HasCompleted())
            {
                err = err || res.GetLastError();
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
     * Checks if a notification is registered
     * @param {*} notification
     * @returns {boolean}
     */
    HasNotification(notification)
    {
        return this._notifications.has(notification);
    }

    /**
     * Registers a notification
     * @param {*} notification
     */
    RegisterNotification(notification)
    {
        if (this.HasNotification(notification)) return;

        let funcName, argument;
        switch (this._state)
        {
            case Tw2Resource.State.ERROR:
                funcName = Tw2Resource.Callback.ERROR;
                argument = this.GetLastError();
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
                break;
        }

        // Don't add notification if it returns true
        if (isFunction(notification))
        {
            if (notification(this, argument)) return;
        }
        else if (funcName && funcName in notification)
        {
            if (notification[funcName](this, argument)) return;
        }

        this._notifications.add(notification);
    }

    /**
     * Deregisters a notification
     * @param {*} notification
     */
    UnregisterNotification(notification)
    {
        this._notifications.delete(notification);
    }

    /**
     * Updates a notification
     * @param {String} stateName - Event state name
     * @param {*} [err]          - Event error
     * @param {*} [log]          - Event log
     */
    UpdateNotifications(stateName, err, log)
    {
        stateName = stateName.toUpperCase();
        const funcName = Tw2Resource.Callback[stateName];

        resMan.OnPathEvent(this.path, stateName, log);

        this._notifications.forEach(notification =>
        {
            let remove = false;

            if (isFunction(notification))
            {
                remove = notification(this, err);
            }
            else if (funcName && funcName in notification)
            {
                remove = notification[funcName](this, err);
            }

            if (remove)
            {
                this.UnregisterNotification(notification);
            }
        });
    }

    /**
     * Clears all notifications
     */
    ClearNotifications()
    {
        this._notifications.clear();
    }

    /**
     * Identifies that this object is a resource
     * @type {boolean}
     * @private
     */
    static __isResource = true;

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

}

/**
 * An optional function for when the resource handles it's own loading
 * -  If the method returns false then the resource manager will handle the http request
 * @type {?Function}
 * @returns {Boolean}
 */
Tw2Resource.prototype.DoCustomLoad = null;

/**
 * HTTP request response type
 * @type {null}
 */
Tw2Resource.prototype.requestResponseType = null;