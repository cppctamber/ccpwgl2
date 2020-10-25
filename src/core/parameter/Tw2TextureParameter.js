import { meta, isString } from "utils";
import { resMan, device } from "global";
import { Tw2SamplerOverride } from "../sampler/Tw2SamplerOverride";
import { Tw2Parameter } from "./Tw2Parameter";
import { Tw2TextureRes } from "../resource/Tw2TextureRes";


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
            this.overrides = this.overrides ||  new Tw2SamplerOverride();
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
                res.RegisterNotification(this);
                if  (isAttached)
                {
                    this._isAttached = true;
                    this.resourcePath = "";
                }
                else
                {
                    this._isAttached = false;
                }
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
                res.path = this.resourcePath;
                res.texture = texture;
                res.texture._isAttached = true;
                this._SetTextureRes(res);
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
                this.EmitEvent("overrides_modified", this, opt);
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
     * Checks if a value is a valid parameter value
     * @param {*} a
     * @returns {Boolean}
     */
    static isValue(a)
    {
        return isString(a);
    }

}
