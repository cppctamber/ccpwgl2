import { meta } from "utils";
import { device } from "global";
import { Tw2Error } from "../Tw2Error";
import { Tw2ShaderAnnotation } from "./Tw2ShaderAnnotation";
import { Tw2ShaderTechnique } from "./Tw2ShaderTechnique";


@meta.type("Tw2Shader")
export class Tw2Shader
{

    @meta.plain
    techniques = {};

    @meta.plain
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
                parameter: {},
                inputDefinitions: []
                //texture: {},
                //override: {}}
            },
            ps: {
                frame: {},
                object: {},
                parameter: {},
                inputDefinitions: []
                //texture: {},
                //override: {}
            },
            ffe: {
                object: {}
            },
            inputDefinitions: {}
        };

        const
            { perFramePSData, perFrameVSData } = device,
            pass0 = this.techniques[technique].passes[0],
            [ stage0, stage1 ] = pass0.stages,
            code = stage0.shaderCode + stage1.shaderCode;

        pass0.shaderProgram.input.elementsSorted.forEach(x =>
        {
            result.inputDefinitions[x._attr] = x.string;
        });

        stage0.inputDefinition.elementsSorted.forEach(x =>
        {
            result.vs.inputDefinitions.push(x.string);
        });

        stage1.inputDefinition.elementsSorted.forEach(x =>
        {
            result.ps.inputDefinitions.push(x.string);
        });

        if (!code)
        {
            throw new Error("Debug mode must be enabled when the shader was created");
        }

        const lines = code.split(/\r\n|\r|\n/);

        const CBH = {
            cb0: { name: "ConstantVertex", source: stage0, target: result.vs.parameter, isStage: true, short: "cb0" },
            cb1: { name: "PerFrameVS", source: perFrameVSData, target: result.vs.frame, short: "cb1" },
            cb2: { name: "PerFramePS", source: perFramePSData, target: result.ps.frame, short: "cb2" },
            cb3: { name: "PerObjectVS", source: perObjectData.vs, target: result.vs.object, short: "cb3" },
            cb4: { name: "PerObjectPS", source: perObjectData.ps, target: result.ps.object, short: "cb4" },
            cb5: { name: "PerObjectFFE", source: perObjectData.ffe, target: result.ffe.object, short: "cb5" },
            cb7: { name: "ConstantFragment", source: stage1, target: result.ps.parameter, isStage: true, short: "cb7" }
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
                let
                    { name, offset, array } = el,
                    ix = index - offset;

                name = `${per.short}[${offset / 4}]_${name}`;

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
     * Applies an Effect Pass
     * @param {String} technique - technique name
     * @param {Number} pass - effect.passes index
     */
    ApplyPass(technique, pass)
    {
        this.techniques[technique].passes[pass].Apply();
    }

    /**
     * Checks if a constant is supported
     * @param {String} name
     * @returns {Boolean}
     */
    HasConstant(name)
    {
        for (const technique in this.techniques)
        {
            if (this.techniques.hasOwnProperty(technique) && this.techniques[technique].HasConstant(name))
            {
                return true;
            }
        }
        return false;
    }

    /**
     * Checks if a texture is supported
     * @param {String} name
     * @returns {Boolean}
     */
    HasTexture(name)
    {
        for (const technique in this.techniques)
        {
            if (this.techniques.hasOwnProperty(technique) && this.techniques[technique].HasTexture(name))
            {
                return true;
            }
        }
        return false;
    }

    /**
     * Checks if a sampler is supported
     * @param {String} name
     * @returns {Boolean}
     */
    HasSampler(name)
    {
        for (const technique in this.techniques)
        {
            if (this.techniques.hasOwnProperty(technique) && this.techniques[technique].HasSampler(name))
            {
                return true;
            }
        }
        return false;
    }

    /**
     * Reads ccp shader binary
     * @param {Tw2BinaryReader} reader
     * @param {Tw2EffectRes} res
     * @return {Tw2Shader}
     */
    static fromCCPBinary(reader, res)
    {
        const shader = new Tw2Shader();

        //  Techniques
        const techniqueCount = res.version > 6 ? reader.ReadUInt8() : 1;
        for (let i = 0; i < techniqueCount; i++)
        {
            const name = res.version > 6 ? res.ReadString() : "Main";

            if (shader.techniques[name])
            {
                throw new Error("Invalid technique, already defined: " + name);
            }
            shader.techniques[name] = Tw2ShaderTechnique.fromCCPBinary(reader, res, name);
        }

        // Annotations
        const parameterCount = reader.ReadUInt16();
        for (let paramIx = 0; paramIx < parameterCount; ++paramIx)
        {
            const annotation = Tw2ShaderAnnotation.fromCCPBinary(reader, res);
            shader.annotations[annotation.name] = annotation;
        }

        return shader;
    }

    /**
     * Identifies if debug is enabled
     * @type {boolean}
     */
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
