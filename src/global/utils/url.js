import { isArray, isFunction, isObjectObject, isPlain, isString } from "./type";

const
    url = {},
    query = window.location.search.substring(1),
    split = query.split("&");

for (let i = 0; i < split.length; i++)
{
    const
        result = split[i].split("="),
        key = result[0],
        value = unescape(result[1]);

    if (key)
    {
        let v = value.toLowerCase();
        switch (v)
        {
            case "true":
                v = true;
                break;

            case "false":
                v = false;
                break;

            case "null":
                v = null;
                break;

            case "undefined":
                v = undefined;
                break;

            default:
                if (!isNaN(v))
                {
                    v = Number(v);
                }
        }

        url[key.toLowerCase()] = v;
    }
}

/**
 * Gets the url as an object
 * @param {Boolean|Function} operator
 * @returns {*}
 */
export function getURL(operator)
{
    if (isPlain(operator))
    {
        const out = {};
        for (const key in operator)
        {
            if (operator.hasOwnProperty(key))
            {
                out[key] = url[key] === undefined ? operator[key] : url[key];
            }
        }
        return out;
    }
    else if (isFunction(operator))
    {
        const out = {};
        for (const key in url)
        {
            if (url.hasOwnProperty(key))
            {
                const value = operator(key, url[key], url);
                if (value !== undefined)
                {
                    out[key] = value;
                }
            }
        }
        return out;
    }

    return Object.assign({}, url);
}

/**
 * Gets a string from the url, returning a default value if not found
 * @param {String} key
 * @param {String} defaultValue
 * @returns {String}
 */
export function getURLString(key, defaultValue)
{
    key = key.toLowerCase();
    return key in url ? url[key] : defaultValue;
}

/**
 * Gets an integer from the url, returning a default value if not found
 * @param {String} key
 * @param {number} defaultValue
 * @returns {number}
 */
export function getURLInteger(key, defaultValue)
{
    key = key.toLowerCase();
    return key in url ? parseInt(url[key], 10) : defaultValue;
}

/**
 * Gets a float from the url, returning a default value if not found
 * @param {String} key
 * @param {number} defaultValue
 * @returns {number}
 */
export function getURLFloat(key, defaultValue)
{
    key = key.toLowerCase();
    return key in url ? parseFloat(url[key]) : defaultValue;
}

/**
 * Gets a boolean from the url, returning a default value if not found
 * @param {String} key
 * @param {Boolean} defaultValue
 * @returns {Boolean}
 */
export function getURLBoolean(key, defaultValue)
{
    key = key.toLowerCase();
    return key in url ? url[key] : defaultValue;
}

/**
 * Checks if an url key is not undefined
 * @param key
 * @returns {boolean}
 */
export function hasURLValue(key)
{
    key = key.toLowerCase();
    return key in url && url[key] !== undefined;
}

/**
 * Updates an object from url values if they're defined
 * @param {Object} [src={}]
 * @param {Object} [out={}]
 * @returns {{}} out
 */
export function fromURLIfDefined(src={}, out={})
{
    for (const prop in src)
    {
        if (!src.hasOwnProperty(prop)) continue;

        // src[prop] = { .... }
        if (isObjectObject(src[prop]))
        {
            out[prop] = fromURLIfDefined(src[prop], out[prop]);
            continue;
        }

        let urlKey,
            urlType;

        // src[prop] = [ "urlKey", "urlType" ]
        if (isArray(src[prop]))
        {
            urlKey = src[prop][0];
            urlType = src[prop][1];
        }
        // src[prop] = "urlType"
        // src[prop] = function(urlKeyValue)
        else if (isString(src[prop]) || isFunction(src[prop]))
        {
            urlKey = prop;
            urlType = src[prop];
        }
        else
        {
            throw new TypeError("Invalid property value");
        }

        if (hasURLValue(urlKey))
        {
            if (isFunction(urlType))
            {
                out[prop] = urlType(url[urlKey]);
            }
            else if (isString(urlType))
            {
                let handler;
                switch (urlType.toUpperCase())
                {
                    case "BOOLEAN":
                        handler = getURLBoolean;
                        break;

                    case "STRING":
                        handler = getURLString;
                        break;

                    case "INTEGER":
                        handler = getURLInteger;
                        break;

                    case "FLOAT":
                        handler = getURLFloat;
                        break;

                    default:
                        throw new TypeError(`Unknown string type${urlType}`);
                }

                out[prop] = handler(urlKey);
            }
            else
            {
                throw new TypeError("Invalid property value");
            }
        }
    }
    return out;
}