const PRIVATE = new WeakMap();

class Model
{
    SetValues(values = {})
    {
        Object.assign(this, values);
        return this;
    }

    EmitEvent(eventName, ...args)
    {
        const listeners = PRIVATE.get(this)?.get(String(eventName).toLowerCase());
        if (!listeners) return this;
        for (const listener of listeners) listener(...args);
        return this;
    }

    OnEvent(eventName, listener)
    {
        let events = PRIVATE.get(this);
        if (!events)
        {
            events = new Map();
            PRIVATE.set(this, events);
        }
        const name = String(eventName).toLowerCase();
        if (!events.has(name)) events.set(name, new Set());
        events.get(name).add(listener);
        return this;
    }

    OffEvent(eventName, listener)
    {
        PRIVATE.get(this)?.get(String(eventName).toLowerCase())?.delete(listener);
        return this;
    }
}

export const meta = { Model };
