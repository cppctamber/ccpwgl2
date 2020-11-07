import { Tw2EventEmitter } from "../Tw2EventEmitter";
import { Tw2ResMan } from "./Tw2ResMan";
import { Tw2Device } from "./Tw2Device";
import { Tw2Logger } from "./Tw2Logger";
import { path } from "../reader/Tw2BlackPropertyReaders";
import { ErrSingletonInstantiation } from "../Tw2Error";
import * as consts from "constant";
import * as math from "math";
import * as util from "utils";


let count = 0;

export class Tw2Library extends Tw2EventEmitter
{

    math = math;
    util = util;
    consts = consts;

    /**
     * Logger
     * @type {Tw2Logger}
     */
    logger = new Tw2Logger();

    /**
     * Resource manager
     * @type {Tw2ResMan}
     */
    resMan = null;

    /**
     * Device
     * @type {Tw2Device}
     */
    device = null;

    /**
     * Store
     * @type {Tw2Store}
     */
    store = null;

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
     * Alias for device.canvas2d
     * @return {null}
     */
    get canvas2d()
    {
        return this.device.canvas2d;
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
     * @param {Tw2Store} store
     */
    constructor(store)
    {
        count++;
        if (count > 1) throw new ErrSingletonInstantiation();

        super();

        this.const = consts;
        this.resMan = new Tw2ResMan(store, this.logger);
        this.device = new Tw2Device(store, this.logger);
        this.store = store;

        this.device.OnEvent("resized", evt => this.EmitEvent("resized", evt));

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
        this.resMan.Tick(this.device);
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
     * Outputs a log to console
     * @param {String} logType
     * @param {String|{}} log
     * @returns {*}
     */
    Log(logType, log)
    {
        return this.logger.Add(logType, log);
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
        if (options.debug !== undefined) this.SetDebugMode(options.debug);
        if (options.resourceHandler) this.SetCustomResourceHandler(options.resourceHandler);
        if (options.black) this.RegisterBlackPathHandlers(options.black);
        if (options.logger) this.logger.Register(options.logger);
        if (options.resMan) this.resMan.Register(options.resMan);
        if (options.device) this.device.Register(options.device);
        if (options.store) this.store.Register(options.store);
    }

    /**
     * Gets a res path's full url
     * @param {String} resPath
     * @returns {String}
     */
    GetResolvedURL(resPath)
    {
        return this.store.paths.Resolve(resPath);
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
        this.store.SetDebugMode(bool);
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
     * @return {Promise<Object|Array>}
     */
    async Fetch(value)
    {
        let result;

        if (this._customResourceHandler)
        {
            result = this._customResourceHandler(value);
            if (result) return result;
        }

        if (util.isDNA(value))
        {
            result = await this.eveSof.FetchObject(value);
        }
        else if (util.isString(value))
        {
            const ext = util.getPathExtension(value);
            if (this.store.extensions.IsLoadingObject(ext))
            {
                result = await this.resMan.FetchObject(value);
            }
            else
            {
                result = await this.resMan.FetchResource(value);
            }
        }

        if (!result)
        {
            throw new ReferenceError("Invalid argument");
        }

        return result;
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
        return this.store.variables.Create(name, value, Type);
    }

    /**
     * Checks if a store variable exists
     * @param name
     * @returns {*}
     */
    HasVariable(name)
    {
        return this.store.variables.Has(name);
    }

    /**
     * Gets a store variable by it's name
     * @param name
     * @returns {*}
     */
    GetVariable(name)
    {
        return this.store.variables.Get(name);
    }

    /**
     * Gets a store variable's value
     * @param name
     * @returns {*}
     */
    GetVariableValue(name)
    {
        return this.store.variables.GetValue(name);
    }

    /**
     * Sets a store variable
     * @param {String} name
     * @param {*} variable
     * @returns {Function}
     */
    SetVariable(name, variable)
    {
        return this.store.variables.Set(name, variable);
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
        return this.store.variables.SetValue(name, value, opt);
    }

    /**
     * Checks if a resource constructor exists for a file extension
     * @param extension
     * @returns {*}
     */
    HasExtension(extension)
    {
        return this.store.extensions.Has(extension);
    }

    /**
     * Gets a file extension's resource constructor
     * @param extension
     * @returns {*}
     */
    GetExtension(extension)
    {
        return this.store.extensions.Get(extension);
    }

    /**
     * Sets a file extension's resource constructor
     * @param extension
     * @param value
     * @returns {*}
     */
    SetExtension(extension, value)
    {
        return this.store.extensions.Set(extension, value);
    }

    /**
     * Checks if a class exists
     * @param name
     * @returns {*}
     */
    HasClass(name)
    {
        return this.store.constructors.Has(name);
    }

    /**
     * Gets a class by it's name
     * @param name
     * @returns {*}
     */
    GetClass(name)
    {
        return this.store.constructors.Get(name);
    }

    /**
     * Sets a class
     * @param {String} name
     * @param {Class|Function} Constructor
     * @returns {Class|Function}
     */
    SetClass(name, Constructor)
    {
        return this.store.constructors.Set(name, Constructor);
    }

    /**
     * Checks if a resource path exists for a prefix
     * @param {String} prefix
     * @returns {Boolean}
     */
    HasPath(prefix)
    {
        return this.store.paths.Has(prefix);
    }

    /**
     * Gets a resource path from it's prefix
     * @param {String} prefix
     * @returns {String}
     */
    GetPath(prefix)
    {
        return this.store.paths.Get(prefix);
    }

    /**
     * Sets a resource path by it's prefix
     * @param {String} prefix
     * @param {String} path
     * @returns {String}
     */
    SetPath(prefix, path)
    {
        return this.store.paths.Set(prefix, path);
    }

    /**
     * Checks if a dynamic path exists
     * @param prefix
     * @returns {*}
     */
    HasDynamicPath(prefix)
    {
        return this.store.dynamicPaths.Has(prefix);
    }

    /**
     * Gets a dynamic path by it's prefix
     * @param {String} prefix
     * @returns {*}
     */
    GetDynamicPath(prefix)
    {
        return this.store.dynamicPaths.Get(prefix);
    }

    /**
     * Sets a dynamic path by it's prefix
     * @param prefix
     * @param value
     * @returns {*}
     */
    SetDynamicPath(prefix, value)
    {
        return this.store.dynamicPaths.Set(prefix, value);
    }

    /**
     * Checks if a type exists
     * @param {String} name
     * @returns {Boolean}
     */
    HasType(name)
    {
        return this.store.variableTypes.Has(name);
    }

    /**
     * Gets a type by name
     * @param {String} name
     * @returns {Function}
     */
    GetType(name)
    {
        return this.store.variableTypes.Get(name);
    }

    /**
     * Gets a type by value
     * @param {*} value
     */
    GetTypeByValue(value)
    {
        return this.store.variableTypes.GetByValue(value);
    }

    /**
     * Sets a type
     * @param {String} name
     * @param {Function} Constructor
     * @returns {Function} Constructor
     */
    SetType(name, Constructor)
    {
        return this.store.variableTypes.Set(name, Constructor);
    }

}
