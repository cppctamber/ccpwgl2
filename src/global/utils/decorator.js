import { isFunction } from "global/utils/type";

/**
 * Ensures descriptors always have default values
 * - Babel doesn't always handle correctly
 * @param {PropertyDescriptor} d
 * @returns {PropertyDescriptor}
 */
export function handleDescriptor(d)
{
    if (d && !d.set && !d.get)
    {
        if (d.writable === undefined) d.writable = true;
        if (d.enumerable === undefined) d.enumerable = true;
        if (d.configurable === undefined) d.configurable = true;
    }
    return d;
}

const invalidHandlers = {
    ctor: () => { throw new TypeError("Decorator doesn't support classes");},
    method: () => { throw new TypeError("Decorator doesn't support methods");},
    property: () => { throw new TypeError("Decorator doesn't support properties");},
};

function normalizeHandlers(options)
{
    const { ctor, method, property, handler } = options;

    function resolve(value, errHandler)
    {
        if (isFunction(value)) return value;
        if (value === false) return errHandler;
        return isFunction(handler) ? handler : errHandler;
    }

    return {
        ctor: resolve(ctor, invalidHandlers.ctor),
        method: resolve(method, invalidHandlers.method),
        property: resolve(property, invalidHandlers.property)
    };
}

function getDecorator(handlers, options, ...args)
{
    return function(target, property, descriptor)
    {
        if (descriptor) handleDescriptor(descriptor);
        let obj = { target, property, descriptor, ...options };
        if (!property) return handlers.ctor(obj, ...args);
        return isFunction(target[property]) ? handlers.method(obj, ...args) : handlers.property(obj, ...args);
    };
}

/**
 * Creates a decorator
 * @param {Object|Function} o
 * @param {Boolean|Function} [o.ctor]     - Class handler
 * @param {Boolean|Function} [o.property] - Property handler
 * @param {Boolean|Function} [o.method]   - Method handler
 * @param {Function} [o.handler]  - Default handler
 * @param {*} [o.value]
 * @returns {Function}
 */
export function createDecorator(o)
{
    // Strip standard options
    let { handler, property, method, ctor, noArgs, ...options } = o;

    const handlers = normalizeHandlers(o);

    if (noArgs)
    {
        return getDecorator(handlers, options);
    }

    return function(...args)
    {
        return getDecorator(handlers, options, ...args);
    };
}
