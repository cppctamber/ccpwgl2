import { isTr2OrTri, toArray, toTw2 } from "global/util";
import { Tw2Error } from "core/Tw2Error";
import { Tw2EventEmitter } from "global/class";


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
        const { storeName, restrictedKeys, onBefore, isValue } = this.constructor;

        if (isValue && !isValue(value))
        {
            throw new ErrStoreValueInvalid({ storeName, key });
        }

        if (restrictedKeys && restrictedKeys.includes(key))
        {
            throw new ErrStoreKeyReserved({ storeName, key });
        }

        if (onBefore)
        {
            const _value = onBefore(value, key, this);
            if (_value) value = _value;
        }

        STORE.get(this).map.set(key, value);
        this.emit("stored", { key, value });
        return value;
    }

    /**
     * Gets a store's value by it's key
     * @param {*} key
     * @returns {*} value
     */
    Get(key)
    {
        const { isClassStore, storeName } = this.constructor;
        const [ usedKey, value ] = getUsedKey(this, key, isClassStore);

        // Keep track of missing values
        if (!value)
        {
            const p = STORE.get(this);
            if (!p.missing) p.missing = [];
            if (!p.missing.includes(key))
            {
                p.missing.push(key);
                this.emit("missing", { key });
            }
            throw new ErrStoreKeyUnregistered({ storeName, key });
        }

        if (usedKey !== key)
        {
            this.emit("substitute", { original: key, substitute: usedKey });
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
        return !!getUsedKey(this, key, this.constructor.isClassStore)[1];
    }

    /**
     * Gets a store's keys
     * @returns {Array}
     */
    Keys()
    {
        return Array.from(STORE.get(this).keys());
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
    static isClassStore = false;

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
 * @param {Boolean} isClassStore
 * @returns {Array}
 */
function getUsedKey(source, key, isClassStore)
{
    const { map } = STORE.get(source);

    if (map.has(key))
    {
        return [ key, map.get(key) ];
    }

    if (isClassStore && isTr2OrTri(key))
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
