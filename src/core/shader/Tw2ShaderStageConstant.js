import { getKeyFromValue, meta } from "utils";


@meta.type("Tw2ShaderStageConstant")
export class Tw2ShaderStageConstant
{

    @meta.string
    name = "";

    @meta.uint
    dimension = 0;

    @meta.uint
    elements = 0;

    @meta.uint
    isAutoregister = 0;

    @meta.boolean
    isSRGB = false;

    @meta.uint
    offset = 0;

    @meta.uint
    size = 0;

    @meta.uint
    type = 0;

    /**
     * Gets the constant's type as a string
     * @returns {String}
     */
    get string()
    {
        const name = getKeyFromValue(Tw2ShaderStageConstant.Type, this.type);
        return name !== undefined ? name : "INVALID";
    }

    /**
     * Reads ccp shader constant binary
     * @param {Tw2BinaryReader} reader
     * @param {Tw2EffectRes}  res
     * @return {Tw2ShaderStageConstant}
     */
    static fromCCPBinary(reader, res)
    {
        const constant = new Tw2ShaderStageConstant();
        constant.name = res.ReadString();
        constant.offset = reader.ReadUInt32() / 4;
        constant.size = reader.ReadUInt32() / 4;
        constant.type = reader.ReadUInt8();
        constant.dimension = reader.ReadUInt8();
        constant.elements = reader.ReadUInt32();
        constant.isSRGB = reader.ReadUInt8();
        constant.isAutoregister = reader.ReadUInt8();
        return constant;
    }

    /**
     * Constant names that are ignored
     * @type {String[]}
     */
    static IgnoreOffset = [
        "PerFrameVS",
        "PerObjectVS",
        "PerFramePS",
        "PerObjectPS"
    ];

    /**
     * Stage constant
     * @type {*}
     */
    static Type = {
        PARAMETER: 0,
        UNKNOWN_1: 1,
        UNKNOWN_2: 2,
        PER_FRAME: 3
    };
}
