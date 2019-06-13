import {Tw2EventEmitter, Tw2Schema} from "../class";
import {ErrStoreKeyReserved, ErrStoreValueInvalid, ErrStoreValueMissing, ErrStoreTypeInvalid} from "../../core/Tw2Error";
import {toArray, isNumber, isArray,  isFunction, isString, isPlain, enableUUID} from "../util";
import * as readers from "../../core/reader/Tw2BlackPropertyReaders";
import {ErrStoreKeyProtected} from "../../core";

/**
 * Value store
 * @ccp N/A
 *
 * @property {Tw2TypeStore} types
 * @property {Tw2PathStore} paths
 * @property {Tw2BlackStore} blacks
 * @property {Tw2ClassStore} classes
 * @property {Tw2SchemaStore} schemas
 * @property {Tw2VariableStore} variables
 * @property {Tw2ExtensionStore} extensions
 * @property {Tw2DynamicPathStore} dynamicPaths
 * @property {Tw2Library} tw2
 */
export class Tw2Store
{

    types = new Tw2TypeStore();
    paths = new Tw2PathStore();
    blacks = new Tw2BlackStore();
    classes = new Tw2ClassStore(this);
    schemas = new Tw2SchemaStore();
    variables = new Tw2VariableStore(this);
    extensions = new Tw2ExtensionStore();
    dynamicPaths = new Tw2DynamicPathStore();
    tw2 = null;

    /**
     * Constructor
     * @param {Tw2Library} tw2
     */
    constructor(tw2)
    {
        tw2.SetLibrary(this);
    }

    /**
     * Registers options
     * @param opt
     */
    Register(opt)
    {
        if (!opt) return;
        this.paths.Register(opt.paths);
        this.dynamicPaths.Register(opt.dynamicPaths);
        this.types.Register(opt.types);
        this.classes.Register(opt.classes);
        this.extensions.Register(opt.extensions);
        this.variables.Register(opt.variables);
        this.schemas.Register(opt.schemas);
        this.blacks.Register(opt.blacks);
    }
}

/**
 * Generic variable store
 *
 * @property {string} name
 * @class
 */
class Tw2GenericStore extends Tw2EventEmitter
{

    _values = new Map();
    _missing = [];

    /**
     * Constructor
     * @param {Tw2Store} [store]
     */
    constructor(store)
    {
        super();

        if (store)
        {
            Reflect.defineProperty(this, "_store", { get: ()=> store });
        }
    }

    /**
     * Gets the store's name
     * @returns {string}
     */
    get name()
    {
        return this.constructor.__storeType;
    }

    /**
     *
     * @param value
     * @returns {*}
     */
    IsValidValue(value)
    {
        return this.constructor.isValue ? this.constructor.isValue : true;
    }

    /**
     *
     * @param key
     * @returns {boolean}
     * @constructor
     */
    IsValidKey(key)
    {
        const restricted = this.constructor.__storeRestrictions;
        return isArray(restricted) ? !restricted.includes(key) : true;
    }

    /**
     * Checks if a key exists
     * @param {string} key
     * @returns {boolean}
     */
    Has(key)
    {
        return this._values.has(key);
    }

    /**
     * Gets a store variable
     * @param {string} key
     * @returns {*}
     */
    Get(key)
    {
        if (this._values.has(key))
        {
            return this._values.get(key);
        }

        if (!this._missing.includes(key))
        {
            this._missing.push(key);
            this._missing.sort();
        }

        return null;
    }

    /**
     * Sets a store variable
     * @param {string} key
     * @param {*} value
     * @param {boolean} [override] - Allows a store key to be overridden
     * @returns {*} value
     * @throws ErrStoreKeyProtected when trying to set a key that already exists
     * @throws ErrStoreKeyReserved when trying to register a reserved key
     * @throws ErrStoreValueInvalid when an invalid key value is passed
     */
    Set(key, value, override)
    {
        if (this.Has(key) && !override)
        {
            throw new ErrStoreKeyProtected({store: this.name, key}).emitOn(this);
        }

        if (!this.IsValidKey(key))
        {
            throw new ErrStoreKeyReserved({store: this.name, key}).emitOn(this);
        }

        if (!this.IsValidValue(value))
        {
            throw new ErrStoreValueInvalid({store: this.name, key}).emitOn(this);
        }

        this._values.set(key, value);

        this.emit("registered", {
            key, value,
            log: {
                type: "debug",
                message: `Registered ${this.name}: ${key}`
            }
        });

        return value;
    }

    /**
     * Registers variables from an object or array of objects
     * @param {*} opt
     */
    Register(opt)
    {
        if (!opt) return;

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
     * Checks if a passed value is a valid store value
     * @param {*} a
     * @returns {boolean}
     */
    static isValue(a)
    {
        return a != null;
    }


    /**
     * Store restricted keys
     * @type {null|String[]}
     * @private
     */
    static __storeRestrictions = null;

    /**
     * Store type
     * @type {string}
     * @private
     */
    static __storeType = "generic";

    /**
     * Class category
     * @type {string}
     * @private
     */
    static __category = "Variable store";

}


/**
 * Resource extension store
 */
class Tw2ExtensionStore extends Tw2GenericStore
{

    /**
     * Checks if a passed value is a valid store value
     * @param {*} a
     * @returns {boolean}
     */
    static isValue = isFunction;

    /**
     * Store type
     * @type {string}
     */
    static __storeType = "extension";

}

/**
 * Black store
 */
class Tw2BlackStore extends Tw2GenericStore
{
    /**
     * Sets a black
     * @param {String} key
     * @param {Function} func
     * @param {Boolean} [override]
     * @returns {Map}
     */
    Set(key, func, override)
    {
        const result = func(readers);
        return super.Set(key, new Map(result));
    }

    /**
     * Checks if a black definition exists
     * @param {String} key
     * @returns {boolean}
     */
    Has(key)
    {
        if (super.Has(key))
        {
            return true;
        }

        // Fallback to Tw2 version
        if (key.indexOf("Tri") === 0 || key.indexOf("Tr2") === 0)
        {
            key = "Tw2" + key.substring(3);
        }

        return super.Has(key);
    }

    /**
     * Gets a black definition
     * @param {String} key
     * @returns {*}
     */
    Get(key)
    {
        let value = super.Get(key);

        if (!value && (key.indexOf("Tri") === 0 || key.indexOf("Tr2") === 0))
        {
            const originalKey = key;
            key = "Tw2" + key.substring(3);
            value = super.Get(key);

            if (value)
            {
                this.emit("substitute", {
                    key, value, originalKey, type: this.name,
                    log: {
                        type: "warning",
                        message: `"${originalKey}" class not found, substituting with "${key}"`
                    }
                });
            }
        }

        return value;
    }

    /**
     * Checks if a passed value is a valid store value
     * @param {*} a
     * @returns {boolean}
     */
    static isValue = isFunction;

    /**
     * Store type
     * @type {string}
     */
    static __storeType = "black";

}

/**
 * Dynamic resource path store
 */
class Tw2DynamicPathStore extends Tw2GenericStore
{

    /**
     * Checks if a passed value is a valid store value
     * @param {*} a
     * @returns {boolean}
     */
    static isValue(a)
    {
        if (!isArray(a)) return false;
        for (let i = 0; i < a.length; i++)
        {
            if (!isNumber(a[i])) return false;
        }
        return true;
    }

    /**
     * Store type
     * @type {string}
     */
    static __storeType = "dynamicPath";

}

/**
 * Resource path store
 */
class Tw2PathStore extends Tw2GenericStore
{
    /**
     * Sets a store variable
     * @param {string} key
     * @param {*} value
     * @param {Boolean} [override]
     * @returns {*} value
     */
    Set(key, value, override)
    {
        // Fix paths without trailing slash
        if (isString(value) && value.charAt(value.length - 1) !== "/")
        {
            value += "/";
        }

        return super.Set(key, value, override);
    }

    /**
     * Checks if a passed value is a valid store value
     * @param {*} a
     * @returns {boolean}
     */
    static isValue = isString;

    /**
     * Store type
     * @type {string}
     */
    static __storeType = "path";

    /**
     * Store restricted keys
     * @type {string[]}
     * @private
     */
    static __storeRestrictions = ["rgba", "dynamic"];

}

/**
 * Type store
 */
class Tw2TypeStore extends Tw2GenericStore
{

    /**
     * Gets a type by value
     * @param {*} value
     * @returns {?Function}
     */
    GetByValue(value)
    {
        for (let [key, type] of this._values)
        {
            if ("isValue" in type && type.isValue(value)) return type;
        }
        return null;
    }

    /**
     * Checks if a value is valid
     * @type {isString}
     */
    static isValue = isFunction;

    /**
     * Store type
     * @type {string}
     */
    static __storeType = "type";

}

/**
 * Schema store
 * @class
 */
class Tw2SchemaStore extends Tw2GenericStore
{

    /**
     * Checks if a value is valid
     * @type {isString}
     */
    static isValue(a)
    {
        return a instanceof Tw2Schema;
    }

    /**
     * Store type
     * @type {string}
     */
    static __storeType = "schema";

}


/**
 * Class store
 * @class
 */
class Tw2ClassStore extends Tw2GenericStore
{

    /**
     * Sets a class
     * @param {String} key
     * @param {*} value
     * @param {Boolean} [override]
     * @returns {*} value
     */
    Set(key, value, override)
    {
        const result = super.Set(key, value, override);

        // Auto add black definitions
        if (value.black && (override || !this._store.blacks.Has(key)))
        {
            this._store.blacks.Set(key, value.black, override);
        }

        // Auto add schemas
        if(value.schema && (override || !this._store.schemas.Has(key)))
        {
            this._store.schemas.Set(key, value.schema, override);
        }

        return result;
    }

    /**
     * Gets a store key value
     * @param {string} key
     * @returns {*}
     * @throws ErrStoreValueMissing when a store value can't be found
     */
    Get(key)
    {
        let value;

        value = super.Get(key);

        if (!value && (key.indexOf("Tri") === 0 || key.indexOf("Tr2") === 0))
        {
            const originalKey = key;
            key = "Tw2" + key.substring(3);
            value = super.Get(key);

            if (value)
            {
                this.emit("substitute", {
                    key, value, originalKey, type: this.name,
                    log: {
                        type: "warning",
                        message: `"${originalKey}" class not found, substituting with "${key}"`
                    }
                });
            }
        }

        // Create a warning when a partially implemented class is called
        if (value && value.__isStaging)
        {
            this.emit("partial", {
                key, value,
                log: {
                    type: "warning",
                    message: `Class partially implemented: ${key}`
                }
            });
        }

        return value;
    }

    /**
     *
     * @type {isFunction}
     */
    static isValue = isFunction;

    /**
     * Store type
     * @type {string}
     * @private
     */
    static __storeType = "class";

}


/**
 * Variable store
 *
 * @property {Tw2TypeStore} _types
 */
class Tw2VariableStore extends Tw2GenericStore
{

    /**
     * Sets a variable store's value
     * @param {String} key
     * @param {*} value
     * @returns {*} 
     */
    SetValue(key, value)
    {
        if (!this.Has(key))
        {
            throw new ErrStoreValueMissing({ store: this.name, key }).emitOn(this);
        }

        const variable = this.Get(key);
        return variable.SetValue(value);
    }

    /**
     * Gets a variable store's value
     * @param {String} key
     * @param {Boolean} [serialize]
     * @returns {?*} null if unsuccessful
     */
    GetValue(key, serialize)
    {
        if (!this.Has(key))
        {
            throw new ErrStoreValueMissing({ store: this.name, key }).emitOn(this);
        }

        const variable = this.Get(key);
        return variable.GetValue(serialize);
    }

    /**
     * Creates a variable by value or type, without storing it
     * @param {String} name
     * @param {*} value
     * @param {*} [Type]
     * @returns {*}
     */
    Create(name, value, Type)
    {
        if (isPlain(value))
        {
            Type = value["Type"] || value["type"];
            value = value["value"];
        }

        if (isFunction(Type)) return new Type(name, value);
        if (isString(Type)) Type = this._store.types.Get(Type); // Should fail if not found?
        if (!Type) Type = this._store.types.GetByValue(value);
        if (isFunction(Type)) return new Type(name, value);
        
        throw new ErrStoreTypeInvalid({ store: this.name, type: Type }).emitOn(this);
    }

    /**
     * Registers variables from an object or array of objects
     * @param {*} opt
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
                    const Constructor = this.Create(key, opt[i][key]);
                    this.Set(key, Constructor);
                }
            }
        }
    }

    /**
     * Store type
     * @type {string}
     * @private
     */
    static __storeType = "variable";

}