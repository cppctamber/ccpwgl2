import { Tw2GenericStore } from "./Tw2GenericStore";
import { isFunction } from "global/util";


export class Tw2ResourceExtensionStore extends Tw2GenericStore
{

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
     * The store's name
     * @type {string}
     */
    static storeName = "Resource extension";

}
