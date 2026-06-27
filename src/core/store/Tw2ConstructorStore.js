import { STORE, Tw2GenericStore } from "./Tw2GenericStore";
import { isFunction } from "utils";
import { getOwnMetadata } from "global/utils/reflect";


export class Tw2ConstructorStore extends Tw2GenericStore
{

    /**
     * Constructor
     */
    constructor()
    {
        super();
        const PRIVATE = STORE.get(this);
        PRIVATE.DEBUG_ENABLED = false;
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
     * Sets a constructor
     * @param {String} key
     * @param {Function} Ctor
     * @returns {Function}
     */
    Set(key, Ctor)
    {
        const value = super.Set(key, Ctor);
        this.RegisterDefinitionKeys(key, Ctor);
        return value;
    }

    /**
     * Registers a constructor's definition names as explicit lookup keys
     * @param {String} key
     * @param {Function} Ctor
     */
    RegisterDefinitionKeys(key, Ctor)
    {
        const definitions = getOwnMetadata("definitions", Ctor);
        if (!definitions || !definitions.namespaces) return;

        const PRIVATE = STORE.get(this);
        for (const namespace in definitions.namespaces)
        {
            const definition = definitions.namespaces[namespace];
            const name = definition && definition.name;
            if (!name || name === key || PRIVATE.map.has(name)) continue;

            Tw2GenericStore.prototype.Set.call(this, name, Ctor);
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
        if ("DEBUG_ENABLED" in Ctor)
        {
            Ctor.DEBUG_ENABLED = STORE.get(source).DEBUG_ENABLED;
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
