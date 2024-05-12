import { meta } from "utils";
import { quat, vec3 } from "math";
import { Tw2Error } from "core";
import { FilterMode, MipFilterMode, WrapMode } from "constant";

/**
 * Decal usages
 * @type {Object}
 */
const Usage = {
    STANDARD: 0,
    KILLMARK: 1,
    HOLE: 2,
    CYLINDRICAL: 3,
    GLOW_CYLINDRICAL: 4,
    GLOW: 5,
    LOGO: 6
};


@meta.type("EveSOFDataHullDecalSetItem")
export class EveSOFDataHullDecalSetItem extends meta.Model
{

    @meta.string
    name = "";

    @meta.uint
    boneIndex = -1;

    @meta.list()
    indexBuffers = [];

    @meta.uint
    glowColorType = 0;

    @meta.uint
    logoType = 0;

    @meta.uint
    meshIndex = 0;

    @meta.list("EveSOFDataParameter")
    parameters = [];

    @meta.vector3
    position = vec3.create();

    @meta.quaternion
    rotation = quat.create();

    @meta.vector3
    scaling = vec3.fromValues(1, 1, 1);

    @meta.list("EveSOFDataTexture")
    textures = [];

    @meta.uint
    usage = 0;

    @meta.string
    visibilityGroup = "";

    // Backwards compatibility with old sofs
    @meta.uint16Array
    indexBuffer = null;

    /**
     * Gets the decals index buffer array
     * @returns {Array}
     */
    GetIndexBuffers()
    {
        // Provide backwards compatibility for older SOF
        if (this.indexBuffer)
        {
            return [ this.indexBuffer ];
        }
        else if (this.indexBuffers)
        {
            return this.indexBuffers.map(x => x.indexBuffer);
        }
        // Throw an error?
        return null;
    }

    /**
     * Assigns the object's textures and parameters to an effect config
     * @param {Object} config={}]
     * @returns {Object} config
     */
    Assign(config = {})
    {
        config.textures = this.AssignTextures(config.textures);
        config.parameters = this.AssignParameters(config.parameters);
        return config;
    }

    /**
     * Assigns parameters to an object
     * @param {Object} [out={}]
     */
    AssignParameters(out = {})
    {
        for (let i = 0; i < this.parameters.length; i++)
        {
            this.parameters[i].Assign(out);
        }
        return out;
    }

    /**
     * Assigns parameters to an object
     * @param {Object} [out={}]
     */
    AssignTextures(out = {})
    {
        for (let i = 0; i < this.textures.length; i++)
        {
            this.textures[i].Assign(out);
        }
        return out;
    }

    /**
     * Gets a decal type by usage
     * @param {Number} usage
     * @returns {String}
     */
    static getDecalNameByUsage(usage)
    {
        for (const key in this.Usage)
        {
            if (this.constructor[key] === usage) return key;
        }
        throw new ErrSOFDecalTypeInvalid({ usage });
    }

    /**
     * Gets the shader by decal type
     * @param {Number} type
     * @returns {String}
     */
    static getShaderByUsage(type)
    {
        this.getDecalNameByUsage(type);
        return this.ShaderByUsage[type];
    }

    /**
     * Decal usage types
     * @type {Object<String:Number>}
     */
    static Usage = Usage;

    /**
     * Overrides by usage
     * @type {Object}
     */
    static OverridesByUsage = {
        [Usage.KILLMARK] : {
            DecalAtMap : {
                addressUMode: WrapMode.REPEAT,
                addressVMode: WrapMode.REPEAT,
                filterMode: FilterMode.LINEAR,
                mipFilterMode: MipFilterMode.NONE
            }
        },
        [Usage.GLOW] : {
            DecalAtMap : {
                addressUMode: WrapMode.CLAMP_TO_EDGE,
                addressVMode: WrapMode.CLAMP_TO_EDGE,
                filterMode: FilterMode.LINEAR,
                mipFilterMode: MipFilterMode.NONE
            }
        }
    }

    /**
     * Shaders by usage
     * @type {Object}
     */
    static ShaderByUsage = {
        [Usage.STANDARD]: "decalv5.fx",
        [Usage.KILLMARK]: "decalcounterv5.fx",
        [Usage.HOLE]: "decalholev5.fx",
        [Usage.CYLINDRICAL]: "decalcylindricv5.fx",
        [Usage.GLOW_CYLINDRICAL]: "decalglowcylindricv5.fx",
        [Usage.GLOW]: "decalglowv5.fx",
        [Usage.LOGO]: "decalv5.fx"
    }

}

/**
 * Fires when an invalid decal type is provided
 */
export class ErrSOFDecalTypeInvalid extends Tw2Error
{
    constructor(data)
    {
        super(data, "SOF decal usage not found (%usage%)");
    }
}