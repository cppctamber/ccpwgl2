import { isTr2OrTri, toArray, toTw2 } from "utils";
import { Tw2EventEmitter, Tw2Error } from "../class";


export const STORE = new WeakMap();


/**
 * Generic store
 */
export class Tw2GenericStore extends Tw2EventEmitter
{

    /**
     * Constructor
     */
    constructor()
    {
        super();
        STORE.set(this, { map: new Map() });
    }

    /**
     * Sets a store key value
     * @param {*} key
     * @param {*} value
     * @returns {*}
     */
    Set(key, value)
    {
        const Ctor = this.constructor;
        const { storeName } = Ctor;

        if (Ctor.isValue && !Ctor.isValue(value))
        {
            throw new ErrStoreValueInvalid({ storeName, key });
        }

        if (Ctor.restrictedKeys && Ctor.restrictedKeys.includes(key))
        {
            throw new ErrStoreKeyReserved({ storeName, key });
        }

        if (Ctor.onBefore)
        {
            const _value = Ctor.onBefore(value, key, this);
            if (_value) value = _value;
        }

        STORE.get(this).map.set(key, value);
        this.EmitEvent("stored", { key, value });
        return value;
    }

    /**
     * Gets a store's value by it's key
     * @param {*} key
     * @returns {*} value
     */
    Get(key)
    {
        const { isConstructorStore, storeName } = this.constructor;
        const [ usedKey, value ] = getUsedKey(this, key, isConstructorStore);

        // Keep track of missing values
        if (!value)
        {
            const p = STORE.get(this);
            if (!p.missing) p.missing = [];
            if (!p.missing.includes(key))
            {
                p.missing.push(key);
                this.EmitEvent("missing", { key });
            }
            throw new ErrStoreKeyUnregistered({ storeName, key });
        }

        if (usedKey !== key)
        {
            this.EmitEvent("substitute", { original: key, substitute: usedKey });
        }

        return value;
    }

    /**
     * Checks if a store key exists
     * @param {*} key
     * @returns {boolean}
     */
    Has(key)
    {
        return !!getUsedKey(this, key, this.constructor.isConstructorStore)[1];
    }

    /**
     * Registers store key: values from an object
     * @param opt
     */
    Register(opt)
    {
        opt = toArray(opt);
        for (let i = 0; i < opt.length; i++)
        {
            for (const key in opt[i])
            {
                if (opt[i].hasOwnProperty(key))
                {
                    this.Set(key, opt[i][key]);
                }
            }
        }
    }

    /**
     * Gets missing keys
     * @returns {Array}
     */
    GetMissing()
    {
        const { missing } = STORE.get(this);
        return missing ? Array.from(missing) : [];
    }

    /**
     * Checks if a value is a valid store value
     * @param {*} value
     * @returns {boolean}
     */
    static isValue(value)
    {
        return true;
    }

    /**
     * Optional function called before values are set
     * @type {Function|null}
     */
    static onBefore = null;

    /**
     * Identifies stores that use classes
     * @type {boolean}
     */
    static isConstructorStore = false;

    /**
     * Identifies any restricted keys
     * @type {null|Array}
     */
    static restrictedKeys = null;

    /**
     * The store's name
     * @type {string}
     */
    static storeName = "Generic";

}


/**
 * Handles substituted keys
 * @param {Tw2GenericStore} source
 * @param {String} key
 * @param {Boolean} isConstructorStore
 * @returns {Array}
 */
function getUsedKey(source, key, isConstructorStore)
{
    const { map } = STORE.get(source);

    if (map.has(key))
    {
        return [ key, map.get(key) ];
    }

    if (isConstructorStore && isTr2OrTri(key))
    {
        const substituteKey = toTw2(key);
        if (map.has(substituteKey))
        {
            return [ substituteKey, map.get(substituteKey) ];
        }
    }

    return [ key ];
}


/**
 * Throws when trying to register a reserved store key
 */
export class ErrStoreKeyReserved extends Tw2Error
{
    constructor(data)
    {
        super(data, "'%storeName%' store key restricted (%key%)");
    }
}

/**
 * Throws when trying to register an invalid store value
 */
export class ErrStoreValueInvalid extends Tw2Error
{
    constructor(data)
    {
        super(data, "'%storeName%' store value invalid (%key%)");
    }
}

/**
 * Throws when trying to retrieve a store value that doesn't exist
 */
export class ErrStoreKeyUnregistered extends Tw2Error
{
    constructor(data)
    {
        super(data, "'%storeName%' store key is unregistered (%key%)");
    }
}
