import { isArray } from "./type";

/**
 * Adds arguments to an array if they don't already exist in it
 * @param {Array} arr
 * @param args
 * @returns {Boolean} true if something was added
 */
export function addToArray(arr, ...args)
{
    let added = false;
    for (let i = 0; i < args.length; i++)
    {
        if (arr.indexOf(args[i]) === -1)
        {
            arr.push(args[i]);
            added = true;
        }
    }
    return added;
}

/**
 * Finds the first element in an array with a given property and value
 * - Throws an optional error if not found
 * @param {Array} arr
 * @param {String} property
 * @param {*} value
 * @param {Tw2Error} [err]
 * @returns {*|null}
 */
export function findElementByPropertyValue(arr, property, value, err)
{
    const index = findIndexByPropertyValue(arr, property, value, err);
    return arr[index];
}

/**
 * Finds the first index of an element in an array with a given property and value
 * - Throws an optional error if not found
 * @param {Array} arr
 * @param {String} property
 * @param {*} value
 * @param {Tw2Error} err
 * @returns {number}
 */
export function findIndexByPropertyValue(arr, property, value, err)
{
    for (let i = 0; i < arr.length; i++)
    {
        if (property in arr[i] && arr[i][property] === value)
        {
            return i;
        }
    }

    if (err)
    {
        throw new err({ [property]: value });
    }

    return -1;
}

/**
 * Calls a function with arguments for each child in an array where that function exists
 * @param {Array} arr
 * @param {String} funcName
 * @param args
 */
export function perArrayChild(arr, funcName, ...args)
{
    for (let i = 0; i < arr.length; i++)
    {
        if (funcName in arr[i])
        {
            arr[i][funcName](...args);
        }
    }
}

/**
 * Removes arguments from an array if they exist in it
 * @param {Array} arr
 * @param args
 * @returns {Boolean} true if something was removed
 */
export function removeFromArray(arr, ...args)
{
    let removed = false;
    for (let i = 0; i < args.length; i++)
    {
        const index = arr.indexOf(args[i]);
        if (index !== -1)
        {
            arr.splice(index, 1);
            removed = true;
        }
    }
    return removed;
}

/**
 * Returns a value if it is an array, or a new array with the object in it
 * @param {*} a
 * @returns {Array}
 */
export function toArray(a)
{
    return isArray(a) ? a : [ a ];
}

/**
 * Returns an array containing only unique numbers
 * @param {*} a
 * @returns {Array}
 */
export function toUniqueArray(a)
{
    return Array.from(new Set(toArray(a)));
}

/**
 * Returns an array in chunks
 * @param {Array} arr
 * @param {Number} chunkSize
 * @return {Array}
 */
export function chunkArray(arr, chunkSize)
{
    const res = [];
    for (let i = 0; i < arr.length; i += chunkSize)
    {
        const chunk = arr.slice(i, i + chunkSize);
        res.push(chunk);
    }
    return res;
}
