import { STORE, Tw2GenericStore } from "./Tw2GenericStore";
import { isFunction } from "utils";
import { logger } from "global/tw2";


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
     * @param {Boolean} bool
     */
    SetDebugMode(bool)
    {
        const PRIVATE = STORE.get(this);
        PRIVATE.DEBUG_ENABLED = bool;

        for (const [ key, value ] of PRIVATE.map)
        {
            if ("DEBUG_ENABLED" in value)
            {
                value.DEBUG_ENABLED = bool;
                if (bool) logger.Log({ name: key, message: "Debug mode enabled" });
            }
        }
    }

    /**
     * Checks if debug is enabled
     * @return {Boolean}
     */
    GetDebugMode()
    {
        return STORE.get(this).DEBUG_ENABLED;
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
        const { Constructor, DEBUG_MODE } = STORE.get(source);
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
