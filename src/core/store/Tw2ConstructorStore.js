import { Tw2GenericStore } from "./Tw2GenericStore";
import { isFunction } from "global/util";


export class Tw2ConstructorStore extends Tw2GenericStore
{

    debug = true;

    /**
     * Checks value validity
     * @param {Function} value
     * @returns {Boolean}
     */
    static isValue(value)
    {
        return isFunction(value);
    }

    /**
     * Function called before values are set
     * @param {Class} Clazz
     * @param {String} key
     * @param {Tw2ConstructorStore} source
     */
    static onBefore(Clazz, key, source)
    {
        if (Clazz.hasOwnProperty("DEBUG_MODE"))
        {
            Reflect.defineProperty(Clazz, "DEBUG_MODE", {
                get: () => source.debug
            });
        }
    }

    /**
     * Identifies stores that use classes
     * @type {boolean}
     */
    static isClassStore =  true;

    /**
     * The store's name
     * @type {string}
     */
    static storeName = "Constructor";

}
