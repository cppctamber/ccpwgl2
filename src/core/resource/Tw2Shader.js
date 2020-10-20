import { meta, isString } from "utils";
import { device } from "global";
import { quat } from "math";
import { Tw2VertexDeclaration, Tw2VertexElement } from "../vertex";
import { Tw2SamplerState } from "../sampler";
import shaderOverrides from "./shaderOverrides.json";
import { Tw2Error } from "../Tw2Error";

/**
 * Tw2Shader
 *
 * @property {Object.<string, Object>} techniques
 * @property {Object.<string, Array>} annotations
 * @class
 */
@meta.type("Tw2Shader")
export class Tw2Shader
{

    techniques = {};
    annotations = {};

    /**
     * Finds per object data usages in a shader and retrieves the current values
     * @param {Tw2PerObjectData} perObjectData
     * @param {String } [technique=Main]
     * @returns {{ps: {parameter: [], frame: [], object: []}, ffe: {object: []}, vs: {parameter: [], frame: [], object: []}}}
     */
    FindPerObjectDataUsage(perObjectData, technique = "Main")
    {
        if (!Tw2Shader.DEBUG_ENABLED)
        {
            throw new Error("Debug mode must be enabled to find per object data");
        }

        //TODO: Add Textures
        //TODO: Add Overrides

        const result = {
            vs: {
                frame: {},
                object: {},
                parameter: {}
                //texture: {},
                //override: {}}
            },
            ps: {
                frame: {},
                object: {},
                parameter: {}
                //texture: {},
                //override: {}
            },
            ffe: {
                object: {}
            }
        };

        const
            { perFramePSData, perFrameVSData } = device,
            [ stage0, stage1 ] = this.techniques[technique].passes[0].stages,
            code = stage0.shaderCode + stage1.shaderCode;

        if (!code)
        {
            throw new Error("Debug mode must be enabled when the shader was created");
        }

        const lines = code.split(/\r\n|\r|\n/);

        const CBH = {
            cb0: { name: "ConstantVertex", source: stage0, target: result.vs.parameter, isStage: true },
            cb1: { name: "PerFrameVS", source: perFrameVSData, target: result.vs.frame },
            cb2: { name: "PerFramePS", source: perFramePSData, target: result.ps.frame },
            cb3: { name: "PerObjectVS", source: perObjectData.vs, target: result.vs.object },
            cb4: { name: "PerObjectPS", source: perObjectData.ps, target: result.ps.object },
            cb5: { name: "PerObjectFFE", source: perObjectData.ffe, target: result.ffe.object },
            cb7: { name: "ConstantFragment", source: stage1, target: result.ps.parameter, isStage: true }
        };

        const CBHReverse = {
            "PerFrameVS": "cb1",
            "PerObjectVS": "cb3",
            "PerFramePS": "cb2",
            "PerObjectPS": "cb4",
            "PerObjectFFE": "cb5"
        };

        const Swizzle = [ "x", "y", "z", "w" ];

        function parsePer(per, index)
        {
            const { target } = per;

            const el = per.source.FindElementFromIndex(index);
            if (el)
            {
                const
                    { name, offset, array } = el,
                    ix = index - offset;

                target[name] = target[name] || {};
                target[name][ix] = array[ix];
                return;
            }

            throw new Error(`Error finding element in ${per.name} at index: ${index}`);
        }

        function parseStage(stage, index)
        {
            const
                { target, source } = stage,
                { constants, constantValues } = source;

            for (let i = 0; i < constants.length; i++)
            {
                const { offset, name, type, size } = constants[i];
                // Find the correct constant value
                if (index < offset || index > offset + size - 1) continue;
                // Offset to the constant
                const ix = index - offset;
                // Per object or per frame
                if (type === 3)
                {
                    parsePer(CBH[CBHReverse[name]], ix);
                }
                // Parameter
                else
                {
                    target[name] = target[name] || {};
                    target[name][ix] = constantValues[offset + ix];
                }
                return;
            }

            throw new Error(`Error finding element in ${stage.name} at index: ${index}`);
        }

        lines.forEach(line =>
        {
            if (!line) return;

            // Todo: Use a single regex to get the results...
            const match = line.match(/cb[0123457]\[\d+\]\.?[xyzw]?[xyzw]?[xyzw]?[xyzw]+/g); //(cb[0123457])\[(\d+)\]\.([xyzw]+)

            if (!match) return;

            for (let i = 0; i < match.length; i++)
            {
                let [ split, swizzle ] = match[i].split(".");

                const
                    cbh = split.match(/(cb[0-7])/g)[0],
                    index = parseInt(split.replace(cbh, "").replace("[", "").replace("]", "")) * 4,
                    // Todo: Handle when a whole value is used, excluding the initial definition of the constant buffer
                    elements = swizzle.split("").map(x => Swizzle.indexOf(x));

                const source = CBH[cbh];

                for (let i = 0; i < elements.length; i++)
                {
                    if (source.isStage)
                    {
                        parseStage(source, index + elements[i]);
                    }
                    else
                    {
                        parsePer(source, index + elements[i]);
                    }
                }

            }
        });

        return result;
    }

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

        const { wrapModes, gl } = device;

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
                pass.stages = [ {}, {} ];
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
                                /*
                                switch(stage.textures[n].type)
                                {
                                    case 4:
                                        s.samplerType = gl.TEXTURE_CUBE_MAP;
                                        s.isVolume = false;
                                        break;

                                    case 3:
                                        s.samplerType = gl.TEXTURE_2D_ARRAY; // gl.TEXTURE_3D ??
                                        s.isVolume = true;
                                        break;

                                    default:
                                        s.samplerType = gl.TEXTURE_2D;
                                        s.isVolume = false;
                                        break;
                                }
                                 */

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
                annotations = { name },
                annotationCount = reader.ReadUInt8();

            let group = "None",
                components = [];

            for (let annotationIx = 0; annotationIx < annotationCount; ++annotationIx)
            {
                let
                    key = ReadString(),
                    type = reader.ReadUInt8(),
                    value;

                switch (type)
                {
                    case 0:
                        value = reader.ReadUInt32() !== 0;
                        break;

                    case 1:
                        value = reader.ReadInt32();
                        break;

                    case 2:
                        value = reader.ReadFloat32();
                        break;

                    default:
                        value = ReadString();
                }

                // Normalize the annotations
                switch (key.toUpperCase())
                {
                    case "UIWIDGET":
                        annotations.widget = value.toUpperCase();
                        if (annotations.widget === "LINEARCOLOR")
                        {
                            components = this.constructor.LinearColor;
                        }
                        break;

                    case "SASUIVISIBLE":
                        annotations.display = value;
                        break;

                    case "SASUIDESCRIPTION":
                        annotations.description = value;
                        break;

                    case "GROUP":
                        group = annotations.group = value;
                        break;

                    case "COMPONENT1":
                        components[0] = value;
                        break;

                    case "COMPONENT2":
                        components[1] = value;
                        break;

                    case "COMPONENT3":
                        components[2] = value;
                        break;

                    case "COMPONENT4":
                        components[3] = value;
                        break;

                    default:
                        key = key.charAt(0).toLowerCase() + key.substring(1);
                        annotations[key] = value;
                }
            }

            if (!annotations.widget && this.HasTexture(name))
            {
                annotations.widget = "TEXTURE";
                annotations.group = annotations.group || "Texture";
            }

            if (components.length)
            {
                annotations.components = components;
            }

            this.annotations[name] = annotations;
        }
    }

    /**
     * Linear colour component names
     * @type {string[]}
     */
    static LinearColor = [ "Linear red", "Linear green", "Linear blue", "Linear alpha" ];

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
            gl = device.gl,
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


/**
 * Throws when a shader cannot compile
 */
export class ErrShaderCompile extends Tw2Error
{
    constructor(data)
    {
        super(data, "Error compiling %shaderType% shader (%infoLog%)");
    }
}


/**
 * Throws when unable to link a vertex shader and fragment shader
 */
export class ErrShaderLink extends Tw2Error
{
    constructor(data)
    {
        super(data, "Error linking shaders");
    }
}
