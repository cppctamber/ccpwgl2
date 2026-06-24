import { Tw2GenericStore } from "./Tw2GenericStore";
import { isFunction } from "global/utils/type";

/**
 * Model property type store
 */
export class Tw2PropertyTypeStore extends Tw2GenericStore
{
    /**
     * Checks if a value is a valid type handler
     * @param {*} value
     * @returns {boolean}
     */
    static isValue(value)
    {
        return !!value && isFunction(value.get) && isFunction(value.set) && isFunction(value.is);
    }

    /**
     * Store name
     * @type {string}
     */
    static storeName = "Model Property Type";
}
