import { getKeyFromValue, meta, toArray } from "utils";


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
    @meta.todo("Why is this here?")
    isSRGB = false;

    @meta.uint
    offset = -1;

    @meta.uint
    size = 0;

    @meta.uint
    type = 0;

    @meta.vector
    defaults = [];

    
    /**
     * Gets the constant's type as a string
     * @returns {String}
     */
    get string()
    {
        return getKeyFromValue(Tw2ShaderStageConstant.Type, this.type, "UNKNOWN");
    }

    /**
     *
     * TODO: Replace with utility functions
     * @param {Object} json
     * @param {Tw2EffectRes} context
     * @return {Tw2ShaderStageConstant}
     */
    static fromJSON(json, context)
    {
        let {
            name,
            dimension=0,
            elements=1,
            isAutoregister=0,
            isSRGB=0,
            offset=-1,
            size=0,
            type=Tw2ShaderStageConstant.Type.PARAMETER,
            value=[] // Will default to 0 for all values if not defined
        } = json;

        // Convert numbers to array
        value = toArray(value);
        //  Guess dimension
        if (value.length) dimension = value.length;
        // Guess size
        if (!size && dimension) size = dimension * elements;

        if (!name || !size)
        {
            throw new ReferenceError("Invalid shader constant definition: invalid inputs");
        }

        const constant = new Tw2ShaderStageConstant();
        constant.name = name;
        constant.isAutoregister = isAutoregister;
        constant.elements = elements;
        constant.type = type;
        constant.isSRGB = isSRGB;
        constant.size = size;

        //  Should be able to use the type for this
        const isIgnored = Tw2ShaderStageConstant.IgnoreOffset.includes(constant.name);

        // Set default values
        if (isIgnored)
        {
            constant.defaults = null;
        }
        else
        {
            for (let i = 0; i < constant.size; i++)
            {
                constant.defaults[i] = value[i] !== undefined ? value[i] : 0;
            }
        }

        constant.offset = offset;
        return constant;
    }

    /**
     * Reads ccp shader constant binary
     * @param {Tw2BinaryReader} reader
     * @param {Tw2EffectRes}  context
     * @return {Tw2ShaderStageConstant}
     */
    static fromCCPBinary(reader, context)
    {
        const constant = new Tw2ShaderStageConstant();
        constant.name = context.ReadString();
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
        "PerObjectPS",
        "PerObjectPSInt"
    ];

    /**
     * Stage constant
     * @type {*}
     */
    static Type = {
        PARAMETER: 0,
        UNKNOWN_1: 1,
        UNKNOWN_2: 2,
        PER: 3
    };
}
