import { emptyObject, meta } from "utils";
import { Tw2BinaryReader } from "../reader";
import { ErrResourceFormatUnsupported, Tw2Resource } from "./Tw2Resource";
import { Tw2Shader, Tw2ShaderPermutation } from "../shader";
import { Tw2Error } from "../Tw2Error";
import { resMan } from "global";


@meta.type("Tw2EffectRes")
export class Tw2EffectRes extends Tw2Resource
{

    passes = [];
    annotations = {};
    permutations = [];
    offsets = [];
    reader = null;
    version = 0;
    stringTable = "";
    shaders = [];

    ReadString = null;
    validShadowShader = false;

    _extension = null;
    _requestResponseType = null;


    /**
     * Prepares ccp binary
     * @param {ArrayBuffer} data
     */
    PrepareFX(data)
    {
        const reader = this.reader = new Tw2BinaryReader(new Uint8Array(data));

        const version = reader.ReadUInt32();
        if (version < 2 || version > 8)
        {
            this.OnError(new ErrShaderVersion({ path: this.path, version }));
            return;
        }

        /**
         * ReadString
         * @returns {String}
         */
        this.ReadString = function()
        {
            const offset = reader.ReadUInt32();
            let end = offset;
            while (stringTable.charCodeAt(end))
            {
                ++end;
            }
            return stringTable.substr(offset, end - offset);
        };

        let headerSize,
            stringTableSize,
            stringTable;

        if (version < 5)
        {
            headerSize = reader.ReadUInt32();
            if (headerSize === 0)
            {
                this.OnError(new ErrShaderHeaderSize({ path: this.path }));
                return;
            }

            /* let permutation = */
            reader.ReadUInt32();
            const offset = reader.ReadUInt32();
            reader.cursor = 2 * 4 + headerSize * 3 * 4;
            stringTableSize = reader.ReadUInt32();
            this.stringTableOffset = reader.cursor;
            stringTable = String.fromCharCode.apply(null, reader.data.subarray(reader.cursor, reader.cursor + stringTableSize));
            reader.cursor = offset;
        }
        else
        {
            stringTableSize = reader.ReadUInt32();
            this.stringTableOffset = reader.cursor;
            stringTable = String.fromCharCode.apply(null, reader.data.subarray(reader.cursor, reader.cursor + stringTableSize));
            reader.cursor += stringTableSize;

            const permutationCount = reader.ReadUInt8();
            for (let perm = 0; perm < permutationCount; ++perm)
            {
                const permutation = Tw2ShaderPermutation.fromCCPBinary(reader, this);
                this.permutations.push(permutation);
            }

            headerSize = reader.ReadUInt32();
            if (headerSize === 0)
            {
                this.OnError(new ErrShaderHeaderSize({ path: this.path }));
                return;
            }

            for (let i = 0; i < headerSize; ++i)
            {
                this.offsets.push({
                    index: reader.ReadUInt32(),
                    offset: reader.ReadUInt32(),
                    size: reader.ReadUInt32()
                });
            }

            reader.ReadUInt32();
            reader.cursor = reader.ReadUInt32();
        }

        this.reader = reader;
        this.version = version;
        this.stringTable = stringTable;
    }

    /**
     * Gets shader from ccp binary
     * @param {Object} options
     * @return {Tw2Shader}
     */
    GetShaderFX(options)
    {
        let index = 0;
        let multiplier = 1;

        for (let i = 0; i < this.permutations.length; ++i)
        {
            let permutation = this.permutations[i];
            let value = permutation.defaultOption;

            if (options.hasOwnProperty(permutation.name))
            {
                try
                {
                    value = permutation.GetOption(value);
                }
                catch(err)
                {
                    this.OnError(err);
                    return null;
                }
            }

            index += value * multiplier;
            multiplier *= permutation.optionCount;
        }

        if (this.shaders.hasOwnProperty(index))
        {
            return this.shaders[index];
        }

        if (this.version > 4)
        {
            this.reader.cursor = this.offsets[index].offset;
        }

        let shader = null;
        try
        {
            shader = Tw2Shader.fromCCPBinary(this.reader, this);
        }
        catch (error)
        {
            this.OnError(error);
            return null;
        }

        return this.shaders[index] = shader;
    }

    /**
     * Prepares json shader format
     * @param {Object} data
     */
    PrepareJSON(data)
    {
        this.reader = data;
    }

    /**
     * Gets shader from json
     * @param {Object} options
     * @return {Tw2Shader}
     */
    GetShaderJSON(options)
    {
        if (!this.shaders[0])
        {
            this.shaders[0] = Tw2Shader.fromJSON(this.reader, this);
            this.reader = null;
        }
        return this.shaders[0];
    }

    /**
     * Prepares the effect
     * - Creates Shaders
     * - Sets shadow states for shaders
     * - Parses Jessica shader annotations
     * @param {ArrayBuffer|Object} data
     */
    Prepare(data)
    {
        this.permutations.splice(0);
        this.offsets.splice(0);
        this.passes.splice(0);
        emptyObject(this.annotations);
        this.reader = null;
        this.version = 0;
        this.stringTable = "";
        this.shaders.splice(0);

        switch(this._extension)
        {
            case "fx":
            case "sm_hi":
            case "sm_lo":
            case "sm_depth":
                this.PrepareFX(data);
                break;

            case "sm_json":
                this.PrepareJSON(data);
                break;

            default:
                throw new ErrResourceFormatUnsupported({ format: this._extension });
        }

        this.OnPrepared();
    }

    /**
     * Gets/creates a shader for the given permutation options
     * @param {Object.<string, string>} options - Permutation options
     * @returns {Tw2Shader|null}
     */
    GetShader(options)
    {
        if (!this.IsGood())
        {
            return null;
        }

        switch(this._extension)
        {
            case "fx":
            case "sm_hi":
            case "sm_lo":
            case "sm_depth":
                return this.GetShaderFX(options);

            case "sm_json":
                return this.GetShaderJSON(options);

            default:
                throw new ErrResourceFormatUnsupported({ format: this._extension });
        }
    }

    /**
     * Custom load handler
     * @param {String} path
     * @param {String} extension
     */
    DoCustomLoad(path, extension)
    {
        this._extension = null;

        switch(extension)
        {
            case "fx":
            case "sm_hi":
            case "sm_lo":
            case "sm_depth":
                this._requestResponseType = "arraybuffer";
                this._extension = extension;
                return;

            case "sm_json":
                this._requestResponseType = "json";
                this._extension = extension;
                return;

            default:
                throw new ErrResourceFormatUnsupported({ format: this._extension });
        }
    }

    /**
     * Creates an effect res from json
     * @param {Object} data
     * @return {Tw2EffectRes}
     */
    static fromJSON(data)
    {
        if (!data.name) throw new ReferenceError("Invalid shader name");

        const
            res = new Tw2EffectRes(),
            name = "manual:/" + data.name + ".sm_json";

        res.path = name.toLowerCase();
        res._extension = "sm_json";
        res.doNotPurge = 1;
        res.Prepare(data);

        // Add so it can be loaded from elsewhere
        resMan.motherLode.Add(res.path, res);
        return res;
    }
}


/**
 * Throws when an effect has an invalid shader version
 */
export class ErrShaderVersion extends Tw2Error
{
    constructor(data)
    {
        super(data, "Invalid version of effect file (%version%)");
    }
}


/**
 * Throws when an effect has no header
 */
export class ErrShaderHeaderSize extends Tw2Error
{
    constructor(data)
    {
        super(data, "Effect file contains no compiled effects");
    }
}

