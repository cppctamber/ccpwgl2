import { meta } from "utils";
import {
    GL_LINEAR,
    GL_REPEAT,
    GL_TEXTURE_2D,
    FilterMode,
    MipFilterMode,
    GL_NEAREST,
    GL_NEAREST_MIPMAP_NEAREST,
    GL_NEAREST_MIPMAP_LINEAR,
    GL_LINEAR_MIPMAP_NEAREST,
    GL_LINEAR_MIPMAP_LINEAR,
    GL_MIRRORED_REPEAT,
    GL_CLAMP_TO_EDGE, GL_TEXTURE_CUBE_MAP
} from "constant";
import { quat } from "math/index";


// Texture Wrap modes
const WrapModes = [
    0,
    GL_REPEAT,
    GL_MIRRORED_REPEAT,
    GL_CLAMP_TO_EDGE,
    GL_CLAMP_TO_EDGE,
    GL_CLAMP_TO_EDGE,
];

// Mip filter mode conversions
const MipFilterToModeTable = {
    [GL_NEAREST]: 0,
    [GL_LINEAR]: 0,
    [GL_NEAREST_MIPMAP_NEAREST]: 1,
    [GL_LINEAR_MIPMAP_NEAREST]: 1,
    [GL_NEAREST_MIPMAP_LINEAR]: 2,
    [GL_LINEAR_MIPMAP_LINEAR]: 2
};

// Filter mode conversions
const FilterToModeTable = {
    [GL_NEAREST]: 1,
    [GL_LINEAR]: 2
};


@meta.type("Tw2SamplerState")
// TODO: Clean this up
export class Tw2SamplerState
{

    @meta.string
    name = "";

    @meta.uint
    registerIndex = 0;

    @meta.uint
    minFilter = GL_LINEAR;

    @meta.uint
    maxFilter = GL_LINEAR;

    @meta.uint
    magFilter = GL_LINEAR;

    @meta.uint
    minFilterNoMips = GL_LINEAR;

    @meta.uint
    addressU = GL_REPEAT;

    @meta.uint
    addressV = GL_REPEAT;

    @meta.uint
    addressW = GL_REPEAT;

    @meta.uint
    anisotropy = 1;

    @meta.uint
    samplerType = GL_TEXTURE_2D;

    @meta.boolean
    isVolume = false;

    @meta.uint
    @meta.isPrivate
    hash = null;

    @meta.uint
    maxAnisotropy = 1;

    // Not used
    _borderColor = null;
    _comparison = null;
    _comparisonFunc = null;
    _mipLODBias = null;
    _minLOD = null;
    _maxLOD = null;

    /**
     * TEMP: Gets the address U mode
     * @return {number}
     */
    get addressUMode()
    {
        return WrapModes.indexOf(this.addressU);
    }

    /**
     * TEMP: Sets the address U by mode
     * @param {Number} mode
     */
    set addressUMode(mode)
    {
        if (this.addressUMode !== mode)
        {
            this.addressU = WrapModes[mode];
            this._dirty = null;
        }
    }

    /**
     * TEMP: Gets the address V mode
     * @return {number}
     */
    get addressVMode()
    {
        return WrapModes.indexOf(this.addressV);
    }

    /**
     * TEMP: Sets the address V by mode
     * @param {Number} mode
     */
    set addressVMode(mode)
    {
        if (this.addressVMode !== mode)
        {
            this.addressV = WrapModes[mode];
            this._dirty = null;
        }
    }

    /**
     * TEMP: Gets the address W mode
     * @return {number}
     */
    get addressWMode()
    {
        return WrapModes.indexOf(this.addressW);
    }

    /**
     * TEMP: Sets the address W by mode
     * @param {Number} mode
     */
    set addressWMode(mode)
    {
        if (this.addressUMode !== mode)
        {
            this.addressW = WrapModes[mode];
            this._dirty = null;
        }
    }

    /**
     * TEMP: Gets the current filter mode
     * @returns {Number}
     */
    get filterMode()
    {
        return this.minFilterNoMips in FilterToModeTable ? FilterToModeTable[this.minFilterNoMips] : 2;
    }

    /**
     * TEMP: Sets the filter by mode
     * @param filterMode
     */
    set filterMode(filterMode)
    {
        this.UpdateFilterModes(filterMode, this.mipFilterMode, this.magFilterMode);
    }

    /**
     * TEMP: Sets the mag filter by mode
     * @return {number}
     */
    get magFilterMode()
    {
        return this.magFilter in FilterToModeTable ? FilterToModeTable[this.magFilter] : 2;
    }

    /**
     * TEMP: Gets the current mip filter mode
     * @returns {Number}
     */
    get mipFilterMode()
    {
        return this.minFilter in MipFilterToModeTable ? MipFilterToModeTable[this.minFilter] : 2;
    }

    /**
     * TEMP: Sets the mip filter by mode
     * @param {Number} mipFilterMode
     */
    set mipFilterMode(mipFilterMode)
    {
        this.UpdateFilterModes(this.filterMode, mipFilterMode, this.magFilterMode);
    }

    /**
     * Updates filters by modes
     * @param {Number} [filterMode]
     * @param {Number} [mipFilterMode]
     * @param {Number} [magFilterMode]
     */
    UpdateFilterModes(filterMode=this.filterMode, mipFilterMode=this.mipFilterMode, magFilterMode=this.magFilterMode)
    {
        if (filterMode === this.filterMode && mipFilterMode === this.filterMode && magFilterMode === this.magFilterMode)
        {
            return;
        }

        switch (filterMode)
        {
            case FilterMode.NEAREST:
                switch (mipFilterMode)
                {
                    case MipFilterMode.NONE:
                        this.minFilter = GL_NEAREST;
                        break;

                    case MipFilterMode.NEAREST:
                        this.minFilter = GL_NEAREST_MIPMAP_NEAREST;
                        break;

                    case MipFilterMode.LINEAR:
                    default:
                        this.minFilter = GL_NEAREST_MIPMAP_LINEAR;
                }

                this.minFilterNoMips = GL_NEAREST;
                this.magFilter = GL_NEAREST;
                break;

            case FilterMode.LINEAR:
            default:
                switch (mipFilterMode)
                {
                    case MipFilterMode.NONE:
                        this.minFilter = GL_LINEAR;
                        break;

                    case MipFilterMode.NEAREST:
                        this.minFilter = GL_LINEAR_MIPMAP_NEAREST;
                        break;

                    case MipFilterMode.LINEAR:
                    default:
                        this.minFilter = GL_LINEAR_MIPMAP_LINEAR;
                }

                this.minFilterNoMips = GL_LINEAR;
                this.magFilter = GL_LINEAR;
        }

        if (mipFilterMode === 3 || magFilterMode === 3 || filterMode === 3)
        {
            this.anisotropy = Math.max(this.maxAnisotropy, 1);
        }

        this.hash = null;
    }

    /**
     * Computes the sampler hash
     */
    ComputeHash()
    {
        this.hash = 2166136261;
        this.hash *= 16777619;
        this.hash ^= this.minFilter;
        this.hash *= 16777619;
        this.hash ^= this.minFilterNoMips;
        this.hash *= 16777619;
        this.hash ^= this.maxFilter;
        this.hash *= 16777619;
        this.hash ^= this.addressU;
        this.hash *= 16777619;
        this.hash ^= this.addressV;
        this.hash *= 16777619;
        this.hash ^= this.addressW;
        this.hash *= 16777619;
        this.hash ^= this.anisotropy;
    }

    /**
     * Apply
     * @param {Tw2Device} device
     * @param {Boolean} hasMipMaps
     * @param {Boolean} [useNoMipFilter] Testing DDS files...
     */
    Apply(device, hasMipMaps, useNoMipFilter)
    {
        const
            targetType = this.samplerType,
            { gl } = device,
            ext = device.GetExtension("EXT_texture_filter_anisotropic"),
            minFilter = useNoMipFilter ? this.minFilterNoMips : this.minFilter;

        gl.texParameteri(targetType, gl.TEXTURE_WRAP_S, hasMipMaps ? this.addressU : gl.CLAMP_TO_EDGE);
        gl.texParameteri(targetType, gl.TEXTURE_WRAP_T, hasMipMaps ? this.addressV : gl.CLAMP_TO_EDGE);

        if (targetType === gl.TEXTURE_3D || targetType === gl.TEXTURE_2D_ARRAY)
        {
            gl.texParameteri(targetType, gl.TEXTURE_WRAP_R, hasMipMaps ? this.addressW : gl.CLAMP_TO_EDGE);
        }

        gl.texParameteri(targetType, gl.TEXTURE_MIN_FILTER, hasMipMaps ? minFilter : this.minFilterNoMips);
        gl.texParameteri(targetType, gl.TEXTURE_MAG_FILTER, this.magFilter);

        if (ext && device.enableAnisotropicFiltering)
        {
            gl.texParameterf(targetType, ext.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(this.anisotropy, ext.maxAnisotropy));
        }

        if (this.hash === null)
        {
            this.ComputeHash();
        }
    }

    /**
     * Resolves modes
     * @param {Object} modes
     */
    ResolveModes(modes = {})
    {
        let {
            addressUMode,
            addressVMode,
            addressWMode,
            maxAnisotropy,
            filterMode,
            mipFilterMode,
            magFilterMode
        } = modes;

        if (maxAnisotropy !== undefined && maxAnisotropy !== this.maxAnisotropy)
        {
            this.maxAnisotropy = maxAnisotropy;
            this.hash = null;
        }

        this.addressUMode = addressUMode;
        this.addressVMode = addressVMode;
        this.addressWMode = addressWMode;
        this.UpdateFilterModes(filterMode, mipFilterMode, magFilterMode);

        if (this.hash === null)
        {
            this.ComputeHash();
        }
    }

    /**
     *
     * TODO: Use utility functions
     * @param {Object} json
     * @param {Tw2EffectRes} context
     * @return {Tw2SamplerState}
     */
    static fromJSON(json, context)
    {
        const { name, registerIndex, ...modes } = json;

        if (!name || registerIndex === undefined)
        {
            throw new ReferenceError("Invalid sampler definition");
        }

        const sampler = new Tw2SamplerState();
        sampler.name = name;
        sampler.registerIndex = registerIndex;
        sampler.ResolveModes(modes);
        return sampler;
    }

    /**
     * Creates a sampler state from ccp binary
     * @param {Tw2BinaryReader}  reader
     * @param {Tw2EffectRes} res
     * @param {Array<Tw2ShaderStageTexture>} stageTextures
     * @returns {Tw2SamplerState}
     */
    static fromCCPBinary(reader, res, stageTextures)
    {
        const sampler = new Tw2SamplerState();
        sampler.registerIndex = reader.ReadUInt8();
        sampler.name = res.version >= 4 ? res.ReadString() : "";
        sampler._comparison = reader.ReadUInt8();     // not used

        const
            filterMode = reader.ReadUInt8(),
            magFilterMode = reader.ReadUInt8(),
            mipFilterMode = reader.ReadUInt8(),
            addressUMode = reader.ReadUInt8(),
            addressVMode = reader.ReadUInt8(),
            addressWMode = reader.ReadUInt8();

        sampler._mipLODBias = reader.ReadFloat32();    // not used

        const maxAnisotropy = reader.ReadUInt8();

        sampler._comparisonFunc = reader.ReadUInt8(); // not used

        sampler._borderColor = quat.fromValues(
            reader.ReadFloat32(),
            reader.ReadFloat32(),
            reader.ReadFloat32(),
            reader.ReadFloat32()
        );

        sampler._minLOD = reader.ReadFloat32();       // not used
        sampler._maxLOD = reader.ReadFloat32();       // not used

        if (res.version < 4) reader.ReadUInt8();

        //  Get texture types
        for (let n = 0; n < stageTextures.length; ++n)
        {
            if (stageTextures[n].registerIndex === sampler.registerIndex)
            {
                sampler.samplerType = stageTextures[n].type === 4 ? GL_TEXTURE_CUBE_MAP: GL_TEXTURE_2D;
                sampler.isVolume = stageTextures[n].type === 3;
                break;
            }
        }

        sampler.ResolveModes({
            mipFilterMode,
            filterMode,
            magFilterMode,
            addressUMode,
            addressVMode,
            addressWMode,
            maxAnisotropy
        });

        return sampler;
    }

    /**
     * Wrap modes
     * @type {number[]}
     */
    static WrapModes = WrapModes;

    /**
     * Filter to mode table
     * @type {Object}
     */
    static FilterToModeTable = FilterToModeTable;

    /**
     * Mip filters to mode table
     * @type {Object}
     */
    static MipFilterToModeTable = MipFilterToModeTable;

}
