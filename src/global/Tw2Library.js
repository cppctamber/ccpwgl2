import {Tw2EventEmitter} from "./class";
import {Tw2ResMan, Tw2Device, Tw2Logger} from "./engine";
import {isArray, isFunction, isPlain, isString, toArray, isDNA, enableUUID, isObjectObject} from "./util";
import * as readers from "../core/reader/Tw2BlackPropertyReaders";
import * as math from "./math";
import * as util from "./util";
import * as consts from "./engine/Tw2Constant";
import { 
    ErrSingletonInstantiation,
    ErrStoreValueInvalid,
    ErrStoreValueMissing,
    ErrStoreInvalid,
    ErrStoreKeyReserved
} from "../core/Tw2Error";

let instanceCount = 0;

/**
 *
 * @param {Tw2ResMan} resMan
 * @param {Tw2Device} device
 * @param {Tw2Logger} logger
 */
class Tw2Library extends Tw2EventEmitter
{

    math = math;
    util = util;

    consts = consts;
    logger = new Tw2Logger(this);
    resMan = new Tw2ResMan(this);
    device = new Tw2Device(this);

    _store = {
        black: new Map(),
        variable: new Map(),
        extension: new Map(),
        class: new Map(),
        path: new Map(),
        dynamicPath: new Map(),
        type: new Map()
    };

    /**
     * Gets the current gl context
     * @returns {*}
     */
    get gl()
    {
        return this.device.gl;
    }

    /**
     * Constructor
     */
    constructor()
    {
        instanceCount++;
        if (instanceCount > 1)
        {
            throw new ErrSingletonInstantiation({class: "Tw2Library"});
        }
        
        super();
        Tw2EventEmitter.defaultLogger = this;

        let debug = false;
        Object.defineProperty(this, "debug", {
            get: () => debug,
            set: (bool) =>
            {
                this._store.class.forEach(Constructor =>
                {
                    if ("DEBUG_ENABLED" in Constructor) Constructor.DEBUG_ENABLED = debug;
                });

                if (debug !== bool)
                {
                    this.logger.Debug(bool);
                    this.emit(bool ? "debug_enabled" : "debug_disabled");
                    this.Log("warn", `Debugging ${bool ? "enabled" : "disabled"}`);
                }
            }
        });

        lazyLoadClass(this, "eveSof", "EveSOF", this);
    }

    /**
     * Sets an object's tw2 instantiation
     * @param {*} target
     */
    SetLibrary(target)
    {
        if ("tw2" in target)
        {
            Reflect.defineProperty(target, "tw2", {value: this, writable: false, configurable: false});
        }
    }

    /**
     * Initializes a gl context
     * @param options
     */
    Initialize(options = {})
    {
        this.Register(options);

        const {canvas, glParams, render = null, autoTick = true} = options;

        if (this.device.CreateDevice(canvas, glParams))
        {
            if (render)
            {
                this.on("tick", render);
            }

            if (autoTick)
            {
                const tick = (_, xrFrame) =>
                {
                    this.RequestAnimationFrame(tick);
                    this.Tick(_, xrFrame);
                };

                this.RequestAnimationFrame(tick);
            }
        }

        return this.device.glVersion;
    }

    /**
     * Requests an animation frame
     * @param callback
     * @returns {*}
     */
    RequestAnimationFrame(callback)
    {
        return this.device.RequestAnimationFrame(callback);
    }

    /**
     * Cancels an animation frame
     * @param id
     * @returns {*}
     */
    CancelAnimationFrame(id)
    {
        return this.device.CancelAnimationFrame(id);
    }

    /**
     * Start frame
     * @param {Number} _
     * @param {*} [xrFrame]
     */
    Tick(_, xrFrame)
    {
        this.device.StartFrame();
        this.resMan.Tick(this.device);

        const d = this.device;
        this.emit("tick", {
            dt: d.dt,
            previous: d.previousTime * 0.001,
            current: d.currentTime,
            frame: d.frameCounter,
            xrFrame
        });

        this.device.EndFrame();
    }

    /**
     * Outputs a log to console
     * @param {String} logType
     * @param {String|{}} log
     * @param {String} [fallbackTitle]
     * @returns {*}
     */
    Log(logType, log, fallbackTitle="Library")
    {
        return this.logger.Log(logType, log, fallbackTitle);
    }

    /**
     * Registers library options
     * @param {*} options
     * @param {Boolean} options.uuid
     * @param {Boolean} options.debug
     * @param {*} options.logger
     * @param {*} options.client
     * @param {*} options.resMan
     * @param {*} options.device
     * @param {*} options.store
     */
    Register(options = {})
    {
        if (options.uuid) enableUUID(options.uuid);
        if (options.logger) this.logger.Register(options.logger);
        if (options.debug) this.debug = options.debug;
        if (options.resMan) this.resMan.Register(options.resMan);
        if (options.device) this.device.Register(options.device);

        const {store} = options;
        if (store)
        {
            // Type must be first
            if (store.type)
            {
                setStoreKeyValues(this, "type", store.type);
            }

            for (const key in store)
            {
                if (store.hasOwnProperty(key) && key !== "type")
                {
                    setStoreKeyValues(this, key, store[key]);
                }
            }
        }
    }

    /**
     * Sets the device's render state value
     * @param {Number} state
     * @param {Number} value
     */
    SetDeviceRenderState(state, value)
    {
        this.device.SetRenderState(state, value);
    }

    /**
     * Sets the device's standard states
     * @param {Number} renderMode
     */
    SetDeviceStandardStates(renderMode)
    {
        this.device.SetStandardStates(renderMode);
    }

    /**
     * Gets a device gl extension
     * @param {String} name
     * @returns {*}
     */
    GetDeviceExtension(name)
    {
        return this.device.GetExtension(name);
    }

    /**
     * Gets a resource
     * @param path
     * @param onResolved
     * @param onRejected
     * @returns {*}
     */
    GetResource(path, onResolved, onRejected)
    {
        return this.resMan.GetResource(path, onResolved, onRejected);
    }

    /**
     * Gets a resource asynchronously
     * @param path
     * @returns {Promise<*>}
     * @constructor
     */
    GetResourceAsync(path)
    {
        return this.resMan.GetResourceAsync(path);
    }

    /**
     * Gets an object
     * @param resPath
     * @param onResolved
     * @param onRejected
     */
    GetObject(resPath, onResolved, onRejected)
    {
        if (isDNA(resPath))
        {
            this.eveSof.GetObject(resPath)
                .then(onResolved)
                .catch(onRejected);
        }
        else
        {
            this.resMan.GetObject(resPath, onResolved, onRejected);
        }
    }

    /**
     * Gets an object asynchronously
     * @param {String} resPath
     * @returns {Promise<*>}
     */
    GetObjectAsync(resPath)
    {
        if (isDNA(resPath))
        {
            return this.eveSof.GetObject(resPath);
        }
        else
        {
            return this.resMan.GetObjectAsync(resPath);
        }
    }

    /**
     * Creates a variable from values and/or type
     * @param {String} name
     * @param {*} [value]
     * @param {String| Function} [Type]
     * @returns {*}
     */
    CreateVariable(name, value, Type)
    {
        if (isPlain(value))
        {
            Type = value["Type"] || value["type"];
            value = value["value"];
        }

        if (isFunction(Type)) return new Type(name, value);
        if (isString(Type)) Type = this.GetType(Type);
        if (!Type) Type = this.GetTypeByValue(value);
        if (isFunction(Type)) return new Type(name, value);
        throw new Error("Could not identify variable type");
    }

    /**
     * Checks if a store variable exists
     * @param name
     * @returns {*}
     */
    HasVariable(name)
    {
        return hasStoreKey(this, "variable", name);
    }

    /**
     * Gets a store variable by it's name
     * @param name
     * @returns {*}
     */
    GetVariable(name)
    {
        return getStoreKey(this, "variable", name);
    }

    /**
     * Gets a store variable's value
     * @param name
     * @param out
     * @returns {*}
     */
    GetVariableValue(name, out)
    {
        const variable = this.GetVariable(name);
        if (variable.GetValue) return variable.GetValue(out);
        throw new Error("Variable missing 'GetValue' method");
    }

    /**
     * Sets a store variable
     * @param {String} name
     * @param {*} variable
     * @returns {Function}
     */
    SetVariable(name, variable)
    {
        if (!isObjectObject(variable))
        {
            variable = this.CreateVariable(name, variable);
        }

        return setStoreKey(this, "variable", name, variable);
    }

    /**
     * Sets a store variable's value
     * @param name
     * @param value
     * @returns {void|*|Boolean}
     */
    SetVariableValue(name, value)
    {
        const variable = this.GetVariable(name);
        if (variable.SetValue) return variable.SetValue(value);
        throw new Error("Variable missing 'SetValue' method");
    }

    /**
     * Checks if a resource constructor exists for a file extension
     * @param extension
     * @returns {*}
     */
    HasExtension(extension)
    {
        return hasStoreKey(this, "extension", extension);
    }

    /**
     * Gets a file extension's resource constructor
     * @param extension
     * @returns {*}
     */
    GetExtension(extension)
    {
        return getStoreKey(this, "extension", extension);
    }

    /**
     * Sets a file extension's resource constructor
     * @param extension
     * @param value
     * @returns {*}
     */
    SetExtension(extension, value)
    {
        return setStoreKey(this, "extension", extension, value, {isValue: isFunction});
    }

    /**
     * Checks if there is a black definition for a given class/ function name
     * @param name
     * @returns {*}
     */
    HasBlack(name)
    {
        return hasStoreKey(this, "black", name);
    }

    /**
     * Gets a black definition for a given class/ function name
     * @param name
     * @returns {*}
     */
    GetBlack(name)
    {
        return getStoreKey(this, "black", name, {isClassName: true});
    }

    /**
     * Sets a black definition for a given class/ function name
     * @param {String} name
     * @param {Function|Array} values
     * @returns {Map}
     */
    SetBlack(name, values)
    {
        if (isFunction(values)) values = values(readers);

        return setStoreKey(this, "black", name, values, {
            isValue: isArray,
            onBeforeSet: value => new Map(value)
        });
    }

    /**
     * Checks if a class exists
     * @param name
     * @returns {*}
     */
    HasClass(name)
    {
        return hasStoreKey(this, "class", name);
    }

    /**
     * Gets a class by it's name
     * @param name
     * @returns {*}
     */
    GetClass(name)
    {
        return getStoreKey(this, "class", name, {isClassName: true});
    }

    /**
     * Sets a class
     * @param {String} name
     * @param {Class|Function} Constructor
     * @returns {Class|Function}
     */
    SetClass(name, Constructor)
    {
        const Value = setStoreKey(this, "class", name, Constructor, {isValue: isFunction});

        Tw2Library.prototype[name] = Value;

        if ("DEBUG_ENABLED" in Value)
        {
            Value.DEBUG_ENABLED = this.debug;
        }

        if (Value.black)
        {
            this.SetBlack(name, Value.black);
        }

        return Value;
    }

    /**
     * Checks if a resource path exists for a prefix
     * @param {String} prefix
     * @returns {Boolean}
     */
    HasPath(prefix)
    {
        return hasStoreKey(this, "path", prefix);
    }

    /**
     * Gets a resource path from it's prefix
     * @param {String} prefix
     * @returns {String}
     */
    GetPath(prefix)
    {
        return getStoreKey(this, "path", prefix);
    }

    /**
     * Sets a resource path by it's prefix
     * @param {String} prefix
     * @param {String} path
     * @returns {String}
     */
    SetPath(prefix, path)
    {
        if (isString(path) && path.charAt(path.length - 1) !== "/") path += "/";

        return setStoreKey(this, "path", prefix, path, {
            isValue: isString,
            onBeforeSet: value => value.toLowerCase()
        });
    }

    /**
     * Checks if a dynamic path exists
     * @param prefix
     * @returns {*}
     */
    HasDynamicPath(prefix)
    {
        return hasStoreKey(this, "dynamicPath", prefix);
    }

    /**
     * Gets a dynamic path by it's prefix
     * @param {String} prefix
     * @returns {*}
     */
    GetDynamicPath(prefix)
    {
        return getStoreKey(this, "dynamicPath", prefix);
    }

    /**
     * Sets a dynamic path by it's prefix
     * @param prefix
     * @param value
     * @returns {*}
     */
    SetDynamicPath(prefix, value)
    {
        return setStoreKey(this, "dynamicPath", prefix, value, {
            isValue(a)
            {
                if (!isArray(a)) return false;
                for (let i = 0; i < a.length; i++)
                {
                    if (!isString(a[i])) return false;
                }
                return true;
            },
            onBeforeSet(x)
            {
                x.forEach(value => value.toLowerCase());
            }
        });
    }

    /**
     * Checks if a type exists
     * @param {String} name
     * @returns {Boolean}
     */
    HasType(name)
    {
        return hasStoreKey(this, "type", name);
    }

    /**
     * Gets a type by name
     * @param {String} name
     * @returns {Function}
     */
    GetType(name)
    {
        return getStoreKey(this, "type", name);
    }

    /**
     * Gets a type by value
     * @param {*} value
     */
    GetTypeByValue(value)
    {
        const types = this._store.type;
        for (let [key, type] of types)
        {
            if ("isValue" in type && type.isValue(value)) return type;
        }
        throw new Error("Could not identify a type from the given value");
    }

    /**
     * Sets a type
     * @param {String} name
     * @param {Function} Constructor
     * @returns {Function} Constructor
     */
    SetType(name, Constructor)
    {
        return setStoreKey(this, "type", name, Constructor, isFunction);
    }

}

/**
 * Lazy loads a class
 * @param {Tw2Library} library
 * @param {String} propertyName
 * @param {String} className
 * @param args
 */
function lazyLoadClass(library, propertyName, className, ...args)
{
    let value;
    Object.defineProperty(library, propertyName, {
        get: function()
        {
            if (!value)
            {
                const Constructor = library.GetClass(className);
                value = new Constructor(...args);
            }
            return value;
        }
    });
}

/**
 * Validates a store
 * @param library
 * @param storeType
 */
function validateStore(library, storeType)
{
    if (!library._store[storeType])
    {
        throw new ErrStoreInvalid({ store: storeType});
    }
}

/**
 * Checks if a value exists for a store key
 * @param library
 * @param storeType
 * @param key
 * @returns {*}
 */
function hasStoreKey(library, storeType, key)
{
    validateStore(library, storeType);
    return library._store[storeType].has(key);
}

/**
 * Gets a store key's value
 * @param library
 * @param storeType
 * @param key
 * @param options
 * @returns {*}
 */
function getStoreKey(library, storeType, key, options)
{
    validateStore(library, storeType);

    const store = library._store[storeType];

    if (store.has(key))
    {
        return library._store[storeType].get(key);
    }
    // Allow substituting of Tr2 and Tri names
    else if (options && options.isClassName && (key.indexOf("Tr2") === 0 || key.indexOf("Tri") === 0))
    {
        const newKey = key.replace("Tr2", "Tw2").replace("Tri", "Tw2");
        if (store.has(newKey))
        {
            const Substitute = store.get(key);
            library.emit("store.substituted", storeType, newKey, Substitute, key);
            return Substitute;
        }
    }

    library.emit("store.missing", storeType, key);
    throw new ErrStoreValueMissing({ store: storeType, key});
}

/**
 * Sets a store key's value
 * @param library
 * @param storeType
 * @param key
 * @param value
 * @param {*} [options]
 * @param {Array<String>} [options.reserved]
 * @param {Function} [options.isValue]
 * @param {Function} [options.onBeforeSet]
 * @returns {*}
 */
function setStoreKey(library, storeType, key, value, options)
{
    validateStore(library, storeType);

    if (!value)
    {
        throw new ErrStoreValueInvalid({ store: storeType, key});
    }

    if (options)
    {
        if (options.reserved && options.reserved.includes(key))
        {
            throw new ErrStoreKeyReserved({ store: storeType, key});
        }

        if (options.isValue && !options.isValue(value))
        {
            throw new ErrStoreValueInvalid({ store: storeType, key});
        }

        if (options.onBeforeSet)
        {
            value = options.onBeforeSet(value);
        }
    }

    library._store[storeType].set(key, value);

    library
        .emit("store.set", storeType, key, value)
        .msg("debug", {name: "Store", message: `${storeType} registered: ${key}`});

    return value;
}

/**
 * Sets store key values from an object or array of objects
 * @param library
 * @param storeType
 * @param values
 */
function setStoreKeyValues(library, storeType, values)
{
    // Use the library method for setting in case of custom stuff(tm)
    const setFunction = "Set" + storeType.charAt(0).toUpperCase() + storeType.substring(1);
    if (!library[setFunction])
    {
        throw new Error(`Invalid store value setter '${setFunction}'`);
    }

    values = toArray(values);
    for (let i = 0; i < values.length; i++)
    {
        for (const key in values[i])
        {
            if (values[i].hasOwnProperty(key))
            {
                library[setFunction](key, values[i][key]);
            }
        }
    }
}

export const tw2 = new Tw2Library();