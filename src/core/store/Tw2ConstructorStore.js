import { STORE, Tw2GenericStore } from "./Tw2GenericStore";
import { isFunction } from "global/util";


export class Tw2ConstructorStore extends Tw2GenericStore
{

    /**
     * Constructor
     * @param {Class|Function} Constructor
     */
    constructor(Constructor)
    {
        super();
        const PRIVATE = STORE.get(this);
        PRIVATE.Constructor = Constructor;
        PRIVATE.DEBUG_MODE = false;
    }

    /**
     * Toggles debug
     * @param {Boolean}  bool
     */
    Debug(bool)
    {
        this.debug = bool;
        const PRIVATE = STORE.get(this);
        PRIVATE.DEBUG_ENABLED = bool;

        for (const [ key, value ] of PRIVATE.map)
        {
            if ("DEBUG_ENABLED" in value)
            {
                console.log("Debug mode enabled for " + key);
                value.DEBUG_ENABLED = bool;
            }
        }
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
        const { Constructor,  DEBUG_MODE } = STORE.get(source);
        if (Constructor) Constructor.prototype[key] = Ctor;
        if ("DEBUG_ENABLED" in Ctor) Ctor.DEBUG_ENABLED = DEBUG_MODE;
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
