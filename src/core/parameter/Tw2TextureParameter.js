import { meta, isString } from "utils";
import { tw2, device } from "global";
import { Tw2SamplerOverride } from "../sampler/Tw2SamplerOverride";
import { Tw2Parameter } from "./Tw2Parameter";
import { Tw2Resource } from "core/resource";


@meta.type("Tw2TextureParameter", "TriTextureParameter")
@meta.define({
    wgl: "Tw2TextureParameter",
    ccp: "TriTextureParameter"
})
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
        // An attached texture has no path to report. The exception used to be
        // "rgba:" paths, which were attached but still meaningful; colours are
        // ordinary resources now, so they are never attached here.
        return this.isAttached ? null : this.resourcePath;
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
     * @param {Tw2TextureRes} res
     * @return {boolean}
     */
    AttachTextureRes(res)
    {
        return this._SetTextureRes(res, true);
    }

    /**
     * Sets the texture's resource manually
     * @param {Tw2TextureRes|null} res
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

        // Constant colours are "dynamic:/color/r,g,b,a" and resolve through
        // the resource manager like any other path, so they are built once a
        // device exists and shared by every parameter asking for that colour.
        // The old "rgba:/" branch did neither: it created a GL texture during
        // construction, and a separate one per parameter.
        if (!this.isAttached)
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
        // A sampler with no resource must still receive a correctly typed
        // texture. The array case was forced on us - binding nothing (or a 2D
        // fallback) to an array unit makes WebGL2 reject the whole draw with
        // INVALID_OPERATION - but the same reasoning applies to every type,
        // and the other types fail quietly instead of loudly: an unbound
        // sampler does not read black, it reads whatever texture the previous
        // draw left on its unit. That has produced Carbon scene textures
        // appearing on unrelated geometry, screen-locked and camera-angle
        // dependent, with no error anywhere.
        //
        // Transparent black is the neutral for the resources that reach here
        // (EveSceneFogVolumeMap computes fog as 1 - sample.w * strength, so
        // alpha 0 means "no fog"). Resources whose neutral is not black -
        // DepthMap, where 0 means "occluded by the near plane" - are given a
        // real texture through the config variables instead, because the right
        // value is a property of the shader, not of the binding layer.
        if (!this.textureRes && sampler)
        {
            const fallback = Tw2TextureParameter.FallbackFor(sampler.samplerType);
            if (fallback)
            {
                device.gl.activeTexture(device.gl.TEXTURE0 + stage);
                device.gl.bindTexture(fallback.target, fallback.texture);
                return;
            }
        }

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

    /**
     * Gets the neutral fallback texture for a sampler target
     *
     * Returns null for an unrecognised target rather than guessing, so an
     * unknown sampler type keeps the historical bind-nothing behaviour instead
     * of being bound something of the wrong shape.
     * @param {Number} samplerType - gl texture target
     * @returns {{target:Number, texture:WebGLTexture}|null}
     */
    static FallbackFor(samplerType)
    {
        const gl = device.gl;
        switch (samplerType)
        {
            case gl.TEXTURE_2D:
                return { target: gl.TEXTURE_2D, texture: device.GetFallbackTexture() };

            case gl.TEXTURE_2D_ARRAY:
                return { target: gl.TEXTURE_2D_ARRAY, texture: device.GetFallbackArrayTexture() };

            case gl.TEXTURE_CUBE_MAP:
                return { target: gl.TEXTURE_CUBE_MAP, texture: device.GetFallbackCubeMap() };

            case gl.TEXTURE_3D:
                return { target: gl.TEXTURE_3D, texture: device.GetFallbackVolumeTexture() };

            default:
                return null;
        }
    }

}
