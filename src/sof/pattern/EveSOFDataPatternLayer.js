import { meta } from "utils";


@meta.type("EveSOFDataPatternLayer")
export class EveSOFDataPatternLayer extends meta.Model
{

    @meta.boolean
    isTargetMtl1 = true;

    @meta.boolean
    isTargetMtl2 = true;

    @meta.boolean
    isTargetMtl3 = true;

    @meta.boolean
    isTargetMtl4 = true;

    @meta.uint
    materialSource = 0;

    @meta.uint
    projectionTypeU = 0;

    @meta.uint
    projectionTypeV = 0;

    @meta.string
    textureName = "";

    @meta.path
    textureResFilePath = EveSOFDataPatternLayer.EMPTY_TEXTURE_RES_FILE_PATH;

    /**
     * Constructor
     * @param {String} name
     */
    constructor(name = "")
    {
        super();
        this.textureName = name;
    }

    /**
     * Empties the pattern layer
     */
    Empty()
    {
        this.isTargetMtl1 = false;
        this.isTargetMtl2 = false;
        this.isTargetMtl3 = false;
        this.isTargetMtl4 = false;
        this.materialSource = 0;
        this.projectionTypeU = 0;
        this.projectionTypeV = 0;
        this.textureResFilePath = this.constructor.EMPTY_TEXTURE_RES_FILE_PATH;
    }

    /**
     * Sets data from a texture parameter and optional sampler override
     * @param {Tw2TextureParameter} textureParameter
     * @param {Tw2SamplerOverride} [samplerOverride]
     */
    SetFromTexture(textureParameter, samplerOverride)
    {
        this.projectionTypeU = 0;
        this.projectionTypeV = 0;
        this.textureResFilePath = textureParameter.GetValue() || this.constructor.EMPTY_TEXTURE_RES_FILE_PATH;

        if (!samplerOverride && textureParameter.useAllOverrides)
        {
            samplerOverride = textureParameter.overrides;
        }

        if (samplerOverride)
        {
            this.projectionTypeU = this.constructor.FromAddressMode(samplerOverride.addressUMode);
            this.projectionTypeV = this.constructor.FromAddressMode(samplerOverride.addressVMode);
        }
    }

    /**
     * Sets the pattern layer from a custom mask
     * @param {EveCustomMask} [customMask]
     */
    SetFromCustomMask(customMask)
    {
        if (!customMask)
        {
            this.Empty();
            return;
        }

        this.isTargetMtl1 = !!customMask.targetMaterials[0];
        this.isTargetMtl2 = !!customMask.targetMaterials[1];
        this.isTargetMtl3 = !!customMask.targetMaterials[2];
        this.isTargetMtl4 = !!customMask.targetMaterials[3];
        this.materialSource = customMask.materialIndex;
        this.SetFromTexture(customMask.parameters.PatternMaskMap);
    }

    /**
     * Gets an address mode from a projection type
     * @param {Number} projectionType
     * @returns {Number}
     */
    static ToAddressMode(projectionType)
    {
        switch (projectionType)
        {
            case 2:
                return 4;

            case 1:
                return 3;

            default:
                return 1;
        }
    }

    /**
     * Gets a projection type from an address mode
     * @param {Number} addressMode
     * @returns {Number}
     */
    static FromAddressMode(addressMode)
    {
        switch (addressMode)
        {
            case 4:
                return 2;

            case 3:
                return 1;

            default:
                return 0;
        }
    }

    /**
     * Empty texture res file path
     * @type {string}
     */
    static EMPTY_TEXTURE_RES_FILE_PATH = "cdn:/texture/global/black.png";

}
