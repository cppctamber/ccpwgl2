import { isTyped, isArrayLike, isArray, isObjectObject, isNumber, isVector } from "./type";
import { num } from "math";

/**
 * Assigns property values if they exist in a source object
 * - Typed arrays are cloned/ copied to ensure no pass-by-reference errors
 *
 * @param {*} dest
 * @param {*} src
 * @param {string[]} attrs
 * @param {Boolean} [skipIfDestUndefined] - Skips assignment if the destination doesn't have the value
 * @returns {boolean} true if something was assigned
 */
export function assignIfExists(dest, src, attrs, skipIfDestUndefined)
{
    if (!src) return false;

    if (!isArray(attrs))
    {
        attrs = [ attrs ];
        console.warn("Attributes must now always be an array");
    }

    let assigned = false;
    for (let i = 0; i < attrs.length; i++)
    {
        const attr = attrs[i];

        let srcAttr = attr,
            destAttr = attr;

        if (isArray(attr))
        {
            srcAttr = attr[1];
            destAttr = attr[0];
        }

        if (src[srcAttr] === undefined)
        {
            continue;
        }

        if (skipIfDestUndefined && dest[destAttr] === undefined)
        {
            continue;
        }

        if (isArrayLike(dest[destAttr]))
        {
            if (isTyped(dest[destAttr]))
            {
                if (dest[destAttr].length !== src[srcAttr].length)
                {
                    const Constructor = dest[destAttr].constructor;
                    dest[destAttr] = new Constructor(src[srcAttr]);
                }
                else
                {
                    dest[destAttr].set(src[srcAttr]);
                }
            }
            else
            {
                dest[destAttr].splice(0);
                for (let i = 0; i < src[srcAttr].length; i++)
                {
                    dest[destAttr].push(src[srcAttr][i]);
                }
            }
        }
        else if (isTyped(src[srcAttr]))
        {
            const Constructor = src[srcAttr].constructor;
            dest[destAttr] = new Constructor(src[srcAttr]);
        }
        else
        {
            dest[destAttr] = src[srcAttr];
        }

        assigned = true;
    }

    return assigned;
}

/**
 * Gets a source's property value if it exists else returns a default value
 * @param {*} src
 * @param {String|string[]} prop
 * @param {*} [defaultValue]
 * @returns {*}
 */
export function get(src, prop, defaultValue)
{
    if (!isArray(prop))
    {
        return src[prop] !== undefined ? src[prop] : defaultValue;
    }

    for (let i = 0; i < prop.length; i++)
    {
        if (src[prop[i]] !== undefined)
        {
            return src[prop[i]];
        }
    }
    return defaultValue;
}

/**
 * Returns a string from a string template and a given object's properties
 * - templates are surrounded by %'s (ie. %propertyName%)
 * - default values are optionally identified with an = (ie. %propertyName=defaultValue%)
 * @param {String} str
 * @param {{}} [obj={}]
 * @returns {String}
 *
 * @example
 * const message = "%feature=Feature% not supported";
 * const message2 = "%feature% not supported";
 * let str1 = template(message, { feature: "Dynamic resource paths" })
 * let str2 = template(message);
 * let str3 = template(message2);
 * > str1 === "Dynamic resource paths not supported"
 * > str2 === "Feature not supported"
 * > str3 === "undefined not supported"
 */
export function template(str, obj = {})
{
    const literals = str.match(/%([^%]+)?%/g) || [];

    for (let i = 0; i < literals.length; i++)
    {
        const
            literal = literals[i],
            split = literal.substring(1, literal.length - 1).split("="),
            value = split[0] in obj ? obj[split[0]] : split[1];

        str = str.replace(literal, value);
    }

    return str;
}

/**
 * Checks if two primary values are equal
 * - Allows for numbers to be "almost" equal
 * @param {String|Boolean|Number} a
 * @param {String|Boolean|Number} b
 * @returns {boolean}
 */
export function isPrimaryEqual(a, b)
{
    if (a === b) return true;

    return isNumber(a) && isNumber(b) ? num.equals(a, b) : false;
}

/**
 * Checks two vectors for equality
 * - Allows for numbers to be "almost" equal
 * @param {Array|TypedArray} a
 * @param {Array|TypedArray} b
 * @returns {boolean}
 */
export function isVectorEqual(a, b)
{
    if (a === b) return true;

    if (a.length !== b.length) return false;

    for (let i = 0; i < a.length; i++)
    {
        if (!num.equals(a[i], b[i])) return false;
    }

    return true;
}

/**
 * Checks two parameters for equality
 * TODO: Optimize
 * TODO: Circular references
 * - Allows for numbers to be "almost" equal
 * @param {String|Boolean|Number|Array|TypedArray} a
 * @param {String|Boolean|Number|Array|TypedArray} b
 * @returns {boolean}
 */
export function isEqual(a, b)
{
    if (a === b) return true;

    // allow "almost" equal numbers
    if (isNumber(a)) return isNumber(b) ? num.equals(a, b) : false;
    if (isVector(a)) return isVector(b) ? isVectorEqual(a, b) : false;
    if (!isObjectObject(a) || !isObjectObject(b)) return false;
    if (a.constructor !== b.constructor) return false;

    const
        aKeys = Object.keys(a),
        bKeys = Object.keys(b);

    if (aKeys.length !== bKeys.length) return false;

    for (let i = 0; i < aKeys.length; i++)
    {
        let key = aKeys[i];
        if (!b.hasOwnProperty(key)) return false;
        if (!isEqual(a[key], b[key])) return false;
    }

    for (let i = 0; i < bKeys.length; i++)
    {
        if (a.hasOwnProperty(bKeys[i])) return false;
    }

    return true;
}

/**
 * Gets an object's key from a value
 * @param {Object} obj
 * @param {*} value
 * @returns {string}
 */
export function getKeyFromValue(obj, value)
{
    for (const key in obj)
    {
        if (obj.hasOwnProperty(key))
        {
            if (obj[key] === value)
            {
                return key;
            }
        }
    }
}