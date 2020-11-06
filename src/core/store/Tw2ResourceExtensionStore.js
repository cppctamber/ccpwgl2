import { Tw2GenericStore } from "./Tw2GenericStore";
import { getPathExtension, isFunction } from "utils";
import { Tw2ResourcePathStore } from "core/store/Tw2ResourcePathStore";


export class Tw2ResourceExtensionStore extends Tw2GenericStore
{

    /**
     * Checks if an extension
     * @param {String} ext
     * @return {Boolean}
     */
    IsLoadingObject(ext)
    {
        const Extension = this.Get(ext);
        return Extension.isLoadingObject;
    }

    /**
     * Gets an extension from a path
     * @param {String} path
     * @return {Function|Class}
     */
    FromPath(path)
    {
        path = Tw2ResourcePathStore.normalizePath(path);
        if (!path) throw new TypeError("Expected string");
        return this.Get(getPathExtension(path));
    }

    /**
     * Checks if a value is a valid store value
     * @param {*} value
     * @returns {boolean}
     */
    static isValue(value)
    {
        return isFunction(value);
    }

    /**
     * Identifies stores that use classes
     * @type {boolean}
     */
    static isConstructorStore = true;

    /**
     * The store's name
     * @type {string}
     */
    static storeName = "Resource extension";

}

