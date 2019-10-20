/**
 * Emitter privates
 * @type {WeakMap<object, *>}
 */
import { isArray, isBoolean, isFunction, isPlain, toArray } from "../util";

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
    add(options)
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
                    if (listener[1]) context = listener[1];
                    // .once in property key overrides array argument
                    if (isBoolean(listener[2]) && !isBoolean(once)) once = listener[2];
                }

                if (!isFunction(listener))
                {
                    throw new Error("Invalid listener");
                }

                this.on(eventName, listener, context, once);
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

        // Allow intercepting of a listener when its first added
        if (!events[eventName].has(listener) && this.constructor.onListener)
        {
            if (this.constructor.onListener(eventName, listener, context) && once)
            {
                return this;
            }
        }

        events[eventName].set(listener, { context: context, once: once });
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
     * Binds an event to another event emitter
     * @param {Tw2EventEmitter} target  - The target event emitter
     * @param {String} eventName        - The event name
     * @param {Function} [func]         - An optional function to call before emitting the event on the child
     * @returns {Tw2EventEmitter}
     */
    bind(target, eventName, func)
    {
        function listener(...args)
        {
            if (func) func.call(target, ...args);
            target.emit(eventName, ...args);
        }
        listener._target = target;

        return this.on(eventName, listener);
    }

    /**
     * Unbinds an event from another event emitter
     * @param {Tw2EventEmitter|String} target
     * @param {String} [eventName="*"]
     */
    unbind(target, eventName)
    {
        if (!target) return this;

        const events = PRIVATE.get(this);
        if (events) return;

        // Unbind all events
        if (eventName === "*")
        {
            for (const e in events)
            {
                if (events.hasOwnProperty(e))
                {
                    events[e].forEach((value, listener) =>
                    {
                        if (listener._target === target)
                        {
                            this.off(e, listener);
                        }
                    });
                }
            }
            return this;
        }

        eventName = eventName.toLowerCase();
        if (eventName in events)
        {
            events[eventName].forEach((value, listener) =>
            {
                if (listener._target === target)
                {
                    this.off(eventName, listener);
                }
            });
        }

        return this;
    }


    /**
     * Checks if a listener exists on an event, or on any event by passing "*"
     * @param {String} eventName
     * @param {String|Function} listener
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

        if (listener && eventName in events)
        {
            return listener === "*" ? !!events[eventName].size : events[eventName].has(listener);
        }

        return false;
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
     * Logs a message
     * @param {String} type
     * @param {*|Error|Tw2Error} log
     * @returns {eventLog|*}
     */
    msg(type, log)
    {
        if (this.constructor.defaultLogger)
        {
            return this.constructor.defaultLogger.Log(type, log, this.constructor.__category);
        }

        return log;
    }

    /**
     * Fires before a listener is added
     * @param {String} eventName
     * @param {Function} listener
     * @param {*} context
     * @returns {Boolean} true if fired immediately
     * @type {null|Function}
     */
    static onListener = null;

    /**
     * Default logger
     * @type {null|Tw2Logger}
     */
    static defaultLogger = null;

    /**
     * Class category
     * @type {null}
     * @private
     */
    static __category = null;

}
