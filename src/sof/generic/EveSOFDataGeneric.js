import { Tw2Error, Tw2Effect } from "core";
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

    /**
     * Creates an effect from a sof shader
     * @param {*|EveSOFDataGenericShader|EveSOFDataGenericDecalShader} shader
     * @param {Boolean} [isAnimated]
     * @param {*} [assignable]
     * @returns {Tw2Effect}
     */
    CreateEffect(shader, isAnimated, assignable)
    {
        const
            parameters = {},
            textures = {},
            overrides = {},
            effectFilePath = this.GetShaderPath(shader.shader || shader.effectFilePath, isAnimated);

        function assignObject(dest, src)
        {
            if (!src) return;
            // Sof object array
            if (util.isArray(src))
            {
                src.forEach(child => child.Assign(dest));
            }
            // Plain object
            else if (util.isPlain(src))
            {
                Object.assign(dest, src);
            }
        }

        assignObject(parameters, shader.defaultParameters);
        assignObject(textures, shader.defaultTextures);

        if (assignable)
        {
            assignObject(parameters, assignable.parameters);
            assignObject(textures, assignable.textures);
            assignObject(overrides, assignable.overrides);
        }

        return Tw2Effect.from({ effectFilePath, parameters, textures, overrides });
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
        if (shader.charAt(0) !== "/") shader += "/";
        const index = shader.lastIndexOf("/");
        return shader.substring(0, index + 1) + prefix + shader.substring(index + 1);
    }

    /**
     * Checks if an area shader exists
     * @param {String} name
     * @returns {boolean}
     */
    HasAreaShader(name)
    {
        return !!util.findElementByPropertyValue(this.areaShaders, "name", name);
    }

    /**
     * Gets area shader by it's short name
     * @param {String} name
     * @returns {null|EveSOFDataGenericShader}
     */
    GetAreaShader(name)
    {
        return util.findElementByPropertyValue(this.areaShaders, "name", name, ErrSOFAreaShaderNotFound);
    }

    /**
     * Checks if a decal shader exists
     * @param {String} name
     * @returns {boolean}
     */
    HasDecalShader(name)
    {
        return !!util.findElementByPropertyValue(this.decalShaders, "name", name);
    }

    /**
     * Gets a decal shader by it's short name
     * @param {String} name
     * @returns {null|EveSOFDataGenericShader}
     */
    GetDecalShader(name)
    {
        return util.findElementByPropertyValue(this.decalShaders, "name", name, ErrSOFDecalShaderNotFound);
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
