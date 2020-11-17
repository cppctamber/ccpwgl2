import { getKeyFromValue, isString, meta } from "utils";
import { Tw2VertexDeclaration, Tw2VertexElement } from "../vertex";
import { Tw2SamplerState } from "../sampler";
import { ErrShaderCompile, Tw2Shader } from "./Tw2Shader";
import { Tw2ShaderStageConstant } from "./Tw2ShaderStageConstant";
import { Tw2ShaderStageTexture } from "./Tw2ShaderStageTexture";
import { device } from "global/tw2";
import shaderOverrides from "./shaderOverrides";


@meta.type("Tw2ShaderStage")
export class Tw2ShaderStage
{

    @meta.uint
    constantSize = 0;

    @meta.vector
    constantValues = null;

    @meta.list("Tw2ShaderStageConstant")
    constants = [];

    @meta.struct("Tw2VertexDeclaration")
    inputDefinition = new Tw2VertexDeclaration();

    @meta.list("Tw2SamplerState")
    samplers = [];

    @meta.struct(WebGLShader)
    @meta.isPrivate
    shader = null;

    @meta.string
    shaderCode = "";

    @meta.struct("WebGLShader")
    @meta.isPrivate
    shadowShader = null;

    @meta.string
    shadowShaderCode = "";

    @meta.uint
    @meta.isPrivate
    type = Tw2ShaderStage.Type.INVALID;

    @meta.list("Tw2ShaderTexture")
    textures = [];

    /**
     * Gets the shader type as a string
     * @return {string}
     */
    get string()
    {
        const name = getKeyFromValue(Tw2ShaderStage, this.type);
        return name !== undefined ? name : "INVALID";
    }

    /**
     * Checks if a constant definition exist
     * @param {String} name
     * @return {boolean}
     */
    HasConstant(name)
    {
        for (let i = 0; i < this.constants.length; i++)
        {
            if (this.constants[i].name === name)
            {
                return true;
            }
        }
        return false;
    }

    /**
     * Checks if a texture definition exist
     * @param {String} name
     * @return {boolean}
     */
    HasTexture(name)
    {
        for (let i = 0; i < this.textures.length; i++)
        {
            if (this.textures[i].name === name)
            {
                return true;
            }
        }
        return false;
    }

    /**
     * Checks if a sampler state exists
     * @param {String} name
     * @return {boolean}
     */
    HasSampler(name)
    {
        for (let i = 0; i < this.samplers.length; i++)
        {
            if (this.samplers[i].name === name)
            {
                return true;
            }
        }
        return false;
    }

    /**
     *
     * TODO: Replace with utility functions
     * @param {Object} json
     * @param {Tw2EffectRes} context
     * @param {Number} [type]
     * @return {Tw2ShaderStage}
     */
    static fromJSON(json, context, type = Tw2ShaderStage.Type.INVALID)
    {
        const stage = new Tw2ShaderStage();
        stage.type = type;

        const { constants = [], textures = [], samplers = [], inputDefinitions = [], shader, shadowShader } = json;

        // Declarations
        for (let i = 0; i < inputDefinitions.length; i++)
        {
            stage.inputDefinition.elements.push(Tw2VertexElement.from(inputDefinitions[i]));
        }
        stage.inputDefinition.RebuildHash();

        // Debugging
        if (Tw2Shader.DEBUG_ENABLED)
        {
            stage.shaderCode = shader;
            stage.shadowShaderCode = shadowShader;
        }

        // Compile normal shader
        stage.shader = this.compileShader(stage.type, "", shader, context.path);

        // Compile shadow shader
        if (context.validShadowShader && shadowShader)
        {
            stage.shadowShader = this.compileShader(stage.type, "", shadowShader, context.path, true);
        }

        //  Setup constants - must be ordered
        // Todo: Enforce offset definition always? Then can use an object instead
        for (let i = 0; i < constants.length; i++)
        {
            const constant = Tw2ShaderStageConstant.fromJSON(constants[i], context);
            stage.constants.push(constant);

            if (!Tw2ShaderStageConstant.IgnoreOffset.includes(constant.name))
            {
                // Set defaults from here?
                if (constant._autoOffset) constant.offset = stage.constantSize;
                stage.constantSize = constant.offset + constant.size;
            }
        }

        // Set constant values (defaults)
        stage.constantValues = new Float32Array(stage.constantSize);
        for (let i = 0; i < stage.constants.length; i++)
        {
            const { name , defaults, offset } = stage.constants[i];
            if (!Tw2ShaderStageConstant.IgnoreOffset.includes(name))
            {
                for (let i = 0; i < defaults.length; i++)
                {
                    stage.constantValues[offset + i] = defaults[i];
                }
            }
        }

        // Setup textures
        for (let i = 0; i < textures.length; i++)
        {
            stage.textures.push(Tw2ShaderStageTexture.fromJSON(textures[i], context));
        }

        // Setup samplers
        for (let i = 0; i < samplers.length; i++)
        {
            stage.samplers.push(Tw2SamplerState.fromJSON(samplers[i], context));
        }

        return stage;
    }

    /**
     * Reads ccp shader stage binary
     * @param {Tw2BinaryReader}reader
     * @param {Tw2EffectRes}  context
     * @returns {Tw2ShaderStage}
     */
    static fromCCPBinary(reader, context)
    {
        const stage = new Tw2ShaderStage();
        stage.type = reader.ReadUInt8();

        // Declarations
        const inputCount = reader.ReadUInt8();
        for (let i = 0; i < inputCount; i++)
        {
            const
                usage = reader.ReadUInt8(),
                registerIndex = reader.ReadUInt8(), // unused
                usageIndex = reader.ReadUInt8(),
                usedMask = reader.ReadUInt8(); // unused

            const vertex = Tw2VertexElement.from({
                usage,
                usageIndex,
                type: 0,
                registerIndex,
                usedMask
            });

            stage.inputDefinition.elements.push(vertex);
        }
        stage.inputDefinition.RebuildHash();

        let shaderSize,
            shaderCode,
            shadowShaderSize,
            shadowShaderCode;

        // Read shader code
        if (context.version < 5)
        {
            shaderSize = reader.ReadUInt32();
            shaderCode = reader.data.subarray(reader.cursor, reader.cursor + shaderSize);
            reader.cursor += shaderSize;

            shadowShaderSize = reader.ReadUInt32();
            shadowShaderCode = reader.data.subarray(reader.cursor, reader.cursor + shadowShaderSize);
            reader.cursor += shadowShaderSize;
        }
        else
        {
            shaderSize = reader.ReadUInt32();
            let so = reader.ReadUInt32();
            // Bad conversions from HLSL
            shaderCode = this.inspectShaderCode(context.stringTable.substr(so, shaderSize), context.path);

            shadowShaderSize = reader.ReadUInt32();
            so = reader.ReadUInt32();
            // Bad conversions from HLSL
            shadowShaderCode = this.inspectShaderCode(context.stringTable.substr(so, shadowShaderSize), context.path);
        }

        if (Tw2Shader.DEBUG_ENABLED)
        {
            stage.shaderCode = shaderCode;
            stage.shadowShaderCode = shadowShaderCode;
        }

        //  Compile normal shader
        stage.shader = this.compileShader(stage.type, "", shaderCode, context.path);

        // Compile shadow shader
        if (context.validShadowShader)
        {
            if (shadowShaderSize === 0)
            {
                stage.shadowShader = this.compileShader(stage.type, "\n#define PS\n", shaderCode, context.path, true);
            }
            else
            {
                stage.shadowShader = this.compileShader(stage.type, "", shadowShaderCode, context.path, true);
            }

            if (stage.shadowShader === null)
            {
                context.validShadowShader = false;
            }
        }
        else
        {
            stage.shadowShader = null;
        }

        if (context.version >= 3)
        {
            reader.ReadUInt32();
            reader.ReadUInt32();
            reader.ReadUInt32();
        }

        // Read constants
        stage.constantSize = 0;
        const constantCount = reader.ReadUInt32();
        for (let constantIx = 0; constantIx < constantCount; ++constantIx)
        {
            const constant = Tw2ShaderStageConstant.fromCCPBinary(reader, context);
            stage.constants.push(constant);
            if (!Tw2ShaderStageConstant.IgnoreOffset.includes(constant.name))
            {
                const last = constant.offset + constant.size;
                if (last > stage.constantSize) stage.constantSize = last;
            }
        }

        //  Constant values  (defaults)
        const constantValueSize = reader.ReadUInt32() / 4;
        stage.constantValues = new Float32Array(constantValueSize);
        if (context.version < 5)
        {
            for (let i = 0; i < constantValueSize; ++i)
            {
                stage.constantValues[i] = reader.ReadFloat32();
            }
        }
        else
        {
            const
                co = reader.ReadUInt32(),
                bo = reader.cursor;

            reader.cursor = context.stringTableOffset + co;
            for (let i = 0; i < constantValueSize; ++i)
            {
                stage.constantValues[i] = reader.ReadFloat32();
            }
            reader.cursor = bo;
        }
        stage.constantSize = Math.max(stage.constantSize, constantValueSize);

        // Populate stage constant defaults?
        for (let i = 0; i < stage.constants.length; i++)
        {
            const { name, elements, offset, dimension } = stage.constants[i];

            if (!Tw2ShaderStageConstant.IgnoreOffset.includes(name))
            {
                let defaultValues = [];

                for (let x = 0; x < elements.length; x++)
                {
                    for (let n = 0; n < dimension; n++)
                    {
                        let index = x * dimension + n;
                        defaultValues[index] = stage.constantValues[index + offset];
                    }
                }

                if (defaultValues.length)
                {
                    stage.constants[i].defaults = defaultValues;
                }
            }
        }

        // Textures
        const textureCount = reader.ReadUInt8();
        for (let textureIx = 0; textureIx < textureCount; ++textureIx)
        {
            stage.textures.push(Tw2ShaderStageTexture.fromCCPBinary(reader, context));
        }

        // Samplers
        const samplerCount = reader.ReadUInt8();
        for (let samplerIx = 0; samplerIx < samplerCount; ++samplerIx)
        {
            stage.samplers.push(Tw2SamplerState.fromCCPBinary(reader, context, stage.textures));
        }

        return stage;
    }

    /**
     * Compiles shader
     * @param {Number} stageType
     * @param {String} prefix
     * @param shaderCode
     * @param {String} path
     * @param {Boolean} [skipError]
     * @returns {*}
     */
    static compileShader(stageType, prefix, shaderCode, path, skipError)
    {
        const
            { gl } = device,
            shader = gl.createShader(stageType === 0 ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER),
            ccpShaderBinary = device.GetExtension("CCP_shader_binary");

        if (ccpShaderBinary)
        {
            ccpShaderBinary["shaderBinary"](shader, shaderCode);
        }
        else
        {
            let source = prefix + (isString(shaderCode) ? shaderCode : String.fromCharCode.apply(null, shaderCode));
            source = source.substr(0, source.length - 1);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
        }

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
        {
            if (!skipError)
            {
                throw new ErrShaderCompile({
                    path: path,
                    shaderType: stageType === 0 ? "vertex" : "fragment",
                    infoLog: gl.getShaderInfoLog(shader)
                });
            }
            return null;
        }
        return shader;
    }

    /**
     * Inspects shader code for a path and fixes any known errors
     * TODO: Fix source files
     * @param {String} code
     * @param {String} path
     * @returns {String}
     */
    static inspectShaderCode(code, path)
    {
        const
            fileName = path.substring(path.lastIndexOf("/") + 1, path.lastIndexOf(".")).toLowerCase(),
            overrides = shaderOverrides[fileName];

        if (!overrides) return code;

        function escapeRegExp(string)
        {
            return string.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&");
        }

        function replaceAll(str, find, replace)
        {
            return str.replace(new RegExp(escapeRegExp(find), "g"), replace);
        }

        for (const key in overrides)
        {
            if (overrides.hasOwnProperty(key))
            {
                code = replaceAll(code, key, overrides[key]);
            }
        }

        return code;
    }

    /**
     * Shader stage type
     * @type {{VERTEX: number, FRAGMENT: number}}
     */
    static Type = {
        INVALID: -1,
        VERTEX: 0,
        FRAGMENT: 1
    };

}
