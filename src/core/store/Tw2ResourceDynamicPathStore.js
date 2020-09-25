import { Tw2GenericStore } from "./Tw2GenericStore";
import { isArray } from "global/util";
import { Tw2ResourcePathStore } from "./Tw2ResourcePathStore";


export class Tw2ResourceDynamicPathStore extends Tw2GenericStore
{

    /**
     * Checks if a value is a valid store value
     * @param {*} value
     * @returns {boolean}
     */
    static isValue(value)
    {
        return isArray(value);
    }

    /**
     * Fires before setting a store key value
     * @param {Array} paths
     * @returns {Array}
     */
    static onBefore(paths)
    {
        paths = Array.from(paths);

        for (let i =0; i < paths.length; i++)
        {
            paths[i] = Tw2ResourcePathStore.normalizePath(paths[i]);
        }

        return paths;
    }

    /**
     * The store's name
     * @type {string}
     */
    static storeName = "Dynamic resource path";

}
