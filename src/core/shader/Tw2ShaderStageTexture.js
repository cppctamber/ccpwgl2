import { getKeyFromValue, meta } from "utils";


@meta.type("Tw2ShaderStageTexture")
export class Tw2ShaderStageTexture
{

    @meta.string
    name = "";

    @meta.uint
    isAutoregister = 0;

    @meta.uint
    isSRGB = 0;

    @meta.uint
    registerIndex = 0;

    @meta.uint
    type = 0;

    /**
     * Gets the textures type as a string
     * @return {string}
     */
    get string()
    {
        const type = getKeyFromValue(Tw2ShaderStageTexture.Type, this.type);
        return type ? type : "UNKNOWN";
    }

    /**
     *
     * TODO: Replace with utility functions
     * @param {Object} json
     * @param {Tw2EffectRes} context
     * @return {Tw2ShaderStageTexture}
     */
    static fromJSON(json, context)
    {
        const { registerIndex, name, type=Tw2ShaderStageTexture.TEXTURE_2D, isSRGB=0, isAutoregister=0 } = json;

        if (!name || registerIndex === undefined)
        {
            throw new ReferenceError("Invalid shader texture definition");
        }

        const texture = new Tw2ShaderStageTexture();
        texture.name = name;
        texture.registerIndex = registerIndex;
        texture.type = type;
        texture.isSRGB = isSRGB;
        texture.isAutoregister = isAutoregister;
        return texture;
    }

    /**
     * Reads ccp shader texture binary
     * @param {Tw2BinaryReader} reader
     * @param {Tw2EffectRes}  context
     * @return {Tw2ShaderStageTexture}
     */
    static fromCCPBinary(reader, context)
    {
        const texture = new Tw2ShaderStageTexture();
        texture.registerIndex = reader.ReadUInt8();
        texture.name = context.ReadString();
        texture.type = reader.ReadUInt8();
        texture.isSRGB = reader.ReadUInt8();
        texture.isAutoregister = reader.ReadUInt8();
        return texture;
    }

    /**
     * Texture types
     * @type {*}
     */
    static Type = {
        UNKNOWN_0: 0,
        UNKNOWN_1: 1,
        TEXTURE_2D: 2,
        VOLUME: 3,
        CUBE_MAP: 4,
        PROJECTION: 5, // ??
    };

}

