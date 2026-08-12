import { emptyObject, meta } from "utils";
import { Tw2BinaryReader } from "../reader";
import { ErrResourceFormatUnsupported, Tw2Resource } from "./Tw2Resource";
import { Tw2Shader, Tw2ShaderPermutation } from "../shader";
import { Tw2Error } from "../Tw2Error";
import { device, tw2 } from "global";
import { CjsWebglFormat } from "@carbonenginejs/runtime-resource/formats/webgl";
import { Tw2Device } from "../engine/Tw2Device";
import { Tw2CarbonShaderFactory } from "./Tw2CarbonEffectReader";

const CHAR_CODE_CHUNK_SIZE = 0x8000;

/**
 * Converts bytes to a binary string without overflowing the JS argument stack.
 * @param {Uint8Array} bytes
 * @returns {string}
 */
function BytesToString(bytes)
{
    let out = "";
    for (let i = 0; i < bytes.length; i += CHAR_CODE_CHUNK_SIZE)
    {
        out += String.fromCharCode.apply(null, bytes.subarray(i, i + CHAR_CODE_CHUNK_SIZE));
    }
    return out;
}


@meta.type("Tw2EffectRes")
@meta.wgl.define("Tw2EffectRes")
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

    _carbon = null;
    _carbonFactory = null;

    /**
     * Checks whether effect bytes are a Carbon package (translated DX11
     * shaders). The first dword of the legacy WebGL binary is its version
     * (2..8); Carbon's "Carbon" magic reads as a value far above 8, which is the
     * agreed new-format discriminator.
     * @param {ArrayBuffer} data
     * @returns {boolean}
     */
    static IsCarbonData(data)
    {
        // The version dword, which is what Carbon itself branches on. This
        // replaced a four-byte magic sniff for the retired chunk format: that
        // format is gone, and it had claimed version 9 in CCP's namespace to
        // get itself read.
        //
        // 2-8 is the legacy gles2 range PrepareCCP owns. 15 is the current
        // Carbon container, whether it carries DXBC or already-translated
        // GLSL - the program slot differs, the container does not, which is
        // why the path and not the bytes decides how to prepare it.
        const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
        if (bytes.byteLength < 4) return false;

        const version = bytes[0] | (bytes[1] << 8) | (bytes[2] << 16) | (bytes[3] << 24);
        return version === 15;
    }


    /**
     * Prepares ccp binary
     * @param {ArrayBuffer} data
     */
    PrepareCCP(data)
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
            stringTable = BytesToString(reader.data.subarray(reader.cursor, reader.cursor + stringTableSize));
            reader.cursor = offset;
        }
        else
        {
            stringTableSize = reader.ReadUInt32();
            this.stringTableOffset = reader.cursor;
            stringTable = BytesToString(reader.data.subarray(reader.cursor, reader.cursor + stringTableSize));
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
    GetShaderCCP(options)
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
                    value = permutation.GetOption(options[permutation.name]);
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

        if (this.shaders[index])
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
     * TODO: Implement options
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
        this._carbon = null;
        this._carbonFactory = null;

        switch(this._extension)
        {
            case "carbon":
            case "fx":
            case "sm_hi":
            case "sm_lo":
            case "sm_depth":
                if (Tw2EffectRes.IsCarbonData(data))
                {
                    this.PrepareCarbon(data);
                }
                else
                {
                    this.PrepareCCP(data);
                }
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
     * Prepares a Carbon package (translated DX11 shaders)
     * @param {ArrayBuffer} data
     */
    PrepareCarbon(data)
    {
        try
        {
            const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);

            // The container is byte-identical across backends - only the
            // program slot differs - so the bytes cannot say whether this is a
            // dx11 source needing translation or an already-translated
            // artefact. The path is the discriminator, exactly as it is in
            // Carbon. `ToEffectPath` has already qualified it by now.
            const profile = Tw2Device.EffectProfileFromPath(this.path)
                || device.effectProfile;

            let container = bytes;
            let permutationGraph = null;

            if (profile === "effect.dx11")
            {
                // Translating at load is a build step running at runtime. It is
                // correct but not cheap; a pre-translated effect.webgl2 tree
                // takes the branch below and skips it entirely.
                // WebGL 2 has no structured buffers, so the local-light family
                // has to be lowered or the shader cannot bind its lights at
                // all. `packed-texture` folds LightIndexBuffer, LightBuffer and
                // LightProfileArray into one usampler2D, which is what keeps
                // the detail quad shaders inside the 16-unit sampler limit.
                // See /docs/contracts/webgl2-texture-budget.md.
                const built = CjsWebglFormat.buildEffect(bytes, {
                    source: this.path,
                    localLights: "packed-texture"
                });
                container = built.bytes;
                permutationGraph = built.permutationGraph;
            }
            else
            {
                throw new Error(
                    `Carbon effect profile '${profile}' cannot be prepared yet; `
                    + "only effect.dx11 sources are translated at load."
                );
            }

            this._carbon = { container, permutationGraph };
            this._carbonFactory = new Tw2CarbonShaderFactory(
                CjsWebglFormat.read(container),
                permutationGraph
            );
            this.permutations = this._carbonFactory.permutations;
            // Carbon's own version, not a number invented for this path. The
            // previous reader claimed 9 ("first post-v8 format") for a chunk
            // container, which asserted a Carbon generation that never existed.
            this.version = 15;
        }
        catch (err)
        {
            this.OnError(err);
        }
    }

    /**
     * Gets/creates a shader for Carbon packages
     * @param {Object.<string, string>} options - Permutation options
     * @returns {Tw2Shader|null}
     */
    GetShaderCarbon(options)
    {
        try
        {
            const index = this._carbonFactory.ResolvePermutationIndex(options);
            if (this.shaders[index])
            {
                return this.shaders[index];
            }
            return this.shaders[index] = this._carbonFactory.CreateShader(index, this.path);
        }
        catch (err)
        {
            this.OnError(err);
            return null;
        }
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
            case "carbon":
            case "fx":
            case "sm_hi":
            case "sm_lo":
            case "sm_depth":
                return this._carbonFactory ? this.GetShaderCarbon(options) : this.GetShaderCCP(options);

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
            case "carbon":
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
     * Creates an effect res from a manual shader's name
     * @param name
     * @returns {Tw2Resource}
     */
    static fromManual(name)
    {
        return this.fromJSON(tw2.shaders.GetShaderByName(name));
    }

    /**
     * Creates an effect res from json
     * @param {Object} json
     * @param {Object} [options]
     * @return {Tw2Resource}
     */
    static fromJSON(json, options)
    {
        if (!json.name) throw new ReferenceError("Invalid shader name");

        const name = "manual:/" + json.name + ".sm_json";
        if (tw2.resMan.motherLode.Has(name))
        {
            throw new ReferenceError("Shader already exists");
        }

        const res = new Tw2EffectRes();
        res.path = name.toLowerCase();
        res._extension = "sm_json";
        res.doNotPurge = 1;
        res.Prepare(json);

        // Add so it can be loaded from elsewhere
        tw2.AddResource(res.path, res);

        // Load the shader
        res.GetShaderJSON(options);

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

