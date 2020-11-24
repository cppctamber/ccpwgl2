import { Tw2EventEmitter } from "../Tw2EventEmitter";
import { Tw2ResMan } from "./Tw2ResMan";
import { Tw2Device } from "./Tw2Device";
import { Tw2Logger } from "./Tw2Logger";
import { path } from "../reader/Tw2BlackPropertyReaders";
import { ErrSingletonInstantiation } from "../Tw2Error";
import * as consts from "constant";
import * as math from "math";
import * as util from "utils";
import * as stores from "core/store";
import { isFunction } from "utils";
import { isArray } from "utils";


let count = 0;

export class Tw2Library extends Tw2EventEmitter
{

    math = math;
    util = util;
    consts = consts;

    /**
     * Variable type store
     * @type {Tw2VariableTypeStore}
     */
    variableTypes = new stores.Tw2VariableTypeStore();

    /**
     * Variable store
     * @type {Tw2VariableStore}
     */
    variables = new stores.Tw2VariableStore(this.variableTypes);

    /**
     * Resource prefix:path store
     * @type {Tw2ResourcePathStore}
     */
    paths = new stores.Tw2ResourcePathStore();

    /**
     * Dynamic resource path store
     * @type {Tw2ResourceDynamicPathStore}
     */
    dynamicPaths = new stores.Tw2ResourceDynamicPathStore();

    /**
     * Resource extension store
     * @type {Tw2ResourceExtensionStore}
     */
    extensions = new stores.Tw2ResourceExtensionStore();

    /**
     * Constructor/Class store
     * @type {Tw2ConstructorStore}
     */
    constructors = new stores.Tw2ConstructorStore();

    /**
     * Logger
     * @type {Tw2Logger}
     */
    logger = new Tw2Logger();

    /**
     * Resource manager
     * @type {Tw2ResMan}
     */
    resMan = new Tw2ResMan(this);

    /**
     * Device
     * @type {Tw2Device}
     */
    device = new Tw2Device(this).BindEvents(this);

    /**
     * Debug mode
     * @type {boolean}
     * @private
     */
    _debugMode = false;

    /**
     * Custom resource handler
     * @type {Function}
     * @private
     */
    _customResourceHandler = null;



    /**
     * Alias for device.dt
     * @returns {number}
     */
    get dt()
    {
        return this.device.dt;
    }


    /**
     * Alias for device.fps
     * @return {number}
     */
    get fps()
    {
        return this.device.fps;
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
     * Alias for device.gl
     * @returns {*}
     */
    get gl()
    {
        return this.device.gl;
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
     * Alias for device.canvas2d
     * @return {null}
     */
    get canvas2d()
    {
        return this.device.canvas2d;
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
     * Alias for resMan.systemMirror
     * @return {boolean}
     */
    get systemMirror()
    {
        return this.resMan.systemMirror;
    }

    /**
     * Constructor
     */
    constructor()
    {
        count++;
        if (count > 1) throw new ErrSingletonInstantiation();

        super();

        this.constructors.OnEvent("stored", ({ key, value }) => this.constructor.prototype[key] = value);

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
        const { render, glParams, canvas, canvas2d, ...opt } = options;

        this.Register(opt);

        this.device.CreateDevice({ canvas, canvas2d, glParams });

        if (render)
        {
            this.OnEvent("tick", render);

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
        this.device.Tick();
        this.resMan.Tick();
    }

    /**
     * End frame
     */
    EndFrame()
    {
        this.EmitEvent("tick", this.device.dt);
    }

    /**
     * Requests an animation frame
     * @param {Function} callback
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
     * Creates a generic log
     * @param {Object} log
     * @returns {Object} log
     */
    Log(log)
    {
        return this.logger.Log(log);
    }

    /**
     * Creates an error log
     * @param {Object} log
     * @return {Object}
     */
    Error(log)
    {
        return this.logger.Error(log);
    }

    /**
     * Creates a debug log
     * @param {Object} log
     * @return {Object}
     */
    Debug(log)
    {
        return this.logger.Debug(log);
    }

    /**
     * Creates a warning log
     * @param {Object} log
     * @return {Object}
     */
    Warning(log)
    {
        return this.logger.Warning(log);
    }

    /**
     * Creates an info log
     * @param {Object} log
     * @return {Object} log
     */
    Info(log)
    {
        return this.logger.Info(log);
    }

    /**
     * Registers library options
     * @param {*} options
     * @param {Boolean} options.debug
     * @param {Function} options.resourceHandler
     * @param {*} options.logger
     * @param {*} options.client
     * @param {*} options.resMan
     * @param {*} options.device
     * @param {*} options.store
     * @param {*} options.black
     */
    Register(options)
    {
        if (!options) return;
        if (options.events) this.AddEvents(options.events);
        if (options.debug !== undefined) this.SetDebugMode(options.debug);
        if (options.resourceHandler) this.SetCustomResourceHandler(options.resourceHandler);

        if (options.black) this.RegisterBlackPathHandlers(options.black);
        if (options.logger) this.logger.Register(options.logger);
        if (options.resMan) this.resMan.Register(options.resMan);
        if (options.device) this.device.Register(options.device);

        if (options.store)
        {
            const opt = options.store;
            if (opt.variableTypes) this.variableTypes.Register(opt.variableTypes);
            if (opt.constructors) this.constructors.Register(opt.constructors);
            if (opt.variables) this.variables.Register(opt.variables);
            if (opt.paths) this.paths.Register(opt.paths);
            if (opt.dynamicPaths) this.dynamicPaths.Register(opt.dynamicPaths);
            if (opt.extensions) this.extensions.Register(opt.extensions);
        }
    }

    /**
     * Gets a res path's full url
     * @param {String} resPath
     * @returns {String}
     */
    GetURL(resPath)
    {
        return this.paths.Resolve(resPath);
    }

    /**
     * Sets black reader path handlers from an object
     * @param { Object<String,Function>} options
     */
    RegisterBlackPathHandlers(options)
    {
        path.registerExtensionHandlers(options);
    }

    /**
     * Sets the black reader's path handler
     * @param { String } ext
     * @param { Function } handler
     */
    SetBlackPathExtensionHandler(ext, handler)
    {
        path.setExtensionHandler(ext, handler);
        return this;
    }

    /**
     * Gets the debug mode
     * @return {boolean}
     */
    GetDebugMode()
    {
        return this._debugMode;
    }

    /**
     * Sets debug mode
     * @param {Boolean} bool
     * @returns {Tw2Library}
     */
    SetDebugMode(bool)
    {
        this._debugMode = bool;
        this.constructors.SetDebugMode(bool);
        this.resMan.SetDebugMode(bool);
        this.logger.SetDebugMode(bool);
        return this;
    }

    /**
     * Sets a custom resource handler
     * @param {Function} func
     */
    SetCustomResourceHandler(func)
    {
        this._customResourceHandler = func;
        return this;
    }

    /**
     * Checks if alpha test is enabled
     * @return {Boolean}
     */
    IsAlphaTestEnabled()
    {
        return this.device.IsAlphaTestEnabled();
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
    SetColorMask(colorMask)
    {
        this.device.gl.colorMask(colorMask[0], colorMask[1], colorMask[2], colorMask[3]);
        return this;
    }

    /**
     * Sets the gl clear color
     * @param clearColor
     * @returns {Tw2Library}
     */
    SetClearColor(clearColor)
    {
        this.device.gl.clearColor(clearColor[0], clearColor[1], clearColor[2], clearColor[3]);
        return this;
    }

    /**
     * Sets gl clear depth
     * @param value
     * @returns {Tw2Library}
     */
    SetClearDepth(value)
    {
        this.device.gl.clearDepth(value);
        return this;
    }

    /**
     * Sets the gl viewport
     * @param viewport
     * @returns {Tw2Library}
     */
    SetViewport(viewport)
    {
        this.device.gl.viewport(viewport[0], viewport[1], viewport[2], viewport[3]);
        return this;
    }

    /**
     * Clears gl
     * @param value
     * @returns {Tw2Library}
     */
    SetClear(value)
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
     * Manually adds a resource
     * @param {String} resPath
     * @param {Tw2Resource} resource
     */
    AddResource(resPath, resource)
    {
        return this.resMan.motherLode.Add(resPath, resource);
    }

    /**
     * Manually removes a resource
     * @param {String} resPath
     */
    RemoveResource(resPath)
    {
        return this.resMan.motherLode.Remove(resPath);
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
     * Fetches a resource
     * @param {*} value
     * @param {Function|Boolean} [awaitResources]
     * @return {Promise<Object>}
     */
    async Fetch(value, awaitResources)
    {
        let result;

        // Short hand to allowing empty values
        if (isArray(value))
        {
            if (!value[0] && value[1]) return null;
            value = value[0];
        }

        if (!value)
        {
            throw new ReferenceError("Invalid resPath: must be defined");
        }

        if (this._customResourceHandler)
        {
            result = await this._customResourceHandler(value);
        }

        if (!result)
        {
            if (util.isDNA(value))
            {
                result = await this.eveSof.FetchObject(value);
            }
            else if (util.isString(value))
            {
                const ext = util.getPathExtension(value);
                if (this.extensions.IsLoadingObject(ext))
                {
                    result = await this.resMan.FetchObject(value);
                }
                else
                {
                    result = await this.resMan.FetchResource(value);
                }
            }
        }

        if (!result)
        {
            throw new ReferenceError("Invalid argument");
        }

        if (awaitResources)
        {
            if (isFunction(awaitResources))
            {
                await this.resMan.Watch(result, awaitResources);
            }
            else
            {
                await this.resMan.Watch(result);
            }
        }

        return result;
    }

    /**
     * Fetches resPaths from a (flat) plain object and returns the results in the same structure
     * @param {Object} obj
     * @param {Function|Boolean} [awaitResources]
     * @return {Promise<Object>}
     */
    async FetchPlain(obj, awaitResources)
    {
        const innerProgress = createInnerProgress(awaitResources, Object.keys(obj).length);

        return Promise.all(Object
            .keys(obj)
            .map(key => this.Fetch(obj[key], innerProgress).then(val => ({ key, val })))
        ).then(items =>
        {
            let result = {};
            items.forEach(item => result[item.key] = item.val);
            return result;
        });
    }

    /**
     * Fetches an array of res paths
     * @param {Array} arr
     * @param {Function|Boolean} [awaitResources]
     * @return {Promise<Array>}
     */
    async FetchAll(arr, awaitResources)
    {
        return Promise.all(arr.map(x => this.Fetch(x, createInnerProgress(awaitResources, arr.length))));
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
        return this.variables.Create(name, value, Type);
    }

    /**
     * Checks if a store variable exists
     * @param name
     * @returns {*}
     */
    HasVariable(name)
    {
        return this.variables.Has(name);
    }

    /**
     * Gets a store variable by it's name
     * @param name
     * @returns {*}
     */
    GetVariable(name)
    {
        return this.variables.Get(name);
    }

    /**
     * Gets a store variable's value
     * @param name
     * @returns {*}
     */
    GetVariableValue(name)
    {
        return this.variables.GetValue(name);
    }

    /**
     * Sets a store variable
     * @param {String} name
     * @param {*} variable
     * @returns {Function}
     */
    SetVariable(name, variable)
    {
        return this.variables.Set(name, variable);
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
        return this.variables.SetValue(name, value, opt);
    }

    /**
     * Checks if a resource constructor exists for a file extension
     * @param extension
     * @returns {*}
     */
    HasExtension(extension)
    {
        return this.extensions.Has(extension);
    }

    /**
     * Gets a file extension's resource constructor
     * @param extension
     * @returns {*}
     */
    GetExtension(extension)
    {
        return this.extensions.Get(extension);
    }

    /**
     * Gets an extension constructor from a path
     * @param {String} path
     * @return {Function|Class}
     */
    GetExtensionFromPath(path)
    {
        return this.extensions.FromPath(path);
    }

    /**
     * Sets a file extension's resource constructor
     * @param extension
     * @param value
     * @returns {*}
     */
    SetExtension(extension, value)
    {
        return this.extensions.Set(extension, value);
    }

    /**
     * Checks if a class exists
     * @param name
     * @returns {*}
     */
    HasClass(name)
    {
        return this.constructors.Has(name);
    }

    /**
     * Gets a class by it's name
     * @param name
     * @returns {*}
     */
    GetClass(name)
    {
        return this.constructors.Get(name);
    }

    /**
     * Sets a class
     * @param {String} name
     * @param {Class|Function} Constructor
     * @returns {Class|Function}
     */
    SetClass(name, Constructor)
    {
        return this.constructors.Set(name, Constructor);
    }

    /**
     * Checks if a resource path exists for a prefix
     * @param {String} prefix
     * @returns {Boolean}
     */
    HasPath(prefix)
    {
        return this.paths.Has(prefix);
    }

    /**
     * Gets a resource path from it's prefix
     * @param {String} prefix
     * @returns {String}
     */
    GetPath(prefix)
    {
        return this.paths.Get(prefix);
    }

    /**
     * Sets a resource path by it's prefix
     * @param {String} prefix
     * @param {String} path
     * @returns {String}
     */
    SetPath(prefix, path)
    {
        return this.paths.Set(prefix, path);
    }

    /**
     * Checks if a dynamic path exists
     * @param prefix
     * @returns {*}
     */
    HasDynamicPath(prefix)
    {
        return this.dynamicPaths.Has(prefix);
    }

    /**
     * Gets a dynamic path by it's prefix
     * @param {String} prefix
     * @returns {*}
     */
    GetDynamicPath(prefix)
    {
        return this.dynamicPaths.Get(prefix);
    }

    /**
     * Sets a dynamic path by it's prefix
     * @param prefix
     * @param value
     * @returns {*}
     */
    SetDynamicPath(prefix, value)
    {
        return this.dynamicPaths.Set(prefix, value);
    }

    /**
     * Checks if a type exists
     * @param {String} name
     * @returns {Boolean}
     */
    HasType(name)
    {
        return this.variableTypes.Has(name);
    }

    /**
     * Gets a type by name
     * @param {String} name
     * @returns {Function}
     */
    GetType(name)
    {
        return this.variableTypes.Get(name);
    }

    /**
     * Gets a type by value
     * @param {*} value
     */
    GetTypeByValue(value)
    {
        return this.variableTypes.GetByValue(value);
    }

    /**
     * Sets a type
     * @param {String} name
     * @param {Function} Constructor
     * @returns {Function} Constructor
     */
    SetType(name, Constructor)
    {
        return this.variableTypes.Set(name, Constructor);
    }

}

/**
 * Creates an inner progress handler
 * @param {undefined|Function}  awaitProgress
 * @param {Number} [total=0]
 * @returns {Boolean|Function}
 */
function createInnerProgress(awaitProgress, total = 0)
{

    if (!isFunction(awaitProgress))
    {
        return !!awaitProgress;
    }

    let map = new Map();

    let lastPercent = 0;

    return function(result, object)
    {
        map.set(object, result);

        const all = {
            total,
            pending: 0,
            objects: 0,
            percent: 0
        };

        map.forEach(r =>
        {
            all.total += r.total;
            all.pending += r.pending;
            all.objects += r.objects;
        });

        all.percent = parseFloat(((all.total - all.pending) / all.total * 100).toFixed(2));
        awaitProgress(result, object, all);
    };

}
