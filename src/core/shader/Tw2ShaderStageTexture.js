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
        return type ? type : "INVALID";
    }

    /**
     * Reads ccp shader texture binary
     * @param {Tw2BinaryReader} reader
     * @param {Tw2EffectRes}  res
     * @return {Tw2ShaderStageTexture}
     */
    static fromCCPBinary(reader, res)
    {
        const texture = new Tw2ShaderStageTexture();
        texture.registerIndex = reader.ReadUInt8();
        texture.name = res.ReadString();
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
        UNKNOWN_1: 0,
        UNKNOWN_2: 0,
        VOLUME: 3,
        CUBE_MAP: 4
    };

}

