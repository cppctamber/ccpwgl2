import { isFunction, isPlain } from "./type";

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
