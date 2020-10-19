import { isArray, isFunction } from "utils";

/**
 * Emitter privates
 * @type {WeakMap<object, *>}
 */
const PRIVATE = new WeakMap();

/**
 * Tw2EventEmitter
 */
export class Tw2EventEmitter
{

    /**
     * Emits an event
     * @param {String} eventName
     * @param args
     * @returns {Tw2EventEmitter}
     */
    EmitEvent(eventName, ...args)
    {
        const events = PRIVATE.get(this);
        if (!events) return this;

        eventName = eventName.toLowerCase();
        if (eventName in events)
        {
            events[eventName].forEach((value, key) =>
            {
                key.call(value.context, ...args);
                if (value.once) events[eventName].delete(key);
            });

            if (events[eventName].size === 0)
            {
                Reflect.deleteProperty(events, eventName);
            }
        }

        return this;
    }

    /**
     * Adds events from a plain object
     * @param {Object} options
     * @returns {Tw2EventEmitter}
     */
    AddEvents(options)
    {
        if (!options) return this;

        for (let key in options)
        {
            if (options.hasOwnProperty(key))
            {
                let listener = options[key],
                    eventName = key,
                    context,
                    once;

                // Append ".once" to event name to fire only once
                if (key.indexOf(".once") !== -1)
                {
                    if (key.lastIndexOf(".once") === key.length - 5)
                    {
                        eventName = key.substring(0, key.length - 5);
                        once = true;
                    }
                }

                // options as an array/ arguments
                if (isArray(listener))
                {
                    listener = listener[0];
                    context = listener[1];
                }

                if (!isFunction(listener))
                {
                    throw new Error("Invalid listener");
                }

                this.OnEvent(eventName, listener, context, once);
            }
        }

        return this;
    }

    /**
     * Adds a listener to an event
     * @param {Array|String} eventName
     * @param {Function} listener
     * @param {*} [context]
     * @param {Boolean} [once]
     * @returns {Tw2EventEmitter}
     */
    OnEvent(eventName, listener, context, once)
    {
        let events = PRIVATE.get(this);

        if (!events)
        {
            events = {};
            PRIVATE.set(this, events);
        }

        eventName = eventName.toLowerCase();

        if (!events[eventName])
        {
            events[eventName] = new Map();
        }

        // Allow intercepting of a listener when its first added
        if (!events[eventName].has(listener))
        {
            if (this.constructor.onListener)
            {
                if (this.constructor.onListener(this, eventName, listener, context) && once)
                {
                    return this;
                }
            }
            else if (this["OnEventFirstListener"])
            {
                if (this["OnEventFirstListener"](this, eventName, listener, context) && once)
                {
                    return this;
                }
            }
        }

        events[eventName].set(listener, { context: context, once: once });
        return this;
    }

    /**
     * Adds a listener to an event, and clears it after it's first EmitEvent
     * @param {String} eventName
     * @param {Function} listener
     * @param {*} [context]
     * @returns {Tw2EventEmitter}
     */
    OnceEvent(eventName, listener, context)
    {
        return this.OnEvent(eventName, listener, context, true);
    }

    /**
     * Removes a listener from a specific event or from all events by passing "*"
     * @param {String} eventName
     * @param {Function} listener
     * @returns {Tw2EventEmitter}
     */
    OffEvent(eventName, listener)
    {
        const events = PRIVATE.get(this);
        if (!events) return this;

        // Remove listener from all events
        if (eventName === "*")
        {
            for (const eventName in events)
            {
                if (events.hasOwnProperty(eventName))
                {
                    events[eventName].delete(listener);
                    if (events[eventName].size === 0)
                    {
                        Reflect.deleteProperty(events, eventName);
                    }
                }
            }
            return this;
        }

        eventName = eventName.toLowerCase();
        if (eventName in events)
        {
            events[eventName].delete(listener);
            if (events[eventName].size === 0)
            {
                Reflect.deleteProperty(events, eventName);
            }
        }

        return this;
    }

    /**
     * Checks if a listener exists on an event, or on any event by passing "*"
     * @param {String} eventName
     * @param {String|Function} listener
     * @returns {boolean}
     */
    HasEvent(eventName, listener)
    {
        const events = PRIVATE.get(this);
        if (!events) return false;

        // Check all events
        if (eventName === "*")
        {
            for (const key in events)
            {
                if (events.hasOwnProperty(key))
                {
                    if (events[key].has(listener))
                    {
                        return true;
                    }
                }
            }
            return false;
        }

        if (listener && eventName in events)
        {
            return listener === "*" ? !!events[eventName].size : events[eventName].has(listener);
        }

        return false;
    }

    /**
     * Clears an event of listeners
     * @param {String} eventName
     * @returns {Tw2EventEmitter}
     */
    ClearEvent(eventName)
    {
        const events = PRIVATE.get(this);
        if (!events) return this;

        if (eventName === "*")
        {
            PRIVATE.delete(this);
            return this;
        }

        eventName = eventName.toLowerCase();
        if (eventName in events)
        {
            events[eventName].clear();
            Reflect.deleteProperty(events, eventName);
        }
        return this;
    }

}
