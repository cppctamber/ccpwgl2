import { meta, isString } from "utils";
import { resMan, device } from "global";
import { Tw2SamplerOverride } from "../sampler/Tw2SamplerOverride";
import { Tw2Parameter } from "./Tw2Parameter";
import { Tw2TextureRes } from "../resource/Tw2TextureRes";
import { Tw2Resource } from "core/resource";


@meta.type("Tw2TextureParameter", "TriTextureParameter")
export class Tw2TextureParameter extends Tw2Parameter
{

    @meta.string
    name = "";

    @meta.path
    resourcePath = "";

    @meta.struct("Tw2TextureRes")
    @meta.todo("Make private")
    textureRes = null;

    @meta.struct("Tw2SamplerOverrides")
    overrides = null;

    /**
     * Temporary
     * @return {Boolean}
     */
    get useAllOverrides()
    {
        return this.overrides ? this.overrides.enabled : false;
    }

    /**
     * Temporary
     * @param {Boolean} bool
     */
    set useAllOverrides(bool)
    {
        if (bool)
        {
            this.overrides = this.overrides || new Tw2SamplerOverride();
            this.overrides.SetValues({ enabled: true });
        }

        if (!bool && this.overrides)
        {
            this.overrides.SetValues({ enabled: false });
        }
    }

    _isAttached = false;

    /**
     * Constructor
     * @param {String} [name]        - Name of the texture parameter
     * @param {String} [texturePath] - The texture's resource path
     */
    constructor(name, texturePath)
    {
        super();

        if (name) this.name = name;

        if (texturePath)
        {
            this.SetValue(texturePath);
        }
    }

    /**
     * Checks if the parameter has a texture that was attached
     * @returns {Boolean}
     */
    get isTextureAttached()
    {
        return (this.textureRes && this._isAttached);
    }

    /**
     * Initializes the texture
     */
    Initialize()
    {
        this.UpdateValues();
    }

    /**
     * Sets the texture path
     * @param {String} value
     * @returns {Boolean} true if changed
     */
    SetValue(value)
    {
        this.resourcePath = value;
        this.UpdateValues();
    }

    /**
     * Returns the texture's resource path
     * @returns {?String}
     */
    GetValue()
    {
        return this.isTextureAttached && this.resourcePath.indexOf("rgba:") !== 0 ? null : this.resourcePath;
    }

    /**
     * Attaches a texture res
     * @param {Tw2TextureRes|Tw2VideoRes} res
     * @return {boolean}
     */
    AttachTextureRes(res)
    {
        return this._SetTextureRes(res, true);
    }

    /**
     * Sets the texture's resource manually
     * @param {Tw2TextureRes|Tw2VideoRes} res
     * @param {Boolean}  [isAttached]
     * @returns {Boolean}
     */
    _SetTextureRes(res, isAttached)
    {
        if (this.textureRes !== res)
        {
            this._RemoveTextureRes();
            this.textureRes = res;

            if (res)
            {
                if (isAttached)
                {
                    this._isAttached = true;
                    this.resourcePath = "";
                }
                else
                {
                    this._isAttached = false;
                }

                res.RegisterNotification(this);
            }

            return true;
        }
        return false;
    }

    /**
     * Removes the texture res
     * @return {boolean}
     */
    _RemoveTextureRes()
    {
        if (this.textureRes)
        {
            this.textureRes.UnregisterNotification(this);
            this.EmitEvent(Tw2TextureRes.Event.RES_REMOVED, this, this.textureRes);
            this.textureRes = null;
            return true;
        }
        return false;
    }

    /**
     * Fire on value changes
     * @param {Object} [opt]
     */
    OnValueChanged(opt)
    {
        this.resourcePath = this.resourcePath ? this.resourcePath.toLowerCase() : "";

        if (this.resourcePath.indexOf("rgba:/") === 0)
        {
            if (!this.textureRes || this.textureRes.path !== this.resourcePath)
            {
                const
                    color = this.resourcePath.replace("rgba:/", "").split(","),
                    texture = device.CreateSolidTexture([
                        parseFloat(color[0]),
                        parseFloat(color[1]),
                        parseFloat(color[2]),
                        color[3] !== undefined ? parseFloat(color[3]) : 255
                    ]);

                const res = new Tw2TextureRes();
                this._SetTextureRes(res);
                res.Attach(texture, this.resourcePath);
            }
        }
        else
        {
            const res = this.resourcePath ? resMan.GetResource(this.resourcePath) : null;
            this._SetTextureRes(res);
        }
    }

    /**
     * Apply
     * @param {Number} stage
     * @param {Tw2SamplerState} sampler
     * @param {Number} slices
     */
    Apply(stage, sampler, slices)
    {
        if (this.textureRes)
        {
            if (this.overrides)
            {
                sampler = this.overrides.GetSampler(sampler);
            }

            device.gl.activeTexture(device.gl.TEXTURE0 + stage);
            this.textureRes.Bind(sampler, slices);
        }
    }

    /**
     * Sets the textures overrides
     * TODO: Move to Tw2Effect
     * @param {{}} [values={}] - values to update
     * @param {Object} [opt]
     * @returns {Boolean} true if updated
     */
    SetOverrides(values, opt)
    {
        this.overrides = this.overrides || new Tw2SamplerOverride();

        if (this.overrides.SetValues(values, opt))
        {
            if (!opt || !opt.skipEvents)
            {
                this.EmitEvent(Tw2TextureParameter.Event.OVERRIDES_MODIFIED, this, opt);
            }
        }
    }

    /**
     * Removes overrides
     * TODO: Move to Tw2Effect
     * @return {boolean}
     */
    RemoveOverrides()
    {
        if (this.overrides)
        {
            this.overrides = null;
            return true;
        }
        return false;
    }

    /**
     * Gets the texture's overrides
     * TODO: Move to Tw2Effect
     * @returns {{}}
     */
    GetOverrides()
    {
        this.overrides && this.overrides.enabled ? this.overrides.GetValues() : null;
    }


    /**
     * Checks if a value is equal to the parameter's resource path
     * @param {*} value
     * @returns {Boolean}
     */
    EqualsValue(value)
    {
        return value.toLowerCase() === this.GetValue();
    }

    /**
     * Gets the texture's resources
     * @param {Array} [out=[]]
     * @returns {Array.<Tw2Resource>}
     */
    GetResources(out = [])
    {
        if (this.textureRes && !out.includes(this.textureRes))
        {
            out.push(this.textureRes);
        }
        return out;
    }

    /**
     * Fires on resource events
     * @param {Tw2TextureRes} res
     * @param {Error} err
     */
    OnResEvent(res, err)
    {
        if (this.textureRes !== res) return;

        const { Event } = Tw2TextureParameter;
        switch (res._state)
        {
            case Tw2Resource.State.ERROR:
                this.EmitEvent(Event.RES_ERROR, this, res, err);
                res.UnregisterNotification(this);
                break;

            case Tw2Resource.State.PURGED:
                this.EmitEvent(Event.RES_PURGED, this, res);
                break;

            case Tw2Resource.State.UNLOADED:
                this.EmitEvent(Event.RES_UNLOADED, this, res);
                break;

            case Tw2Resource.State.REQUESTED:
                this.EmitEvent(Event.RES_REQUESTED, this, res);
                break;

            case Tw2Resource.State.PREPARED:
                this.EmitEvent(Event.RES_PREPARED, this, res);
                res.UnregisterNotification(this);
                break;
        }
    }

    /**
     * Handles listeners added after an event has already been fired
     * @param {Tw2TextureParameter} textureParameter
     * @param {String} eventName
     * @param {Function} listener
     * @param {*} [context]
     * @return {boolean} true if the listener was fired
     */
    static onListener(textureParameter, eventName, listener, context)
    {
        /**
         * The texture resource
         * @type {Tw2TextureRes}
         */
        const res = textureParameter.textureRes;
        if (!res) return false;

        const { Event } = this;

        let doCall;
        switch (eventName)
        {
            case Event.RES_ERROR:
                if (res.HasErrors())
                {
                    listener.call(context, this, res, res.GetLastError());
                    return true;
                }
                return false;

            case Event.RES_UNLOADED:
                if (res.IsUnloaded()) doCall = true;
                break;

            case Event.RES_PURGED:
                if (res.IsPurged()) doCall = true;
                break;

            case Event.RES_REQUESTED:
                if (res.HasRequested()) doCall = true;
                break;

            case Event.RES_PREPARED:
                if (res.IsPrepared()) doCall = true;
        }

        if (doCall)
        {
            listener.call(context, this, res);
            return true;
        }

        return false;
    }

    /**
     * Checks if a value is a valid parameter value
     * @param {*} a
     * @returns {Boolean}
     */
    static isValue(a)
    {
        return isString(a);
    }

    /**
     * Event names
     * @type {*}
     */
    static Event = {
        RES_UNLOADED: "res_unloaded",
        RES_PURGED: "res_purged",
        RES_ERROR: "res_error",
        RES_REQUESTED: "res_requested",
        RES_PREPARED: "res_prepared",
        RES_REMOVED: "res_removed",
        OVERRIDES_MODIFIED: "overrides_modified"
    };

}
