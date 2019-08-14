import {resMan} from "../../global";
import {Tw2Error} from "../Tw2Error";

/**
 * Tw2Resource base class
 *
 * @property {String} path
 * @property {Number} activeFrame
 * @property {Number} doNotPurge
 * @property {Number} _state
 * @property {Array} _notifications
 */
export class Tw2Resource
{

    path = "";
    activeFrame = 0;
    doNotPurge = 0;

    _state = Tw2Resource.State.NO_INIT;
    _notifications = [];

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
        return this._state === Tw2Resource.State.ERROR ||
            this._state === Tw2Resource.State.PURGED ||
            this._state === Tw2Resource.State.PREPARED;
    }

    /**
     * Unloads the resource
     * @returns {Boolean}
     */
    Unload()
    {
        return false;
    }

    /**
     * Reloads the resource
     */
    Reload()
    {
        this.Unload();
        if (this.IsUnloaded() || this.IsPurged())
        {
            resMan.LoadResource(this);
        }
    }

    /**
     * Keeps the resource from being purged
     */
    KeepAlive()
    {
        this.activeFrame = resMan.activeFrame;
        if (this.IsPurged() && !this.HasErrors())
        {
            this.Reload();
        }
    }

    /**
     * Gets an array of resource errors, or an empty array if there are none
     * @returns {Array.<Tw2Error|Error>}
     */
    GetErrors()
    {
        return resMan.motherLode.GetErrors(this.path);
    }

    /**
     * Gets the resource's last error
     * @returns {Tw2Error|Error}
     */
    GetLastError()
    {
        return resMan.motherLode.GetLastError(this.path);
    }

    /**
     * Fires on warnings
     * @param {*} [eventLog]
     */
    OnWarning(eventLog)
    {
        resMan.OnResEvent("warning", this.path, eventLog);
    }

    /**
     * Fires on debugs
     * @param {*} eventLog
     */
    OnDebug(eventLog)
    {
        resMan.OnResEvent("debug", this.path, eventLog);
    }

    /**
     * Fires on errors
     * @param {Error} err
     * @returns {Error}
     */
    OnError(err = new Tw2Error())
    {
        const doUnload = !this.IsUnloaded();
        this._state = Tw2Resource.State.ERROR;
        if (doUnload) this.Unload();
        resMan.OnResEvent("error", this.path, err);
        this.UpdateNotifications(Tw2Resource.Callback.ERROR, err);
        return err;
    }

    /**
     * LoadStarted
     * @param {*} [eventLog]
     */
    OnRequested(eventLog)
    {
        if (this.HasErrors()) return;
        const reloading = this.IsPurged() || this.IsUnloaded();
        this._state = Tw2Resource.State.REQUESTED;
        resMan.OnResEvent(reloading ? "reloading" : "requested", this.path, eventLog);
        this.UpdateNotifications(Tw2Resource.Callback.REQUESTED);
    }

    /**
     * LoadFinished
     * @param {*} [eventLog]
     */
    OnLoaded(eventLog)
    {
        if (this.HasErrors()) return;
        this._state = Tw2Resource.State.LOADED;
        resMan.OnResEvent("loaded", this.path, eventLog);
        this.UpdateNotifications(Tw2Resource.Callback.LOADED);
    }

    /**
     * PrepareFinished
     * @param {*} [eventLog]
     */
    OnPrepared(eventLog)
    {
        if (this.HasErrors()) return;
        this._state = Tw2Resource.State.PREPARED;
        resMan.OnResEvent("prepared", this.path, eventLog);
        this.UpdateNotifications(Tw2Resource.Callback.PREPARED);
    }

    /**
     * Fires when the resource has been unloads
     * @param {*} [eventLog]
     */
    OnUnloaded(eventLog)
    {
        if (this.HasErrors()) return;
        this._state = Tw2Resource.State.UNLOADED;
        resMan.OnResEvent("unloaded", this.path, eventLog);
        this.UpdateNotifications(Tw2Resource.Callback.UNLOADED);
    }

    /**
     * Fires when the resource is purged
     * @param eventLog
     */
    OnPurged(eventLog)
    {
        if (!this.HasErrors()) this._state = Tw2Resource.State.PURGED;
        resMan.OnResEvent("purged", this.path, eventLog);
        this.UpdateNotifications(Tw2Resource.Callback.PURGED);
    }

    /**
     * Wraps callbacks as a notification
     * - The notification is removed as soon as the resource is prepared or errored
     * @param {Function} [onResolved]
     * @param {Function} [onRejected]
     */
    RegisterCallbacks(onResolved, onRejected)
    {
        this.KeepAlive();

        if (!onResolved && !onRejected)
        {
            return;
        }

        const notification = {

            /**
             * Fires on res error
             * @param {Tw2Resource} res
             * @param {Tw2Error|Error} err
             * @returns {boolean}
             */
            OnResError(res, err)
            {
                if (onRejected) onRejected(err);
                return true;
            },

            /**
             * Fires on res prepared
             * @param {Tw2Resource} res
             * @returns {boolean}
             */
            OnResPrepared(res)
            {
                if (onResolved) onResolved(res);
                return true;
            }

        };

        this.RegisterNotification(notification);
        return notification;
    }

    /**
     * Registers a notification
     * @param {*} notification
     */
    RegisterNotification(notification)
    {
        if (!this._notifications.includes(notification))
        {
            let funcName, argument;

            switch (this._state)
            {
                case Tw2Resource.State.ERROR:
                    funcName = Tw2Resource.Callback.ERROR;
                    argument = resMan.motherLode.GetLastError(this.path);
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
            if (funcName && notification[funcName] && notification[funcName](this, argument))
            {
                return;
            }

            this._notifications.push(notification);
        }
    }

    /**
     * Deregisters a notification
     * @param {*} notification
     */
    UnregisterNotification(notification)
    {
        this._notifications.splice(this._notifications.indexOf(notification), 1);
    }

    /**
     * Updates a notification
     * @param {String} funcName - The function name to call
     * @param {*} [argument]    - An optional argument
     */
    UpdateNotifications(funcName, argument)
    {
        for (let i = 0; i < this._notifications.length; i++)
        {
            // Notifications are removed if they return true
            if (funcName && funcName in this._notifications[i] && this._notifications[i][funcName](this, argument))
            {
                this._notifications.splice(i, 1);
                i--;
            }
        }
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
        DEBUG: "OnResDebug",
        WARNING: "OnResWarning"
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

