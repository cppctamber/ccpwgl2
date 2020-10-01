import { STORE, Tw2GenericStore } from "./Tw2GenericStore";
import { isFunction } from "global/util";


export class Tw2ConstructorStore extends Tw2GenericStore
{

    debug = true;

    /**
     * Constructor
     * @param {Class|Function} Constructor
     */
    constructor(Constructor)
    {
        super();
        STORE.get(this).Constructor = Constructor;
    }

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
     * @param {Class} Ctor
     * @param {String} key
     * @param {Tw2ConstructorStore} source
     */
    static onBefore(Ctor, key, source)
    {
        const { Constructor } = STORE.get(source);
        if (Constructor) Constructor.prototype[key] = Ctor;

        if (Ctor.hasOwnProperty("DEBUG_MODE"))
        {
            Reflect.defineProperty(Ctor, "DEBUG_MODE", {
                get: () => source.debug
            });
        }
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
    static storeName = "Constructor";

}
