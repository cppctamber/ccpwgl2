import { singleton } from "./meta";
import { Tw2EventEmitter } from "./class";
import { Tw2ResMan, Tw2Device, Tw2Logger } from "./engine";
import * as math from "./math";
import * as util from "./util";
import * as consts from "./engine/Tw2Constant";
import * as readers from "../core/reader/Tw2BlackPropertyReaders";
import {
    isArray,
    isFunction,
    isPlain,
    isString,
    toArray,
    isDNA,
    enableUUID,
    isObjectObject,
    isTr2OrTri,
    toTw2
} from "./util";
import {
    ErrStoreValueInvalid,
    ErrStoreValueMissing,
    ErrStoreInvalid,
    ErrStoreKeyReserved
} from "../core/Tw2Error";

/**
 *
 * @param {Tw2ResMan} resMan
 * @param {Tw2Device} device
 * @param {Tw2Logger} logger
 * @param {Object} math
 * @param {Object} util
 * @param {Object} consts
 * @param {Object} _store
 * @param {Boolean} _debug
 */
@singleton
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

    _debug = false;

    /**
     * Alias for device.gl
     * @returns {*}
     */
    get gl()
    {
        return this.device.gl;
    }

    /**
     * Alias for device.now
     * @returns {number}
     */
    get now()
    {
        return this.device.now;
    }

    /**
     * Alias for device.frameCounter
     * @returns {number}
     */
    get frame()
    {
        return this.device.frameCounter;
    }

    /**
     * Alias for device.canvas
     * @returns {*}
     */
    get canvas()
    {
        return this.device.canvas;
    }

    /**
     * Alias for device.dt
     * @returns {number}
     */
    get dt()
    {
        return this.device.dt;
    }

    /**
     * Alias for device.viewportWidth
     * @returns {number}
     */
    get width()
    {
        return this.device.viewportWidth;
    }

    /**
     * Alias for device.viewportHeight
     * @returns {number}
     */
    get height()
    {
        return this.device.viewportHeight;
    }

    /**
     * Alias for device.viewportAspect
     * @returns {number}
     */
    get aspect()
    {
        return this.device.viewportAspect;
    }

    /**
     * Constructor
     */
    constructor()
    {
        super();

        let eveSof;
        Object.defineProperty(this, "eveSof", {
            get: () =>
            {
                if (!eveSof)
                {
                    const Constructor = this.GetClass("EveSOF");
                    eveSof = new Constructor(this);
                }
                return eveSof;
            }
        });

        Tw2EventEmitter.defaultLogger = this;
    }

    /**
     * Sets debug mode
     * @param {Boolean} bool
     */
    SetDebug(bool)
    {
        if (this._debug === bool) return;
        this._debug = bool;

        this._store.class.forEach(Constructor =>
        {
            if ("DEBUG_ENABLED" in Constructor)
            {
                Constructor.DEBUG_ENABLED = bool;
            }
        });

        this.logger.Debug(bool);
        this.emit("debug_mode", bool);
        this.Log("warn", `Debugging ${bool ? "enabled" : "disabled"}`);
    }

    /**
     * Sets an object's tw2 instantiation
     * @param {*} target
     */
    SetLibrary(target)
    {
        if ("tw2" in target)
        {
            Reflect.defineProperty(target, "tw2", { value: this, writable: false, configurable: false });
        }
    }

    /**
     * Initializes the library
     * @param {{}} [options]
     * @param {String|HTMLCanvasElement} [options.canvas] - Canvas element or id
     * @param {{}} [options.device]                       - Optional device parameters
     * @param {{}} [options.resMan]                       - Optional resMan parameters
     * @param {{}} [options.store]                        - Optional store parameters
     * @param {{}} [options.glParams]                     - Optional gl parameters
     * @param {Function} [options.render]                 - Optional render function
     */
    Initialize(options = {})
    {
        this.Register(options);
        this.device.CreateDevice(options.canvas, options.glParams);

        if (options.render)
        {
            this.on("tick", options.render);

            const tick = () =>
            {
                this.RequestAnimationFrame(tick);
                this.StartFrame();
                this.EndFrame();
            };

            this.RequestAnimationFrame(tick);
        }
    }

    /**
     * Start frame
     */
    StartFrame()
    {
        this.device.StartFrame();
        this.resMan.Tick(this.device);
    }

    /**
     * End frame
     */
    EndFrame()
    {
        this.emit("tick", this.device.dt);
        this.device.EndFrame();
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
     * Outputs a log to console
     * @param {String} logType
     * @param {String|{}} log
     * @param {String} [fallbackTitle]
     * @returns {*}
     */
    Log(logType, log, fallbackTitle = "Library")
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
        if (options.debug) this.SetDebug(true);
        if (options.resMan) this.resMan.Register(options.resMan);
        if (options.device) this.device.Register(options.device);

        const { store } = options;
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
     * Gets a res path's full url
     * @param {String} resPath
     * @returns {String}
     */
    GetFullURL(resPath)
    {
        return this.resMan.BuildUrl(resPath);
    }

    /**
     * Sets the device's standard states
     * @param {Number} renderMode
     */
    SetStandardStates(renderMode)
    {
        this.device.SetStandardStates(renderMode);
        return this;
    }

    /**
     * Sets the gl color mask
     * @param colorMask
     * @returns {Tw2Library}
     */
    GLColorMask(colorMask)
    {
        this.device.gl.colorMask(colorMask[0], colorMask[1], colorMask[2], colorMask[3]);
        return this;
    }

    /**
     * Sets the gl clear color
     * @param clearColor
     * @returns {Tw2Library}
     */
    GLClearColor(clearColor)
    {
        this.device.gl.clearColor(clearColor[0], clearColor[1], clearColor[2], clearColor[3]);
        return this;
    }

    /**
     * Sets gl clear depth
     * @param value
     * @returns {Tw2Library}
     */
    GLClearDepth(value)
    {
        this.device.gl.clearDepth(value);
        return this;
    }

    /**
     * Sets the gl viewport
     * @param viewport
     * @returns {Tw2Library}
     */
    GLViewport(viewport)
    {
        this.device.gl.viewport(viewport[0], viewport[1], viewport[2], viewport[3]);
        return this;
    }

    /**
     * Clears gl
     * @param value
     * @returns {Tw2Library}
     */
    GLClear(value)
    {
        this.device.gl.clear(value);
        return this;
    }

    /**
     * Sets the device projection matrix
     * @param {mat4} m
     * @returns {Tw2Library}
     */
    SetProjectionMatrix(m)
    {
        this.device.SetProjection(m);
        return this;
    }

    /**
     * Sets the device view matrix
     * @param {mat4} m
     * @returns {Tw2Library}
     */
    SetViewMatrix(m)
    {
        this.device.SetView(m);
        return this;
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
     * @param {String} resPath
     * @param {Function} [onResolved]
     * @param {Function} [onRejected]
     * @returns {Tw2Resource}
     */
    GetResource(resPath, onResolved, onRejected)
    {
        return this.resMan.GetResource(resPath, onResolved, onRejected);
    }

    /**
     * Gets a resource asynchronously
     * @param {String} resPath

     * @returns {Promise<Tw2Resource>}
     */
    async FetchResource(resPath)
    {
        return this.resMan.FetchResource(resPath);
    }

    /**
     * Gets an object asynchronously
     * @param {String} resPath
     * @param {String|Class|Function|Array<String|Class|Function>} [expectedConstructor]
     * @returns {Promise<*>}
     */
    async FetchObject(resPath, expectedConstructor)
    {
        let result;
        if (isDNA(resPath))
        {
            result = await this.eveSof.FetchObject(resPath);
        }
        else
        {
            result = await this.resMan.FetchObject(resPath);
        }

        if (!this.IsClass(result, expectedConstructor))
        {
            throw new Error("Unexpected constructor");
        }

        return result;
    }

    /**
     * Fetches a resPath's build constructor
     * TODO: Add planets, moons and scenes?
     * @param {String} resPath
     * @returns {Promise<number>}
     */
    async FetchBuildClass(resPath)
    {
        return isDNA(resPath) ? await this.eveSof.FetchHullBuildClass(resPath) : 2;
    }

    /**
     * Checks if an object is a valid class
     * @param {*} object
     * @param {String|Class|Function|Array<String|Class|Function>}expectedConstructor
     * @returns {boolean}
     */
    IsClass(object, expectedConstructor)
    {
        if (!expectedConstructor)
        {
            return true;
        }

        expectedConstructor = toArray(expectedConstructor);

        let isGood;
        for (let i = 0; i < expectedConstructor.length; i++)
        {
            let Constructor = expectedConstructor[i],
                exclude = false;

            if (isString(Constructor))
            {
                if (Constructor.charAt(0) === "!")
                {
                    exclude = true;
                    Constructor = Constructor.substring(1);
                }
                if (Constructor === "Array") Constructor = Array;
                else if (Constructor === "Object") Constructor = Object;
                else Constructor = this.GetClass(Constructor);
            }

            if (object instanceof Constructor)
            {
                isGood = !exclude;
                break;
            }
        }

        return isGood;
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
     * @param {*} [opt]
     * @returns {void|*|Boolean}
     */
    SetVariableValue(name, value, opt)
    {
        const variable = this.GetVariable(name);
        if (variable.SetValue) return variable.SetValue(value, opt);
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
        return setStoreKey(this, "extension", extension, value, { isValue: isFunction });
    }

    /**
     * Checks if there is a black definition for a given class/ function name
     * @param name
     * @returns {*}
     */
    HasBlack(name)
    {
        return hasStoreKey(this, "black", name, { isClassName: true });
    }

    /**
     * Gets a black definition for a given class/ function name
     * @param name
     * @returns {*}
     */
    GetBlack(name)
    {
        return getStoreKey(this, "black", name, { isClassName: true });
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
        return hasStoreKey(this, "class", name, { isClassName: true });
    }

    /**
     * Gets a class by it's name
     * @param name
     * @returns {*}
     */
    GetClass(name)
    {
        return getStoreKey(this, "class", name, { isClassName: true });
    }

    /**
     * Sets a class
     * @param {String} name
     * @param {Class|Function} Constructor
     * @returns {Class|Function}
     */
    SetClass(name, Constructor)
    {
        const Value = setStoreKey(this, "class", name, Constructor, { isValue: isFunction });

        Tw2Library.prototype[name] = Value;

        if ("DEBUG_ENABLED" in Value)
        {
            Value.DEBUG_ENABLED = this._debug;
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
        for (let [ key, type ] of types)
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
        throw new ErrStoreInvalid({ store: storeType });
    }
}

/**
 * Checks if a value exists for a store key
 * @param library
 * @param storeType
 * @param key
 * @param options
 * @returns {*}
 */
function hasStoreKey(library, storeType, key, options)
{
    validateStore(library, storeType);
    const store = library._store[storeType];
    return store.has(key) || (options && options.isClassName && isTr2OrTri(key) && store.has(toTw2(key)));
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
    else if (options && options.isClassName && isTr2OrTri(key))
    {
        const newKey = toTw2(key);
        if (store.has(newKey))
        {
            const Substitute = store.get(newKey);
            library.emit("store.substituted", storeType, newKey, Substitute, key);
            return Substitute;
        }
    }

    library.emit("store.missing", storeType, key);
    throw new ErrStoreValueMissing({ store: storeType, key });
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
        throw new ErrStoreValueInvalid({ store: storeType, key });
    }

    if (options)
    {
        if (options.reserved && options.reserved.includes(key))
        {
            throw new ErrStoreKeyReserved({ store: storeType, key });
        }

        if (options.isValue && !options.isValue(value))
        {
            throw new ErrStoreValueInvalid({ store: storeType, key });
        }

        if (options.onBeforeSet)
        {
            value = options.onBeforeSet(value);
        }
    }

    library._store[storeType].set(key, value);

    library
        .emit("store.set", storeType, key, value)
        .msg("debug", { name: "Store", message: `${storeType} registered: ${key}` });

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

const
    tw2 = new Tw2Library(),
    // Temporarily export resMan and device
    resMan = tw2.resMan,
    device = tw2.device;

export { tw2, resMan, device };
