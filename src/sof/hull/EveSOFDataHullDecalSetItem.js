import { meta, isArray } from "utils";
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
@meta.define({
    wgl: "EveSOFDataHullDecalSetItem",
    ccp: true
})
export class EveSOFDataHullDecalSetItem extends meta.Model
{

    @meta.string
    name = "";

    @meta.int32
    boneIndex = -1;

    @meta.list()
    indexBuffers = [];

    @meta.list("EveSOFDataMultiHullDecalIndexBuffers")
    multiHullIndexBuffers = [];

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
        const getIndexBuffer = value =>
        {
            if (!value) return null;
            if (isArray(value) || ArrayBuffer.isView(value)) return value;
            if (isArray(value.indexBuffer) || ArrayBuffer.isView(value.indexBuffer)) return value.indexBuffer;
            if (isArray(value.indexes) || ArrayBuffer.isView(value.indexes)) return value.indexes;
            return null;
        };

        const getIndexBuffersFromList = values =>
        {
            const out = [];
            for (let i = 0; i < values.length; i++)
            {
                const buffer = getIndexBuffer(values[i]);
                if (buffer) out.push(buffer);
            }
            return out;
        };

        // Provide backwards compatibility for older SOF
        if (this.indexBuffer)
        {
            return [ this.indexBuffer ];
        }
        else if (this.indexBuffers && this.indexBuffers.length)
        {
            return getIndexBuffersFromList(this.indexBuffers);
        }
        else if (this.multiHullIndexBuffers && this.multiHullIndexBuffers.length)
        {
            const indexBuffers = [];
            for (let i = 0; i < this.multiHullIndexBuffers.length; i++)
            {
                const multiHullItem = this.multiHullIndexBuffers[i];
                if (isArray(multiHullItem) || ArrayBuffer.isView(multiHullItem))
                {
                    indexBuffers.push(multiHullItem);
                    continue;
                }
                if (multiHullItem && multiHullItem.indexBuffers && multiHullItem.indexBuffers.length)
                {
                    indexBuffers.push(...getIndexBuffersFromList(multiHullItem.indexBuffers));
                    continue;
                }
                const buffer = getIndexBuffer(multiHullItem);
                if (buffer) indexBuffers.push(buffer);
            }
            return indexBuffers;
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
     * Gets the sampler overrides for this item's usage, keyed by sampler name
     * ("<TextureName>Sampler"), for Tw2Effect.SetSamplerOverrides. Decal
     * textures are projected onto the hull, so sampling outside [0,1] must
     * clamp; the shipped samplers default to wrap. Usage-specific settings
     * (OverridesByUsage, e.g. killmark repeat) win over the clamp default.
     * Overrides for samplers the resolved shader doesn't declare are pruned
     * by the effect's next clean pass, so a superset here is harmless.
     * @param {Array<String>} [textureNames] - texture names from the effect config
     * @returns {Object}
     */
    GetSamplerOverrides(textureNames = [])
    {
        const names = new Set(EveSOFDataHullDecalSetItem.DecalTextureNames);
        textureNames.forEach(name =>
        {
            if (name.indexOf("Decal") === 0) names.add(name);
        });

        const out = {};
        names.forEach(name =>
        {
            // Border clamp (transparent border kills the decal outside its
            // projected square), matching the legacy manual shaders'
            // clampToBorder; falls back to edge without
            // EXT_texture_border_clamp. The hole map and interior cube sample
            // inside the decal only, and use edge like the legacy definitions.
            const mode = EveSOFDataHullDecalSetItem.EdgeClampTextureNames.includes(name)
                ? WrapMode.CLAMP_TO_EDGE
                : WrapMode.CLAMP_TO_BORDER;

            out[`${name}Sampler`] = {
                addressUMode: mode,
                addressVMode: mode,
                addressWMode: mode
            };
        });

        const byUsage = EveSOFDataHullDecalSetItem.OverridesByUsage[this.usage];
        if (byUsage)
        {
            for (const name in byUsage)
            {
                if (byUsage.hasOwnProperty(name))
                {
                    out[`${name}Sampler`] = Object.assign(out[`${name}Sampler`] || {}, byUsage[name]);
                }
            }
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
     * Decal texture names across the decal shader family, used as the
     * clamp-to-edge default set in GetSamplerOverrides
     * @type {Array<String>}
     */
    static DecalTextureNames = [
        "DecalAtMap",
        "DecalAlbedoMap",
        "DecalFresnelMap",
        "DecalGlowMap",
        "DecalHoleMap",
        "DecalInsideCubeMap",
        "DecalNormalMap",
        "DecalRoughnessMap",
        "DecalTransparencyMap"
    ];

    /**
     * Decal textures that clamp to edge rather than border, per the legacy
     * manual shader definitions
     * @type {Array<String>}
     */
    static EdgeClampTextureNames = [
        "DecalHoleMap",
        "DecalInsideCubeMap"
    ];

    /**
     * Usage-specific sampler settings, keyed by texture name; these win over
     * the clamp-to-edge default in GetSamplerOverrides
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
