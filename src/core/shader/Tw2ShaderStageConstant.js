import { assignIfExists, getKeyFromValue, isArray, isNumber, isVector, meta, toArray } from "utils";


@meta.type("Tw2ShaderStageConstant")
export class Tw2ShaderStageConstant
{

    @meta.string
    name = "";

    @meta.uint
    dimension = 1;

    @meta.uint
    elements = 0;

    @meta.uint
    isAutoregister = 0;

    @meta.boolean
    @meta.todo("Why is this here?")
    isSRGB = false;

    @meta.uint
    offset = 0;

    @meta.uint
    size = 0;

    @meta.uint
    type = 0;

    @meta.vector
    @meta.alias("value")
    defaults = [];

    _autoOffset = false;


    /**
     * Gets the constant's type as a string
     * @returns {String}
     */
    get string()
    {
        const name = getKeyFromValue(Tw2ShaderStageConstant.Type, this.type);
        return name !== undefined ? name : "UNKNOWN";
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
            dimension=null,
            elements=1,
            isAutoRegister=0,
            isSRGB=0,
            offset=null,
            size=null,
            type=Tw2ShaderStageConstant.Type.PARAMETER,
            value=[] // Will default to 0 for all values if not defined
        } = json;

        // Convert numbers to array
        value = toArray(value);

        // Guess size
        if (size === null)
        {
            if (dimension)
            {
                size = dimension * elements;
            }
            // How to know how many dimensions?
            else if (value.length)
            {
                size = value.length;
            }
        }

        if (!name || (dimension === null && size === null))
        {
            throw new ReferenceError("Invalid shader constant definition: invalid inputs");
        }

        const constant = new Tw2ShaderStageConstant();
        constant.name = name;
        constant.isAutoregister = isAutoRegister;
        constant.elements = elements;
        constant.type = type;
        constant.isSRGB = isSRGB;
        constant.size = size;

        // Set default values
        for (let i = 0; i < constant.size; i++)
        {
            constant.defaults[i] = value[i] !== undefined ? value[i] : 0;
        }

        if (offset === null)
        {
            if (!Tw2ShaderStageConstant.IgnoreOffset.includes(constant.name))
            {
                constant._autoOffset = json.offset === undefined;
            }
            else
            {
                // We can guess these...
                throw new ReferenceError("Invalid shader constant definition: PER definitions must have an offset");
            }
        }
        else
        {
            constant.offset = offset;
        }

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
        PER: 3
    };
}
