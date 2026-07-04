import { meta } from "utils";


const
    RESULT_PASS = 0,
    RESULT_HANDLED = 1,
    RESULT_CONSUME = 2,
    RESULT_CAPTURE = 3,
    RESULT_RELEASE = 4,
    DEFAULT_EVENTS = [ "mousedown", "mousemove", "mouseup", "wheel", "contextmenu" ],
    DEFAULT_DOCUMENT_EVENTS = [ "mousemove", "mouseup" ],
    DEFAULT_KEY_EVENTS = [ "keydown", "keyup" ];


/**
 * Canvas input manager.
 *
 * Native DOM handlers stay tiny: they normalize and queue events. Registered
 * consumers are drained from the library frame boundary so scene mutations do
 * not happen in the middle of browser input propagation.
 */
@meta.type("Tw2InputMan")
@meta.wgl.define("Tw2InputMan")
export class Tw2InputMan extends meta.Model
{

    name = "Input";
    enabled = true;
    maxQueuedEvents = 512;
    drainPerFrame = 256;
    element = null;
    keyTarget = null;

    _bindings = [];
    _consumers = [];
    _queue = [];
    _nextListenerId = 1;
    _capturedConsumer = null;
    _keyboardConsumer = null;
    _seenEvents = typeof WeakSet !== "undefined" ? new WeakSet() : null;

    /**
     * Constructor
     * @param {Tw2Library} tw2
     */
    constructor(tw2)
    {
        super();
        this.tw2 = tw2;
    }

    /**
     * Binds input to a device's canvas stack.
     * @param {Tw2Device} device
     * @param {Object} [options]
     * @returns {Tw2InputMan}
     */
    BindDevice(device, options = {})
    {
        return this.BindElement(options.element || device.canvas2d || device.canvas, {
            ...options,
            keyTarget: options.keyTarget || this.constructor.GetDefaultKeyTarget()
        });
    }

    /**
     * Binds native event listeners.
     * @param {HTMLElement|String} element
     * @param {Object} [options]
     * @returns {Tw2InputMan}
     */
    BindElement(element, options = {})
    {
        this.UnbindElement();

        element = this.constructor.ResolveElement(element);
        if (!element) return this;

        const
            capture = options.capture !== undefined ? !!options.capture : true,
            events = this.constructor.NormalizeEvents(options.events || DEFAULT_EVENTS),
            documentEvents = this.constructor.NormalizeEvents(options.documentEvents || DEFAULT_DOCUMENT_EVENTS),
            keyEvents = this.constructor.NormalizeEvents(options.keyEvents || DEFAULT_KEY_EVENTS),
            keyTarget = options.keyTarget === false ? null : this.constructor.ResolveElement(options.keyTarget) || this.constructor.GetDefaultKeyTarget(),
            documentTarget = options.documentTarget === false ? null : this.constructor.GetDefaultDocumentTarget();

        this.element = element;
        this.keyTarget = keyTarget;

        const add = (target, type) =>
        {
            if (!target || !target.addEventListener) return;
            const handler = event => this.OnDomEvent(type, event);
            target.addEventListener(type, handler, capture);
            this._bindings.push({ target, type, handler, capture });
        };

        for (let i = 0; i < events.length; i++)
        {
            add(element, events[i]);
        }

        if (documentTarget && documentTarget !== element)
        {
            for (let i = 0; i < documentEvents.length; i++)
            {
                add(documentTarget, documentEvents[i]);
            }
        }

        const windowTarget = typeof window !== "undefined" ? window : null;
        if (windowTarget && keyTarget !== windowTarget)
        {
            for (let i = 0; i < keyEvents.length; i++)
            {
                add(windowTarget, keyEvents[i]);
            }
        }

        if (keyTarget)
        {
            for (let i = 0; i < keyEvents.length; i++)
            {
                add(keyTarget, keyEvents[i]);
            }
        }

        return this;
    }

    /**
     * Removes native event listeners.
     * @returns {Tw2InputMan}
     */
    UnbindElement()
    {
        for (let i = 0; i < this._bindings.length; i++)
        {
            const { target, type, handler, capture } = this._bindings[i];
            if (target && target.removeEventListener)
            {
                target.removeEventListener(type, handler, capture);
            }
        }

        this._bindings.splice(0);
        this.element = null;
        this.keyTarget = null;
        this._seenEvents = typeof WeakSet !== "undefined" ? new WeakSet() : null;
        return this;
    }

    /**
     * Registers an ordered input consumer.
     * @param {Object|Function} consumer
     * @returns {Object} token
     */
    Register(consumer)
    {
        if (!consumer)
        {
            throw new TypeError("Invalid input consumer");
        }

        if (typeof consumer === "function")
        {
            consumer = { HandleInputEvent: consumer };
        }

        const record = {
            id: this._nextListenerId++,
            consumer,
            context: consumer.context || consumer,
            name: consumer.name || consumer.constructor && consumer.constructor.name || "inputConsumer",
            priority: Number(consumer.priority) || 0,
            events: this.constructor.NormalizeEvents(consumer.events),
            enabled: consumer.enabled !== false
        };

        this._consumers.push(record);
        this.SortConsumers();

        return {
            input: this,
            id: record.id,
            consumer,
            Unregister: () => this.Unregister(record.id)
        };
    }

    /**
     * Unregisters an input consumer.
     * @param {Object|Number|Function} token
     * @returns {Boolean}
     */
    Unregister(token)
    {
        const index = this._consumers.findIndex(record =>
            record === token ||
            record.id === token ||
            record.consumer === token ||
            record.consumer === token?.consumer ||
            record.consumer === token?.listener ||
            record.id === token?.id
        );

        if (index === -1) return false;

        const record = this._consumers[index];
        this._consumers.splice(index, 1);

        if (this._capturedConsumer === record) this._capturedConsumer = null;
        if (this._keyboardConsumer === record) this._keyboardConsumer = null;
        return true;
    }

    /**
     * Sorts input consumers by priority.
     */
    SortConsumers()
    {
        this._consumers.sort((a, b) => b.priority - a.priority || a.id - b.id);
    }

    /**
     * Native DOM event entrypoint.
     * @param {String} type
     * @param {Event} domEvent
     */
    OnDomEvent(type, domEvent)
    {
        if (!this.enabled || !domEvent) return;

        if (this._seenEvents)
        {
            if (this._seenEvents.has(domEvent)) return;
            this._seenEvents.add(domEvent);
        }

        const event = this.CreateEvent(type, domEvent);
        this.DispatchEvent(event, true);

        if (event.consumed)
        {
            this.ConsumeDomEvent(domEvent);
        }

        this.EmitEvent("queued", event, this);
        this.QueueEvent(event);
    }

    /**
     * Queues an input event for frame-boundary processing.
     * @param {Object} event
     * @returns {Object}
     */
    QueueEvent(event)
    {
        if (this._queue.length >= this.maxQueuedEvents)
        {
            this._queue.shift();
        }

        this._queue.push(event);
        return event;
    }

    /**
     * Drains queued input events.
     * @param {Number} dt
     * @returns {Number} processed count
     */
    Update(dt)
    {
        if (!this.enabled || !this._queue.length) return 0;

        let processed = 0;
        const count = Math.min(this._queue.length, this.drainPerFrame);

        this.EmitEvent("pre_update", this, dt);

        for (let i = 0; i < count; i++)
        {
            const event = this._queue.shift();
            event.dt = dt;
            this.DispatchEvent(event, false);
            processed++;
        }

        this.EmitEvent("post_update", this, dt, processed);
        return processed;
    }

    /**
     * Dispatches an input event.
     * @param {Object} event
     * @param {Boolean} preview
     * @returns {Number}
     */
    DispatchEvent(event, preview)
    {
        this.EmitEvent(preview ? "preview" : "input", event, this);
        this.EmitEvent(event.type, event, this, preview);

        const captured = this.GetCapturedRecord(event);
        if (captured)
        {
            return this.DispatchToRecord(captured, event, preview);
        }

        for (let i = 0; i < this._consumers.length; i++)
        {
            const record = this._consumers[i];
            if (!this.RecordMatchesEvent(record, event)) continue;

            const result = this.DispatchToRecord(record, event, preview);
            if (result >= RESULT_HANDLED)
            {
                return result;
            }
        }

        return RESULT_PASS;
    }

    /**
     * Dispatches an event to a consumer record.
     * @param {Object} record
     * @param {Object} event
     * @param {Boolean} preview
     * @returns {Number}
     */
    DispatchToRecord(record, event, preview)
    {
        if (!record || !record.enabled || !this.RecordMatchesEvent(record, event))
        {
            return RESULT_PASS;
        }

        const
            consumer = record.consumer,
            context = record.context,
            callbacks = preview ?
                [ "PreviewInputEvent", "PreviewEvent", "preview" ] :
                [ "HandleInputEvent", "HandleEvent", "handle" ];

        let result = RESULT_PASS;

        for (let i = 0; i < callbacks.length; i++)
        {
            const callback = consumer[callbacks[i]];
            if (typeof callback === "function")
            {
                result = this.NormalizeResult(callback.call(context, event, this));
                break;
            }
        }

        this.ApplyResult(record, event, result, preview);
        return result;
    }

    /**
     * Applies a consumer result.
     * @param {Object} record
     * @param {Object} event
     * @param {Number} result
     * @param {Boolean} preview
     */
    ApplyResult(record, event, result, preview)
    {
        if (result >= RESULT_CONSUME)
        {
            event.consumed = true;
        }

        if (!preview && result === RESULT_CAPTURE)
        {
            if (this.constructor.IsKeyboardEvent(event))
            {
                this._keyboardConsumer = record;
            }
            else
            {
                this._capturedConsumer = record;
            }
        }
        else if (!preview && result === RESULT_RELEASE)
        {
            if (this._capturedConsumer === record) this._capturedConsumer = null;
            if (this._keyboardConsumer === record) this._keyboardConsumer = null;
        }
    }

    /**
     * Gets a captured consumer for an event.
     * @param {Object} event
     * @returns {Object|null}
     */
    GetCapturedRecord(event)
    {
        if (this.constructor.IsKeyboardEvent(event))
        {
            return this._keyboardConsumer;
        }

        return this._capturedConsumer;
    }

    /**
     * Checks if a consumer can handle an event.
     * @param {Object} record
     * @param {Object} event
     * @returns {Boolean}
     */
    RecordMatchesEvent(record, event)
    {
        return !!(
            record &&
            record.enabled &&
            (!record.events || !record.events.length || record.events.includes(event.type))
        );
    }

    /**
     * Normalizes a consumer result.
     * @param {*} result
     * @returns {Number}
     */
    NormalizeResult(result)
    {
        if (result === true) return RESULT_HANDLED;
        if (typeof result === "number") return result;

        switch (String(result || "").toLowerCase())
        {
            case "handled":
            case "handle":
                return RESULT_HANDLED;

            case "consume":
            case "consumed":
                return RESULT_CONSUME;

            case "capture":
            case "captured":
                return RESULT_CAPTURE;

            case "release":
            case "released":
                return RESULT_RELEASE;

            default:
                return RESULT_PASS;
        }
    }

    /**
     * Creates a normalized input event.
     * @param {String} type
     * @param {Event} domEvent
     * @returns {Object}
     */
    CreateEvent(type, domEvent)
    {
        type = String(type || domEvent.type || "").toLowerCase();

        const event = {
            input: this,
            type,
            domEvent,
            target: domEvent.target || null,
            currentTarget: domEvent.currentTarget || null,
            element: this.element,
            timeStamp: domEvent.timeStamp || 0,
            clientX: Number.isFinite(domEvent.clientX) ? domEvent.clientX : 0,
            clientY: Number.isFinite(domEvent.clientY) ? domEvent.clientY : 0,
            screenX: Number.isFinite(domEvent.screenX) ? domEvent.screenX : 0,
            screenY: Number.isFinite(domEvent.screenY) ? domEvent.screenY : 0,
            movementX: Number.isFinite(domEvent.movementX) ? domEvent.movementX : 0,
            movementY: Number.isFinite(domEvent.movementY) ? domEvent.movementY : 0,
            button: Number.isFinite(domEvent.button) ? domEvent.button : 0,
            buttons: Number.isFinite(domEvent.buttons) ? domEvent.buttons : 0,
            deltaX: Number.isFinite(domEvent.deltaX) ? domEvent.deltaX : 0,
            deltaY: Number.isFinite(domEvent.deltaY) ? domEvent.deltaY : 0,
            key: domEvent.key || "",
            code: domEvent.code || "",
            repeat: !!domEvent.repeat,
            altKey: !!domEvent.altKey,
            ctrlKey: !!domEvent.ctrlKey,
            metaKey: !!domEvent.metaKey,
            shiftKey: !!domEvent.shiftKey,
            consumed: false,
            dt: 0
        };

        event.PreventDefault = () =>
        {
            event.consumed = true;
            this.ConsumeDomEvent(domEvent, false);
        };

        event.StopPropagation = () =>
        {
            event.consumed = true;
            this.ConsumeDomEvent(domEvent, true);
        };

        event.Consume = () =>
        {
            event.consumed = true;
            this.ConsumeDomEvent(domEvent, true);
        };

        return event;
    }

    /**
     * Consumes a native DOM event.
     * @param {Event} domEvent
     * @param {Boolean} [stop]
     */
    ConsumeDomEvent(domEvent, stop = true)
    {
        if (!domEvent) return;
        if (domEvent.cancelable !== false && domEvent.preventDefault)
        {
            domEvent.preventDefault();
        }
        if (stop && domEvent.stopPropagation)
        {
            domEvent.stopPropagation();
            if (domEvent.stopImmediatePropagation)
            {
                domEvent.stopImmediatePropagation();
            }
        }
    }

    /**
     * Resolves an element.
     * @param {*} element
     * @returns {*}
     */
    static ResolveElement(element)
    {
        if (typeof element === "string" && typeof document !== "undefined")
        {
            return document.getElementById(element);
        }

        return element || null;
    }

    /**
     * Gets the default document target.
     * @returns {*}
     */
    static GetDefaultDocumentTarget()
    {
        return typeof document !== "undefined" ? document : null;
    }

    /**
     * Gets the default keyboard target.
     * @returns {*}
     */
    static GetDefaultKeyTarget()
    {
        return typeof window !== "undefined" ? window : typeof document !== "undefined" ? document : null;
    }

    /**
     * Normalizes event names.
     * @param {String|Array} events
     * @returns {Array|null}
     */
    static NormalizeEvents(events)
    {
        if (!events) return null;
        if (typeof events === "string")
        {
            events = events.split(/[\s,|]+/).filter(Boolean);
        }

        if (!Array.isArray(events)) return null;
        return events.map(event => String(event).toLowerCase());
    }

    /**
     * Checks if an event is keyboard driven.
     * @param {Object} event
     * @returns {Boolean}
     */
    static IsKeyboardEvent(event)
    {
        return event && event.type && event.type.indexOf("key") === 0;
    }

    /**
     * Checks if an event is pointer/mouse driven.
     * @param {Object} event
     * @returns {Boolean}
     */
    static IsPointerEvent(event)
    {
        return !!(event && /^(mouse|pointer|touch|wheel|contextmenu)/.test(event.type));
    }

}


Tw2InputMan.Result = {
    PASS: RESULT_PASS,
    HANDLED: RESULT_HANDLED,
    CONSUME: RESULT_CONSUME,
    CAPTURE: RESULT_CAPTURE,
    RELEASE: RESULT_RELEASE
};

Tw2InputMan.PASS = RESULT_PASS;
Tw2InputMan.HANDLED = RESULT_HANDLED;
Tw2InputMan.CONSUME = RESULT_CONSUME;
Tw2InputMan.CAPTURE = RESULT_CAPTURE;
Tw2InputMan.RELEASE = RESULT_RELEASE;
