import {Tw2Store, Tw2Client, Tw2ResMan, Tw2Device, Tw2Logger} from "./engine";
import * as math from "./math";
import * as util from "./util";
import * as consts from "./engine/Tw2Constant";
import {Tw2EventEmitter} from "./class/Tw2EventEmitter";
import {enableUUID} from "./util";

/**
 * Tw2 Library
 *
 * @property {*} consts
 * //@property {Tw2Clock} clock
 * @property {Tw2Store} store
 * @property {Tw2Client} client
 * @property {Tw2Logger} logger
 * @property {Tw2ResMan} resMan
 * @property {Tw2Device} device
 * @property {EveSOF} eveSof
 * @property {Function} render
 */
class Tw2Library extends Tw2EventEmitter
{

    consts = consts;
    logger = new Tw2Logger(this);
    client = new Tw2Client(this);
    //clock = new Tw2Clock(this);
    store = new Tw2Store(this);
    device = new Tw2Device(this);
    resMan = new Tw2ResMan(this);
    eveSof = null;
    render = null;

    /**
     * Constructor
     */
    constructor()
    {
        super();

        this.store.classes.on("registered", (key, value) =>
        {
            Tw2Library.prototype[key] = value;
        });

        Tw2EventEmitter.defaultLogger = this;

        // Lazy load the space object factory
        let eveSof;
        const getSof = () =>
        {
            if (!eveSof)
            {
                const EveSOF = this.GetClass("EveSOF");
                if (EveSOF)
                {
                    eveSof = new EveSOF(this);
                }
            }
            return eveSof;
        };

        Object.defineProperty(this, "eveSof", {get: getSof});
    }

    /**
     * Creates a log
     * @param {String} type
     * @param {*} log
     * @param {String} [category]
     * @returns {*}
     */
    Log(type, log, category=Tw2Library.constructor.__category)
    {
        return this.logger.Log(type, log, category);
    }

    /**
     * Per frame tick
     */
    Tick()
    {
        const d = this.device;

        d.Tick();

        this.client.Tick(d);

        this.emit("tick", {
            dt: d.dt,
            previous: d.previousTime,
            current: d.currentTime,
            frame: d.frame
        });

        this.resMan.Tick(d);

        if (this.render)
        {
            this.render(d.dt);
        }
    }

    /**
     * Initializes the engine
     * @param {{}} [opt={}]
     * @param {HTMLCanvasElement} opt.canvas
     * @param {Function} [opt.render]
     * @param {Boolean} [opt.autoTick]
     * @param {*} [opt.glParams]
     * @param {*} [opt.client]
     * @param {*} [opt.clock]
     * @param {*} [opt.device]
     * @param {*} [opt.resMan]
     * @param {*} [opt.store]
     * @param {*} [opt.logger]
     * @returns {Number} The gl version that was created
     */
    Initialize(opt = {})
    {
        this.Register(opt);

        const {canvas = null, render = null, autoTick = true, glParams = {}} = opt;

        if (this.device.CreateDevice(canvas, glParams))
        {
            this.render = render;

            if (autoTick)
            {
                const tick = () =>
                {
                    this.client.RequestAnimationFrame(tick);
                    this.Tick();
                };

                this.client.RequestAnimationFrame(tick);
            }
        }

        return this.device.glVersion;
    }

    /**
     * Gets a resource
     * @param {String} resPath
     * @returns {Tw2Resource}
     */
    GetResource(resPath)
    {
        return this.resMan.GetResource(resPath);
    }

    /**
     * Gets an object
     * @param {String} resPath
     * @param {Function} onResolved
     * @param {Function} onRejected
     */
    GetObject(resPath, onResolved, onRejected)
    {
        if (resPath.match(/(\w|\d|[-_])+:(\w|\d|[-_])+:(\w|\d|[-_])+/))
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
     * Gets an object
     * @param {String} resPath
     * @returns {Promise<any>}
     */
    GetObjectAsync(resPath)
    {
        if (resPath.match(/(\w|\d|[-_])+:(\w|\d|[-_])+:(\w|\d|[-_])+/))
        {
            return this.eveSof.GetObject(resPath);
        }
        else
        {
            return this.resMan.GetObjectAsync(resPath);
        }
    }

    /**
     * Gets a class by it's name
     * @param {String} name
     * @returns {*}
     */
    GetClass(name)
    {
        return this.store.classes.Get(name);
    }

    /**
     *
     * @param name
     * @returns {*}
     * @constructor
     */
    GetVariable(name)
    {
        return this.store.variables.Get(name);
    }

    /**
     * Gets a variable's value
     * @param name
     * @param serialize
     * @returns {*}
     */
    GetVariableValue(name, serialize)
    {
        return this.store.variables.GetValue(name, serialize);
    }

    /**
     * Sets a variable's value
     * @param name
     * @param value
     * @returns {*}
     */
    SetVariableValue(name, value)
    {
        return this.store.variables.SetValue(name, value);
    }

    /**
     * Registers options from an object
     * @param {*} opt={}
     * @param {Boolean} opt.uuid
     * @param {*} opt.client
     * @param {*} opt.device
     * @param {*} opt.logger
     * @param {*} opt.resMan
     * @param {*} opt.store
     */
    Register(opt)
    {
        if (!opt) return;
        if (opt.uuid) enableUUID(opt.uuid);

        this.logger.Register(opt.logger);
        if (opt.debug) this.Debug(opt.debug);

        this.client.Register(opt.client);
        this.device.Register(opt.device);
        this.resMan.Register(opt.resMan);
        this.store.Register(opt.store);
        //this.clock.Register(opt.clock);
    }

    /**
     * Enables debug mode
     * @param {Boolean} bool
     */
    Debug(bool)
    {
        this.store.classes.Debug(bool);
        this.logger.Debug(bool);
        this.Log("warning", `Debugging ${bool ? "enabled" : "disabled"}`);
    }

    /**
     * Sets an object's tw2 instantiation
     * @param {*} target
     */
    SetLibrary(target)
    {
        if ("tw2" in target)
        {
            Reflect.defineProperty(target, "tw2", {
                value: this,
                writable: false,
                configurable: false
            });
        }
    }

    /**
     * Logger category
     * @type {string}
     * @private
     */
    category = "Library";
}

/**
 * Math functions
 * @type {*}
 */
Tw2Library.prototype.math = math;

/**
 * Utils
 * @type {*}
 */
Tw2Library.prototype.util = util;


export const tw2 = new Tw2Library();

// Temporary until instances of Tw2Library are supported
const {store, resMan, device, logger} = tw2;
export {store, resMan, device, logger, util};

