import {
    VendorCancelAnimationFrame,
    VendorRequestAnimationFrame,
    Webgl2ContextNames,
    WebglContextNames,
    WebglVersion
} from "./Tw2Constant";

import {get} from "../util";
import Tw2EventEmitter from "../class/Tw2EventEmitter";

/**
 * Provides client information and compatibility
 *
 * @property {Tw2Library} tw2
 */
export class Tw2Client extends Tw2EventEmitter
{

    _tw2 = null;

    /**
     * Gets the client vr display
     * @returns {*|VRDisplay|null}
     */
    get vrDisplay()
    {
        return this._tw2.device.vrDisplay;
    }

    /**
     * Constructor
     * @param {Tw2Library} tw2
     */
    constructor(tw2)
    {
        super();
        this._tw2 = tw2;
    }

    /**
     * Registers client options
     * @param {*} opt
     */
    Register(opt)
    {

    }

    /**
     * Per frame tick
     * @param {Tw2Device} device
     */
    Tick(device)
    {

    }

    /**
     * Requests an animation frame
     * @param {Function} callback
     */
    RequestAnimationFrame(callback)
    {
        return this.vrDisplay
            ? this.vrDisplay.requestAnimationFrame(callback)
            : this.constructor.RequestAnimationFrame(callback);
    }

    /**
     * Cancels an animation frame
     * @param {Number} id
     */
    CancelAnimationFrame(id)
    {
        return this.vrDisplay
            ? this.vrDisplay.cancelAnimationFrame(id)
            : this.constructor.CancelAnimationFrame(id);
    }

    /**
     * Creates a webgl context
     * @param {HTMLCanvasElement} canvas
     * @param {*} params
     * @param {Boolean} [enableWebgl2]
     * @returns {{gl: *, version: number}}
     */
    CreateContext(canvas, params, enableWebgl2)
    {
        let lastErr;

        /**
         * Creates a gl context
         * @param {HTMLCanvasElement} canvas
         * @param {*} [params]
         * @param {*} [contextNames]
         * @returns {*}
         */
        function create(canvas, params, contextNames)
        {
            contextNames = Array.isArray(contextNames) ? contextNames : [contextNames];
            for (let i = 0; i < contextNames.length; i++)
            {
                try
                {
                    return canvas.getContext(contextNames[i], params);
                }
                catch (err)
                {
                    lastErr = err;/* eslint-disable-line no-empty */
                }
            }
            return null;
        }

        let gl = null,
            version = WebglVersion.NONE;

        if (enableWebgl2)
        {
            gl = create(canvas, params, Webgl2ContextNames);
            if (gl) version = WebglVersion.WEBGL2;
        }

        if (!gl)
        {
            gl = create(canvas, params, WebglContextNames);
            if (gl) version = WebglVersion.WEBGL;
        }

        if (!gl)
        {
            //throw lastErr;
        }

        return {gl, version};
    }

    /**
     * Requests an animation frame
     * @type {Function}
     */
    static RequestAnimationFrame = (function ()
    {
        const request = get(window, VendorRequestAnimationFrame);
        return callback => request(callback);
    })();

    /**
     * Cancels an animation frame
     * @type {Function}
     */
    static CancelAnimationFrame = (function ()
    {
        const cancel = get(window, VendorCancelAnimationFrame);
        return id => cancel(id);
    })();

}