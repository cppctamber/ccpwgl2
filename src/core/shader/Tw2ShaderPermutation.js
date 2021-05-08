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

    @meta.array
    options = [];

    @meta.uint
    optionCount = 0;


    /**
     * Gets the permutation's type as a string
     * @return {string}
     */
    get string()
    {
        const name = getKeyFromValue(Tw2ShaderPermutation.Type, this.type);
        return name ? name : "INVALID";
    }

    /**
     * Checks
     * @param name
     * @return {boolean}
     */
    HasOption(name)
    {
        return this.options.indexOf(name.toUpperCase()) !== -1;
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
            return this.options.indexOf(name);
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
            permutation.options[i] = context.ReadString();
        }

        return permutation;
    }

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

