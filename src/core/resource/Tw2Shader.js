import {quat, util, device} from "../../global";
import {Tw2VertexDeclaration, Tw2VertexElement} from "../vertex";
import {Tw2SamplerState} from "../sampler";
import {ErrShaderCompile, ErrShaderLink} from "../Tw2Error";
import shaderOverrides from "./shaderOverrides.json";

/**
 * Tw2Shader
 *
 * @property {Object.<string, Object>} techniques
 * @property {Object.<string, Array>} annotations
 * @class
 */
export class Tw2Shader
{

    techniques = {};
    annotations = {};


    /**
     * Constructor
     * @param reader
     * @param version
     * @param stringTable
     * @param stringTableOffset
     * @param path
     */
    constructor(reader, version, stringTable, stringTableOffset, path)
    {

        /**
         * ReadString
         * @returns {String}
         * @private
         */
        function ReadString()
        {
            const offset = reader.ReadUInt32();
            let end = offset;
            while (stringTable.charCodeAt(end))
            {
                ++end;
            }
            return stringTable.substr(offset, end - offset);
        }

        const {wrapModes, gl} = device;

        let techniqueCount = 1;
        if (version > 6)
        {
            techniqueCount = reader.ReadUInt8();
        }

        for (let t = 0; t < techniqueCount; ++t)
        {
            let technique = {
                name: "Main",
                passes: []
            };

            if (version > 6)
            {
                technique.name = ReadString();
            }

            this.techniques[technique.name] = technique;

            const passCount = reader.ReadUInt8();
            for (let passIx = 0; passIx < passCount; ++passIx)
            {
                const pass = {};
                pass.stages = [{}, {}];
                const stageCount = reader.ReadUInt8();
                let validShadowShader = true;

                for (let stageIx = 0; stageIx < stageCount; ++stageIx)
                {
                    const stage = {};
                    stage.inputDefinition = new Tw2VertexDeclaration();
                    stage.constants = [];
                    stage.textures = [];
                    stage.samplers = [];

                    const
                        stageType = reader.ReadUInt8(),
                        inputCount = reader.ReadUInt8();

                    stage.stageType = stageType === 0 ? "vertex" : "fragment";

                    for (let inputIx = 0; inputIx < inputCount; ++inputIx)
                    {
                        const
                            usage = reader.ReadUInt8(),
                            registerIndex = reader.ReadUInt8(), // unused
                            usageIndex = reader.ReadUInt8(),
                            usedMask = reader.ReadUInt8(); // unused

                        stage.inputDefinition.elements[inputIx] = Tw2VertexElement.from({
                            usage, usageIndex, type: 0, registerIndex, usedMask
                        });
                    }
                    stage.inputDefinition.RebuildHash();

                    let shaderSize,
                        shaderCode,
                        shadowShaderSize,
                        shadowShaderCode;

                    if (version < 5)
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
                        shaderCode = Tw2Shader.InspectShaderCode(stringTable.substr(so, shaderSize), path);
                        shadowShaderSize = reader.ReadUInt32();
                        so = reader.ReadUInt32();
                        shadowShaderCode = Tw2Shader.InspectShaderCode(stringTable.substr(so, shadowShaderSize), path);

                        if (Tw2Shader.DEBUG_ENABLED)
                        {
                            stage.shaderCode = shaderCode;
                            stage.shadowShaderCode = shadowShaderCode;
                        }
                    }

                    try
                    {
                        stage.shader = Tw2Shader.CompileShader(stageType, "", shaderCode, path);

                    }
                    catch (err)
                    {
                        console.group();
                        console.error(err.message);
                        console.dir(stage);
                        console.groupEnd();
                        throw err;
                    }

                    if (validShadowShader)
                    {
                        if (shadowShaderSize === 0)
                        {
                            stage.shadowShader = Tw2Shader.CompileShader(stageType, "\n#define PS\n", shaderCode, path, true);
                        }
                        else
                        {
                            stage.shadowShader = Tw2Shader.CompileShader(stageType, "", shadowShaderCode, path, true);
                        }

                        if (stage.shadowShader === null)
                        {
                            validShadowShader = false;
                        }
                    }
                    else
                    {
                        stage.shadowShader = null;
                    }

                    if (version >= 3)
                    {
                        reader.ReadUInt32();
                        reader.ReadUInt32();
                        reader.ReadUInt32();
                    }

                    stage.constantSize = 0;
                    const constantCount = reader.ReadUInt32();
                    for (let constantIx = 0; constantIx < constantCount; ++constantIx)
                    {
                        const constant = {};
                        constant.name = ReadString();
                        constant.offset = reader.ReadUInt32() / 4;
                        constant.size = reader.ReadUInt32() / 4;
                        constant.type = reader.ReadUInt8();
                        constant.dimension = reader.ReadUInt8();
                        constant.elements = reader.ReadUInt32();
                        constant.isSRGB = reader.ReadUInt8();
                        constant.isAutoregister = reader.ReadUInt8();
                        stage.constants[constantIx] = constant;

                        if (Tw2Shader.ConstantIgnore.includes(constant.name)) continue;

                        const last = constant.offset + constant.size;
                        if (last > stage.constantSize) stage.constantSize = last;
                    }

                    const constantValueSize = reader.ReadUInt32() / 4;
                    stage.constantValues = new Float32Array(constantValueSize);
                    if (version < 5)
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

                        reader.cursor = stringTableOffset + co;
                        for (let i = 0; i < constantValueSize; ++i)
                        {
                            stage.constantValues[i] = reader.ReadFloat32();
                        }
                        reader.cursor = bo;
                    }
                    stage.constantSize = Math.max(stage.constantSize, constantValueSize);

                    let textureCount = reader.ReadUInt8();
                    for (let textureIx = 0; textureIx < textureCount; ++textureIx)
                    {
                        const texture = {};
                        texture.registerIndex = reader.ReadUInt8();
                        texture.name = ReadString();
                        texture.type = reader.ReadUInt8();
                        texture.isSRGB = reader.ReadUInt8();
                        texture.isAutoregister = reader.ReadUInt8();
                        stage.textures.push(texture);
                    }

                    const samplerCount = reader.ReadUInt8();
                    for (let samplerIx = 0; samplerIx < samplerCount; ++samplerIx)
                    {
                        const s = new Tw2SamplerState();
                        s.registerIndex = reader.ReadUInt8();
                        s.name = version >= 4 ? ReadString() : "";
                        s._comparison = reader.ReadUInt8();     // not used
                        s.minFilter = reader.ReadUInt8();
                        s.magFilter = reader.ReadUInt8();
                        s.mipFilter = reader.ReadUInt8();
                        s.addressU = reader.ReadUInt8();
                        s.addressV = reader.ReadUInt8();
                        s.addressW = reader.ReadUInt8();
                        s.mipLODBias = reader.ReadFloat32();    // not used
                        s._maxAnisotropy = reader.ReadUInt8();
                        s._comparisonFunc = reader.ReadUInt8(); // not used
                        s._borderColor = quat.fromValues(
                            reader.ReadFloat32(),
                            reader.ReadFloat32(),
                            reader.ReadFloat32(),
                            reader.ReadFloat32()
                        );
                        s._minLOD = reader.ReadFloat32();       // not used
                        s._maxLOD = reader.ReadFloat32();       // not used

                        if (version < 4) reader.ReadUInt8();

                        if (s.minFilter === 1)
                        {
                            switch (s.mipFilter)
                            {
                                case 0:
                                    s.minFilter = gl.NEAREST;
                                    break;

                                case 1:
                                    s.minFilter = gl.NEAREST_MIPMAP_NEAREST;
                                    break;

                                default:
                                    s.minFilter = gl.NEAREST_MIPMAP_LINEAR;
                            }
                            s.minFilterNoMips = gl.NEAREST;
                        }
                        else
                        {
                            switch (s.mipFilter)
                            {
                                case 0:
                                    s.minFilter = gl.LINEAR;
                                    break;

                                case 1:
                                    s.minFilter = gl.LINEAR_MIPMAP_NEAREST;
                                    break;

                                default:
                                    s.minFilter = gl.LINEAR_MIPMAP_LINEAR;
                            }
                            s.minFilterNoMips = gl.LINEAR;
                        }

                        s.magFilter = s.magFilter === 1 ? gl.NEAREST : gl.LINEAR;
                        s.addressU = wrapModes[s.addressU];
                        s.addressV = wrapModes[s.addressV];
                        s.addressW = wrapModes[s.addressW];

                        if (s.minFilter === 3 || s.magFilter === 3 || s.mipFilter === 3)
                        {
                            s.anisotropy = Math.max(s.maxAnisotropy, 1);
                        }

                        for (let n = 0; n < stage.textures.length; ++n)
                        {
                            if (stage.textures[n].registerIndex === s.registerIndex)
                            {
                                s.samplerType = stage.textures[n].type === 4 ? gl.TEXTURE_CUBE_MAP : gl.TEXTURE_2D;
                                s.isVolume = stage.textures[n].type === 3;
                                break;
                            }
                        }

                        s.ComputeHash();
                        stage.samplers.push(s);
                    }

                    if (version >= 3) reader.ReadUInt8();
                    if (version > 7) reader.ReadUInt8();

                    pass.stages[stageType] = stage;
                }

                pass.states = [];
                const stateCount = reader.ReadUInt8();
                for (let stateIx = 0; stateIx < stateCount; ++stateIx)
                {
                    const
                        state = reader.ReadUInt32(),
                        value = reader.ReadUInt32();

                    pass.states.push({
                        "state": state,
                        "value": value
                    });
                }

                pass.shaderProgram = Tw2Shader.CreateProgram(
                    pass.stages[0].shader,
                    pass.stages[1].shader,
                    pass, path);

                if (validShadowShader)
                {
                    pass.shadowShaderProgram = Tw2Shader.CreateProgram(
                        pass.stages[0].shadowShader,
                        pass.stages[1].shadowShader,
                        pass, path, true);

                    if (pass.shadowShaderProgram === null)
                    {
                        pass.shadowShaderProgram = pass.shaderProgram;
                    }
                }
                else
                {
                    pass.shadowShaderProgram = pass.shaderProgram;
                }

                technique.passes[passIx] = pass;
            }
        }

        const parameterCount = reader.ReadUInt16();
        for (let paramIx = 0; paramIx < parameterCount; ++paramIx)
        {
            const
                name = ReadString(),
                annotations = [],
                annotationCount = reader.ReadUInt8();

            for (let annotationIx = 0; annotationIx < annotationCount; ++annotationIx)
            {
                annotations[annotationIx] = {};
                annotations[annotationIx].name = ReadString();
                annotations[annotationIx].type = reader.ReadUInt8();
                switch (annotations[annotationIx].type)
                {
                    case 0:
                        annotations[annotationIx].value = reader.ReadUInt32() !== 0;
                        break;

                    case 1:
                        annotations[annotationIx].value = reader.ReadInt32();
                        break;

                    case 2:
                        annotations[annotationIx].value = reader.ReadFloat32();
                        break;

                    default:
                        annotations[annotationIx].value = ReadString();
                }
            }
            this.annotations[name] = annotations;
        }
    }


    /**
     * Applies an Effect Pass
     * @param {String} technique - technique name
     * @param {Number} pass - effect.passes index
     */
    ApplyPass(technique, pass)
    {
        const
            d = device,
            gl = d.gl;

        pass = this.techniques[technique].passes[pass];

        for (let i = 0; i < pass.states.length; ++i)
        {
            d.SetRenderState(pass.states[i].state, pass.states[i].value);
        }

        if (d.IsAlphaTestEnabled())
        {
            gl.useProgram(pass.shadowShaderProgram.program);
            d.shadowHandles = pass.shadowShaderProgram;
        }
        else
        {
            gl.useProgram(pass.shaderProgram.program);
            d.shadowHandles = null;
        }
    }

    /**
     * Checks if a constant is supported
     * @param {String} name
     * @returns {Boolean}
     */
    HasConstant(name)
    {
        return this.constructor.Has(this.techniques, "constants", name);
    }

    /**
     * Checks if a texture is supported
     * @param {String} name
     * @returns {Boolean}
     */
    HasTexture(name)
    {
        return this.constructor.Has(this.techniques, "textures", name);
    }

    /**
     * Checks if a sampler is supported
     * @param {String} name
     * @returns {Boolean}
     */
    HasSampler(name)
    {
        return this.constructor.Has(this.techniques, "samplers", name);
    }

    /**
     * Checks if any techniques have a value with a given name for a specific type
     * @param {*} techniques
     * @param {String} type
     * @param {String} name
     * @returns {?*}
     */
    static Has(techniques, type, name)
    {
        for (const t in techniques)
        {
            if (techniques.hasOwnProperty(t))
            {
                const technique = techniques[t];
                for (let p = 0; p < technique.passes.length; p++)
                {
                    const pass = technique.passes[p];
                    for (let s = 0; s < pass.stages.length; s++)
                    {
                        const stage = pass.stages[s];
                        for (let i = 0; i < stage[type].length; i++)
                        {
                            if (stage[type][i].name === name)
                            {
                                return true;
                            }
                        }
                    }
                }
            }
        }
        return false;
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
    static CompileShader(stageType, prefix, shaderCode, path, skipError)
    {
        const
            {ext, gl} = device,
            shader = gl.createShader(stageType === 0 ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER);

        if (ext.ShaderBinary)
        {
            ext.ShaderBinary["shaderBinary"](shader, shaderCode);
        }
        else
        {
            let source = prefix + (util.isString(shaderCode) ? shaderCode : String.fromCharCode.apply(null, shaderCode));
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
     * Creates shader program
     * @param vertexShader
     * @param fragmentShader
     * @param pass
     * @param {String} path
     * @param {Boolean} [skipError]
     * @returns {*}
     */
    static CreateProgram(vertexShader, fragmentShader, pass, path, skipError)
    {
        const
            gl = device.gl,
            program = {};

        program.program = gl.createProgram();
        gl.attachShader(program.program, vertexShader);
        gl.attachShader(program.program, fragmentShader);
        gl.linkProgram(program.program);

        if (!gl.getProgramParameter(program.program, gl.LINK_STATUS))
        {
            if (!skipError)
            {
                throw new ErrShaderLink({
                    path: path,
                    infoLog: gl.getProgramInfoLog(program.program)
                });
            }
            return null;
        }

        gl.useProgram(program.program);
        program.constantBufferHandles = [];
        for (let j = 0; j < 16; ++j)
        {
            program.constantBufferHandles[j] = gl.getUniformLocation(program.program, "cb" + j);
        }

        program.samplerHandles = [];
        for (let j = 0; j < 16; ++j)
        {
            program.samplerHandles[j] = gl.getUniformLocation(program.program, "s" + j);
            gl.uniform1i(program.samplerHandles[j], j);
        }

        for (let j = 0; j < 16; ++j)
        {
            program.samplerHandles[j + 12] = gl.getUniformLocation(program.program, "vs" + j);
            gl.uniform1i(program.samplerHandles[j + 12], j + 12);
        }

        program.input = new Tw2VertexDeclaration();
        for (let j = 0; j < pass.stages[0].inputDefinition.elements.length; ++j)
        {
            const attr = "attr" + j;
            let location = gl.getAttribLocation(program.program, attr);
            if (location >= 0)
            {
                const el = Tw2VertexElement.from({
                    usage: pass.stages[0].inputDefinition.elements[j].usage,
                    usageIndex: pass.stages[0].inputDefinition.elements[j].usageIndex,
                    location,
                    attr
                });
                program.input.elements.push(el);
            }
        }
        program.input.RebuildHash();

        program.shadowStateInt = gl.getUniformLocation(program.program, "ssi");
        program.shadowStateFloat = gl.getUniformLocation(program.program, "ssf");
        program.shadowStateYFlip = gl.getUniformLocation(program.program, "ssyf");
        gl.uniform3f(program.shadowStateYFlip, 0, 0, 1);

        program.volumeSlices = [];
        for (let j = 0; j < pass.stages[1].samplers.length; ++j)
        {
            if (pass.stages[1].samplers[j].isVolume)
            {
                program.volumeSlices[pass.stages[1].samplers[j].registerIndex] = gl.getUniformLocation(program.program, "s" + pass.stages[1].samplers[j].registerIndex + "sl");
            }
        }
        return program;
    }

    /**
     * Inspects shader code for a path and fixes any known errors
     * TODO: Fix source files
     * @param {String} code
     * @param {String} path
     * @returns {String}
     */
    static InspectShaderCode(code, path)
    {
        const
            fileName = path.substring(path.lastIndexOf("/") + 1, path.lastIndexOf(".")).toLowerCase(),
            overrides = shaderOverrides[fileName];

        if (!overrides) return code;

        for (const key in overrides)
        {
            if (overrides.hasOwnProperty(key))
            {
                code = code.replace(key, overrides[key]);
            }
        }

        return code;
    }

    /**
     * Constant names that are ignored
     * @type {String[]}
     */
    static ConstantIgnore = [
        "PerFrameVS",
        "PerObjectVS",
        "PerFramePS",
        "PerObjectPS"
    ];

    static DEBUG_ENABLED = false;

}