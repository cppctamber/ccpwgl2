/**
 * meta
 * @description Wraps Reflect.metadata
 * @module
 */


/**
 * Meta data prefix
 * @type {string}
 */
const PREFIX = "tw2:";

/**
 * Turns a string into a meta data name
 * @param {String} name
 * @returns {string}
 */
function getMetaName(name)
{
    return `${PREFIX}${name}`;
}

/**
 * Defines meta data as a decorator
 * @param {String|Object} key
 * @param {*} [value=true]
 * @returns {PropertyDecorator|ClassDecorator|MethodDecorator}
 */
export function data(key, value=true)
{
    return Reflect.metadata(getMetaName(key), value);
}

/**
 * Defines meta data
 * @param {String} name
 * @param {*} value
 * @param {*} target
 * @param {String} [property]
 * @returns {*} value
 */
export function set(name, value, target, property)
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
export function has(name, target, property)
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
export function hasOwn(name, target, property)
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
export function get(name, target, property)
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
export function getOwn(name, target, property)
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
export function del(key, target, property)
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
export function keys(target, property)
{
    return getValidKeys(Reflect.getMetadataKeys(target, property));
}

/**
 * Gets own meta data keys
 * @param {*} target
 * @param {String} [property]
 * @returns {[]}
 */
export function ownKeys(target, property)
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
export function values(target, property)
{
    return getAllValidValues(target, property, keys, get);
}

/**
 * Gets all own metadata values
 * @param {*} target
 * @param {String} [property]
 * @returns {Object}
 */
export function ownValues(target, property)
{
    return getAllValidValues(target, property, ownKeys, getOwn);
}
