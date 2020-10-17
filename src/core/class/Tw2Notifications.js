import { isFunction } from "utils";

/**
 * Tw2Notification
 */
export class Tw2Notifications
{

    /**
     * Registers a notification
     * @param {*} notification
     */
    RegisterNotification(notification)
    {
        if (this.HasNotification(notification))
        {
            return;
        }

        if (this.constructor.onNotification && this.constructor.onNotification(this, notification))
        {
            return;
        }

        this._notifications = this._notifications || new Set();
        this._notifications.add(notification);
    }

    /**
     * Updates notifications
     * @param {String} funcName
     * @param {Error|Tw2Error} [err]
     */
    UpdateNotifications(funcName, err)
    {
        if (this._notifications)
        {
            this._notifications.forEach(notification =>
            {
                let remove = false;
                if (isFunction(notification))
                {
                    remove = notification(this, err, funcName);
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

            if (this._notifications.size === 0)
            {
                this.ClearNotifications();
            }
        }
    }

    /**
     * Checks if a notification exists
     * @param {*} notification
     * @returns {boolean}
     */
    HasNotification(notification)
    {
        return this._notifications ? this._notifications.has(notification) : false;
    }

    /**
     * Unregisters a notification
     * @param {*} notification
     */
    UnregisterNotification(notification)
    {
        if (this._notifications)
        {
            this._notifications.delete(notification);
        }
    }

    /**
     * Clears notifications
     */
    ClearNotifications()
    {
        if (this._notifications)
        {
            this._notifications.clear();
            Reflect.deleteProperty(this, "_notifications");
        }
    }

    /**
     * Fires when a notification is registered
     * @type {null| Function}
     * @param {*} target
     * @param {*} notification
     * @returns {boolean}
     */
    static onNotification = null;

}
