import {isError, isFunction} from "../util";

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
     * @param {*} args
     * @returns {Tw2EventEmitter}
     */
    emit(eventName, ...args)
    {
        const events = PRIVATE.get(this);
        if (!events) return this;

        eventName = eventName.toLowerCase();
        if (eventName in events)
        {
            events[eventName].forEach(
                function(value, key)
                {
                    key.call(value.context, ...args);
                    if (value.once) events[eventName].delete(key);
                }
            );

            if (events[eventName].size === 0)
            {
                Reflect.deleteProperty(events, eventName);
            }
        }
        return this;
    }

    /**
     * Adds a listener to an event
     * @param {Array|String} eventName
     * @param {Function} listener
     * @param {*} [context=undefined]
     * @param {Boolean} [once=false]
     * @returns {Tw2EventEmitter}
     */
    on(eventName, listener, context = undefined, once = false)
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

        events[eventName].set(listener, {context: context, once: once});
        return this;
    }

    /**
     * Adds a listener to an event, and clears it after it's first emit
     * @param {String} eventName
     * @param {Function} listener
     * @param {*} [context]
     * @returns {Tw2EventEmitter}
     */
    once(eventName, listener, context)
    {
        return this.on(eventName, listener, context, true);
    }

    /**
     * Removes a listener from a specific event or from all events by passing "*"
     * @param {String} eventName
     * @param {Function} listener
     * @returns {Tw2EventEmitter}
     */
    off(eventName, listener)
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
     * @param {Function} listener
     * @returns {boolean}
     */
    has(eventName, listener)
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

        eventName = eventName.toLowerCase();
        return !!(eventName in events && events[eventName].has(listener));
    }

    /**
     * Clears an event and it's listeners, or all events by passing "*"
     * @param {String} eventName
     * @returns {Tw2EventEmitter}
     */
    del(eventName)
    {
        const events = PRIVATE.get(this);
        if (!events) return this;

        // Clear all
        if (eventName === "*")
        {
            this.emit("kill");
            for (const e in events)
            {
                if (events.hasOwnProperty(e))
                {
                    events[e].clear();
                    Reflect.deleteProperty(events, e);
                }
            }
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

    /**
     * Logs an event log
     * @param {eventLog|Error} eventLog
     * @returns {eventLog}
     */
    msg(eventLog)
    {
        if (isFunction(eventLog) && !isError(eventLog))
        {
            throw new Error("Invalid log, must be a plain object or an error");
        }

        if (!this.constructor.defaultLogger)
        {
            return eventLog;
        }

        return this.constructor.defaultLogger.Log(eventLog, this.constructor.category || this.constructor.name);
    }

    /**
     * Global logger
     * @type {*}
     */
    static defaultLogger = null;

}
