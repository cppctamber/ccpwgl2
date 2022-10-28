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
import { isFunction, isString } from "utils";
import { isArray } from "utils";


let count = 0;

export class Tw2Library extends Tw2EventEmitter
{

    math = math;

    util = util;

    const = consts;

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
     * Audio context
     * @type {null|Tw2AudMan}
     */
    audMan = null; //new Tw2AudMan();

    /**
     * Resource manager
     * @type {Tw2ResMan}
     */
    resMan = new Tw2ResMan(this);

    /**
     * Device
     * @type {Tw2Device}
     */
    device = new Tw2Device(this);

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
     * Constructor
     */
    constructor()
    {
        count++;
        if (count > 1) throw new ErrSingletonInstantiation();

        super();

        // Forward device events
        this.device.AddEvents({
            resized: (...args) => this.EmitEvent("resized", ...args),
            context_lost: (...args) => this.EmitEvent("context_lost", ...args),
            context_restored: (...args) => this.EmitEvent("context_restored", ...args),
            context_created: (...args) => this.EmitEvent("context_created", ...args),
            canvas2d_cleared: (...args) => this.EmitEvent("canvas2d_cleared", ...args)
        });

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
     * @param {{}} opt
     * @param {Function} [opt.render]                   - Optional function to automatically call per frame
     * @param {String|HTMLCanvasElement} opt.canvas     - Canvas element or id
     * @param {String|HTMLCanvasElement} [opt.canvas2d] - Optional 2d canvas element or id
     * @param {Object} [opt.glParams]                   - Optional gl params
     * @param {Boolean} [opt.debug]                     - toggles debug mode
     * @param {Function} [opt.resourceHandler]          - An optional resource handler
     * @param {Object} [opt.events]                     - Optional event listener config
     * @param {Object} [opt.black]                      - Configuration for black file extension handling
     * @param {Object} [opt.variableTypes]
     * @param {Object} [opt.constructors]
     * @param {Object} [opt.variables]
     * @param {Object} [opt.paths]
     * @param {Object} [opt.dynamicPaths]
     * @param {Object} [opt.extensions]
     * @param {Object} [opt.logger]                     - Optional logger config
     * @param {Object} [opt.resMan]                     - Optional resource manager config
     * @param {Object} [opt.device]                     - Optional device config
     */
    Initialize(opt = {})
    {
        const { render, glParams, canvas, canvas3d, canvas2d, ...options } = opt;

        this.Register(options);

        this.device.Create({ canvas, canvas3d, canvas2d, glParams });

        if (render)
        {
            this.OnEvent("tick", render);

            const tick = () =>
            {
                this.device.RequestAnimationFrame(tick);
                this.StartFrame();
                this.EndFrame();
            };

            this.device.RequestAnimationFrame(tick);
        }
    }

    /**
     * Start frame
     */
    StartFrame()
    {
        this.device.Tick();
        this.resMan.Tick();
        if (this.audMan) this.audMan.Tick();
        this.EmitEvent("start_frame", this.device.dt);
        this.EmitEvent("tick", this.device.dt);
    }

    /**
     * End frame
     */
    EndFrame()
    {
        this.EmitEvent("end_frame", this.device.dt);
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
     * Registers library opt
     * @param {*} opt
     * @param {Boolean} opt.debug
     * @param {Function} opt.resourceHandler
     * @param {Object} opt.black
     * @param {Object} opt.variableTypes
     * @param {Object} opt.constructors
     * @param {Object} opt.variables
     * @param {Object} opt.paths
     * @param {Object} opt.dynamicPaths
     * @param {Object} opt.extensions
     * @param {Object} opt.logger
     * @param {Object} opt.resMan
     * @param {Object} opt.device
     */
    Register(opt)
    {
        if (!opt) return;

        if (opt.events) this.AddEvents(opt.events);
        if (opt.debug !== undefined) this.SetDebugMode(opt.debug);
        if (opt.resourceHandler) this.SetCustomResourceHandler(opt.resourceHandler);
        if (opt.black) this.RegisterBlackPathHandlers(opt.black);
        if (opt.variableTypes) this.variableTypes.Register(opt.variableTypes);
        if (opt.constructors) this.constructors.Register(opt.constructors);
        if (opt.variables) this.variables.Register(opt.variables);
        if (opt.paths) this.paths.Register(opt.paths);
        if (opt.dynamicPaths) this.dynamicPaths.Register(opt.dynamicPaths);
        if (opt.extensions) this.extensions.Register(opt.extensions);

        if (opt.logger) this.logger.Register(opt.logger);
        if (opt.resMan) this.resMan.Register(opt.resMan);
        if (opt.device) this.device.Register(opt.device);

        // Shortcut to device.glParams
        if (opt.glParams) this.device.Register({ glParams: opt.glParams });
    }

    /**
     * Enables system mirror
     * @returns {Promise<void>}
     */
    async SetSystemMirror(bool)
    {
        return this.resMan.SetSystemMirror(bool);
    }

    /**
     * Checks if system mirror is enabled
     * @returns {Boolean}
     */
    IsSystemMirrorEnabled()
    {
        return this.resMan.IsSystemMirrorEnabled();
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
     * Sets opaque render states
     * @returns {Tw2Library}
     * @constructor
     */
    SetOpaqueRenderStates()
    {
        return this.SetStandardStates(consts.RM_OPAQUE);
    }

    /**
     * Sets transparent render states
     * @returns {Tw2Library}
     */
    SetTransparentRenderStates()
    {
        return this.SetStandardStates(consts.RM_OPAQUE);
    }

    /**
     * Sets additive render states
     * @returns {Tw2Library}
     */
    SetAdditiveRenderStates()
    {
        return this.SetStandardStates(consts.RM_ADDITIVE);
    }

    /**
     * Sets decal render states
     * @returns {Tw2Library}
     */
    SetDecalRenderStates()
    {
        return this.SetStandardStates(consts.RM_DECAL);
    }

    /**
     * Sets distortion render states
     * @returns {Tw2Library}
     */
    SetDistortionRenderStates()
    {
        return this.SetStandardStates(consts.RM_DISTORTION);
    }

    /**
     * Sets pickable render states
     * @returns {Tw2Library}
     */
    SetPickableRenderStates()
    {
        return this.SetStandardStates(consts.RM_PICKABLE);
    }

    /**
     * Sets fullscreen render states
     * @returns {Tw2Library}
     */
    SetFullscreenRenderStates()
    {
        return this.SetStandardStates(consts.RM_FULLSCREEN);
    }

    /**
     * Sets the gl color mask using an array or vector4
     * @param {vec4|Array} colorMask
     * @returns {Tw2Library}
     */
    SetColorMask(colorMask)
    {
        this.device.gl.colorMask(!!colorMask[0], !!colorMask[1], !!colorMask[2], !!colorMask[3]);
        return this;
    }

    /**
     * Gets the gl color mask
     * @param {vec4|Array} [out=[]]
     * @returns {vec4|Array} out
     */
    GetColorMask(out=[])
    {
        const colorMask = this.device.gl.getParameter(this.device.gl.COLOR_WRITEMASK);
        for (let i = 0; i < colorMask.length; i++)
        {
            out[i] = colorMask[i] ? 1 : 0;
        }
        return colorMask;
    }

    /**
     * Sets the gl clear color using an array or vector4
     * @param {vec4|Array} clearColor
     * @returns {Tw2Library}
     */
    SetClearColor(clearColor)
    {
        this.device.gl.clearColor(clearColor[0], clearColor[1], clearColor[2], clearColor[3]);
        return this;
    }

    /**
     * Gets the gl clear color
     * @param {vec4|Array} [out=[]]
     * @returns {vec4|Array} out
     */
    GetClearColor(out=[])
    {
        const clearColor = this.device.gl.getParameter(this.device.gl.COLOR_CLEAR_VALUE);
        return math.vec4.copy(out, clearColor);
    }

    /**
     * Sets the gl viewport using an array or vector4
     * @param {vec4|Array} viewport
     * @returns {Tw2Library}
     */
    SetViewport(viewport)
    {
        this.device.gl.viewport(viewport[0], viewport[1], viewport[2], viewport[3]);
        return this;
    }

    /**
     * Gets the gl viewport
     * @param {Array|vec4} [out=[]]
     * @returns {Array|vec4}
     */
    GetViewport(out=[])
    {
        const viewport = this.device.gl.getParameter(this.device.gl.VIEWPORT);
        return math.vec4.copy(out, viewport);
    }

    /**
     * Sets GL Depth parameters
     * @param {Boolean} [enabled]
     * @param {String|Number} [depthFunc]
     * @param {Number} [clearDepth]
     * @constructor
     */
    SetDepth(enabled, depthFunc, clearDepth)
    {
        if (!enabled)
        {
            this.device.gl.disable(this.device.gl.DEPTH_TEST);
        }
        else
        {
            this.device.gl.enable(this.device.gl.DEPTH_TEST);
        }

        if (depthFunc !== undefined)
        {
            this.device.gl.depthFunc(isString(depthFunc) ? this.gl[depthFunc] : depthFunc);
        }

        if (clearDepth !== undefined)
        {
            this.device.gl.clearDepth(clearDepth);
        }

        return this;
    }

    /**
     * Sets gl clear depth
     * @param {Number} value
     * @returns {Tw2Library}
     */
    SetClearDepth(value)
    {
        this.device.gl.clearDepth(value);
        return this;
    }

    /**
     * Gets the current gl clear depth
     * @returns {Number}
     */
    GetClearDepth()
    {
        return this.device.gl.getParameter(this.device.gl.DEPTH_CLEAR_VALUE);
    }


    /**
     * Clears buffer bits
     * @param {Boolean} color
     * @param {Boolean} depth
     * @param {Boolean} stencil
     * @returns {Tw2Library}
     */
    ClearBufferBits(color=true, depth=true, stencil=true)
    {
        let bits = 0;
        if (color) bits |= this.device.gl.COLOR_BUFFER_BIT;
        if (depth) bits |= this.device.gl.DEPTH_BUFFER_BIT;
        if (stencil) bits |= this.device.gl.STENCIL_BUFFER_BIT;
        this.device.gl.clear(bits);
        return this;
    }

    /**
     * Clears GL Depth
     * @returns {Tw2Library}
     */
    ClearDepth()
    {
        return this.ClearBufferBits(false, true, false);
    }

    /**
     * Clears GL Stencil
     * @returns {Tw2Library}
     */
    ClearStencil()
    {
        return this.ClearBufferBits(false, false, true);
    }

    /**
     * Clears GL Color
     * @returns {Tw2Library}
     */
    ClearColor()
    {
        return this.ClearBufferBits(true, false, false);
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
     * Watches an objects progress and resolves when all resources have completed processing
     * @param {*} obj
     * @param {Function} [onProgress]
     * @return {Promise<*>}
     */
    async Watch(obj, onProgress)
    {
        return this.resMan.Watch(obj, onProgress);
    }

    /**
     * Unwatches an object
     * @param {*} obj
     * @return {boolean}
     */
    Unwatch(obj)
    {
        return this.resMan.UnWatch(obj);
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
                await this.Watch(result, awaitResources);
            }
            else
            {
                await this.Watch(result);
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
        const outerProgress = createOuterProgress(awaitResources, Object.keys(obj).length);

        return Promise.all(Object
            .keys(obj)
            .map(key => this.Fetch(obj[key], outerProgress).then(val => ({ key, val })))
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
        const outerProgress = createOuterProgress(awaitResources, arr.length);

        return Promise.all(arr.map(x => this.Fetch(x, outerProgress)));
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
     * @param {String} name
     * @param {*} [out]
     * @returns {*}
     */
    GetVariableValue(name, out)
    {
        return this.variables.GetValue(name, out);
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
 * Creates outer progress handler
 * @param {undefined|Function}  awaitProgress
 * @param {Number} [total=0]
 * @returns {Boolean|Function}
 */
function createOuterProgress(awaitProgress, total = 0)
{

    if (!isFunction(awaitProgress))
    {
        return !!awaitProgress;
    }

    let map = new Map();
    
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
        awaitProgress(result, object, all, map);
    };

}
