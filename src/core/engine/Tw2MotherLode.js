export class Tw2MotherLode
{
    constructor()
    {
        this._loadedObjects = {};
        this._errors = {};
        this._watching = [];
    }

    /**
     * Watches an object and resolves a promise when all resources have completed processing
     * @param {*} object
     * @param {Function} [onProgress]
     * @return {Promise<*>}
     */
    async Watch(object, onProgress)
    {
        // Check if already watching
        const index = this.GetWatchedIndex(object);
        if (index !== -1)
        {
            const watched = this._watching[index];
            if (!watched.onProgress.includes(onProgress))
            {
                watched.onProgress.push(onProgress);
            }
            return this._watching[index]._promise;
        }

        // Get resource counts
        const r = this.GetWatchedResourceDetail(object);

        // Update progress (include 0)
        if (onProgress)
        {
            onProgress(r, object);
        }

        // Already complete
        if (!r.pending) return object;

        // Watcher
        const watched = {
            object,
            onProgress: [],
            frames: 0,
            total: r.total,
            pending: r.pending
        };

        if (onProgress)
        {
            watched.onProgress.push(onProgress);
        }

        this._watching.push(watched);

        // Create deferred promise
        watched._promise = new Promise((resolve, reject) =>
        {
            watched.onCompleted = didComplete => resolve(watched.object, didComplete);
            watched.onError = err => reject(err);
        });

        return watched._promise;
    }

    /**
     * Unwatches an object
     * @param {*} obj
     * @return {boolean}
     */
    UnWatch(obj)
    {
        const index = this.GetWatchedIndex(obj);
        if (index !== -1)
        {
            const { onCompleted } = this._watching[index];
            this._watching.splice(index, 1);
            onCompleted(false);
            return true;
        }
        return false;
    }

    /**
     * Purges all watched objects and forces all promises to resolve
     */
    PurgeWatched()
    {
        for (let i = 0; i < this._watching.length; i++)
        {
            const { onCompleted } = this._watching[i];
            this._watching.splice(i, 1);
            onCompleted(false);
            i--;
        }
    }

    /**
     * Gets the watched index of an object
     * @param {Object} object
     * @return {number}
     */
    GetWatchedIndex(object)
    {
        for (let i = 0; i < this._watching.length; i++)
        {
            if (this._watching[i].object === object)
            {
                return i;
            }
        }
        return -1;
    }

    /**
     * Checks if an object's resources have completed
     * @param {*} object
     * @return {Object}
     */
    GetWatchedResourceDetail(object)
    {
        const out = { total: 0, pending: 0, percent: 100 };

        // We have no idea
        if (!object.GetResources && !object.getResources)
        {
            return out;
        }

        const res = object.GetResources ? object.GetResources() : object.getResources();
        out.total = res.length;

        // Cycle through all available res to keep them alive
        // And to catch any that have been added since first watched
        if (out.total)
        {
            for (let i = 0; i < res.length; i++)
            {
                if (!res[i].HasCompleted())
                {
                    out.pending++;
                }
            }

            out.percent = parseFloat(((out.total - out.pending) / out.total * 100).toFixed(2));
        }

        return out;
    }

    /**
     * Updated watches objects
     * @param {Number} maxFrames
     * @param {Number} maxWatched (0 for unlimited)
     * @param {Number} maxTime (0 for unlimited)
     */
    UpdateWatched(maxFrames, maxWatched, maxTime)
    {
        const now = Date.now();

        for (let i = 0; i < this._watching.length; i++)
        {
            // Limit time watching
            if (maxTime && Date.now() - now >= maxTime)
            {
                return;
            }

            // Limit how many can be watched
            if (maxWatched && maxWatched >= i)
            {
                return;
            }

            const
                w = this._watching[i],
                res = this.GetWatchedResourceDetail(w.object);

            w.frames++;

            // Update progress if there was a change (include 0)
            if (w.total !== res.total || w.pending !== res.pending)
            {
                w.total = res.total;
                w.pending = res.pending;
                for (let i = 0; i < w.onProgress.length; i++)
                {
                    w.onProgress[i](res, w.object);
                }
            }

            // Finished
            if (!res.pending)
            {
                this._watching.splice(i, 1);
                i--;
                w.onCompleted(true);
                break;
            }

            // Took too long
            if (w.frames >= maxFrames)
            {
                this._watching.splice(i, 1);
                i--;
                w.onError(new Error("Maximum watch duration reached"));
                break;
            }
        }
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
    HasErrored(path)
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
                if (res.HasErrored())
                {
                    detail = "errored";
                }
                // Waiting for purge
                else if (res.IsUnloaded())
                {
                    detail = "unloaded";
                }
                // good but inactive
                else if (res.HasLoaded() && (curFrame - res.activeFrame) % frameLimit >= frameDistance)
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
