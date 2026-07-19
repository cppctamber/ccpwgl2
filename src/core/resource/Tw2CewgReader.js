import { device } from "global";
import {
    ErrShaderCompile,
    Tw2Shader,
    Tw2ShaderPass,
    Tw2ShaderProgram,
    Tw2ShaderStage,
    Tw2ShaderStageConstant,
    Tw2ShaderStageTexture,
    Tw2ShaderTechnique
} from "core/shader";
import { Tw2SamplerState } from "core/sampler";
import { Tw2VertexElement } from "core/vertex";


const STAGE_VERTEX = Tw2ShaderStage.Type.VERTEX;
const STAGE_FRAGMENT = Tw2ShaderStage.Type.FRAGMENT;
const TEXTURE_2D = 2;

/**
 * Carbon metadata -> ccpwgl/SOF constant-name aliases.
 *
 * The DX11 pattern bodies name their two pattern materials as palette
 * slots 5 and 6 (Mtl5.../Mtl6..., cb7[18-23]), but CCP's engine data and
 * ccpwgl's entire SOF pipeline address the same values as pattern
 * materials 1 and 2 (PMtl1.../PMtl2...) - the engine remaps when
 * applying patterns. ccpwgl binds constants by name, so translate at
 * this reader boundary (same policy as the package-time
 * BINORMAL->BITANGENT attribute alias: runtime-ABI naming translation
 * belongs at the boundary, not in the GLSL emitter).
 */
const CARBON_TO_SOF_CONSTANT_NAMES = {
    Mtl5DiffuseColor: "PMtl1DiffuseColor",
    Mtl5FresnelColor: "PMtl1FresnelColor",
    Mtl5Gloss: "PMtl1Gloss",
    Mtl6DiffuseColor: "PMtl2DiffuseColor",
    Mtl6FresnelColor: "PMtl2FresnelColor",
    Mtl6Gloss: "PMtl2Gloss"
};

const textDecoder = new TextDecoder("utf-8", { fatal: false });


/**
 * CEWG v1 package reader (chunked container of JSON + binary chunks).
 *
 * Package layout: "CEWG" magic, uint32 version, uint32 chunk count, then per
 * chunk a 4-char tag, uint32 size and raw bytes. Standard chunks: INFO, META,
 * GLSL (JSON) and optional TR2E (original effect bytes).
 */
export class Tw2CewgPackageReader
{

    version = 0;
    chunks = [];
    chunkMap = new Map();
    readError = null;

    /**
     * Reads CEWG bytes.
     * @param {ArrayBuffer|ArrayBufferView} source
     * @returns {boolean} true when read successfully
     */
    Read(source)
    {
        this.version = 0;
        this.chunks = [];
        this.chunkMap = new Map();
        this.readError = null;

        try
        {
            const bytes = normalizeBytes(source);
            const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
            let offset = 0;

            const magic = readAscii(bytes, offset, 4);
            offset += 4;
            if (magic !== "CEWG") throw new Error(`Invalid CEWG magic: ${magic}`);

            this.version = view.getUint32(offset, true);
            offset += 4;
            if (this.version !== 1) throw new Error(`Unsupported CEWG version: ${this.version}`);

            const chunkCount = view.getUint32(offset, true);
            offset += 4;
            for (let i = 0; i < chunkCount; i++)
            {
                const tag = readAscii(bytes, offset, 4);
                offset += 4;
                const size = view.getUint32(offset, true);
                offset += 4;
                const chunk = { tag, size, bytes: bytes.subarray(offset, offset + size) };
                offset += size;
                this.chunks.push(chunk);
                this.chunkMap.set(tag, chunk);
            }

            if (offset !== bytes.length) throw new Error(`CEWG trailing bytes: ${bytes.length - offset}`);
            return true;
        }
        catch (err)
        {
            this.readError = err;
            return false;
        }
    }

    /**
     * Gets a chunk as JSON
     * @param {String} tag
     * @returns {Object|null}
     */
    GetJson(tag)
    {
        const chunk = this.chunkMap.get(tag) || null;
        return chunk ? JSON.parse(textDecoder.decode(chunk.bytes)) : null;
    }
}


/**
 * Builds ccpwgl shader objects from CEWG package data.
 *
 * Consumes packages produced by hlslreader's JS emitter (translator
 * "dxbc-js-emitter"): GLSL is load-ready (cb# uniform arrays with the PS
 * cb0->cb7 remap, s#/vs# sampler names, semantic in_* attribute names), and
 * every shader record carries the emitter's binding manifest. There is no
 * source rewriting here by design — if a package needs rewriting, fix the
 * emitter, not the loader.
 */
export class Tw2CewgShaderFactory
{

    /**
     * Builds package indexes used by shader construction.
     * @param {Object} metadata  META chunk JSON
     * @param {Object} glslSet   GLSL chunk JSON
     */
    constructor(metadata, glslSet)
    {
        this.metadata = metadata;
        this.glslSet = glslSet;
        this.permutations = Array.isArray(metadata.permutations) ? metadata.permutations : [];

        this._bodiesByKey = new Map();
        this._glslBodiesByKey = new Map();
        this._glslStagesByKey = new Map();
        this._glslShadersByKey = new Map();
        this._variantBodiesByIndex = new Map();

        for (const body of metadata.bodies || []) this._bodiesByKey.set(body.key, body);
        for (const body of glslSet.bodies || []) this._glslBodiesByKey.set(body.key, body);
        for (const stage of glslSet.stages || []) this._glslStagesByKey.set(stage.key, stage);
        for (const shader of glslSet.shaders || []) this._glslShadersByKey.set(shader.key, shader);
        for (const variant of glslSet.variants || [])
        {
            this._variantBodiesByIndex.set(variant.permutationIndex, variant.bodyKey);
        }
    }

    /**
     * Resolves ccpwgl effect options to Carbon's mixed-radix permutation index
     * @param {Object.<string,string>} options
     * @returns {Number}
     */
    ResolvePermutationIndex(options = {})
    {
        let index = 0;
        let multiplier = 1;

        for (const permutation of this.permutations)
        {
            let optionIndex = permutation.defaultOption || 0;
            if (Object.prototype.hasOwnProperty.call(options, permutation.name))
            {
                const selectedIndex = permutation.options.indexOf(options[permutation.name]);
                if (selectedIndex >= 0) optionIndex = selectedIndex;
            }
            index += optionIndex * multiplier;
            multiplier *= permutation.options.length || 1;
        }
        return index;
    }

    /**
     * Creates a ccpwgl shader for a permutation index
     * @param {Number} permutationIndex
     * @param {String} path              resource path for errors
     * @returns {Tw2Shader}
     */
    CreateShader(permutationIndex, path)
    {
        const bodyKey = this._variantBodiesByIndex.get(permutationIndex) || this.glslSet.variants?.[0]?.bodyKey;
        const body = this._bodiesByKey.get(bodyKey);
        const glslBody = this._glslBodiesByKey.get(bodyKey);
        if (!body || !glslBody || body.error)
        {
            throw new Error(`CEWG body is not available: ${bodyKey} ${body?.error || ""}`);
        }

        const shader = new Tw2Shader();
        const grouped = this._groupStagesByPass(body, glslBody);

        for (const groupKey in grouped)
        {
            if (!Object.prototype.hasOwnProperty.call(grouped, groupKey)) continue;
            const group = grouped[groupKey];
            const techniqueName = group.techniqueName || "Main";
            const technique = shader.techniques[techniqueName] || new Tw2ShaderTechnique();
            technique.name = techniqueName;
            shader.techniques[techniqueName] = technique;
            technique.passes[group.passIndex] = this._createPass(group, path);
        }

        shader.annotations = {};
        return shader;
    }

    /**
     * Groups stage records into technique/pass pairs
     * @param {Object} body
     * @param {Object} glslBody
     * @returns {Object.<string,Object>}
     */
    _groupStagesByPass(body, glslBody)
    {
        const manifestStages = new Map();
        for (const stage of body.manifest?.stages || [])
        {
            manifestStages.set(stageKey(stage), stage);
        }

        const grouped = {};
        for (const stageKeyValue of glslBody.stages || [])
        {
            const glslStage = this._glslStagesByKey.get(stageKeyValue);
            if (!glslStage) continue;
            if (glslStage.stageName !== "vertex" && glslStage.stageName !== "pixel") continue;

            const key = `${glslStage.techniqueName || "Main"}:${glslStage.passIndex || 0}`;
            grouped[key] = grouped[key] || {
                techniqueName: glslStage.techniqueName || "Main",
                passIndex: glslStage.passIndex || 0,
                vertex: null,
                pixel: null
            };

            grouped[key][glslStage.stageName] = {
                glslStage,
                manifestStage: manifestStages.get(stageKey(glslStage)),
                shaderRecord: this._glslShadersByKey.get(glslStage.shaderKey)
            };
        }
        return grouped;
    }

    /**
     * Creates and links one shader pass
     * @param {Object} group
     * @param {String} path
     * @returns {Tw2ShaderPass}
     */
    _createPass(group, path)
    {
        if (!group.vertex || !group.pixel)
        {
            throw new Error(`CEWG pass is missing vertex or pixel shader: ${group.techniqueName}[${group.passIndex}]`);
        }

        const pass = new Tw2ShaderPass();
        pass.isCewg = true;
        pass.stages[0] = this._createStage(group.vertex, STAGE_VERTEX, path);
        pass.stages[1] = this._createStage(group.pixel, STAGE_FRAGMENT, path);
        pass.shaderProgram = Tw2ShaderProgram.create(
            pass.stages[0].shader,
            pass.stages[1].shader,
            pass,
            { path }
        );
        pass.shadowShaderProgram = pass.shaderProgram;
        return pass;
    }

    /**
     * Creates one shader stage from CEWG records
     * @param {Object} stageRecord
     * @param {Number} stageType
     * @param {String} path
     * @returns {Tw2ShaderStage}
     */
    _createStage(stageRecord, stageType, path)
    {
        const { glslStage, manifestStage, shaderRecord } = stageRecord;
        if (shaderRecord?.excluded)
        {
            throw new Error(`CEWG shader is excluded for WebGL2: ${glslStage.shaderKey} (${shaderRecord.excluded.reason})`);
        }
        if (!shaderRecord?.source)
        {
            throw new Error(`CEWG shader source is missing: ${glslStage.shaderKey}`);
        }

        const stage = new Tw2ShaderStage();
        stage.type = stageType;
        stage.shaderCode = shaderRecord.source;
        stage.inputDefinition = buildInputDefinition(shaderRecord, manifestStage, stageType);
        buildConstants(stage, manifestStage, shaderRecord);
        buildTexturesAndSamplers(stage, manifestStage, shaderRecord);
        // New-format binding kinds (structuredUbo bones, structuredTexture
        // lights, bufferTexture post-fx) ride along for the CEWG program/
        // upload layer; legacy Tw2Effect binding ignores them.
        stage.cewgBindings = shaderRecord.bindings || [];
        stage.shader = compileShader(stageType, stage.shaderCode, path);
        return stage;
    }
}


/**
 * Builds a stable stage key from a manifest or GLSL stage record
 * @param {Object} stage
 * @returns {String}
 */
function stageKey(stage)
{
    return `${stage.techniqueName || "Main"}.pass${stage.passIndex || 0}.${stage.stageName}`;
}

/**
 * Builds the vertex input definition, binding attributes by their emitted
 * GLSL names (joined to Carbon pipeline inputs by register, so semantic
 * naming drift like BINORMAL/BITANGENT cannot break the mapping)
 * @param {Object} shaderRecord
 * @param {Object} manifestStage
 * @param {Number} stageType
 * @returns {Tw2VertexDeclaration}
 */
function buildInputDefinition(shaderRecord, manifestStage, stageType)
{
    const stage = new Tw2ShaderStage();
    if (stageType !== STAGE_VERTEX || !manifestStage) return stage.inputDefinition;

    const emitted = new Map();
    for (const input of shaderRecord.stageInputs || [])
    {
        emitted.set(input.register, input);
    }

    for (const input of manifestStage.pipelineInputs || [])
    {
        if (input.usedMask === 0) continue;
        const emittedInput = emitted.get(input.registerIndex);
        if (!emittedInput) continue;

        // The manifest's numeric `usage` is Trinity's vertex-usage enum,
        // which is what Tw2VertexElement.Type now follows (the legacy
        // GLES convention is translated away at its readers). The
        // usageName lookup is drift armor only — it wins if the numeric
        // code and the name ever disagree.
        let usage = Tw2VertexElement.Type[input.usageName] !== undefined
            ? Tw2VertexElement.Type[input.usageName]
            : input.usage;

        stage.inputDefinition.elements.push(Tw2VertexElement.from({
            usage,
            usageIndex: input.usageIndex,
            type: 0,
            registerIndex: input.registerIndex,
            usedMask: input.usedMask,
            attr: emittedInput.name
        }));
    }

    stage.inputDefinition.RebuildHash();
    return stage.inputDefinition;
}

/**
 * Builds local stage constants from Carbon constant-buffer metadata
 * @param {Tw2ShaderStage} stage
 * @param {Object} manifestStage
 * @param {Object} shaderRecord emitter shader record (binding declarations)
 */
function buildConstants(stage, manifestStage, shaderRecord)
{
    const binding = (manifestStage?.bindings || []).find((entry) =>
        entry.kind === "constantBuffer" &&
        entry.registerIndex === 0
    );
    const declaration = (shaderRecord?.bindings || []).find((entry) =>
        entry.kind === "constantBuffer" &&
        entry.registerIndex === 0
    );
    const constants = binding?.carbon?.constants || [];

    if (!binding && !declaration)
    {
        stage.constantSize = 0;
        stage.constantValues = new Float32Array(0);
        return;
    }

    // Some packages omit or under-report constantValueSize. The emitted
    // declaration and the end of the final named constant are independent
    // authorities, so allocate for the largest and pad to a vec4 register.
    const declaredSize = (declaration?.sizeInVec4 || 0) * 4;
    const defaultValueSize = bytesToFloats(binding?.carbon?.constantValueSize || 0);
    const constantsSize = constants.reduce((size, item) =>
    {
        return Math.max(size, Math.ceil(((item.offset || 0) + (item.size || 0)) / 4));
    }, 0);
    const constantValueSize = (Math.max(declaredSize, defaultValueSize, constantsSize) + 3) & ~3;
    stage.constantValues = new Float32Array(constantValueSize);
    stage.constantSize = constantValueSize;

    for (const item of constants)
    {
        const size = bytesToFloats(item.size || 0);
        const offset = bytesToFloats(item.offset || 0);
        if (!item.name || !size) continue;

        stage.constants.push(Tw2ShaderStageConstant.fromJSON({
            name: CARBON_TO_SOF_CONSTANT_NAMES[item.name] || item.name,
            offset,
            size,
            dimension: item.dimension || 4,
            elements: item.elements || 1,
            isSRGB: item.isSRGB || false,
            isAutoregister: item.isAutoregister || false,
            type: item.type || 0,
            value: item.value || []
        }, null));
    }

    stage.constants.sort((a, b) => a.offset - b.offset);
}

/**
 * Builds texture and sampler definitions from Carbon resource bindings
 * @param {Tw2ShaderStage} stage
 * @param {Object} manifestStage
 * @param {Object} shaderRecord emitter shader record (binding manifest)
 */
function buildTexturesAndSamplers(stage, manifestStage, shaderRecord)
{
    const bindings = manifestStage?.bindings || [];

    // Registers the emitter lowered to non-texture GLSL bindings (bone UBOs,
    // light/index data textures, post-fx buffer textures) are not sampler
    // uniforms — their upload path is the CEWG binding layer, not Tw2Effect.
    const nonTextureRegisters = new Set(
        (shaderRecord?.bindings || [])
            .filter((entry) => entry.kind === "structuredUbo"
                || entry.kind === "structuredTexture"
                || entry.kind === "bufferTexture")
            .map((entry) => entry.registerIndex)
    );

    const samplersByRegister = new Map(
        bindings
            .filter((entry) => entry.kind === "sampler")
            .map((entry) => [ entry.registerIndex, entry ])
    );
    const emittedResourcesByRegister = new Map(
        (shaderRecord?.bindings || [])
            .filter((entry) => entry.kind === "resource")
            .map((entry) => [ entry.registerIndex, entry ])
    );

    for (const resource of bindings.filter((entry) => entry.kind === "resource"))
    {
        if (nonTextureRegisters.has(resource.registerIndex)) continue;
        const name = resource.metadataName || resource.carbon?.name || resource.generatedSymbol || `Texture${resource.registerIndex}`;
        const type = resource.carbon?.type || TEXTURE_2D;
        const texture = Tw2ShaderStageTexture.fromJSON({
            name,
            registerIndex: resource.registerIndex,
            type,
            isSRGB: resource.carbon?.isSRGB || false,
            isAutoregister: resource.carbon?.isAutoregister || false
        }, null);

        stage.textures.push(texture);

        const emittedResource = emittedResourcesByRegister.get(resource.registerIndex);
        const pairedRegister = getSamplerRegisterIndex(resource, emittedResource);
        const samplerBinding = pairedRegister !== null
            ? samplersByRegister.get(pairedRegister)
            : samplersByRegister.get(resource.registerIndex)
                || (samplersByRegister.size === 1 ? samplersByRegister.values().next().value : samplersByRegister.get(0));
        const sampler = samplerBinding?.carbon?.sampler || {};
        const samplerState = Tw2SamplerState.fromJSON({
            name: samplerBinding?.metadataName || `${name}Sampler`,
            registerIndex: samplerBinding?.registerIndex ?? texture.registerIndex,
            samplerType: texture.glType,
            isVolume: texture.isVolume,
            type,
            comparison: emittedResource?.comparison === true,
            comparisonFunc: sampler.comparisonFunc,
            addressUMode: sampler.addressU,
            addressVMode: sampler.addressV,
            addressWMode: sampler.addressW,
            filterMode: sampler.minFilter,
            mipFilterMode: sampler.mipFilter,
            magFilterMode: sampler.magFilter,
            maxAnisotropy: sampler.maxAnisotropy
        }, null);

        // Tw2Effect historically inferred pairing from equal registers. Keep a
        // direct link so CEWG can preserve t#/s# pairs when the package carries
        // decoded instruction-use metadata with a different sampler register.
        texture._sampler = samplerState;
        samplerState._textureRegisterIndex = texture.registerIndex;
        stage.samplers.push(samplerState);
    }

    stage.textures.sort((a, b) => a.registerIndex - b.registerIndex);
    stage.samplers.sort((a, b) => a.registerIndex - b.registerIndex);
}

/**
 * Gets an explicitly paired sampler register from CEWG metadata
 * @param {Object} resource Carbon resource binding
 * @param {Object} emittedResource emitter resource binding
 * @returns {Number|null}
 */
function getSamplerRegisterIndex(resource, emittedResource)
{
    const sources = [ emittedResource, resource, resource?.carbon ];
    for (const source of sources)
    {
        if (!source) continue;
        if (Number.isInteger(source.samplerRegisterIndex)) return source.samplerRegisterIndex;
        if (Array.isArray(source.samplerRegisterIndices))
        {
            const registers = [ ...new Set(source.samplerRegisterIndices.filter(Number.isInteger)) ];
            if (registers.length === 1) return registers[0];
            if (registers.length > 1)
            {
                const name = resource.metadataName || resource.carbon?.name || resource.generatedSymbol || `t${resource.registerIndex}`;
                throw new Error(`CEWG resource '${name}' uses multiple sampler registers: ${registers.join(", ")}`);
            }
        }
    }
    return null;
}

/**
 * Compiles GLSL for one stage
 * @param {Number} stageType
 * @param {String} shaderCode
 * @param {String} path
 * @returns {WebGLShader}
 */
function compileShader(stageType, shaderCode, path)
{
    const { gl } = device;
    const shader = gl.createShader(stageType === STAGE_VERTEX ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER);
    gl.shaderSource(shader, shaderCode);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
    {
        throw new ErrShaderCompile({
            path,
            shaderType: stageType === STAGE_VERTEX ? "vertex" : "fragment",
            infoLog: gl.getShaderInfoLog(shader)
        });
    }
    return shader;
}

/**
 * Normalizes a binary source to a Uint8Array view
 * @param {ArrayBuffer|ArrayBufferView} source
 * @returns {Uint8Array}
 */
function normalizeBytes(source)
{
    if (source instanceof Uint8Array) return source;
    if (source instanceof ArrayBuffer) return new Uint8Array(source);
    if (ArrayBuffer.isView(source)) return new Uint8Array(source.buffer, source.byteOffset, source.byteLength);
    throw new Error("Unsupported CEWG source bytes");
}

/**
 * Reads ASCII text
 * @param {Uint8Array} bytes
 * @param {Number} offset
 * @param {Number} size
 * @returns {String}
 */
function readAscii(bytes, offset, size)
{
    let out = "";
    for (let i = 0; i < size; i++)
    {
        out += String.fromCharCode(bytes[offset + i]);
    }
    return out;
}

/**
 * Converts a byte count to float count
 * @param {Number} value
 * @returns {Number}
 */
function bytesToFloats(value)
{
    return Math.floor((value || 0) / 4);
}
