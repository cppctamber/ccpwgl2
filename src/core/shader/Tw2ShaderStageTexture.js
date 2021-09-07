import { assignIfExists, meta } from "utils";
import { TEX_VOLUME, TexTypeToString, TexTypeToGLTexture } from "constant/d3d";


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
    registerIndex = -1;

    @meta.uint
    type = -1;

    /**
     * Gets the texture's gl texture type
     * @return {number}
     */
    get glType()
    {
        return this.type in TexTypeToGLTexture ? TexTypeToGLTexture[this.type] : 0;
    }

    /**
     * Identifies if the texture is a volume
     * @return {boolean}
     */
    get isVolume()
    {
        return this.type === TEX_VOLUME;
    }

    /**
     * Gets the textures type as a string
     * @return {string}
     */
    get string()
    {
        return this.type in TexTypeToString ? TexTypeToString[this.type] : "UNKNOWN";
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
        const texture = new Tw2ShaderStageTexture();
        assignIfExists(texture, json, [ "name", "registerIndex", "type", "isSRGB", "isAutoregister" ]);
        if (texture.registerIndex === -1 || texture.glType === 0)
        {
            throw new ReferenceError("Invalid shader texture definition");
        }
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

}

