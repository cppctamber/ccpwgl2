import { Tw2Error } from "core";
import { meta, util } from "global";


@meta.type("EveSOFDataGeneric", true)
export class EveSOFDataGeneric
{

    @meta.black.path
    areaShaderLocation = "";

    @meta.black.listOf("EveSOFDataGenericShader")
    areaShaders = [];

    @meta.black.rawOf("EveSOFDataGenericShader")
    bannerShader = null;

    @meta.black.objectOf("EveSOFDataGenericDamage")
    damage = null;

    @meta.black.path
    decalShaderLocation = "";

    @meta.black.listOf("EveSOFDataGenericDecalShader")
    decalShaders = [];

    @meta.black.objectOf("EveSOFDataAreaMaterial")
    genericWreckMaterial = null;

    @meta.black.objectOf("EveSOFDataGenericHullDamage")
    hullDamage = null;

    @meta.black.listOf("EveSOFDataGenericString")
    materialPrefixes = [];

    @meta.black.listOf("EveSOFDataGenericString")
    patternMaterialPrefixes = [];

    @meta.black.path
    resPathDefaultAlliance = "";

    @meta.black.path
    resPathDefaultCeo = "";

    @meta.black.path
    resPathDefaultCorp = "";

    @meta.black.string
    shaderPrefixAnimated = "";

    @meta.black.objectOf("EveSOFDataGenericSwarm")
    swarm = null;

    @meta.black.listOf("EveSOFDataGenericVariant")
    variants = [];

    @meta.black.listOf("EveSOFDataGenericString")
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
            // TODO: Figure out default parameters and textures
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
        if (this.HasDecalShader(name))
        {
            const
                shader = this.GetDecalShader(name),
                effectFilePath = this.GetDecalShaderPath(name, isAnimated);

            return shader.Assign({ effectFilePath }, provided);
        }

        const
            shader = this.GetAreaShader(name),
            effectFilePath = this.GetAreaShaderPath(name, isAnimated);

        return shader.Assign({ effectFilePath, hasPatternMaskMaps: shader.HasPatternMaskMaps() }, provided);
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
        super(data, "SOF Area shader not found: %name%");
    }
}

/**
 * Fires when a sof decal shader is not found
 */
export class ErrSOFDecalShaderNotFound extends Tw2Error
{
    constructor(data)
    {
        super(data, "SOF Decal area shader not found: %name%");
    }
}

/**
 * Fires when a sof material prefix is not found
 */
export class ErrSOFMaterialPrefixNotFound extends Tw2Error
{
    constructor(data)
    {
        super(data, "SOF Material prefix index not found: %index%");
    }
}

/**
 * Fires when a sof pattern material prefix is not found
 */
export class ErrSOFPatternMaterialPrefixNotFound extends Tw2Error
{
    constructor(data)
    {
        super(data, "SOF Pattern material prefix index not found: %index%");
    }
}
