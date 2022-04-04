import { isFunction } from "utils";

/**
 * Meta data prefix
 * @type {string}
 */
const PREFIX = "tw2";

/**
 * Turns a string into a meta data name
 * @param {String} name
 * @returns {string}
 */
function getMetaName(name)
{
    return `${PREFIX}:${name}`;
}

/**
 * Defines meta data
 * @param {String} name
 * @param {*} value
 * @param {*} target
 * @param {String} [property]
 * @returns {*} value
 */
export function defineMetadata(name, value, target, property)
{
    Reflect.defineMetadata(getMetaName(name), value, target, property);
}

/**
 * Checks if a target has meta data
 * @param {String} name
 * @param {*} target
 * @param {*} [property]
 * @returns {boolean}
 */
export function hasMetadata(name, target, property)
{
    return Reflect.hasMetadata(getMetaName(name), target, property);
}

/**
 * Checks if a target has it's own meta data
 * @param {String} name
 * @param {*} target
 * @param {*} [property]
 * @returns {boolean}
 */
export function hasOwnMetadata(name, target, property)
{
    return Reflect.hasOwnMetadata(getMetaName(name), target, property);
}

/**
 * Gets a target's meta data
 * @param {String} name
 * @param {*} target
 * @param {*} [property]
 * @returns {any}
 */
export function getMetadata(name, target, property)
{
    return Reflect.getMetadata(getMetaName(name), target, property);
}

/**
 * Gets a target's own meta data
 * @param {String} name
 * @param {*} target
 * @param {*} [property]
 * @returns {any}
 */
export function getOwnMetadata(name, target, property)
{
    return Reflect.getOwnMetadata(getMetaName(name), target, property);
}

/**
 * Removes/deletes meta data
 * @param {String} key
 * @param {*} target
 * @param {String} property
 * @returns {boolean}
 */
export function deleteMetadata(key, target, property)
{
    return Reflect.deleteMetadata(getMetaName(key), target, property);
}

/**
 * Gets only valid meta data keys
 * @param {Array<String>} array
 * @returns {Array<String>}
 */
function getValidKeys(array)
{
    let out = [];
    for (let i = 0; i < array.length; i++)
    {
        if (array[i].indexOf(PREFIX) === 0)
        {
            out.push(array[i].replace(PREFIX + ":", ""));
        }
    }
    return out;
}

/**
 * Gets meta data keys
 * @param {*} target
 * @param {String} [property]
 * @returns {[]}
 */
export function getMetadataKeys(target, property)
{
    return getValidKeys(Reflect.getMetadataKeys(target, property));
}

/**
 * Gets own meta data keys
 * @param {*} target
 * @param {String} [property]
 * @returns {[]}
 */
export function getOwnMetadataKeys(target, property)
{
    return getValidKeys(Reflect.getOwnMetadataKeys(target, property));
}

/**
 *
 * @param {*} target
 * @param {String} property
 * @param {Function} keyFunc
 * @param {Function} getFunc
 */
function getAllValidValues(target, property, keyFunc, getFunc)
{
    const
        metaKeys = keyFunc(target, property),
        out = {};

    metaKeys.forEach((key) =>
    {
        const result = getFunc(key, target, property);
        if (result !== undefined) out[key] = result;
    });

    return out;
}

/**
 * Gets all meta data values
 * @param {*} target
 * @param {String} [property]
 */
export function getMetadataValues(target, property)
{
    return getAllValidValues(target, property, getMetadataKeys, getMetadata);
}

/**
 * Gets all own metadata values
 * @param {*} target
 * @param {String} [property]
 * @returns {Object}
 */
export function getOwnMetadataValues(target, property)
{
    return getAllValidValues(target, property, getOwnMetadataKeys, getOwnMetadata);
}

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
