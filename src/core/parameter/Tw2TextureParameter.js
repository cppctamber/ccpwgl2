import {resMan, device, util} from "../../global";
import {Tw2SamplerState} from "../sampler";
import {Tw2Parameter} from "./Tw2Parameter";
import {Tw2TextureRes} from "../resource/Tw2TextureRes";

/**
 * Tw2TextureParameter
 * TODO: Remove constructor parameters
 * TODO: Identify if override samplers are handled differently for TriTextureParameter (e.g. directly on effects)
 * TODO: Make textureRes private
 * TODO: Remove Override methods once utility functions working
 * @ccp TriTextureParameter
 *
 * @property {Boolean} useAllOverrides
 * @property {Number} addressUMode
 * @property {Number} addressVMode
 * @property {Number} addressWMode
 * @property {Number} filterMode
 * @property {Number} mapFilterMode
 * @property {Number} maxAnisotropy
 * @property {Tw2TextureRes} textureRes
 * @property {Tw2SamplerState} _sampler
 */
export class Tw2TextureParameter extends Tw2Parameter
{

    // ccp
    resourcePath = "";

    // ccpwgl
    addressUMode = 1;
    addressVMode = 1;
    addressWMode = 1;
    filterMode = 2;
    maxAnisotropy = 4;
    mipFilterMode = 2;
    textureRes = null;
    useAllOverrides = false;

    _sampler = null;


    /**
     * Constructor
     * @param {String} [name]        - Name of the texture parameter
     * @param {String} [texturePath] - The texture's resource path
     */
    constructor(name, texturePath)
    {
        super(name);

        if (texturePath)
        {
            this.resourcePath = texturePath;
            this.Initialize();
        }
    }

    /**
     * Checks if the parameter has a texture that was attached
     * @returns {Boolean}
     */
    get isTextureAttached()
    {
        return (this.textureRes && this.textureRes._isAttached);
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
        return this.isTextureAttached ? null : this.resourcePath;
    }

    /**
     * Sets the texture's resource manually
     * @param {Tw2TextureRes} res
     * @returns {Boolean}
     */
    SetTextureRes(res)
    {
        if (this.textureRes === res) return false;
        this.resourcePath = "";
        this.textureRes = res;
        if (this.textureRes) this.textureRes._isAttached = true;
        return true;
    }

    /**
     * Fire on value changes
     * @param {*} [controller]        - An optional parameter for tracking the object that called this function
     * @param {String[]} [skipUpdate] -
     */
    OnValueChanged(controller, skipUpdate)
    {
        this.resourcePath = this.resourcePath.toLowerCase();
        if (this.resourcePath !== "")
        {
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

                    this.textureRes = new Tw2TextureRes();
                    this.textureRes.path = this.resourcePath;
                    this.textureRes.Attach(texture);
                }
            }
            else
            {
                this.textureRes = resMan.GetResource(this.resourcePath);
            }
        }
        else
        {
            this.textureRes = null;
        }

        this.UpdateOverrides();
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
            if (this.useAllOverrides && this._sampler)
            {
                this._sampler.samplerType = sampler.samplerType;
                this._sampler.isVolume = sampler.isVolume;
                this._sampler.registerIndex = sampler.registerIndex;
                sampler = this._sampler;
            }
            device.gl.activeTexture(device.gl.TEXTURE0 + stage);
            this.textureRes.Bind(sampler, slices);
        }
    }

    /**
     * Sets the textures overrides
     * TODO: Remove once utility functions working
     * @param {{}} [opt={}] - An object containing the override options to set
     */
    SetOverrides(opt = {})
    {
        util.assignIfExists(this, opt, Tw2TextureParameter.overrideProperties);
        this.UpdateValues();
    }

    /**
     * Gets the texture's overrides
     * TODO: Remove once utility functions working
     * @returns {{}}
     */
    GetOverrides(out = {})
    {
        util.assignIfExists(out, this, Tw2TextureParameter.overrideProperties);
        return out;
    }

    /**
     * Updates the parameter's overrides
     * TODO: Move to OnValueChanged
     */
    UpdateOverrides()
    {
        if (this.useAllOverrides)
        {
            this._sampler = this._sampler || new Tw2SamplerState();

            const
                {wrapModes, gl} = device,
                sampler = this._sampler;

            if (this.filterMode === 1)
            {
                switch (this.mipFilterMode)
                {
                    case 0:
                        sampler.minFilter = gl.NEAREST;
                        break;

                    case 1:
                        sampler.minFilter = gl.NEAREST_MIPMAP_NEAREST;
                        break;

                    default:
                        sampler.minFilter = gl.NEAREST_MIPMAP_LINEAR;
                }

                sampler.minFilterNoMips = gl.NEAREST;
                sampler.magFilter = gl.NEAREST;
            }
            else
            {
                switch (this.mipFilterMode)
                {
                    case 0:
                        sampler.minFilter = gl.LINEAR;
                        break;

                    case 1:
                        sampler.minFilter = gl.LINEAR_MIPMAP_NEAREST;
                        break;

                    default:
                        sampler.minFilter = gl.LINEAR_MIPMAP_LINEAR;
                }
                sampler.minFilterNoMips = gl.LINEAR;
                sampler.magFilter = gl.LINEAR;
            }

            sampler.addressU = wrapModes[this.addressUMode];
            sampler.addressV = wrapModes[this.addressVMode];
            sampler.addressW = wrapModes[this.addressWMode];
            sampler.anisotropy = this.maxAnisotropy;
            sampler.ComputeHash();
        }
        else if (this._sampler)
        {
            this._sampler = null;
        }
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
        return util.isString(a);
    }

    /**
     * The texture parameter's override properties
     * @type {String[]}
     */
    static overrideProperties = [
        "useAllOverrides",
        "addressUMode",
        "addressVMode",
        "addressWMode",
        "filterMode",
        "mipFilterMode",
        "maxAnisotropy"
    ];

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["name", r.string],
            ["resourcePath", r.path]
        ];
    }

}