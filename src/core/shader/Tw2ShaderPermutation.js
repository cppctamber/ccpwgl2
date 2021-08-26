import { getKeyFromValue, meta } from "utils";
import { Tw2Error } from "core/Tw2Error";


@meta.type("Tw2ShaderPermutation")
export class Tw2ShaderPermutation
{

    @meta.string
    name = "";

    @meta.uint
    defaultOption = 0;

    @meta.string
    description = "";

    @meta.uint
    type = Tw2ShaderPermutation.Type.INVALID;

    @meta.plain
    options = {};

    @meta.uint
    optionCount = 0;

    /**
     * Gets the permutation's type as a string
     * @return {string}
     */
    get string()
    {
        return getKeyFromValue(Tw2ShaderPermutation.Type, this.type, "INVALID");
    }

    /**
     * Checks
     * @param name
     * @return {boolean}
     */
    HasOption(name)
    {
        return name.toUpperCase() in this.options;
    }

    /**
     * Gets a permutation option's value
     * @param {String} name
     * @return {Number}
     */
    GetOption(name)
    {
        name = name.toUpperCase();

        if (this.HasOption(name))
        {
            return this.options[name];
        }

        throw new ErrShaderPermutationOptionInvalid({ name: this.name, option: name });
    }

    /**
     * Reads a ccp shader permutation binary
     * @param {Tw2BinaryReader} reader
     * @param {Tw2EffectRes} context
     * @return {Tw2ShaderPermutation}
     */
    static fromCCPBinary(reader, context)
    {
        const permutation = new Tw2ShaderPermutation();
        permutation.name = context.ReadString();
        permutation.defaultOption = reader.ReadUInt8();
        permutation.description = context.ReadString();
        permutation.type = reader.ReadUInt8();
        permutation.optionCount = reader.ReadUInt8();

        for (let i = 0; i < permutation.optionCount; i++)
        {
            permutation.options[context.ReadString()] = i;
        }

        return permutation;
    }

    /**
     * Permutation types
     * @type {Object}
     */
    static Type = {
        INVALID: -1,
        UNKNOWN_0: 0,
        UNKNOWN_1: 1,
        UNKNOWN_2: 2,
        UNKNOWN_3: 3,
        UNKNOWN_4: 4
    };

}


/**
 * Throws when a shader has an invalid permutation value
 */
export class ErrShaderPermutationOptionInvalid extends Tw2Error
{
    constructor(data)
    {
        super(data, "Invalid shader permutation option for %name% (%option%)");
    }
}

