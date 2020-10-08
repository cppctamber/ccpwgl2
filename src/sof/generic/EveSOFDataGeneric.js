import { Tw2Error } from "core";
import { meta, util } from "global";


@meta.ctor("EveSOFDataGeneric", true)
export class EveSOFDataGeneric
{

    @meta.path
    areaShaderLocation = "";

    @meta.list("EveSOFDataGenericShader")
    areaShaders = [];

    @meta.raw("EveSOFDataGenericShader")
    bannerShader = null;

    @meta.struct("EveSOFDataGenericDamage")
    damage = null;

    @meta.path
    decalShaderLocation = "";

    @meta.list("EveSOFDataGenericDecalShader")
    decalShaders = [];

    @meta.struct("EveSOFDataAreaMaterial")
    genericWreckMaterial = null;

    @meta.struct("EveSOFDataGenericHullDamage")
    hullDamage = null;

    @meta.list("EveSOFDataGenericString")
    materialPrefixes = [];

    @meta.list("EveSOFDataGenericString")
    patternMaterialPrefixes = [];

    @meta.path
    resPathDefaultAlliance = "";

    @meta.path
    resPathDefaultCeo = "";

    @meta.path
    resPathDefaultCorp = "";

    @meta.string
    shaderPrefixAnimated = "";

    @meta.struct("EveSOFDataGenericSwarm")
    swarm = null;

    @meta.list("EveSOFDataGenericVariant")
    variants = [];

    @meta.list("EveSOFDataGenericString")
    visibilityGroups = [];

    /**
     * Initializer
     */
    Initialize()
    {
        if (this.bannerShader)
        {
            // No banner.fx for gles effects
            this.bannerShader.shader = "cdn:/graphics/effect/managed/space/spaceobject/v5/fx/banner/unpacked_fxbannerv5.fx";
            // TODO: Figure out default parameters and textures for unpacked banner shader
        }
    }

    /**
     * Gets a shader's configuration object
     * @param {String} name
     * @param {Boolean} isAnimated
     * @param {Object} [provided]
     * @returns {{effectFilePath: *, textures: *, parameters: *}}
     */
    GetShaderConfig(name, isAnimated, provided)
    {
        const
            isDecal = this.HasDecalShader(name),
            shader = isDecal ? this.GetDecalShader(name) : this.GetAreaShader(name),
            effectFilePath = isDecal ?
                this.GetDecalShaderPath(name, isAnimated) :
                this.GetAreaShaderPath(name, isAnimated);

        return {
            effectFilePath,
            hasPatternMaskMaps: !!shader.hasPatternMaskMaps,
            parameters: shader.AssignParameters({}, provided ? provided.parameters : undefined),
            textures: shader.AssignParameters({}, provided ? provided.textures : undefined)
        };

    }

    /**
     * Gets a shader's prefix
     * @param {Boolean} [isAnimated]
     * @returns {String}
     */
    GetShaderPrefix(isAnimated)
    {
        return isAnimated ? this.shaderPrefixAnimated : "";
    }

    /**
     * Gets a shader's full path
     * @param {String} shader
     * @param {Boolean} [isAnimated]
     * @returns {string}
     */
    GetShaderPath(shader, isAnimated)
    {
        const prefix = this.GetShaderPrefix(isAnimated);
        if (shader.charAt(0) !== "/") shader = "/" + shader;
        const index = shader.lastIndexOf("/");
        return shader.substring(0, index + 1) + prefix + shader.substring(index + 1);
    }

    /**
     * Gets an area shader's path
     * @param shader
     * @param isAnimated
     * @returns {string}
     */
    GetAreaShaderPath(shader, isAnimated)
    {
        return this.areaShaderLocation + this.GetShaderPath(shader, isAnimated);
    }

    /**
     * Gets a decal shader's path
     * @param shader
     * @param isAnimated
     * @returns {string}
     */
    GetDecalShaderPath(shader, isAnimated)
    {
        return this.decalShaderLocation + this.GetShaderPath(shader, isAnimated);
    }

    /**
     * Checks if an area shader exists
     * @param {String} name
     * @returns {boolean}
     */
    HasAreaShader(name)
    {
        return !!util.findElementByPropertyValue(this.areaShaders, "shader", name);
    }

    /**
     * Gets area shader by it's short name
     * @param {String} name
     * @returns {null|EveSOFDataGenericShader}
     */
    GetAreaShader(name)
    {
        return util.findElementByPropertyValue(this.areaShaders, "shader", name, ErrSOFAreaShaderNotFound);
    }

    /**
     * Checks if a decal shader exists
     * @param {String} name
     * @returns {boolean}
     */
    HasDecalShader(name)
    {
        return !!util.findElementByPropertyValue(this.decalShaders, "shader", name);
    }

    /**
     * Gets a decal shader by it's short name
     * @param {String} name
     * @returns {null|EveSOFDataGenericShader}
     */
    GetDecalShader(name)
    {
        return util.findElementByPropertyValue(this.decalShaders, "shader", name, ErrSOFDecalShaderNotFound);
    }

    /**
     * Gets material prefixes
     * @returns {Array<String>}
     */
    GetMaterialPrefixes()
    {
        const out = [];
        for (let i = 0; i < this.materialPrefixes.length; i++)
        {
            out.push(this.materialPrefixes[i].str);
        }
        return out;
    }

    /**
     * Gets pattern material prefixes
     * @returns {Array<String>}
     */
    GetPatternMaterialPrefixes()
    {
        const out = [];
        for (let i = 0; i < this.patternMaterialPrefixes.length; i++)
        {
            out.push(this.patternMaterialPrefixes[i].str);
        }
        return out;
    }

    /**
     * Gets a material prefix by it's index
     * @param {Number} index
     * @returns {String}
     */
    GetMaterialPrefix(index)
    {
        let offByOne = index - 1;
        if (this.materialPrefixes[offByOne] === undefined)
        {
            throw new ErrSOFMaterialPrefixNotFound({ index });
        }
        return this.materialPrefixes[offByOne].str;
    }

    /**
     * Gets a pattern material prefix by it's index
     * @param {Number} index
     * @returns {String}
     */
    GetPatternMaterialPrefix(index)
    {
        let offByOne = index - 1;
        if (this.patternMaterialPrefixes[offByOne] === undefined)
        {
            throw new ErrSOFPatternMaterialPrefixNotFound({ index });
        }
        return this.patternMaterialPrefixes[offByOne].str;
    }

}

/**
 * Fires when a sof area shader is not found
 */
export class ErrSOFAreaShaderNotFound extends Tw2Error
{
    constructor(data)
    {
        super(data, "SOF Area shader not found (%name%)");
    }
}

/**
 * Fires when a sof decal shader is not found
 */
export class ErrSOFDecalShaderNotFound extends Tw2Error
{
    constructor(data)
    {
        super(data, "SOF Decal area shader not found (%name%)");
    }
}

/**
 * Fires when a sof material prefix is not found
 */
export class ErrSOFMaterialPrefixNotFound extends Tw2Error
{
    constructor(data)
    {
        super(data, "SOF Material prefix index not found (%index%)");
    }
}

/**
 * Fires when a sof pattern material prefix is not found
 */
export class ErrSOFPatternMaterialPrefixNotFound extends Tw2Error
{
    constructor(data)
    {
        super(data, "SOF Pattern material prefix index not found (%index%)");
    }
}
