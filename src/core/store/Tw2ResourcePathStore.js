import { Tw2GenericStore } from "./Tw2GenericStore";
import { isString } from "global/util";
import { Tw2Error } from "../class";


export class Tw2ResourcePathStore extends Tw2GenericStore
{

    /**
     * Gets a full url from a path
     * @param {String} path
     * @returns {String}
     */
    GetURL(path)
    {
        path = Tw2ResourcePathStore.normalizePath(path);

        const prefixIndex = path.indexOf(":/");
        if (prefixIndex === -1)
        {
            throw new ErrStorePathUndefined({ path });
        }

        const prefix = path.substr(0, prefixIndex);
        if (prefix === "http" || prefix === "https")
        {
            return path;
        }

        return this.GetPath(prefix) + path.substr(prefixIndex + 2);
    }

    /**
     * Checks if a value is a valid key value
     * @param {String} value
     * @returns {Boolean}
     */
    static isValue(value)
    {
        return isString(value);
    }

    /**
     * Fires before setting a store key's value
     * @param {String} path
     * @returns {String}
     */
    static onBefore(path)
    {
        if (path.charAt(path.length -1) !== "/") path += "/";
        return this.normalizePath(path);
    }

    /**
     * Normalizes a path
     * @param {String} path
     * @returns {String}
     */
    static normalizePath(path)
    {
        path = path.toLowerCase();
        path = path.replace("\\", "/");
        return path;
    }

    /**
     * The store's name
     * @type {string}
     */
    static storeName = "Resource path";

    /**
     * Identifies any restricted keys
     * @type {Array}
     */
    static restrictedKeys = [ "rgba" ];

}

/**
 * Throws when a resource path is undefined
 */
export class ErrStorePathUndefined extends Tw2Error
{
    constructor(data)
    {
        super(data, "Undefined resource prefix");
    }
}
