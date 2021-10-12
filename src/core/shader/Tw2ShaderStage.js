import { addToArray, get, getKeyFromValue, isString, meta } from "utils";
import { Tw2VertexDeclaration, Tw2VertexElement } from "../vertex";
import { Tw2SamplerState } from "../sampler";
import { ErrShaderCompile, Tw2Shader } from "./Tw2Shader";
import { Tw2ShaderStageConstant } from "./Tw2ShaderStageConstant";
import { Tw2ShaderStageTexture } from "./Tw2ShaderStageTexture";
import { device } from "global/tw2";
import shaderOverrides from "./shaderOverrides";
import { Tw2ShaderAnnotation } from "core/shader/Tw2ShaderAnnotation";



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
        return getKeyFromValue(Tw2ShaderStage.Type, this.type, "INVALID");
    }

    /**
     * Gets the shader's parameter names
     * @param {Object} [out={}]
     * @return {{}} out
     */
    GetParameterNames(out={})
    {
        out.constants = out.constants || [];
        out.textures = out.textures || [];
        out.samplers = out.samplers || [];

        for (let i = 0; i < this.constants.length; i++)
        {
            addToArray(out.constants, this.constants[i].name);
        }

        for (let i = 0; i < this.textures.length; i++)
        {
            addToArray(out.textures, this.textures[i].name);
        }

        for (let i = 0; i < this.samplers.length; i++)
        {
            addToArray(out.samplers, this.samplers[i].name);
        }

        return out;
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

        const {
            constants = [],
            textures = [],
            //samplers = [],
            inputDefinitions = [],
            shader,
            shadowShader
        } = json;

        // Declarations
        for (let i = 0; i < inputDefinitions.length; i++)
        {
            stage.inputDefinition.elements.push(Tw2VertexElement.from(inputDefinitions[i]));
        }
        stage.inputDefinition.RebuildHash();

        // Debugging
        if (Tw2Shader.DEBUG_ENABLED)
        {
            console.group(context.path);
            console.dir({
                path: context.path,
                shader,
                shadowShader,
                type: stage.type === 0 ? "vertex" : "fragment"
            });
            console.groupEnd();
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


        let manuallyDefinedConstantOffset = false;

        /**
         * Resolves/validates a constant's offset
         * @param {*} obj
         * @return {Number}
         */
        function getOffset(obj)
        {

            if (Tw2ShaderStageConstant.IgnoreOffset.includes(obj.name))
            {
                if (stage.constantSize > obj.offset)
                {
                    throw new ReferenceError(`Constant offset out of bounds: ${obj.name}`);
                }

                return obj.offset;
            }

            let offset;
            if (obj.offset !== -1)
            {
                manuallyDefinedConstantOffset = true;
                offset = obj.offset;
            }
            else if (manuallyDefinedConstantOffset)
            {
                throw new ReferenceError("Cannot auto offset when an offset has been manually defined");
            }
            else if (!obj.size || obj.size === 1)
            {
                throw new ReferenceError("Invalid constant size");
            }
            else
            {
                offset = stage.constantSize;
            }

            stage.constantSize += obj.size;
            return offset;
        }

        //  Setup constants (must be ordered)
        for (let i = 0; i < constants.length; i++)
        {
            if (!constants[i].name) constants[i].name = "Constant" + i;
            const constant = Tw2ShaderStageConstant.fromJSON(constants[i], context);
            constant.offset = getOffset(constant);
            stage.constants.push(constant);

            // Annotations defined directly on constant
            if (constants[i].ui)
            {
                const annotation = Tw2ShaderAnnotation.fromJSON(constants[i].ui, context);
                if (!annotation.name) annotation.name = constant.name;
                if (!annotation.group) annotation.group = "Constant";
                context.annotations[annotation.name] = annotation;
            }
        }

        // Set constant values (defaults)
        stage.constantValues = new Float32Array(stage.constantSize);
        for (let i = 0; i < stage.constants.length; i++)
        {
            const { name, defaults, offset, size } = stage.constants[i];
            if (!Tw2ShaderStageConstant.IgnoreOffset.includes(name))
            {
                for (let i = 0; i < defaults.length; i++)
                {
                    stage.constantValues[offset + i] = defaults[i];
                }

                // Only store defaults in debug mode
                if (!Tw2Shader.DEBUG_ENABLED)
                {
                    stage.constants[i].defaults = null;
                }
                else
                {
                    //  Replace with reference
                    stage.constants[i].defaults = stage.constantValues.subarray(offset, offset + size);
                }
            }
        }

        let manuallyDefinedRegisterIndices = false;

        /**
         * Resolves register indices
         * @param {*} obj
         * @param {Number} index
         * @return {Number}
         */
        function getRegisterIndex(obj, index)
        {
            if (obj.registerIndex !== undefined)
            {
                manuallyDefinedRegisterIndices = true;
                return obj.registerIndex;
            }
            else if (manuallyDefinedRegisterIndices)
            {
                throw new ReferenceError("Cannot automatically resolve a register index when one has already been defined");
            }
            else
            {
                return index;
            }
        }

        // Setup textures and samplers
        for (let i = 0; i < textures.length; i++)
        {
            const { sampler={}, ui, ...tex } = textures[i];

            // Texture
            tex.registerIndex = getRegisterIndex(tex, i);
            tex.name = get(textures[i], "name", "Texture" + i);
            const texture = Tw2ShaderStageTexture.fromJSON(tex, context);
            stage.textures.push(texture);

            // Sampler
            sampler.name = get(sampler, "name", texture.name + "Sampler");
            sampler.registerIndex = texture.registerIndex;
            sampler.isVolume = texture.isVolume;
            sampler.samplerType = texture.glType;
            stage.samplers.push(Tw2SamplerState.fromJSON(sampler, context));

            // Annotations
            if (ui)
            {
                const annotation = Tw2ShaderAnnotation.fromJSON(ui, context);
                if (!annotation.name) annotation.name = textures[i].name;
                if (!annotation.group) annotation.group = "Textures";
                context.annotations[annotation.name] = annotation;
            }
        }

        // Order all arrays
        stage.constants.sort((a, b) => a.offset - b.offset);
        stage.textures.sort((a, b) => a.registerIndex - b.registerIndex);
        stage.samplers.sort((a, b) => a.registerIndex - b.registerIndex);

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
            // Handle bad conversions from HLSL
            shaderCode = this.inspectShaderCode(context.stringTable.substr(so, shaderSize), context.path, stage.type);

            shadowShaderSize = reader.ReadUInt32();
            so = reader.ReadUInt32();
            // Handle bad conversions from HLSL
            shadowShaderCode = this.inspectShaderCode(context.stringTable.substr(so, shadowShaderSize), context.path, stage.type);
        }

        if (Tw2Shader.DEBUG_ENABLED)
        {
            console.group(context.path);
            console.dir({ path: context.path, shaderCode, shadowShaderCode, type: stage.type  === 0 ? "vertex" : "fragment" });
            console.groupEnd();

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
                stage.shadowShader = this.compileShader(stage.type, "//shadow\n#define PS\n", shaderCode, context.path, true);
            }
            else
            {
                stage.shadowShader = this.compileShader(stage.type, "//shadow\n", shadowShaderCode, context.path, true);
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

        //  Constant values  (default values)
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

        // Only populate default values when in  debug mode
        for (let i = 0; i < stage.constants.length; i++)
        {
            if (Tw2Shader.DEBUG_ENABLED)
            {
                const { name, size, offset } = stage.constants[i];

                if (!Tw2ShaderStageConstant.IgnoreOffset.includes(name))
                {
                    stage.constants[i].defaults = stage.constantValues.subarray(offset, offset + size);
                }
            }
            else
            {
                stage.constants[i].defaults = null;
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

        // Order all arrays
        stage.constants.sort((a, b) => a.offset - b.offset);
        stage.textures.sort((a, b) => a.registerIndex - b.registerIndex);
        stage.samplers.sort((a, b) => a.registerIndex - b.registerIndex);

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

        let shaderName = path.split("/");
        shaderName = `//${shaderName[shaderName.length - 1]}\n`;

        if (ccpShaderBinary)
        {
            ccpShaderBinary["shaderBinary"](shader, shaderCode);
        }
        else
        {
            let source = shaderName + prefix + (isString(shaderCode) ? shaderCode : String.fromCharCode.apply(null, shaderCode));
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
     * @param {Number} type
     * @returns {String}
     */
    static inspectShaderCode(code, path, type)
    {
        const
            fileName = path.substring(path.lastIndexOf("/") + 1, path.lastIndexOf(".")).toLowerCase(),
            mainOverrides = shaderOverrides[fileName],
            shaderTypeSuffix = type === 0 ? ".vertex" : ".fragment",
            typeOverrides = shaderOverrides[fileName + shaderTypeSuffix];

        const overrides = Object.assign({}, mainOverrides, typeOverrides);
        if (!Object.keys(overrides).length) return code;

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
