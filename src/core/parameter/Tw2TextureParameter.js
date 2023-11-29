import { meta, isString } from "utils";
import { tw2, device } from "global";
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
    @meta.isPrivate
    overrides = null;

    _isAttached = false;

    /**
     * Alias for textureRes
     * @returns {null|Tw2TextureRes}
     */
    get res()
    {
        return this.textureRes;
    }

    /**
     * Temporary
     * @return {Boolean}
     */
    get useAllOverrides()
    {
        return this.overrides ? this.overrides.enable : false;
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
            this.overrides.SetValues({ enable: true });
        }

        if (!bool && this.overrides)
        {
            this.overrides.SetValues({ enable: false });
        }
    }

    /**
     * Checks if the parameter has a texture that was attached
     * @returns {Boolean}
     */
    get isAttached()
    {
        return (this.textureRes && this._isAttached);
    }

    /**
     * Constructor
     * @param {String} [name]        - Name of the texture parameter
     * @param {String} [texturePath] - The texture's resource path
     */
    constructor(name, texturePath)
    {
        super();
        if (name) this.name = name;
        if (texturePath) this.SetValue(texturePath);
    }

    /**
     * Initializes the texture
     */
    Initialize()
    {
        this.UpdateValues();
    }

    /**
     * Reloads the texture if it isn't attached
     * @returns {Boolean} true if reloaded
     */
    Reload()
    {
        if (this.textureRes && !this._isAttached && !this.textureRes._isAttached)
        {
            this.textureRes.Reload();
            return true;
        }
        return false;
    }

    /**
     * Sets the texture path
     * @param {String} value
     * @param {Object} opt
     * @returns {Boolean} true if changed
     */
    SetValue(value, opt)
    {
        if (value === undefined) return false;

        value = value ? value.toLowerCase() : "";

        if (!this.EqualsValue(value))
        {
            this.resourcePath = value;
            this.UpdateValues(opt);
            return true;
        }
        return false;
    }

    /**
     * Returns the texture's resource path
     * @returns {?String}
     */
    GetValue()
    {
        return this.isAttached && this.resourcePath.indexOf("rgba:") !== 0 ? null : this.resourcePath;
    }

    /**
     * Checks if the texture is good
     * @return {Boolean}
     */
    IsGood()
    {
        return this.textureRes ? this.textureRes.IsGood() : false;
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
     * @param {Tw2TextureRes|Tw2VideoRes|null} res
     * @param {Boolean}  [isAttached]
     * @returns {Boolean}
     */
    _SetTextureRes(res, isAttached)
    {
        if (this.textureRes === res)
        {
            return false;
        }

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

            // TODO: Need to delay one frame
            res.RegisterNotification(this);
        }

        return true;
    }

    /**
     * Removes the texture res
     * @return {boolean}
     */
    _RemoveTextureRes()
    {
        const res = this.textureRes;
        if (res)
        {
            this.textureRes = null;
            this._isAttached = false;
            res.UnregisterNotification(this);
            this.EmitEvent(Tw2Resource.Event.RES_REMOVED, this, res);
            return true;
        }
        return false;
    }

    /**
     * Fire on value changes
     */
    OnValueChanged()
    {
        // Don't update res when a texture is attached
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
        else if (!this.isAttached)
        {
            const res = this.resourcePath ? tw2.GetResource(this.resourcePath) : null;
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

            if (!this._samplers)
            {
                this._samplers = { };
            }

            if (!this._samplers[stage])
            {
                this._samplers[stage] = sampler;
            }
        }
    }

    /**
     * Sets the textures overrides
     * TODO: Move to Tw2Effect
     * @param {{}|null} [values] - values to update
     * @param {Object} [opt]
     * @returns {Boolean}        - true if updated
     */
    SetOverrides(values, opt)
    {
        // Null is treated as "delete"
        if (values === null)
        {
            if (this.overrides)
            {
                this.RemoveOverrides();
                return true;
            }
            return false;
        }

        this.overrides = this.overrides || new Tw2SamplerOverride();

        // Temporary until overrides implemented on Tw2Effect
        if (!this.overrides.name)
        {
            this.overrides.name = this.name + "Sampler";
        }

        if (this.overrides.SetValues(values, opt))
        {
            if (!opt || !opt.skipEvents)
            {
                this.EmitEvent("overrides_modified", this, opt);
            }
        }
    }

    /**
     * Removes overrides
     * TODO: Move to Tw2Effect
     * @param {Object} [opt]
     * @return {boolean}
     */
    RemoveOverrides(opt)
    {
        if (this.overrides)
        {
            this.overrides = null;
            this.EmitEvent("overrides_removed", this, opt);
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
        return this.overrides ? this.overrides.GetValues() : null;
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
     * Fires on resource events
     * @param {Tw2TextureRes} res
     * @param {Error} err
     */
    OnResEvent(res, err)
    {
        return Tw2Resource.parentOnResEvent(this, "textureRes", res, err);
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
        return Tw2Resource.parentOnListener(textureParameter, "textureRes", eventName, listener, context);
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

}
