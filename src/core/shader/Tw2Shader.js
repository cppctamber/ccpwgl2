import { isPlain, meta } from "utils";
import { device } from "global";
import { Tw2Error } from "../Tw2Error";
import { Tw2ShaderAnnotation } from "./Tw2ShaderAnnotation";
import { Tw2ShaderTechnique } from "./Tw2ShaderTechnique";


@meta.type("Tw2Shader")
export class Tw2Shader
{

    techniques = {};

    annotations = {};

    /**
     * Finds per object/per frame/parameter usages in a shader and retrieves the current values.
     * Also returns USED textures (samplers) with slot + resolved resource path.
     *
     * NOTE:
     * - This does NOT dump raw constant buffers.
     * - It only returns named values actually referenced by the shader code for the selected technique.
     * - Values are returned as float arrays:
     *   - .xyzw => length 4
     *   - .xyz  => length 3
     *   - .xy   => length 2
     *   - .x/.y/.z/.w => length 1
     *
     * DEDUPE:
     * - If any usage causes all 4 lanes of a register to be observed, only .xyzw is reported
     *   (no additional per-component entries).
     *
     * MULTI-REGISTER VALUES:
     * - Matrices/arrays spanning multiple registers will appear as multiple lines:
     *   cbN[r].xyzw_Name for each involved register.
     *
     * @param {Tw2PerObjectData} perObjectData
     * @param {String} [technique="Main"]
     * @returns {{
     *   vs: { frame: Object, object: Object, parameter: Object, textures: Object, inputDefinitions: string[] },
     *   ps: { frame: Object, object: Object, parameter: Object, textures: Object, inputDefinitions: string[] },
     *   ffe: { object: Object },
     *   inputDefinitions: Object
     * }}
     */
    FindPerObjectDataUsageV2(perObjectData, technique = "Main")
    {
        if (!Tw2Shader.DEBUG_ENABLED)
        {
            throw new Error("Debug mode must be enabled to find per object data");
        }

        const result = {
            vs: { frame: {}, object: {}, parameter: {}, textures: {}, inputDefinitions: [] },
            ps: { frame: {}, object: {}, parameter: {}, textures: {}, inputDefinitions: [] },
            ffe: { object: {} },
            inputDefinitions: {}
        };

        const { perFramePSData, perFrameVSData } = device;

        const pass0 = this.techniques[technique]?.passes?.[0];
        if (!pass0) throw new Error(`Technique "${technique}" has no pass[0]`);

        const [ stage0, stage1 ] = pass0.stages;
        if (!stage0 || !stage1) throw new Error(`Technique "${technique}" pass[0] missing stages`);

        const code = (stage0.shaderCode || "") + (stage1.shaderCode || "");
        if (!code) throw new Error("Debug mode must be enabled when the shader was created");

        // Input definitions
        pass0.shaderProgram.input.elementsSorted.forEach(x => { result.inputDefinitions[x._attr] = x.string; });
        stage0.inputDefinition.elementsSorted.forEach(x => { result.vs.inputDefinitions.push(x.string); });
        stage1.inputDefinition.elementsSorted.forEach(x => { result.ps.inputDefinitions.push(x.string); });

        const lines = code.split(/\r\n|\r|\n/);

        // Constant buffer handlers
        const CBH = {
            cb0: { name: "ConstantVertex",       source: stage0,                                     target: result.vs.parameter, isStage: true,  short: "cb0" },
            cb1: { name: "PerFrameVS",           source: perFrameVSData,                             target: result.vs.frame,     isStage: false, short: "cb1" },
            cb2: { name: "PerFramePS",           source: perFramePSData,                             target: result.ps.frame,     isStage: false, short: "cb2" },
            cb3: { name: "PerObjectVS",          source: perObjectData.vs  || perObjectData._perFrameVS, target: result.vs.object, isStage: false, short: "cb3" },
            cb4: { name: "PerObjectPS",          source: perObjectData.ps  || perObjectData._perFramePS, target: result.ps.object, isStage: false, short: "cb4" },
            cb5: { name: "PerObjectFFE",         source: perObjectData.ffe,                          target: result.ffe.object,   isStage: false, short: "cb5" },
            cb7: { name: "ConstantFragment",     source: stage1,                                     target: result.ps.parameter, isStage: true,  short: "cb7" }
        };

        const CBHReverse = {
            "ConstantVertex":   "cb0",
            "PerFrameVS":       "cb1",
            "PerObjectVS":      "cb3",
            "PerFramePS":       "cb2",
            "PerObjectPS":      "cb4",
            "PerObjectFFE":     "cb5",
            "ConstantFragment": "cb7"
        };

        const Swizzle = [ "x", "y", "z", "w" ];

        // ---------------------------------------------------------------------
        // Aggregation: collect per-register lane usage, then emit minimal masks.
        // Keyed by (cbShort, registerIndex, logicalName).
        // ---------------------------------------------------------------------
        function makeAgg()
        {
            return {
                used: [ false, false, false, false ],
                vals: [ null, null, null, null ]
            };
        }

        function aggWrite(target, cbShort, regIndex, logicalName, laneIndex, value)
        {
            const baseKey = `${cbShort}[${regIndex}]_${logicalName}`;
            let rec = target.__agg?.[baseKey];
            if (!rec)
            {
                target.__agg = target.__agg || {};
                rec = target.__agg[baseKey] = makeAgg();
            }

            rec.used[laneIndex] = true;
            rec.vals[laneIndex] = value;
        }

        function maskAndPack(rec)
        {
            // If all lanes used => xyzw only (dedupe rule)
            if (rec.used[0] && rec.used[1] && rec.used[2] && rec.used[3])
            {
                return [ { mask: "xyzw", arr: [ rec.vals[0], rec.vals[1], rec.vals[2], rec.vals[3] ] } ];
            }

            // Prefer common packed masks if they match exactly
            const u = rec.used;

            const pack = [];
            if (u[0] && u[1] && u[2] && !u[3]) pack.push({ mask: "xyz", arr: [ rec.vals[0], rec.vals[1], rec.vals[2] ] });
            else if (u[0] && u[1] && !u[2] && !u[3]) pack.push({ mask: "xy", arr: [ rec.vals[0], rec.vals[1] ] });
            else if (!u[0] && u[1] && u[2] && u[3]) pack.push({ mask: "yzw", arr: [ rec.vals[1], rec.vals[2], rec.vals[3] ] });
            else if (!u[0] && !u[1] && u[2] && u[3]) pack.push({ mask: "zw", arr: [ rec.vals[2], rec.vals[3] ] });
            else
            {
                // Fallback: individual lanes
                if (u[0]) pack.push({ mask: "x", arr: [ rec.vals[0] ] });
                if (u[1]) pack.push({ mask: "y", arr: [ rec.vals[1] ] });
                if (u[2]) pack.push({ mask: "z", arr: [ rec.vals[2] ] });
                if (u[3]) pack.push({ mask: "w", arr: [ rec.vals[3] ] });
            }

            return pack;
        }

        function flushAgg(target)
        {
            const agg = target.__agg;
            if (!agg) return;

            for (const baseKey in agg)
            {
                const rec = agg[baseKey];

                // baseKey format: "cbN[reg]_Name"
                const m = baseKey.match(/^(cb[0-7])\[(\d+)\]_(.+)$/);
                if (!m) continue;

                const cbShort = m[1];
                const reg = m[2];
                const logicalName = m[3];

                const packed = maskAndPack(rec);
                for (let i = 0; i < packed.length; i++)
                {
                    const k = `${cbShort}[${reg}].${packed[i].mask}_${logicalName}`;
                    target[k] = packed[i].arr;
                }
            }

            // Remove internal aggregation storage
            Reflect.deleteProperty(target, "__agg");
        }

        // ---------------------------------------------------------------------
        // Resolve a float-indexed reference against Tw2RawData and write it
        // as per-register usage.
        // ---------------------------------------------------------------------
        function parsePer(per, floatIndex)
        {
            const el = per.source.FindElementFromIndex(floatIndex);
            if (!el)
            {
                throw new Error(`Error finding element in ${per.name} at float index: ${floatIndex}`);
            }

            const { offset, name: logicalName, array } = el;
            const ix = floatIndex - offset;

            // Global register/lane location within THIS cb (floatIndex is cb-local)
            const regIndex = (floatIndex / 4) | 0;
            const lane = floatIndex & 3;

            // Value from the element's array (element-local index)
            const v = array[ix];

            aggWrite(per.target, per.short, regIndex, logicalName, lane, v);
        }

        // ---------------------------------------------------------------------
        // Resolve a stage constant (or stage per-frame/per-object reference)
        // and write it as per-register usage.
        // ---------------------------------------------------------------------
        function parseStage(stage, floatIndex)
        {
            const { source } = stage;
            const { constants, constantValues } = source;

            for (let i = 0; i < constants.length; i++)
            {
                const c = constants[i];
                const { offset, name: logicalName, type, size } = c;

                if (floatIndex < offset || floatIndex > offset + size - 1) continue;

                const ix = floatIndex - offset;

                // If type===3, this is a "Per*" indirection into another CB
                if (type === 3)
                {
                    const cbShort = CBHReverse[logicalName];
                    if (!cbShort) throw new Error(`Unknown per-buffer reference "${logicalName}"`);
                    parsePer(CBH[cbShort], ix);
                }
                else
                {
                    // Stage-local constant values (cb0/cb7 etc)
                    const regIndex = (floatIndex / 4) | 0;
                    const lane = floatIndex & 3;
                    const v = constantValues[offset + ix];

                    aggWrite(stage.target, stage.short, regIndex, logicalName, lane, v);
                }

                return;
            }

            throw new Error(`Error finding stage constant in ${stage.name} at float index: ${floatIndex}`);
        }

        // ------------------------------
        // PASS 1: find cb[] usage
        // ------------------------------
        for (let li = 0; li < lines.length; li++)
        {
            const line = lines[li];
            if (!line) continue;

            // Skip cb uniform declarations
            if (line.includes("uniform vec4 cb")) continue;

            // Find cb0..cb7 indexed usage with optional swizzle
            const match = line.match(/cb[0123457]\[\d+\](?:\.[xyzw]{1,4})?/g);
            if (!match) continue;

            for (let mi = 0; mi < match.length; mi++)
            {
                const token = match[mi];
                const parts = token.split(".");

                const cbh = parts[0].match(/(cb[0-7])/)[0];
                const regIndex = parseInt(parts[0].replace(cbh, "").replace("[", "").replace("]", ""), 10);

                const swizzle = parts[1] || null;
                const lanes = swizzle
                    ? swizzle.split("").map(ch => Swizzle.indexOf(ch))
                    : [ 0, 1, 2, 3 ];

                const source = CBH[cbh];

                for (let ei = 0; ei < lanes.length; ei++)
                {
                    const floatIndex = regIndex * 4 + lanes[ei];
                    if (source.isStage) parseStage(source, floatIndex);
                    else parsePer(source, floatIndex);
                }
            }
        }

        // Flush aggregated values (this is where dedupe happens)
        flushAgg(result.vs.frame);
        flushAgg(result.vs.object);
        flushAgg(result.vs.parameter);
        flushAgg(result.ps.frame);
        flushAgg(result.ps.object);
        flushAgg(result.ps.parameter);
        flushAgg(result.ffe.object);

        // ------------------------------
        // PASS 2: Collect USED samplers/textures
        // ------------------------------
        function collectStageTextures(stage, outTarget)
        {
            const stageTextures = stage?.textures;
            if (!stageTextures) return;

            // Find s0..s31 usage, avoid matching identifiers like "ss0"
            const samplerMatches = code.match(/(^|[^a-zA-Z0-9_])(s\d{1,2})([^a-zA-Z0-9_]|$)/g);
            if (!samplerMatches) return;

            const used = new Set();
            for (let i = 0; i < samplerMatches.length; i++)
            {
                const m = samplerMatches[i].match(/s(\d{1,2})/);
                if (!m) continue;
                used.add(parseInt(m[1], 10));
            }

            used.forEach(slot =>
            {
                const texParam = stageTextures[slot];
                if (!texParam) return;

                const texRes = texParam.textureRes;
                const path = texRes?.path || texParam.resourcePath || "";
                const name = texParam.name || texParam.parameter?.name || `s${slot}`;

                outTarget[name] = {
                    slot,
                    path,
                    width: texRes?._width,
                    height: texRes?._height,
                    isCube: !!texRes?._isCube
                };
            });
        }

        collectStageTextures(stage0, result.vs.textures);
        collectStageTextures(stage1, result.ps.textures);

        return result;
    }


    /**
     * Applies an Effect Pass
     * @param {String} technique        - technique name
     * @param {Number} pass             - effect.passes index
     * @param {Array} [stateOverride<{ state: Number, value: Number|Boolean }>]   - state override
     */
    ApplyPass(technique, pass, stateOverride)
    {
        this.techniques[technique].passes[pass].Apply(stateOverride);
    }

    /**
     * Gets shader parameter names
     * @param {Object} [out={}]
     * @param {Object} [mask]
     * @return {Object} out
     */
    GetParameterNames(out={}, mask)
    {
        if (mask && mask.technique)
        {
            return this.techniques[mask.technique] ? this.techniques[mask.technique].GetParameterNames(out, mask) : out;
        }

        for (const technique in this.techniques)
        {
            if (this.techniques.hasOwnProperty(technique))
            {
                this.techniques[technique].GetParameterNames(out, mask);
            }
        }

        return out;
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
     * Creates a shader from JSON
     * @param {Object} json
     * @param {Tw2EffectRes} context
     * @return {Tw2Shader}
     */
    static fromJSON(json, context)
    {
        let { techniques = {}, annotations = {} } = json;

        const shader = new Tw2Shader();

        for (const key in techniques)
        {
            if (techniques.hasOwnProperty(key))
            {
                shader.techniques[key] = Tw2ShaderTechnique.fromJSON(techniques[key], context, key);
            }
        }

        for (const key in annotations)
        {
            if (annotations.hasOwnProperty(key) && !context.annotations[key])
            {
                context.annotations[key] = Tw2ShaderAnnotation.fromJSON(annotations[key], context, key);
            }
        }

        shader.annotations = context.annotations;

        return shader;
    }

    /**
     * Reads ccp shader binary
     * @param {Tw2BinaryReader} reader
     * @param {Tw2EffectRes} context
     * @return {Tw2Shader}
     */
    static fromCCPBinary(reader, context)
    {
        const shader = new Tw2Shader();

        //  Techniques
        const techniqueCount = context.version > 6 ? reader.ReadUInt8() : 1;
        for (let i = 0; i < techniqueCount; i++)
        {
            const name = context.version > 6 ? context.ReadString() : "Main";

            if (shader.techniques[name])
            {
                throw new Error("Invalid technique, already defined: " + name);
            }
            shader.techniques[name] = Tw2ShaderTechnique.fromCCPBinary(reader, context, name);
        }

        // Annotations
        const parameterCount = reader.ReadUInt16();
        for (let paramIx = 0; paramIx < parameterCount; ++paramIx)
        {
            const annotation = Tw2ShaderAnnotation.fromCCPBinary(reader, context);
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
