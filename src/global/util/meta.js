import { isFunction, isPlain, isString } from "global/util";

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
 * Provides similar functionality to Reflect.metadata
 * @param {String} a
 * @param {*} value
 * @param {Object} [options];
 * @returns {Function}
 */
export function metadata(a, value, options)
{
    if (value !== undefined)
    {
        return function(target, property, descriptor)
        {
            handle(target, property, descriptor, options, a, value);
        };
    }

    return function(...args)
    {
        return function(target, property, descriptor)
        {
            handle(target, property, descriptor, options, a, args);
        };
    };
}

/**
 * Defines meta data
 * @param {String} name
 * @param {*} value
 * @param {*} target
 * @param {String} [property]
 * @returns {*} value
 */
export function setMetadata(name, value, target, property)
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
            out.push(array[i].replace(PREFIX, ""));
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
 * @param {*} d
 * @returns {*}
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


function handle(t, p, d, o, k, v)
{
    if (!isString(k))
    {
        throw new Error("A key must be defined");
    }

    handleDescriptor(d);

    let any = true,
        func;

    if (o)
    {
        func = o.any;

        if (o.any !== undefined)
        {
            any = o.any;
        }
        else
        {
            any = o.method === undefined && o.class === undefined && o.property === undefined;
        }
    }

    if (!any)
    {
        if (p)
        {
            if (isFunction(t[p]))
            {
                if (!o.method) throw new Error("Decorator doesn't support methods");
            }
            else if (!o.property)
            {
                throw new Error("Decorator doesn't support properties");
            }
        }
        else if (!o.class)
        {
            throw new Error("Decorator doesn't support classes");
        }
    }

    if (func)
    {
        v = func({  target: t, property: p, descriptor:  d, key: k, value: v, options: o });
    }

    if (v !== undefined)
    {
        setMetadata(k, v, t, p);
    }
}


/**
 * Constructs a generic meta data type decorator
 * @param {Number} type
 * @param {Object} [o={}]
 * @returns {(function(*=): function(...[*]=))|(function(...[*]=))}
 */
export function createTypeDecorator(type, o={})
{
    if (!isPlain(o)) o = { children: !!o };

    o.property = true;
    o.class = false;
    o.method = false;

    if (o.children)
    {
        return function(...args)
        {
            return function(t, p, d)
            {
                handle(t, p, d, o, "type", type);
                setMetadata("typeOf", args, t, p);
            };
        };
    }

    return function(t, p, d)
    {
        handle(t, p, d, o, "type", type);
    };
}

/**
 * Creates a decorator
 * @param {String|Function} k
 * @param {Object} [options={}]
 * @param {*} [options.value]          - The value to set, or if undefined a value must be passed to the decorator
 * @param {Function} [options.func]    - An optional function to call before setting meta data value
 * @param {Boolean} [options.method]   - True if allowed on methods
 * @param {Boolean} [options.class]    - True if allowed on classes
 * @param {Boolean} [options.property] - True if allowed on properties
 * @param {Boolean} [options.any]      - Defaults to true if no decorator type restrictions defined
 * @returns {Function}
 */
export function createDecorator(k, options={})
{
    const { value } = options;
    
    if (isFunction(k))
    {
        if (value !== undefined)
        {
            return function(target, property, descriptor)
            {
                handleDescriptor(descriptor);
                k({ target, property, descriptor, value, options });
            };
        }

        return function(...args)
        {
            return function(target, property, descriptor)
            {
                handleDescriptor(descriptor);
                k({ target, property, descriptor, value: args, options });
            };
        };
    }

    if (value !== undefined)
    {
        return function(target, property, descriptor)
        {
            handle(target, property, descriptor, options, k, value);
        };
    }

    return function(...args)
    {
        return function(target, property,  descriptor)
        {
            handle(target, property, descriptor, options, k, args);
        };
    };
}
