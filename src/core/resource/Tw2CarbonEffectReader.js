import { device } from "global";
import {
    GL_TEXTURE_2D,
    GL_TEXTURE_2D_ARRAY,
    GL_TEXTURE_3D,
    GL_TEXTURE_CUBE_MAP
} from "constant";
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
 * GL binding target per emitted GLSL sampler keyword. The emitter is the only
 * authority that knows a resource's real dimensionality — see the note at the
 * sampler construction below.
 */
const GLSL_SAMPLER_TARGETS = {
    sampler2D: GL_TEXTURE_2D,
    sampler2DShadow: GL_TEXTURE_2D,
    sampler3D: GL_TEXTURE_3D,
    samplerCube: GL_TEXTURE_CUBE_MAP,
    samplerCubeShadow: GL_TEXTURE_CUBE_MAP,
    sampler2DArray: GL_TEXTURE_2D_ARRAY,
    sampler2DArrayShadow: GL_TEXTURE_2D_ARRAY
};

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
 * Carbon v1 package reader (chunked container of JSON + binary chunks).
 *
 * Package layout: "Carbon" magic, uint32 version, uint32 chunk count, then per
 * chunk a 4-char tag, uint32 size and raw bytes. Standard chunks: INFO, META,
 * GLSL (JSON) and optional TR2E (original effect bytes).
 */
export class Tw2CarbonPackageReader
{

    version = 0;
    chunks = [];
    chunkMap = new Map();
    readError = null;

    /**
     * Reads Carbon bytes.
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
            // Four bytes on disk, not vocabulary. The CEWG *name* is retired but
            // the magic in already-written files is unchanged, so this literal
            // must keep its old spelling or nothing parses.
            if (magic !== "CEWG") throw new Error(`Invalid CEWG magic: ${magic}`);

            this.version = view.getUint32(offset, true);
            offset += 4;
            if (this.version !== 1) throw new Error(`Unsupported Carbon version: ${this.version}`);

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

            if (offset !== bytes.length) throw new Error(`Carbon trailing bytes: ${bytes.length - offset}`);
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
 * Builds ccpwgl shader objects from Carbon package data.
 *
 * Consumes packages produced by hlslreader's JS emitter (translator
 * "dxbc-js-emitter"): GLSL is load-ready (cb# uniform arrays with the PS
 * cb0->cb7 remap, s#/vs# sampler names, semantic in_* attribute names), and
 * every shader record carries the emitter's binding manifest. There is no
 * source rewriting here by design — if a package needs rewriting, fix the
 * emitter, not the loader.
 */
export class Tw2CarbonShaderFactory
{


    /**
     * Builds the indexes shader construction walks.
     *
     * Both inputs come from `@carbonenginejs/runtime-resource/formats/webgl`
     * reading one Carbon v15 container. There are no chunks: `read()` returns a
     * flat stage/shader graph, and each stage carries its own manifest rather
     * than being paired against a separate META body.
     *
     * @param {Object} readResult        `CjsWebglFormat.read(bytes)` output.
     * @param {Object} permutationGraph  Permutation axes and variants.
     */
    constructor(readResult, permutationGraph)
    {
        this.read = readResult;
        this.graph = permutationGraph || {};
        // Axes carry {name, options, defaultOption}, which is the shape the
        // mixed-radix resolver below already expects.
        this.permutations = Array.isArray(this.graph.axes) ? this.graph.axes : [];

        this._shadersByKey = new Map();
        this._stagesByBody = new Map();
        this._variantBodiesByIndex = new Map();

        for (const shader of readResult.shaders || [])
        {
            this._shadersByKey.set(shader.key, shader);
        }
        for (const stage of readResult.stages || [])
        {
            const list = this._stagesByBody.get(stage.bodyKey);
            if (list) list.push(stage);
            else this._stagesByBody.set(stage.bodyKey, [ stage ]);
        }

        // Bridge permutation index -> body through `read().bodies`, never
        // through the permutation graph's `bodyKey`.
        //
        // The graph spells the same body `body${N}` while the reader spells it
        // `body_${N}`, and they do not even partition bodies by the same rule:
        // the graph dedupes by content, the reader by source-record offset.
        // Mapping between the spellings looks like it works — the two ordinals
        // agree today only because the writer aliases byte-identical bodies
        // onto one offset — and fails silently when it stops being true, with
        // every permutation resolving to a body that does not exist.
        for (const body of readResult.bodies || [])
        {
            for (const permutationIndex of body.permutationIndices)
            {
                this._variantBodiesByIndex.set(permutationIndex, body.key);
            }
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
        const bodyKey = this._variantBodiesByIndex.get(permutationIndex)
            ?? this.graph.variants?.[0]?.bodyKey;

        if (!bodyKey || !this._stagesByBody.has(bodyKey))
        {
            throw new Error(`Carbon body is not available: ${bodyKey ?? `permutation ${permutationIndex}`}`);
        }

        const shader = new Tw2Shader();
        const grouped = this._groupStagesByPass(bodyKey);

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
    _groupStagesByPass(bodyKey)
    {
        const grouped = {};

        for (const glslStage of this._stagesByBody.get(bodyKey) || [])
        {
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
                // Each stage carries its own manifest now, so there is no
                // second lookup to keep in step with the stage list.
                manifestStage: glslStage.manifest,
                shaderRecord: this._shadersByKey.get(glslStage.shaderKey)
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
            throw new Error(`Carbon pass is missing vertex or pixel shader: ${group.techniqueName}[${group.passIndex}]`);
        }

        const pass = new Tw2ShaderPass();
        pass.isCarbon = true;
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
     * Creates one shader stage from Carbon records
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
            throw new Error(`Carbon shader is excluded for WebGL2: ${glslStage.shaderKey} (${shaderRecord.excluded.reason})`);
        }
        if (!shaderRecord?.source)
        {
            throw new Error(`Carbon shader source is missing: ${glslStage.shaderKey}`);
        }

        const stage = new Tw2ShaderStage();
        stage.type = stageType;
        stage.shaderCode = shaderRecord.source;
        stage.inputDefinition = buildInputDefinition(shaderRecord, manifestStage, stageType);
        buildConstants(stage, manifestStage, shaderRecord);
        buildTexturesAndSamplers(stage, manifestStage, shaderRecord);
        // New-format binding kinds (structuredUbo bones, structuredTexture
        // lights, bufferTexture post-fx) ride along for the Carbon program/
        // upload layer; legacy Tw2Effect binding ignores them.
        stage.carbonBindings = shaderRecord.bindings || [];
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

    // Seed the exact authored default bytes the container carries. Without
    // them every constant the scene does not override reads zero - the
    // background effect multiplies its output by Tint * NebulaIntensity, so
    // zero defaults render pure black while drawing "correctly", and hull
    // material factors go dark the same way.
    const defaultBytes = binding?.carbon?.constantValues;
    if (defaultBytes && defaultBytes.length >= 4)
    {
        const authored = new Float32Array(new Uint8Array(defaultBytes).buffer);
        stage.constantValues.set(authored.subarray(0, Math.min(authored.length, stage.constantValues.length)));
    }

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
            // Authored defaults from the seeded buffer, so parameters built
            // from these constants start at the values the artist shipped.
            value: item.value || Array.from(stage.constantValues.subarray(offset, offset + size))
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
    // uniforms — their upload path is the Carbon binding layer, not Tw2Effect.
    const nonTextureRegisters = new Set();
    for (const entry of shaderRecord?.bindings || [])
    {
        if (entry.kind === "structuredUbo"
            || entry.kind === "structuredTexture"
            || entry.kind === "bufferTexture")
        {
            nonTextureRegisters.add(entry.registerIndex);
        }

        // A lowering can stand in for more Carbon registers than the one it
        // declares. The packed local-light texture folds LightIndexBuffer,
        // LightBuffer and LightProfileArray into a single usampler2D, so it
        // reports only the index register. The other two are still described
        // by Carbon's reflection, and treating them as ordinary textures
        // fails hard: a structured buffer's Carbon type has no GL texture
        // target, so Tw2ShaderStageTexture rejects the definition outright.
        for (const register of [
            entry.lightIndexRegister,
            entry.lightDataRegister,
            entry.lightProfileRegister
        ])
        {
            if (Number.isInteger(register)) nonTextureRegisters.add(register);
        }
    }

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
        // `name` is what the container reader emits (Carbon's own resource
        // name); the others are the older chunk-manifest spellings. Without
        // `name` in this chain every texture falls through to the positional
        // `Texture<n>`, nothing binds AlbedoMap/NormalMap/etc, every sampler
        // reads an unbound texture and the surface renders pure black - while
        // the shader still links, draws and reports no error.
        const name = resource.name
            || resource.metadataName
            || resource.carbon?.name
            || resource.generatedSymbol
            || `Texture${resource.registerIndex}`;
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
        // Matching t# against s# by number is meaningless - it is what gave
        // NormalMap the clamp sampler - so it is only reachable when the package
        // carries no emitter data at all. When the emitter IS present and
        // recorded no pair, the texture is simply never sampled in this body
        // (SSAOMap and the shadow map in the pattern permutation), and the
        // shared default sampler is the honest answer rather than whichever
        // sampler happens to share its number.
        const defaultSampler = samplersByRegister.size === 1
            ? samplersByRegister.values().next().value
            : samplersByRegister.get(0);
        const samplerBinding = pairedRegister !== null
            ? samplersByRegister.get(pairedRegister)
            : emittedResource
                ? defaultSampler
                : samplersByRegister.get(resource.registerIndex) || defaultSampler;
        const sampler = samplerBinding?.carbon?.sampler || {};
        // The emitted GLSL declaration is the binding-target authority.
        // Carbon's own reflection cannot express a 2D array: the shader
        // compiler has no Texture2DArray case and stamps those resources
        // TEX_TYPE_TYPELESS (5), which the d3d table maps to TEXTURE_2D —
        // and binding a 2D texture to a sampler2DArray uniform makes WebGL2
        // reject the draw. When the emitter named the sampler type, use it;
        // `type` is withheld from the JSON in that case so ResolveModes
        // cannot re-derive the target from the typeless byte.
        const emittedTarget = GLSL_SAMPLER_TARGETS[emittedResource?.samplerType];
        // Carbon addresses a sampler override BY NAME, and only a dynamic
        // sampler keeps its name to be found by. So the authored name is the
        // override target when there is one; otherwise `<Texture>Sampler` is a
        // display label only, and `isDynamic` false stops it being registered as
        // an override target it cannot be in Carbon.
        const isDynamicSampler = sampler.isDynamic !== false && !!samplerBinding?.carbon?.name;
        const samplerState = Tw2SamplerState.fromJSON({
            name: samplerBinding?.carbon?.name || samplerBinding?.metadataName || `${name}Sampler`,
            isDynamic: isDynamicSampler,
            registerIndex: samplerBinding?.registerIndex ?? texture.registerIndex,
            samplerType: emittedTarget ?? texture.glType,
            isVolume: texture.isVolume,
            ...(emittedTarget === undefined ? { type } : {}),
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
        // direct link so Carbon can preserve t#/s# pairs when the package carries
        // decoded instruction-use metadata with a different sampler register.
        texture._sampler = samplerState;
        samplerState._textureRegisterIndex = texture.registerIndex;
        stage.samplers.push(samplerState);
    }

    stage.textures.sort((a, b) => a.registerIndex - b.registerIndex);
    stage.samplers.sort((a, b) => a.registerIndex - b.registerIndex);
}

/**
 * Gets an explicitly paired sampler register from Carbon metadata
 * @param {Object} resource Carbon resource binding
 * @param {Object} emittedResource emitter resource binding
 * @returns {Number|null}
 */
function getSamplerRegisterIndex(resource, emittedResource)
{
    // `pairedSamplerRegisters` is the general pairing the emitter recovers from
    // every DXBC sample instruction, and it is the ONLY correct source. Carbon's
    // reflection relates textures and samplers nowhere, so without it the caller
    // falls back to matching t# against s# by number - which is coincidence, and
    // which silently hands NormalMap the clamp sampler on every patterned hull.
    // See /docs/contracts/texture-sampler-pairing.md.
    const paired = emittedResource?.pairedSamplerRegisters;
    if (Array.isArray(paired))
    {
        const registers = [ ...new Set(paired.filter(Number.isInteger)) ].sort((a, b) => a - b);
        // A texture sampled through more than one sampler cannot be expressed by
        // one GLSL uniform, which carries a single sampler state. Ten shipped
        // effects do it (earthlikeplanet wrap+mirror, ssao mirror+clamp, the
        // point-filtered blits). Take the lowest register so the choice is at
        // least deterministic rather than declaration-order dependent; properly
        // supporting it means emitting one uniform per pair.
        if (registers.length) return registers[0];
    }

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
                throw new Error(`Carbon resource '${name}' uses multiple sampler registers: ${registers.join(", ")}`);
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
    throw new Error("Unsupported Carbon source bytes");
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
