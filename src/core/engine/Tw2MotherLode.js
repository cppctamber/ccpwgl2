
export class Tw2MotherLode
{
    constructor()
    {
        this._loadedObjects = {};
        this._errors = {};
    }

    /**
     * Adds an error log for a given path
     * @param {String} path
     * @param {Tw2Error|Error} err
     * @returns {Tw2Error|Error} err
     */
    AddError(path, err)
    {
        this._errors[path] = this._errors[path] || [];

        // Ensure error includes file path
        if (!err.message.includes(path))
        {
            err.message = `${err.message} "${path}"`;
        }

        if (!this._errors[path].includes(err))
        {
            err.path = path;
            this._errors[path].unshift(err);
        }

        return err;
    }

    /**
     * Gets a path's error logs
     * @param {String} path
     * @returns {?Array<Tw2Error|Error>}
     */
    GetErrors(path)
    {
        return path && path in this._errors ? Array.from(this._errors[path]) : [];
    }

    /**
     * Gets the last error for a path
     * @param path
     * @returns {Tw2Error|Error|undefined}
     */
    GetLastError(path)
    {
        return path && path in this._errors ? this._errors[path][0] : undefined;
    }

    /**
     * Checks if a path has any errors
     * @param {String} path
     * @returns {*|Boolean}
     */
    HasErrors(path)
    {
        return (path && path in this._errors);
    }

    /**
     * Finds a loaded object by it's file path
     * @param {String} path
     * @returns {Tw2LoadingObject|Tw2Resource}
     */
    Find(path)
    {
        if (path in this._loadedObjects)
        {
            return this._loadedObjects[path];
        }
        return null;
    }

    /**
     * Adds a loaded object
     * @param {String} path
     * @param {Tw2LoadingObject|Tw2Resource} obj
     */
    Add(path, obj)
    {
        this._loadedObjects[path] = obj;
    }

    /**
     * Checks if a res exists
     * @param {String} path
     * @returns {boolean}
     */
    Has(path)
    {
        return !!this._loadedObjects[path];
    }

    /**
     * Removes a loaded object by it's file path
     * @param {String} path
     */
    Remove(path)
    {
        if (this._loadedObjects[path])
        {
            Reflect.deleteProperty(this._loadedObjects, path);
        }
    }

    /**
     * Clears the loaded object object
     * @param {Function} [onClear] - Function that is called on each unloaded resource
     */
    Clear(onClear)
    {
        for (const key in this._loadedObjects)
        {
            if (this._loadedObjects.hasOwnProperty(key))
            {
                if (onClear) onClear(this._loadedObjects[key]);
                this.Remove(key);
            }
        }
    }

    /**
     * Unloads all loaded objects and then clears the loadedObject object
     * @param {Function} [onClear] - Function that is called on each unloaded and cleared resource
     * @param {eventLog} [eventLog]
     */
    UnloadAndClear(onClear, eventLog)
    {
        this.Clear(res =>
        {
            res.Unload(eventLog);
            if (onClear) onClear(res);
        });
    }

    /**
     * Purges inactive loaded objects (resources that have been loaded but are not being actively used)
     * - Loaded objects can flagged with `doNotPurge` to ensure they are never removed
     * - Resource auto purging can be managed in `ccpwgl` or `ccpwgl_int.resMan` - {@link Tw2ResMan}
     *     ccpwgl.setResourceUnloadPolicy()
     *     ccpwgl_int.resMan.autoPurgeResources=true
     *     ccpwgl_int.resMan.purgeTime=30
     * @param {Number} curFrame - the current frame count
     * @param {Number} frameLimit - how many frames the object can stay alive for before being purged
     * @param {Number} frameDistance - how long the resource has been alive for
     */
    PurgeInactive(curFrame, frameLimit, frameDistance)
    {
        for (const path in this._loadedObjects)
        {
            if (this._loadedObjects.hasOwnProperty(path))
            {
                const res = this._loadedObjects[path];

                // Don't purge
                if (res.doNotPurge)
                {
                    continue;
                }

                // Already purged
                if (res.IsPurged())
                {
                    this.Remove(path);
                    continue;
                }

                let detail;

                // Has errors
                if (res.HasErrors())
                {
                    detail = "errored";
                }
                // Waiting for purge
                else if (res.IsUnloaded())
                {
                    detail = "unloaded";
                }
                // good but inactive
                else if ((res.IsLoaded() || res.IsPrepared()) && (curFrame - res.activeFrame) % frameLimit >= frameDistance)
                {
                    if (res.Unload({ hide: true, detail: "inactivity" }))
                    {
                        detail = "inactivity";
                    }
                }

                if (detail)
                {
                    res.OnPurged({ detail });
                    this.Remove(path);
                }
            }
        }
    }
}
