const textDecoder = new TextDecoder("utf-8", { fatal: false });
const EXTENSION = "sm_converted_hi";
const TEXTURE_2D = 2;
let registeredTw2 = null;
let registeredClasses = null;

const SHADER_FILE_NAMES = {
    blinkinglightspool: "blinkinglightspool.sm_converted_hi",
    boostervolumetric: "boostervolumetric.sm_converted_hi",
    decalcounterv5: "decalcounterv5.sm_converted_hi",
    decalglowv5: "decalglowv5.sm_converted_hi",
    decalv5: "decalv5.sm_converted_hi",
    planeglow: "planeglow.sm_converted_hi",
    quadheatv5: "unpacked_quadheatv5.sm_converted_hi",
    quadv5: "unpacked_quadv5.sm_converted_hi",
    shadowdepth: "shadowdepth.sm_converted_hi",
    skinned_quadheatv5: "unpackedskinned_quadheatv5.sm_converted_hi",
    skinned_quadv5: "unpackedskinned_quadv5.sm_converted_hi",
    unpacked_fxbannerv5: "unpacked_fxbannerv5.sm_converted_hi"
};

/**
 * Registers Carbon converted shader support on a ccpwgl tw2 instance.
 *
 * @param {object} tw2 ccpwgl library instance.
 * @param {object} [options] Registration options.
 * @param {string} [options.extension="sm_converted_hi"] Resource extension.
 * @param {string} [options.quadV5Path] Converted QuadV5 package URL.
 * @param {Object.<string,string>} [options.shaderPaths] Converted shader URL overrides.
 * @returns {object} `tw2.carbon` helper namespace.
 */
export function RegisterCarbonShaders(tw2, options = {})
{
    if (!tw2?.Register)
    {
        throw new Error("RegisterCarbonShaders requires a ccpwgl tw2 instance");
    }

    const classes = resolveClasses(tw2);
    const extension = options.extension || EXTENSION;
    const shaderPaths = buildShaderPaths(options.shaderPaths);
    const quadV5Path = options.quadV5Path || shaderPaths.quadv5;
    shaderPaths.quadv5 = quadV5Path;
    const CarbonConvertedEffectRes = createCarbonConvertedEffectRes(tw2, classes, extension);
    registeredTw2 = tw2;
    registeredClasses = classes;

    tw2.Register({
        extensions: {
            [extension]: CarbonConvertedEffectRes
        }
    });

    EnsureCarbonDefaultVariables(tw2);

    tw2.carbon = {
        ...(tw2.carbon || {}),
        extension,
        extensions: {
            [extension]: CarbonConvertedEffectRes
        },
        CarbonConvertedEffectRes,
        QuadV5EveShip2PerObjectAdapter,
        shaderManifestPath: new URL("./shaders/ab-test-manifest.json", import.meta.url).href,
        shaderPaths,
        quadV5Path,
        Register: RegisterCarbonShaders,
        EnsureDefaultVariables: EnsureCarbonDefaultVariables,
        CreateQuadV5Effect: effectOptions => CreateQuadV5Effect(tw2, classes, quadV5Path, effectOptions),
        fetchDNA: (dna, fetchOptions) => fetchDNA(dna, fetchOptions),
        testWrapped: (ship, testOptions) => testWrapped(ship, testOptions),
        createAgentReport: (shipOrResult, reportOptions) => createAgentReport(shipOrResult, reportOptions),
        logAgentReport: (shipOrResult, reportOptions) => logAgentReport(shipOrResult, reportOptions),
        InstallQuadV5EveShip2Adapter,
        RemoveQuadV5EveShip2Adapter,
        InstallQuadV5TextureFallbacks: (effect, fallbackOptions) => InstallQuadV5TextureFallbacks(classes, effect, fallbackOptions),
        RemoveQuadV5TextureFallbacks
    };

    return tw2.carbon;
}

/**
 * Registers default resources that converted shaders expect.
 *
 * @param {object} tw2 ccpwgl library instance.
 * @returns {object} Registered defaults, or `{ deferred: true }`.
 */
export function EnsureCarbonDefaultVariables(tw2)
{
    if (!tw2.device?.gl)
    {
        if (!tw2._carbonDefaultVariablesPending)
        {
            tw2._carbonDefaultVariablesPending = true;
            tw2.OnceEvent("context_created", () =>
            {
                tw2._carbonDefaultVariablesPending = false;
                EnsureCarbonDefaultVariables(tw2);
            });
        }

        return { deferred: true };
    }

    const defaults = {};
    if (!tw2.HasVariable("SSAOMap"))
    {
        defaults.SSAOMap = "rgba:/255,255,255,255";
    }

    if (Object.keys(defaults).length)
    {
        tw2.Register({ variables: defaults });
    }

    return defaults;
}

/**
 * Builds converted shader URLs relative to this plugin.
 *
 * @param {Object.<string,string>} [overrides] Optional path overrides.
 * @returns {Object.<string,string>} Shader URL map.
 */
function buildShaderPaths(overrides = {})
{
    const paths = {};
    for (const key in SHADER_FILE_NAMES)
    {
        if (Object.prototype.hasOwnProperty.call(SHADER_FILE_NAMES, key))
        {
            paths[key] = new URL(`./shaders/${SHADER_FILE_NAMES[key]}`, import.meta.url).href;
        }
    }
    return { ...paths, ...overrides };
}

/**
 * Creates a temporary QuadV5 effect using the converted package.
 *
 * @param {object} tw2 ccpwgl library instance.
 * @param {object} classes Resolved classes.
 * @param {string} defaultPath Default converted shader URL.
 * @param {object} [options] Effect options.
 * @returns {object} Tw2Effect.
 */
export function CreateQuadV5Effect(tw2, classes, defaultPath, options = {})
{
    if (arguments.length === 0 || !tw2?.Register)
    {
        options = tw2 || {};
        tw2 = registeredTw2;
        classes = registeredClasses;
        defaultPath = tw2?.carbon?.quadV5Path;
    }

    if (!tw2 || !classes)
    {
        throw new Error("CreateQuadV5Effect requires RegisterCarbonShaders(tw2) first");
    }

    const effect = new classes.Tw2Effect();
    effect.name = options.name || "quadv5.sm_converted_hi";
    effect.effectFilePath = options.path || defaultPath;
    effect.autoParameter = options.autoParameter !== undefined ? options.autoParameter : true;

    if (options.initialize !== false)
    {
        effect.Initialize();
    }

    return effect;
}

/**
 * Temporary EveShip2 adapter for converted QuadV5 constant buffers.
 */
export class QuadV5EveShip2PerObjectAdapter
{
    /**
     * @param {object} ship EveShip2-like object.
     * @param {object} [options] Adapter options.
     */
    constructor(ship, options = {})
    {
        this.ship = ship;
        this.cb3 = new Float32Array(800);
        this.cb4 = new Float32Array(options.cb4Size || 56);
        this.options = {
            glowScale: 1,
            glowScaleOffset: 49,
            cb3Secondary: "InvWorldMat",
            jointMatOffset: 104,
            cb4Size: this.cb4.length,
            ...options
        };
        this._lastCb3Build = null;
        this._lastCb4Build = null;
        this._lastJointCopy = null;
    }

    /**
     * Updates adapter options.
     *
     * @param {object} options Adapter options.
     * @returns {QuadV5EveShip2PerObjectAdapter} This adapter.
     */
    SetOptions(options = {})
    {
        Object.assign(this.options, options);
        if (options.cb4Size && options.cb4Size !== this.cb4.length)
        {
            this.cb4 = new Float32Array(options.cb4Size);
            this.options.cb4Size = this.cb4.length;
        }
        return this;
    }

    /**
     * Gets converted constant buffers for the active draw.
     *
     * @param {object} perObjectData Current ccpwgl per-object data.
     * @returns {{cb3: Float32Array, cb4: Float32Array}|null} Converted buffers.
     */
    GetConstantBuffers(perObjectData)
    {
        const pod = perObjectData || this.ship?._perObjectData;
        if (!pod) return null;

        const out = {};
        if (pod.vs) out.cb3 = this._BuildCb3(pod.vs);
        if (pod.ps) out.cb4 = this._BuildCb4(pod.ps);

        return out.cb3 || out.cb4 ? out : null;
    }

    /**
     * Builds the converted QuadV5 vertex per-object buffer.
     *
     * @param {object} vs Existing ccpwgl VS per-object data.
     * @returns {Float32Array} Converted `cb3`.
     */
    _BuildCb3(vs)
    {
        this.cb3.fill(0);
        this._lastCb3Build = {
            vsDataLength: vs?.data?.length || 0,
            jointBeforeCopy: []
        };

        if (vs.data)
        {
            this.cb3.set(vs.data.subarray(0, Math.min(vs.data.length, this.cb3.length)));
        }
        else
        {
            copyRawDataElement(vs, "WorldMat", this.cb3, 0, 16);

            const secondary = this.options.cb3Secondary;
            if (secondary !== false && !copyRawDataElement(vs, secondary, this.cb3, 16, 16))
            {
                copyRawDataElement(vs, "WorldMatLast", this.cb3, 16, 16);
            }

            copyRawDataElement(vs, "JointMat", this.cb3, 104, 696);
        }

        this._lastCb3Build.jointBeforeCopy = sampleArray(this.cb3, this.options.jointMatOffset || 104, 24, { floatPrecision: 4 });
        this._CopyJointMatrices(vs, !vs.data);
        this._lastCb3Build.jointAfterCopy = sampleArray(this.cb3, this.options.jointMatOffset || 104, 24, { floatPrecision: 4 });
        return this.cb3;
    }

    /**
     * Copies current mesh joint matrices into the converted `cb3` layout.
     *
     * @param {object} vs Existing ccpwgl VS per-object data.
     * @param {boolean} preferAnimation True to query animation before live per-object data.
     * @returns {boolean} True if joint data was copied.
     */
    _CopyJointMatrices(vs, preferAnimation = false)
    {
        if (this.options.jointMatOffset === false)
        {
            this._lastJointCopy = { copied: false, reason: "disabled" };
            return false;
        }

        const offset = this.options.jointMatOffset;
        const animation = this.ship?.animation;
        const mesh = this.ship?.mesh;
        const meshIndex = this.ship?.meshIndex || mesh?.meshIndex || 0;
        const geometryResource = mesh?.geometryResource || mesh?.geometryRes;

        let jointMat = null;
        let source = null;
        const attempts = [];

        if (!preferAnimation)
        {
            const info = getRawDataElementInfo(vs, "JointMat");
            attempts.push(summarizeRawElementInfo(info));
            jointMat = info?.array;
            source = info?.source;
        }

        if (!jointMat?.length && animation?.GetBoneMatrices)
        {
            jointMat = animation.GetBoneMatrices(meshIndex, geometryResource);
            source = "animation.GetBoneMatrices";
            attempts.push({
                name: "JointMat",
                source,
                length: jointMat?.length || 0,
                sample: sampleArray(jointMat, 0, 24, { floatPrecision: 4 })
            });
        }

        if (!jointMat?.length)
        {
            const info = getRawDataElementInfo(vs, "JointMat");
            attempts.push(summarizeRawElementInfo(info));
            jointMat = info?.array;
            source = info?.source;
        }

        if (!jointMat?.length)
        {
            this._lastJointCopy = {
                copied: false,
                reason: "missing JointMat",
                preferAnimation,
                offset,
                meshIndex,
                attempts
            };
            return false;
        }

        const copyLength = Math.min(jointMat.length, this.cb3.length - offset);
        this.cb3.set(jointMat.subarray(0, copyLength), offset);
        this._lastJointCopy = {
            copied: true,
            source,
            preferAnimation,
            offset,
            meshIndex,
            sourceLength: jointMat.length,
            copyLength,
            sourceSample: sampleArray(jointMat, 0, 24, { floatPrecision: 4 }),
            cb3Sample: sampleArray(this.cb3, offset, 24, { floatPrecision: 4 }),
            attempts
        };
        return true;
    }

    /**
     * Builds the converted QuadV5 pixel per-object buffer.
     *
     * @param {object} ps Existing ccpwgl PS per-object data.
     * @returns {Float32Array} Converted `cb4`.
     */
    _BuildCb4(ps)
    {
        if (this.options.cb4Size && this.options.cb4Size !== this.cb4.length)
        {
            this.cb4 = new Float32Array(this.options.cb4Size);
        }

        this.cb4.fill(0);
        this._lastCb4Build = {
            psDataLength: ps?.data?.length || 0,
            cb4Length: this.cb4.length,
            droppedTail: []
        };

        if (ps.data)
        {
            this.cb4.set(ps.data.subarray(0, Math.min(ps.data.length, this.cb4.length)));
            this._lastCb4Build.droppedTail = sampleArray(ps.data, this.cb4.length, Math.max(0, ps.data.length - this.cb4.length), { floatPrecision: 4 });
        }

        const glowScaleOffset = this.options.glowScaleOffset;
        if (this.options.glowScale !== undefined && this.options.glowScale !== null && glowScaleOffset !== false && glowScaleOffset < this.cb4.length)
        {
            this.cb4[glowScaleOffset] = Number(this.options.glowScale);
        }

        this._lastCb4Build.tail = sampleArray(this.cb4, Math.max(0, this.cb4.length - 12), 12, { floatPrecision: 4 });

        return this.cb4;
    }
}

/**
 * Installs the temporary QuadV5 EveShip2 constant-buffer adapter on an effect.
 *
 * @param {object} ship EveShip2-like object.
 * @param {object} effect Effect using the converted QuadV5 package.
 * @param {object} [options] Adapter options.
 * @returns {QuadV5EveShip2PerObjectAdapter} Source adapter.
 */
export function InstallQuadV5EveShip2Adapter(ship, effect, options = {})
{
    if (!ship?._perObjectData)
    {
        throw new Error("InstallQuadV5EveShip2Adapter requires an EveShip2-like object");
    }

    if (!effect?.effectRes?.CreateConstantBufferAdapter || !effect.AddAdapter)
    {
        throw new Error("InstallQuadV5EveShip2Adapter requires a converted QuadV5 effect and adapter-enabled Tw2Effect");
    }

    RemoveQuadV5EveShip2Adapter(effect);

    const adapter = new QuadV5EveShip2PerObjectAdapter(ship, options);
    const effectAdapter = effect.effectRes.CreateConstantBufferAdapter(adapter);
    effect.AddAdapter(effectAdapter);

    Object.defineProperty(effect, "_carbonQuadV5EveShip2Adapter", {
        configurable: true,
        value: { adapter, effectAdapter }
    });

    return adapter;
}

/**
 * Removes the temporary QuadV5 EveShip2 adapter from an effect.
 *
 * @param {object} effect Effect using the converted QuadV5 package.
 * @returns {boolean} True if an adapter was removed.
 */
export function RemoveQuadV5EveShip2Adapter(effect)
{
    const record = effect?._carbonQuadV5EveShip2Adapter;
    if (!record) return false;

    if (record.effectAdapter && effect.RemoveAdapter)
    {
        effect.RemoveAdapter(record.effectAdapter);
    }

    Reflect.deleteProperty(effect, "_carbonQuadV5EveShip2Adapter");
    return true;
}

/**
 * Fetches a DNA through `tiny.scene.FetchShip` and replaces known shaders.
 *
 * @param {string} dna SOF DNA string.
 * @param {object} [options] Test options.
 * @param {object} [options.scene=globalThis.tiny.scene] Scene-like object with FetchShip.
 * @param {boolean} [options.clear=false] Removes existing wrapped scene objects before loading.
 * @param {boolean} [options.disableEffectChildren=true] Temporarily disables SOF child effects while loading.
 * @returns {Promise<object>} Replacement result.
 */
export async function fetchDNA(dna, options = {})
{
    const scene = options.scene || globalThis.tiny?.scene;
    if (!scene?.FetchShip)
    {
        throw new Error("carbon.fetchDNA requires tiny.scene.FetchShip or options.scene");
    }

    if (options.clear)
    {
        clearWrappedScene(scene);
    }

    const restoreEffectChildren = setSofEffectChildrenEnabled(options.disableEffectChildren === false);
    let wrapped;
    try
    {
        wrapped = await scene.FetchShip(dna);
    }
    finally
    {
        restoreEffectChildren();
    }

    const ship = getEveShip2(wrapped);
    const result = testWrapped(ship, options);
    result.wrapped = wrapped;
    result.dna = dna;
    return result;
}

/**
 * Clears wrapped scene objects without resetting the wrapped EveSpaceScene.
 *
 * @param {object} scene Wrapped scene.
 */
function clearWrappedScene(scene)
{
    if (scene?.RemoveAllObjects)
    {
        scene.RemoveAllObjects(true, true);
    }
    else if (Array.isArray(scene?.objects))
    {
        const objects = scene.objects.slice();
        for (let i = 0; i < objects.length; i++)
        {
            scene.RemoveObject?.(objects[i], { skipRebuild: true });
        }
        scene.Rebuild?.();
    }

    if (Array.isArray(globalThis.w))
    {
        globalThis.w.length = 0;
    }
}

/**
 * Temporarily toggles SOF child effect generation.
 *
 * @param {boolean} enabled True to enable SOF children.
 * @returns {Function} Restore function.
 */
function setSofEffectChildrenEnabled(enabled)
{
    const sof = registeredTw2?.eveSof || globalThis.tw2?.eveSof;
    if (!sof || !Object.prototype.hasOwnProperty.call(sof, "enableChildren"))
    {
        return () => {};
    }

    const previous = sof.enableChildren;
    sof.enableChildren = enabled;
    return () =>
    {
        sof.enableChildren = previous;
    };
}

/**
 * Replaces known converted DX shader packages on an EveShip2 object.
 *
 * @param {object} ship EveShip2 object, not the root wrapper.
 * @param {object} [options] Test options.
 * @param {boolean} [options.log=true] Logs replacement table.
 * @param {boolean} [options.installAdapters=true] Installs available temporary adapters.
 * @param {boolean} [options.installFallbacks=true] Installs available texture fallbacks.
 * @returns {{ship: object, results: Array}} Replacement result.
 */
export function testWrapped(ship, options = {})
{
    if (!registeredTw2 || !registeredClasses)
    {
        throw new Error("carbon.testWrapped requires RegisterCarbonShaders(tw2) first");
    }

    if (!ship?.mesh)
    {
        throw new Error("carbon.testWrapped requires an EveShip2 object");
    }

    const results = collectEffectSlots(ship).map(slot => replaceEffectWithCarbon(registeredTw2, registeredClasses, ship, slot, options));

    if (options.log !== false)
    {
        console.table(results.map(result => ({
            areaType: result.areaType,
            replaced: result.replaced,
            key: result.key,
            oldPath: result.oldPath,
            newPath: result.newPath
        })));
    }

    return { ship, results };
}

/**
 * Builds a compact, paste-friendly report for agent inspection.
 *
 * @param {object} shipOrResult EveShip2 object or `carbon.fetchDNA`/`testWrapped` result.
 * @param {object} [options] Report options.
 * @param {number} [options.floatPrecision=4] Number precision for sampled float arrays.
 * @param {number} [options.maxEffects=80] Maximum effect rows.
 * @returns {object} Agent inspection report.
 */
export function createAgentReport(shipOrResult, options = {})
{
    const ship = getEveShip2(shipOrResult?.ship || shipOrResult);
    const resultRows = Array.isArray(shipOrResult?.results) ? shipOrResult.results : null;
    const report = {
        generatedAt: new Date().toISOString(),
        dna: shipOrResult?.dna,
        ccpwgl: getCcpwglSummary(),
        ship: summarizeShip(ship, options),
        replacements: resultRows ? summarizeReplacementRows(resultRows) : null,
        effects: ship ? summarizeEffectSlots(ship, options) : [],
        perObjectData: summarizePerObjectData(ship?._perObjectData, options),
        adapters: ship ? summarizeCarbonAdapters(ship, options) : []
    };

    report.counts = {
        effects: report.effects.length,
        replaced: report.effects.filter(effect => effect.isCarbon).length,
        badEffects: report.effects.filter(effect => effect.isGood === false).length,
        adapters: report.adapters.length
    };

    return report;
}

/**
 * Logs a compact report and useful tables for agent inspection.
 *
 * @param {object} shipOrResult EveShip2 object or `carbon.fetchDNA`/`testWrapped` result.
 * @param {object} [options] Report options.
 * @returns {object} Agent inspection report.
 */
export function logAgentReport(shipOrResult, options = {})
{
    const report = createAgentReport(shipOrResult, options);
    console.log("carbon agent report", report);
    console.table(report.effects.map(effect => ({
        areaType: effect.areaType,
        key: effect.key,
        carbon: effect.isCarbon,
        good: effect.isGood,
        bodyKey: effect.bodyKey,
        constantsVS: effect.vertex?.constantSize,
        constantsPS: effect.fragment?.constantSize,
        texturesPS: effect.fragment?.textures,
        samplersPS: effect.fragment?.samplers,
        path: effect.path
    })));
    if (report.adapters.length)
    {
        console.table(report.adapters.map(adapter => ({
            areaType: adapter.areaType,
            key: adapter.key,
            cb3Length: adapter.cb3?.length,
            cb4Length: adapter.cb4?.length,
            jointMatOffset: adapter.options?.jointMatOffset,
            cb3Joint0: adapter.cb3?.joint0?.join(",")
        })));
    }
    return report;
}

/**
 * Gets a short ccpwgl/runtime summary.
 *
 * @returns {object} Runtime summary.
 */
function getCcpwglSummary()
{
    const tw2 = registeredTw2 || globalThis.tw2;
    const gl = tw2?.device?.gl;
    return {
        hasTw2: !!tw2,
        hasContext: !!gl,
        webgl2: !!globalThis.WebGL2RenderingContext && gl instanceof globalThis.WebGL2RenderingContext,
        texture3D: gl?.TEXTURE_3D,
        maxVertexUniformVectors: gl ? gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS) : undefined,
        maxVertexAttribs: gl ? gl.getParameter(gl.MAX_VERTEX_ATTRIBS) : undefined,
        carbonRegistered: !!tw2?.carbon
    };
}

/**
 * Summarizes an EveShip2-like object.
 *
 * @param {object} ship EveShip2 object.
 * @param {object} options Report options.
 * @returns {object}
 */
function summarizeShip(ship, options)
{
    if (!ship) return null;

    const geometry = ship.mesh?.geometryResource || ship.mesh?.geometryRes;
    const mesh = geometry?.meshes?.[ship.mesh?.meshIndex || 0] || geometry?.meshes?.[0];
    const boneMatrices = ship.animation?.GetBoneMatrices?.(ship.meshIndex, geometry);

    return {
        type: ship.constructor?.name,
        name: ship.name,
        meshIndex: ship.meshIndex,
        effectChildren: asList(ship.effectChildren).length,
        decals: asList(ship.decals).length,
        boosters: asList(ship.boosters).length,
        hasAnimation: !!ship.animation,
        animationCount: ship.animation?.animations?.length || 0,
        boneMatricesLength: boneMatrices?.length || 0,
        boneMatrixRows: sampleArray(boneMatrices, 0, 24, options),
        boneMatrixSummary: summarizeMatrixRows(boneMatrices, 0, 20, options),
        geometryPath: geometry?.path,
        meshDeclaration: summarizeDeclaration(mesh?.declaration),
        meshBufferSamples: summarizeMeshBufferSamples(mesh, options)
    };
}

/**
 * Summarizes mesh vertex buffer data by declaration element.
 *
 * @param {object} mesh Geometry mesh.
 * @param {object} options Report options.
 * @returns {Array}
 */
function summarizeMeshBufferSamples(mesh, options)
{
    if (!mesh?.bufferData || !mesh?.declaration?.elementsSorted?.length) return [];

    const strideFloats = Math.floor((mesh.declaration.stride || 0) / 4);
    if (!strideFloats) return [];

    const vertexCount = Math.floor(mesh.bufferData.length / strideFloats);
    const sampleCount = Math.min(vertexCount, Number(options.meshSampleCount) || 64);

    return mesh.declaration.elementsSorted.map((element) =>
    {
        const offsetFloats = Math.floor((element.offset || 0) / 4);
        const componentCount = element.elements || 1;
        const scanCount = Number(options.meshScanCount) || vertexCount;
        const min = new Array(componentCount).fill(Infinity);
        const max = new Array(componentCount).fill(-Infinity);
        const values = [];
        const unique = new Set();

        for (let vertex = 0; vertex < scanCount; vertex++)
        {
            const base = vertex * strideFloats + offsetFloats;
            const row = [];
            for (let component = 0; component < componentCount; component++)
            {
                const value = Number(mesh.bufferData[base + component]);
                row.push(Number.isFinite(value) ? value : null);
                if (Number.isFinite(value))
                {
                    min[component] = Math.min(min[component], value);
                    max[component] = Math.max(max[component], value);
                    unique.add(`${component}:${Math.round(value * 10000) / 10000}`);
                }
            }
            if (vertex < sampleCount && values.length < 8) values.push(roundArray(row, options));
        }

        return {
            usage: element.usage,
            usageIndex: element.usageIndex,
            offset: element.offset,
            elements: componentCount,
            type: element.type,
            vertexCount,
            sampledVertices: sampleCount,
            scannedVertices: scanCount,
            min: roundArray(min.map(value => value === Infinity ? null : value), options),
            max: roundArray(max.map(value => value === -Infinity ? null : value), options),
            uniqueComponentValues: unique.size,
            samples: values
        };
    });
}

/**
 * Summarizes replacement result rows.
 *
 * @param {Array} rows Replacement rows.
 * @returns {Array}
 */
function summarizeReplacementRows(rows)
{
    return rows.map(row => ({
        areaType: row.areaType,
        replaced: !!row.replaced,
        key: row.key,
        oldPath: row.oldPath,
        newPath: row.newPath,
        isGood: row.effect?.IsGood?.(),
        errors: row.effect?.GetErrors?.()
    }));
}

/**
 * Summarizes effect slots on an EveShip2 object.
 *
 * @param {object} ship EveShip2 object.
 * @param {object} options Report options.
 * @returns {Array}
 */
function summarizeEffectSlots(ship, options)
{
    const maxEffects = options.maxEffects || 80;
    return collectEffectSlots(ship)
        .slice(0, maxEffects)
        .map(slot => summarizeEffectSlot(ship, slot, options));
}

/**
 * Summarizes one effect slot.
 *
 * @param {object} ship EveShip2 object.
 * @param {object} slot Effect slot.
 * @param {object} options Report options.
 * @returns {object}
 */
function summarizeEffectSlot(ship, slot, options)
{
    const effect = slot.owner?.[slot.prop];
    const path = effect?.effectFilePath || effect?.GetValue?.();
    const res = effect?.effectRes;
    const shader = effect?.shader;
    const mainPass = shader?.techniques?.Main?.passes?.[0];
    const vertex = mainPass?.stages?.[0];
    const fragment = mainPass?.stages?.[1];

    return {
        areaType: slot.areaType,
        key: getShaderKey(path),
        path,
        isCarbon: String(path || "").includes(`.${registeredTw2?.carbon?.extension || EXTENSION}`),
        name: effect?.name,
        isGood: effect?.IsGood?.(),
        errors: effect?.GetErrors?.(),
        resGood: res?.IsGood?.(),
        resErrors: res?.GetErrors?.(),
        permutationIndex: res?.GetPermutationIndex?.(effect?.options),
        bodyKey: res?.GetPermutationBodyKey?.(effect?.options),
        bodyHealth: res?.GetPermutationBodyHealth?.(effect?.options),
        options: effect?.GetValues?.()?.options || effect?.options,
        vertex: summarizeStage(vertex),
        fragment: summarizeStage(fragment),
        adapter: summarizeEffectAdapter(effect, ship, options)
    };
}

/**
 * Summarizes a Tw2ShaderStage.
 *
 * @param {object} stage Shader stage.
 * @returns {object|null}
 */
function summarizeStage(stage)
{
    if (!stage) return null;
    return {
        constantSize: stage.constantSize,
        constants: asList(stage.constants).map(item => ({
            name: item.name,
            offset: item.offset,
            size: item.size,
            dimension: item.dimension
        })),
        textures: asList(stage.textures).length,
        textureNames: asList(stage.textures).map(item => ({
            name: item.name,
            slot: item.registerIndex,
            type: item.type,
            glType: item.glType,
            isVolume: item.isVolume,
            isSRGB: item.isSRGB,
            isAutoregister: item.isAutoregister
        })),
        samplers: asList(stage.samplers).length,
        samplerNames: asList(stage.samplers).map(item => ({
            name: item.name,
            slot: item.registerIndex,
            type: item.type,
            samplerType: item.samplerType,
            isVolume: item.isVolume,
            addressU: item.addressUMode,
            addressV: item.addressVMode,
            addressW: item.addressWMode
        })),
        inputDefinition: summarizeDeclaration(stage.inputDefinition),
        shaderSnippets: summarizeShaderSnippets(stage.shaderCode)
    };
}

/**
 * Extracts diagnostic shader source snippets.
 *
 * @param {string} shaderCode GLSL source.
 * @returns {Array}
 */
function summarizeShaderSnippets(shaderCode)
{
    if (!shaderCode) return [];
    const patterns = /BLENDINDICES|attr\d+|uvec|ivec|uint|int\s*\(/;
    return shaderCode
        .split(/\r\n|\r|\n/)
        .map((text, index) => ({ line: index + 1, text: text.trim() }))
        .filter(item => patterns.test(item.text))
        .slice(0, 80);
}

/**
 * Summarizes a vertex declaration.
 *
 * @param {object} declaration Vertex declaration.
 * @returns {Array}
 */
function summarizeDeclaration(declaration)
{
    return asList(declaration?.elementsSorted || declaration?.elements).map(element => ({
        usage: element.usage,
        usageIndex: element.usageIndex,
        location: element.location,
        offset: element.offset,
        elements: element.elements,
        type: element.type,
        attr: element._attr
    }));
}

/**
 * Summarizes ccpwgl per-object data.
 *
 * @param {object} perObjectData Per-object data.
 * @param {object} options Report options.
 * @returns {object|null}
 */
function summarizePerObjectData(perObjectData, options)
{
    if (!perObjectData) return null;
    return {
        vs: summarizeRawData(perObjectData.vs, options),
        ps: summarizeRawData(perObjectData.ps, options)
    };
}

/**
 * Summarizes Tw2RawData-like values.
 *
 * @param {object} raw Raw data.
 * @param {object} options Report options.
 * @returns {object|null}
 */
function summarizeRawData(raw, options)
{
    if (!raw) return null;
    const elements = {};
    for (const [ name, element ] of Object.entries(raw.elements || {}))
    {
        const info = getRawDataElementInfo(raw, name);
        elements[name] = {
            offset: element.offset,
            size: element.size,
            source: info?.source,
            arrayLength: info?.arrayLength,
            elementArrayLength: info?.elementArrayLength,
            sample: sampleArray(info?.array, 0, Math.min(element.size || 0, 16), options),
            matrixRows: name === "JointMat" ? summarizeMatrixRows(info?.array, 0, 20, options) : undefined,
            rawDataSample: raw.data ? sampleArray(raw.data, element.offset || 0, Math.min(element.size || 0, 16), options) : []
        };
    }

    return {
        size: raw.size,
        dataLength: raw.data?.length,
        elements
    };
}

/**
 * Summarizes Carbon adapters installed on converted effects.
 *
 * @param {object} ship EveShip2 object.
 * @param {object} options Report options.
 * @returns {Array}
 */
function summarizeCarbonAdapters(ship, options)
{
    return collectEffectSlots(ship)
        .map(slot =>
        {
            const effect = slot.owner?.[slot.prop];
            const adapter = effect?._carbonQuadV5EveShip2Adapter?.adapter;
            if (!adapter) return null;

            const buffers = adapter.GetConstantBuffers?.(ship._perObjectData) || {};
            return {
                areaType: slot.areaType,
                key: getShaderKey(effect.effectFilePath),
                path: effect.effectFilePath,
                options: { ...adapter.options },
                cb3Build: adapter._lastCb3Build,
                cb4Build: adapter._lastCb4Build,
                jointCopy: adapter._lastJointCopy,
                cb3: summarizeConvertedBuffer(buffers.cb3, options),
                cb4: summarizeConvertedBuffer(buffers.cb4, options)
            };
        })
        .filter(Boolean);
}

/**
 * Summarizes one effect's Carbon adapter.
 *
 * @param {object} effect Effect.
 * @param {object} ship EveShip2 object.
 * @param {object} options Report options.
 * @returns {object|null}
 */
function summarizeEffectAdapter(effect, ship, options)
{
    const adapter = effect?._carbonQuadV5EveShip2Adapter?.adapter;
    if (!adapter) return null;

    const buffers = adapter.GetConstantBuffers?.(ship._perObjectData) || {};
    return {
        options: { ...adapter.options },
        cb3Build: adapter._lastCb3Build,
        cb4Build: adapter._lastCb4Build,
        jointCopy: adapter._lastJointCopy,
        cb3: summarizeConvertedBuffer(buffers.cb3, options),
        cb4: summarizeConvertedBuffer(buffers.cb4, options)
    };
}

/**
 * Summarizes a converted constant buffer.
 *
 * @param {Float32Array} buffer Buffer.
 * @param {object} options Report options.
 * @returns {object|null}
 */
function summarizeConvertedBuffer(buffer, options)
{
    if (!buffer) return null;
    return {
        length: buffer.length,
        world: sampleArray(buffer, 0, 16, options),
        invOrLastWorld: sampleArray(buffer, 16, 16, options),
        joint0: sampleArray(buffer, 104, 12, options),
        joint1: sampleArray(buffer, 116, 12, options),
        jointRows: summarizeMatrixRows(buffer, 104, 20, options),
        tail: sampleArray(buffer, Math.max(0, buffer.length - 8), 8, options)
    };
}

/**
 * Summarizes 3x4 joint matrix rows from a flat array.
 *
 * @param {ArrayLike<number>} array Source array.
 * @param {number} start Start offset.
 * @param {number} matrixCount Maximum matrix count.
 * @param {object} options Report options.
 * @returns {Array}
 */
function summarizeMatrixRows(array, start, matrixCount, options)
{
    if (!array?.length) return [];
    const rows = [];
    const available = Math.floor(Math.max(0, array.length - start) / 12);
    const count = Math.min(matrixCount, available);
    for (let i = 0; i < count; i++)
    {
        const offset = start + i * 12;
        const values = sampleArray(array, offset, 12, options);
        const sumAbs = values.reduce((sum, value) => sum + Math.abs(Number(value) || 0), 0);
        rows.push({
            index: i,
            offset,
            sumAbs: roundNumber(sumAbs, options),
            values
        });
    }
    return rows;
}

/**
 * Rounds one numeric value with the report precision.
 *
 * @param {number} value Source value.
 * @param {object} options Report options.
 * @returns {number}
 */
function roundNumber(value, options)
{
    const precision = Number.isFinite(options.floatPrecision) ? options.floatPrecision : 4;
    const scale = Math.pow(10, precision);
    return Math.round(value * scale) / scale;
}

/**
 * Samples an array with compact rounded values.
 *
 * @param {ArrayLike<number>} array Source array.
 * @param {number} start Start offset.
 * @param {number} count Number of values.
 * @param {object} options Report options.
 * @returns {Array<number>}
 */
function sampleArray(array, start, count, options)
{
    if (!array || !count) return [];
    const precision = Number.isFinite(options.floatPrecision) ? options.floatPrecision : 4;
    const scale = Math.pow(10, precision);
    const out = [];
    const end = Math.min(array.length || 0, start + count);
    for (let i = start; i < end; i++)
    {
        const value = Number(array[i]);
        out.push(Number.isFinite(value) ? Math.round(value * scale) / scale : value);
    }
    return out;
}

/**
 * Rounds an array with the report precision.
 *
 * @param {ArrayLike<number|null>} array Source values.
 * @param {object} options Report options.
 * @returns {Array<number|null>}
 */
function roundArray(array, options)
{
    const precision = Number.isFinite(options.floatPrecision) ? options.floatPrecision : 4;
    const scale = Math.pow(10, precision);
    return Array.from(array, value =>
    {
        const number = Number(value);
        return Number.isFinite(number) ? Math.round(number * scale) / scale : null;
    });
}

/**
 * Gets an EveShip2 object from common fetch return shapes.
 *
 * @param {*} value Fetch result or ship.
 * @returns {object}
 */
function getEveShip2(value)
{
    if (value?.mesh) return value;
    if (Array.isArray(value))
    {
        return value.find(item => item?.mesh) || value[0];
    }
    if (value?.wrapped?.mesh) return value.wrapped;
    if (value?.object?.mesh) return value.object;
    return value;
}

/**
 * Gets a converted shader map key from an effect path.
 *
 * @param {string} path Effect path.
 * @returns {string|null}
 */
function getShaderKey(path)
{
    if (!path) return null;

    const file = String(path)
        .split("/")
        .pop()
        .replace(".sm_json", "")
        .replace(".sm_hi", "")
        .replace(".sm_lo", "")
        .replace(".sm_depth", "")
        .replace(".sm_converted_hi", "")
        .toLowerCase();

    if (file === "shadow" || file === "skinned_shadow") return "shadowdepth";
    return file;
}

/**
 * Coerces array-like or keyed object collections to an array.
 *
 * @param {*} value Collection value.
 * @returns {Array}
 */
function asList(value)
{
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === "object") return Object.values(value);
    return [];
}

/**
 * Collects effect-owning slots from an EveShip2 object.
 *
 * @param {object} ship EveShip2 object.
 * @returns {Array<{owner: object, prop: string, areaType: string}>}
 */
function collectEffectSlots(ship)
{
    const slots = [];

    for (const key of [
        "opaqueAreas",
        "transparentAreas",
        "additiveAreas",
        "decalAreas",
        "depthAreas",
        "distortionAreas",
        "pickableAreas"
    ])
    {
        for (const area of asList(ship.mesh?.[key]))
        {
            if (area?.effect) slots.push({ owner: area, prop: "effect", areaType: `mesh.${key}` });
        }
    }

    for (const key of [
        "decals",
        "boosters",
        "children",
        "spriteSets",
        "spotlightSets",
        "planeSets",
        "lightSets",
        "curveSets"
    ])
    {
        for (const item of asList(ship[key]))
        {
            if (item?.effect) slots.push({ owner: item, prop: "effect", areaType: key });

            for (const area of asList(item?.areas))
            {
                if (area?.effect) slots.push({ owner: area, prop: "effect", areaType: `${key}.areas` });
            }
        }
    }

    return slots;
}

/**
 * Replaces a single effect slot when a converted shader exists.
 *
 * @param {object} tw2 ccpwgl library instance.
 * @param {object} classes Resolved classes.
 * @param {object} ship EveShip2 object.
 * @param {object} slot Effect slot.
 * @param {object} options Test options.
 * @returns {object} Replacement result.
 */
function replaceEffectWithCarbon(tw2, classes, ship, slot, options)
{
    const oldEffect = slot.owner[slot.prop];
    const oldPath = oldEffect?.effectFilePath || oldEffect?.GetValue?.();
    const key = getShaderKey(oldPath);
    const newPath = tw2.carbon?.shaderPaths?.[key];

    if (!newPath)
    {
        return { replaced: false, key, oldPath, areaType: slot.areaType };
    }

    const effect = new classes.Tw2Effect();
    effect.name = `${key}.${tw2.carbon.extension}`;
    effect.effectFilePath = newPath;
    effect.autoParameter = true;

    const values = oldEffect?.GetValues?.();
    if (values)
    {
        effect.SetValues({
            parameters: values.parameters,
            textures: values.textures,
            overrides: values.overrides,
            options: values.options
        });
    }

    effect.Initialize();
    installTestAdapters(tw2, classes, ship, key, effect, options);
    slot.owner[slot.prop] = effect;

    return { replaced: true, key, oldPath, newPath, areaType: slot.areaType, effect };
}

/**
 * Installs temporary adapters needed by converted shader tests.
 *
 * @param {object} tw2 ccpwgl library instance.
 * @param {object} classes Resolved classes.
 * @param {object} ship EveShip2 object.
 * @param {string} key Shader key.
 * @param {object} effect Replacement effect.
 * @param {object} options Test options.
 */
function installTestAdapters(tw2, classes, ship, key, effect, options)
{
    const installAdapters = options.installAdapters !== false;
    const installFallbacks = options.installFallbacks !== false;
    const quadKeys = options.quadAdapterKeys || [ "quadv5", "skinned_quadv5", "quadheatv5", "skinned_quadheatv5" ];
    const quadFallbackKeys = options.quadFallbackKeys || [ "quadv5", "skinned_quadv5", "quadheatv5", "skinned_quadheatv5" ];

    if (installAdapters && quadKeys.includes(key) && tw2.carbon?.InstallQuadV5EveShip2Adapter)
    {
        tw2.carbon.InstallQuadV5EveShip2Adapter(ship, effect, options.quadAdapterOptions);
    }

    if (installFallbacks && quadFallbackKeys.includes(key) && tw2.carbon?.InstallQuadV5TextureFallbacks)
    {
        tw2.carbon.InstallQuadV5TextureFallbacks(effect, options.textureFallbackOptions);
    }
}

/**
 * Installs white fallback textures on an effect.
 *
 * @param {object} classes Resolved classes.
 * @param {object} effect Target effect.
 * @param {object} [options] Fallback options.
 * @returns {object} Installed fallback record.
 */
export function InstallQuadV5TextureFallbacks(classes, effect, options = {})
{
    if (!effect)
    {
        throw new Error("InstallQuadV5TextureFallbacks requires an effect");
    }

    RemoveQuadV5TextureFallbacks(effect);

    const names = options.names || [ "SSAOMap", "EveSpaceSceneShadowMap" ];
    const path = options.path || "rgba:/255,255,255,255";
    const previous = {};

    for (const name of names)
    {
        previous[name] = {
            hadOwn: Object.prototype.hasOwnProperty.call(effect.parameters, name),
            value: effect.parameters[name]
        };

        effect.parameters[name] = new classes.Tw2TextureParameter(name, path);
    }

    Object.defineProperty(effect, "_carbonQuadV5TextureFallbacks", {
        configurable: true,
        value: { names, previous }
    });

    if (effect.IsGood())
    {
        effect.BindParameters({ skipEvents: true });
    }

    return effect._carbonQuadV5TextureFallbacks;
}

/**
 * Removes temporary QuadV5 texture fallbacks from an effect.
 *
 * @param {object} effect Target effect.
 * @returns {boolean} True if fallbacks were removed.
 */
export function RemoveQuadV5TextureFallbacks(effect)
{
    const record = effect?._carbonQuadV5TextureFallbacks;
    if (!record) return false;

    for (const name of record.names)
    {
        const previous = record.previous[name];
        if (previous?.hadOwn)
        {
            effect.parameters[name] = previous.value;
        }
        else
        {
            Reflect.deleteProperty(effect.parameters, name);
        }
    }

    Reflect.deleteProperty(effect, "_carbonQuadV5TextureFallbacks");

    if (effect.IsGood())
    {
        effect.BindParameters({ skipEvents: true });
    }

    return true;
}

/**
 * Creates the converted effect resource class for a specific ccpwgl runtime.
 *
 * @param {object} tw2 ccpwgl library instance.
 * @param {object} classes Resolved classes.
 * @param {string} extension Registered extension.
 * @returns {Function} Resource constructor.
 */
function createCarbonConvertedEffectRes(tw2, classes, extension)
{
    const {
        Tw2EffectRes,
        Tw2Shader,
        Tw2ShaderPass,
        Tw2ShaderProgram,
        Tw2ShaderStage,
        Tw2ShaderStageConstant,
        Tw2ShaderStageTexture,
        Tw2ShaderTechnique,
        Tw2SamplerState,
        Tw2VertexElement
    } = classes;

    const STAGE_VERTEX = Tw2ShaderStage.Type.VERTEX;
    const STAGE_FRAGMENT = Tw2ShaderStage.Type.FRAGMENT;

    return class CarbonConvertedEffectRes extends Tw2EffectRes
    {
        constructor()
        {
            super();
            this.package = null;
            this.info = null;
            this.metadata = null;
            this.glslSet = null;
            this._bodiesByKey = new Map();
            this._glslBodiesByKey = new Map();
            this._glslStagesByKey = new Map();
            this._glslShadersByKey = new Map();
            this._variantBodiesByIndex = new Map();
            this._constantBufferAdapter = null;
        }

        /**
         * Prepares CEWG package bytes.
         *
         * @param {ArrayBuffer|ArrayBufferView} data Package bytes.
         */
        Prepare(data)
        {
            this.permutations.splice(0);
            this.offsets.splice(0);
            this.passes.splice(0);
            this.annotations = {};
            this.reader = null;
            this.version = 0;
            this.stringTable = "";
            this.shaders.splice(0);
            this._resetPackageIndexes();

            try
            {
                this.package = new CewgPackageReader();
                if (!this.package.Read(data))
                {
                    throw this.package.readError || new Error("Unable to read CEWG package");
                }

                this.info = this.package.GetJson("INFO");
                this.metadata = this.package.GetJson("META");
                this.glslSet = this.package.GetJson("GLSL");

                if (!this.info || !this.metadata || !this.glslSet)
                {
                    throw new Error("CEWG package must contain INFO, META and GLSL JSON chunks");
                }

                this._buildPackageIndexes();
                this.OnPrepared();
            }
            catch (err)
            {
                this.OnError(err);
            }
        }

        /**
         * Gets or creates a ccpwgl shader for the requested permutation options.
         *
         * @param {Object.<string, string>} [options={}] Permutation options.
         * @returns {object|null} Shader, or null when the resource is not ready.
         */
        GetShader(options = {})
        {
            if (!this.IsGood()) return null;

            try
            {
                const permutationIndex = this._resolvePermutationIndex(options);
                if (this.shaders[permutationIndex])
                {
                    return this.shaders[permutationIndex];
                }

                const bodyKey = this._variantBodiesByIndex.get(permutationIndex) || this.glslSet.variants?.[0]?.bodyKey;
                const body = this._bodiesByKey.get(bodyKey);
                const glslBody = this._glslBodiesByKey.get(bodyKey);
                if (!body || !glslBody || body.error || glslBody.error)
                {
                    throw new Error(`CEWG body is not available: ${bodyKey}`);
                }
                this._assertBodyIsComplete(body, glslBody);

                return this.shaders[permutationIndex] = this._createShader(body, glslBody);
            }
            catch (err)
            {
                this.OnError(err);
                return null;
            }
        }

        /**
         * Gets the CEWG permutation index for effect options.
         *
         * @param {Object.<string, string>} [options={}] Permutation options.
         * @returns {number} Mixed-radix permutation index.
         */
        GetPermutationIndex(options = {})
        {
            return this._resolvePermutationIndex(options);
        }

        /**
         * Gets the CEWG body key selected by effect options.
         *
         * @param {Object.<string, string>} [options={}] Permutation options.
         * @returns {string|undefined} Body key.
         */
        GetPermutationBodyKey(options = {})
        {
            const permutationIndex = this.GetPermutationIndex(options);
            return this._variantBodiesByIndex.get(permutationIndex) || this.glslSet?.variants?.[0]?.bodyKey;
        }

        /**
         * Gets selected CEWG body completeness and missing-stage contracts.
         *
         * @param {Object.<string, string>} [options={}] Permutation options.
         * @returns {object|null} Body health, or null before package load.
         */
        GetPermutationBodyHealth(options = {})
        {
            const bodyKey = this.GetPermutationBodyKey(options);
            const body = this._bodiesByKey.get(bodyKey);
            const glslBody = this._glslBodiesByKey.get(bodyKey);
            if (!bodyKey || !body || !glslBody)
            {
                return null;
            }

            const missing = this._getMissingBodyStages(glslBody);
            return {
                bodyKey,
                complete: missing.length === 0 && !body.error && !glslBody.error,
                bodyError: body.error || glslBody.error || null,
                missing
            };
        }

        /**
         * Sets a temporary runtime adapter for converted constant buffers.
         *
         * @param {?object} adapter Adapter with `GetConstantBuffers(perObjectData, context)`.
         * @returns {object} This resource.
         */
        SetConstantBufferAdapter(adapter)
        {
            this._constantBufferAdapter = adapter || null;
            return this;
        }

        /**
         * Creates a Tw2Effect adapter that applies converted constant buffers.
         *
         * @param {object} adapter Source adapter.
         * @returns {object} Effect adapter.
         */
        CreateConstantBufferAdapter(adapter)
        {
            return {
                name: "CarbonConvertedConstantBufferAdapter",
                source: adapter,
                OnAfterPerObjectData: context => this.ApplyConstantBufferOverrides(context, adapter)
            };
        }

        /**
         * Applies converted constant-buffer overrides after ccpwgl's normal upload.
         *
         * @param {object} context Draw context.
         * @param {object} [source=this._constantBufferAdapter] Source adapter.
         * @returns {boolean} True if any overrides were uploaded.
         */
        ApplyConstantBufferOverrides(context, source = this._constantBufferAdapter)
        {
            const adapter = source;
            if (!adapter || !context?.program?.constantBufferHandles) return false;

            const buffers = adapter.GetConstantBuffers(context.perObjectData, context);
            if (!buffers) return false;

            const { gl, program } = context;
            const cbh = program.constantBufferHandles;
            let applied = false;

            if (buffers.cb3 && cbh[3])
            {
                gl.uniform4fv(cbh[3], buffers.cb3);
                applied = true;
            }

            if (buffers.cb4 && cbh[4])
            {
                gl.uniform4fv(cbh[4], buffers.cb4);
                applied = true;
            }

            return applied;
        }

        /**
         * Sets the response type for converted shader files.
         *
         * @param {string} path Resource path.
         * @param {string} receivedExtension File extension.
         */
        DoCustomLoad(path, receivedExtension)
        {
            this._extension = null;
            if (receivedExtension !== extension)
            {
                throw new Error(`Unsupported converted shader format: ${receivedExtension}`);
            }

            this._extension = receivedExtension;
            this._requestResponseType = "arraybuffer";
        }

        /**
         * Clears package-specific indexes.
         */
        _resetPackageIndexes()
        {
            this.package = null;
            this.info = null;
            this.metadata = null;
            this.glslSet = null;
            this._bodiesByKey = new Map();
            this._glslBodiesByKey = new Map();
            this._glslStagesByKey = new Map();
            this._glslShadersByKey = new Map();
            this._variantBodiesByIndex = new Map();
        }

        /**
         * Builds fast lookup maps from CEWG metadata.
         */
        _buildPackageIndexes()
        {
            this.permutations = Array.isArray(this.metadata.permutations) ? this.metadata.permutations : [];

            for (const body of this.metadata.bodies || []) this._bodiesByKey.set(body.key, body);
            for (const body of this.glslSet.bodies || []) this._glslBodiesByKey.set(body.key, body);
            for (const stage of this.glslSet.stages || []) this._glslStagesByKey.set(stage.key, stage);
            for (const shader of this.glslSet.shaders || []) this._glslShadersByKey.set(shader.key, shader);
            for (const variant of this.glslSet.variants || []) this._variantBodiesByIndex.set(variant.permutationIndex, variant.bodyKey);
        }

        /**
         * Resolves ccpwgl effect options to Carbon's mixed-radix permutation index.
         *
         * @param {Object.<string, string>} options Selected options.
         * @returns {number} Permutation index.
         */
        _resolvePermutationIndex(options)
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
         * Creates a normal ccpwgl shader object from one CEWG body.
         *
         * @param {object} body Carbon body metadata.
         * @param {object} glslBody GLSL body record.
         * @returns {object} ccpwgl shader.
         */
        _createShader(body, glslBody)
        {
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
                technique.passes[group.passIndex] = this._createPass(group);
            }

            shader.annotations = this.annotations;
            return shader;
        }

        /**
         * Groups stage records into ccpwgl technique/pass pairs.
         *
         * @param {object} body Carbon body metadata.
         * @param {object} glslBody GLSL body record.
         * @returns {Object.<string, object>} Pass groups.
         */
        _groupStagesByPass(body, glslBody)
        {
            const manifestStages = new Map();
            for (const stage of body.manifest?.stages || []) manifestStages.set(stageKey(stage), stage);

            const manifestPasses = new Map();
            for (const pass of body.manifest?.passes || [])
            {
                manifestPasses.set(`${pass.techniqueName || "Main"}:${pass.passIndex || 0}`, pass);
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
                    manifestPass: manifestPasses.get(key) || null,
                    vertex: null,
                    pixel: null
                };

                const manifestStage = manifestStages.get(stageKey(glslStage));
                grouped[key][glslStage.stageName] = {
                    glslStage,
                    manifestStage,
                    shaderRecord: this._glslShadersByKey.get(glslStage.shaderKey)
                };
            }

            return grouped;
        }

        /**
         * Throws before shader creation if a selected body still has failed
         * stage translations.
         *
         * @param {object} body Carbon body metadata.
         * @param {object} glslBody GLSL body record.
         */
        _assertBodyIsComplete(body, glslBody)
        {
            const missing = this._getMissingBodyStages(glslBody);
            if (missing.length)
            {
                const err = new Error(`CEWG body has untranslated shader stages: ${body.key}`);
                err.details = { bodyKey: body.key, missing };
                throw err;
            }
        }

        /**
         * Gets untranslated vertex/pixel stages for a GLSL body.
         *
         * @param {object} glslBody GLSL body record.
         * @returns {Array} Missing-stage records.
         */
        _getMissingBodyStages(glslBody)
        {
            const missing = [];
            for (const stageKeyValue of glslBody.stages || [])
            {
                const glslStage = this._glslStagesByKey.get(stageKeyValue);
                if (!glslStage || (glslStage.stageName !== "vertex" && glslStage.stageName !== "pixel")) continue;

                const shaderRecord = this._glslShadersByKey.get(glslStage.shaderKey);
                if (shaderRecord?.source) continue;

                missing.push({
                    stage: `${glslStage.techniqueName || "Main"}.pass${glslStage.passIndex || 0}.${glslStage.stageName}`,
                    shaderKey: glslStage.shaderKey,
                    contract: glslStage.contract || shaderRecord?.primaryContract || null,
                    hlsl2webgl: shaderRecord?.hlsl2webgl || null
                });
            }
            return missing;
        }

        /**
         * Creates and links one ccpwgl shader pass.
         *
         * @param {object} group Technique/pass stage group.
         * @returns {object} Shader pass.
         */
        _createPass(group)
        {
            if (!group.vertex || !group.pixel)
            {
                throw new Error(`CEWG pass is missing vertex or pixel shader: ${group.techniqueName}[${group.passIndex}]`);
            }

            const pass = new Tw2ShaderPass();
            pass.stages[0] = this._createStage(group.vertex, STAGE_VERTEX);
            pass.stages[1] = this._createStage(group.pixel, STAGE_FRAGMENT);
            pass.SetStates(normalizePassStates(group.manifestPass?.states));
            pass.shaderProgram = Tw2ShaderProgram.create(
                pass.stages[0].shader,
                pass.stages[1].shader,
                pass,
                this
            );
            pass.shadowShaderProgram = pass.shaderProgram;
            return pass;
        }

        /**
         * Creates one ccpwgl shader stage from CEWG stage metadata.
         *
         * @param {object} stageRecord Stage metadata and source.
         * @param {number} stageType ccpwgl stage type.
         * @returns {object} Shader stage.
         */
        _createStage(stageRecord, stageType)
        {
            const { glslStage, manifestStage, shaderRecord } = stageRecord;
            if (!shaderRecord?.source)
            {
                throw new Error(`CEWG shader source is missing: ${glslStage.shaderKey}`);
            }

            const stage = new Tw2ShaderStage();
            stage.type = stageType;
            stage.shaderCode = adaptShaderSource(classes, shaderRecord.source, manifestStage, stageType);
            stage.inputDefinition = buildInputDefinition(classes, shaderRecord.source, manifestStage, stageType);
            buildConstants(classes, stage, manifestStage);
            buildTexturesAndSamplers(classes, stage, manifestStage, getTextureSamplerUsage(shaderRecord.source));
            stage.shader = compileShader(tw2, stageType, stage.shaderCode, this.path, STAGE_VERTEX);
            return stage;
        }
    };
}

/**
 * Tiny browser-side CEWG v1 reader.
 */
class CewgPackageReader
{
    constructor()
    {
        this.version = 0;
        this.chunks = [];
        this.chunkMap = new Map();
        this.readError = null;
    }

    /**
     * Reads CEWG bytes.
     *
     * @param {ArrayBuffer|ArrayBufferView} source Source bytes.
     * @returns {boolean} True when read successfully.
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
                const chunkBytes = bytes.subarray(offset, offset + size);
                offset += size;
                const chunk = { tag, size, bytes: chunkBytes };
                this.chunks.push(chunk);
                this.chunkMap.set(tag, chunk);
            }

            if (offset !== bytes.length)
            {
                throw new Error(`CEWG trailing bytes: ${bytes.length - offset}`);
            }

            return true;
        }
        catch (err)
        {
            this.readError = err;
            return false;
        }
    }

    /**
     * Gets a chunk by tag.
     *
     * @param {string} tag Four-character tag.
     * @returns {object|null} Chunk.
     */
    GetChunk(tag)
    {
        return this.chunkMap.get(tag) || null;
    }

    /**
     * Gets a chunk as text.
     *
     * @param {string} tag Four-character tag.
     * @returns {string|null} Decoded text.
     */
    GetText(tag)
    {
        const chunk = this.GetChunk(tag);
        return chunk ? textDecoder.decode(chunk.bytes) : null;
    }

    /**
     * Gets a chunk as JSON.
     *
     * @param {string} tag Four-character tag.
     * @returns {object|null} JSON value.
     */
    GetJson(tag)
    {
        const text = this.GetText(tag);
        return text === null ? null : JSON.parse(text);
    }
}

/**
 * Resolves ccpwgl constructors from the runtime.
 *
 * @param {object} tw2 ccpwgl library instance.
 * @returns {object} Constructors.
 */
function resolveClasses(tw2)
{
    const required = [
        "Tw2Effect",
        "Tw2EffectRes",
        "Tw2Shader",
        "Tw2ShaderPass",
        "Tw2ShaderProgram",
        "Tw2ShaderStage",
        "Tw2ShaderStageConstant",
        "Tw2ShaderStageTexture",
        "Tw2ShaderTechnique",
        "Tw2SamplerState",
        "Tw2TextureParameter",
        "Tw2VertexElement"
    ];

    const classes = {};
    for (const name of required)
    {
        const Constructor = tw2.GetClass(name);
        if (!Constructor)
        {
            throw new Error(`Carbon shader plugin could not resolve ${name}`);
        }
        classes[name] = Constructor;
    }

    return classes;
}

/**
 * Builds a stable stage key from a manifest or GLSL stage record.
 *
 * @param {object} stage Stage record.
 * @returns {string} Key.
 */
function stageKey(stage)
{
    return `${stage.techniqueName || "Main"}.pass${stage.passIndex || 0}.${stage.stageName}`;
}

/**
 * Normalizes Carbon pass state records for `Tw2ShaderPass.SetStates`.
 *
 * @param {Array|Object} states Carbon state records.
 * @returns {Array|Object|null} ccpwgl-compatible state records.
 */
function normalizePassStates(states)
{
    if (!states) return null;
    if (!Array.isArray(states)) return states;

    return states.map((entry) => ({
        state: Number(entry.state ?? entry.key),
        value: Number(entry.value)
    })).filter((entry) => Number.isFinite(entry.state) && Number.isFinite(entry.value));
}

/**
 * Adapts HLSLcc WebGL2 source to ccpwgl's shader binding names.
 *
 * @param {object} classes Resolved classes.
 * @param {string} source GLSL source.
 * @param {object} manifestStage Carbon stage manifest.
 * @param {number} stageType ccpwgl stage type.
 * @returns {string} Adapted GLSL source.
 */
function adaptShaderSource(classes, source, manifestStage, stageType)
{
    let out = source;
    const cbMap = stageType === classes.Tw2ShaderStage.Type.FRAGMENT ? { 0: 7 } : {};

    out = out.replace(
        /layout\s*\(\s*std140\s*\)\s*uniform\s+ConstantBuffer(\d+)\s*\{\s*vec4\s+data\s*\[\s*(\d+)\s*\]\s*;\s*\}\s*cb\1\s*;/g,
        (match, registerIndex, size) => `uniform vec4 cb${cbMap[registerIndex] ?? registerIndex}[${size}];`
    );
    out = out.replace(/\bcb(\d+)\.data\s*\[/g, (match, registerIndex) => `cb${cbMap[registerIndex] ?? registerIndex}[`);

    const samplerPrefix = stageType === classes.Tw2ShaderStage.Type.VERTEX ? "vs" : "s";
    out = out.replace(/\bt(\d+)TEX_with_SMPs\d+\b/g, (match, registerIndex) => `${samplerPrefix}${registerIndex}`);
    out = out.replace(/\bt(\d+)\b/g, (match, registerIndex) => `${samplerPrefix}${registerIndex}`);
    out = dedupeSamplerUniforms(out);

    if (stageType === classes.Tw2ShaderStage.Type.VERTEX)
    {
        out = lowerIntegerBlendInputsToFloat(out);
        const usedInputs = getUsedPipelineInputs(source, manifestStage);
        let blendIndicesAttr = null;
        for (let i = 0; i < usedInputs.length; i++)
        {
            const attr = `attr${i}`;
            if (usedInputs[i].usageName === "BLENDINDICES")
            {
                blendIndicesAttr = attr;
            }
            out = replaceIdentifier(out, inputSymbol(usedInputs[i]), attr);
        }

        if (blendIndicesAttr && globalThis.CarbonShaderDebug?.forceBlendIndexZero)
        {
            out = forceBlendIndexZero(out, blendIndicesAttr);
        }
    }

    return out;
}

/**
 * Lowers HLSLcc integer blend-index attributes to float attributes.
 *
 * ccpwgl currently binds mesh attributes with `vertexAttribPointer`, not
 * `vertexAttribIPointer`, so GLSL integer vertex inputs are not a valid runtime
 * contract. Blend indices are still cast back to integers at use sites.
 *
 * @param {string} source GLSL source.
 * @returns {string} Source with float blend-index inputs.
 */
function lowerIntegerBlendInputsToFloat(source)
{
    return source.replace(
        /\bin\s+(?:(lowp|mediump|highp)\s+)?(?:uvec|ivec)([234])\s+(in_BLENDINDICES\d+)\s*;/g,
        (match, precision = "highp", size, name) => `in ${precision} vec${size} ${name};`
    );
}

/**
 * Rewrites blend-index reads to zero for skinned shader diagnostics.
 *
 * @param {string} source GLSL source.
 * @param {string} attr Blend-indices attribute name after ccpwgl rewrite.
 * @returns {string} Rewritten source.
 */
function forceBlendIndexZero(source, attr)
{
    const escaped = escapeRegExp(attr);
    return source
        .replace(new RegExp(`ivec([234])\\s*\\(\\s*${escaped}\\.[xyzw]{1,4}\\s*\\)`, "g"), "ivec$1(0)")
        .replace(new RegExp(`int\\s*\\(\\s*${escaped}\\.[xyzw]\\s*\\)`, "g"), "0");
}

/**
 * Removes duplicate sampler uniforms after t-register to s-register rewrites.
 *
 * @param {string} source GLSL source.
 * @returns {string} Source without duplicate sampler uniforms.
 */
function dedupeSamplerUniforms(source)
{
    const seen = new Set();
    const lines = source.split(/\r\n|\r|\n/);

    return lines.filter((line) =>
    {
        const match = line.match(/^\s*uniform\s+(?:lowp|mediump|highp)?\s*sampler\w+\s+((?:vs|s)\d+)\s*;/);
        if (!match) return true;
        if (seen.has(match[1])) return false;
        seen.add(match[1]);
        return true;
    }).join("\n");
}

/**
 * Builds ccpwgl's input definition for active vertex inputs.
 *
 * @param {object} classes Resolved classes.
 * @param {string} source Original translated GLSL source.
 * @param {object} manifestStage Carbon stage manifest.
 * @param {number} stageType ccpwgl stage type.
 * @returns {object} Vertex declaration.
 */
function buildInputDefinition(classes, source, manifestStage, stageType)
{
    const stage = new classes.Tw2ShaderStage();
    if (stageType !== classes.Tw2ShaderStage.Type.VERTEX || !manifestStage) return stage.inputDefinition;

    const usedInputs = getUsedPipelineInputs(source, manifestStage);
    for (let i = 0; i < usedInputs.length; i++)
    {
        const input = usedInputs[i];
        stage.inputDefinition.elements.push(classes.Tw2VertexElement.from({
            usage: getCcpwglInputUsage(classes, input),
            usageIndex: input.usageIndex,
            type: 0,
            registerIndex: input.registerIndex,
            usedMask: input.usedMask,
            attr: `attr${i}`
        }));
    }

    stage.inputDefinition.RebuildHash();
    return stage.inputDefinition;
}

/**
 * Maps Carbon/DX vertex usage names onto ccpwgl's current mesh ABI.
 *
 * ccpwgl's GR2 JSON reader intentionally flips blend indices and weights for
 * legacy GLES shader compatibility. Converted Carbon shaders keep the DX names,
 * so the compatibility flip belongs at this boundary rather than in core.
 *
 * @param {object} classes Resolved ccpwgl classes.
 * @param {object} input Carbon pipeline input.
 * @returns {number} ccpwgl vertex usage.
 */
function getCcpwglInputUsage(classes, input)
{
    if (input?.usageName === "BLENDINDICES" || input?.usageName === "BLENDINDICE") return classes.Tw2VertexElement.Type.BLENDWEIGHT;
    if (input?.usageName === "BLENDWEIGHT" || input?.usageName === "BLENDWEIGHTS") return classes.Tw2VertexElement.Type.BLENDINDICES;
    return input?.usage;
}

/**
 * Gets vertex inputs that survived translation.
 *
 * @param {string} source Original translated GLSL source.
 * @param {object} manifestStage Carbon stage manifest.
 * @returns {object[]} Used pipeline inputs.
 */
function getUsedPipelineInputs(source, manifestStage)
{
    return (manifestStage?.pipelineInputs || [])
        .filter((input) => input.usedMask !== 0)
        .filter((input) => new RegExp(`\\b${inputSymbol(input)}\\b`).test(source));
}

/**
 * Gets HLSLcc's input symbol for a Carbon pipeline input.
 *
 * @param {object} input Pipeline input.
 * @returns {string} GLSL identifier.
 */
function inputSymbol(input)
{
    return `in_${input.usageName}${input.usageIndex || 0}`;
}

/**
 * Builds local stage constants from Carbon constant-buffer metadata.
 *
 * @param {object} classes Resolved classes.
 * @param {object} stage Target shader stage.
 * @param {object} manifestStage Carbon stage manifest.
 */
function buildConstants(classes, stage, manifestStage)
{
    const localRegister = 0;
    const binding = (manifestStage?.bindings || []).find((entry) =>
        entry.kind === "constantBuffer" &&
        entry.registerIndex === localRegister &&
        entry.carbon?.hasLocalConstants
    );

    if (!binding)
    {
        stage.constantSize = 0;
        stage.constantValues = new Float32Array(0);
        return;
    }

    const constantValueSize = bytesToFloats(binding.carbon.constantValueSize || 0);
    stage.constantValues = new Float32Array(constantValueSize);
    stage.constantSize = constantValueSize;

    for (const item of binding.carbon.constants || [])
    {
        const size = bytesToFloats(item.size || 0);
        const offset = bytesToFloats(item.offset || 0);
        if (!item.name || !size) continue;

        const constant = classes.Tw2ShaderStageConstant.fromJSON({
            name: item.name,
            offset,
            size,
            dimension: item.dimension || 4,
            elements: item.elements || 1,
            isSRGB: item.isSRGB || false,
            isAutoregister: item.isAutoregister || false,
            type: item.type || 0,
            value: item.value || []
        }, null);
        stage.constants.push(constant);
    }

    stage.constants.sort((a, b) => a.offset - b.offset);
}

/**
 * Gets HLSLcc texture-to-sampler pairings from translated source.
 *
 * @param {string} source Original translated GLSL source.
 * @returns {Map<number, number>} Texture register to sampler register map.
 */
function getTextureSamplerUsage(source)
{
    const out = new Map();
    const regex = /\bt(\d+)TEX_with_SMPs(\d+)\b/g;
    let match;

    while ((match = regex.exec(source)))
    {
        const textureRegister = Number(match[1]);
        const samplerRegister = Number(match[2]);
        if (!out.has(textureRegister))
        {
            out.set(textureRegister, samplerRegister);
        }
    }

    return out;
}

/**
 * Builds texture and sampler definitions from Carbon resource bindings.
 *
 * @param {object} classes Resolved classes.
 * @param {object} stage Target shader stage.
 * @param {object} manifestStage Carbon stage manifest.
 * @param {Map<number, number>} textureSamplerUsage Texture register to sampler register map.
 */
function buildTexturesAndSamplers(classes, stage, manifestStage, textureSamplerUsage)
{
    const bindings = manifestStage?.bindings || [];
    const samplersByRegister = new Map(
        bindings
            .filter((entry) => entry.kind === "sampler")
            .map((entry) => [ entry.registerIndex, entry ])
    );

    for (const resource of bindings.filter((entry) => entry.kind === "resource"))
    {
        if (!isTextureResourceBinding(resource, textureSamplerUsage)) continue;

        const name = resource.metadataName || resource.carbon?.name || resource.generatedSymbol || `Texture${resource.registerIndex}`;
        const type = resource.carbon?.type || TEXTURE_2D;
        const texture = classes.Tw2ShaderStageTexture.fromJSON({
            name,
            registerIndex: resource.registerIndex,
            type,
            isSRGB: resource.carbon?.isSRGB || false,
            isAutoregister: resource.carbon?.isAutoregister || false
        }, null);

        stage.textures.push(texture);

        const samplerRegister = textureSamplerUsage.get(resource.registerIndex);
        const samplerBinding = samplersByRegister.get(samplerRegister) || samplersByRegister.get(resource.registerIndex) || samplersByRegister.get(0);
        const sampler = samplerBinding?.carbon?.sampler || {};
        stage.samplers.push(classes.Tw2SamplerState.fromJSON({
            name: samplerBinding?.metadataName || `${name}Sampler`,
            registerIndex: texture.registerIndex,
            samplerType: texture.glType,
            isVolume: texture.isVolume,
            type,
            addressUMode: sampler.addressU,
            addressVMode: sampler.addressV,
            addressWMode: sampler.addressW,
            filterMode: sampler.minFilter,
            mipFilterMode: sampler.mipFilter,
            magFilterMode: sampler.magFilter,
            maxAnisotropy: sampler.maxAnisotropy
        }, null));
    }

    stage.textures.sort((a, b) => a.registerIndex - b.registerIndex);
    stage.samplers.sort((a, b) => a.registerIndex - b.registerIndex);
}

/**
 * Identifies resource bindings that ccpwgl should expose as shader textures.
 *
 * Skinned DX11 metadata can contain structured-buffer resources such as
 * `BoneTransforms`; those are lowered to constant-buffer reads for WebGL2 and
 * must not be registered as texture bindings.
 *
 * @param {object} resource Carbon resource binding.
 * @param {Map<number, number>} textureSamplerUsage Texture register to sampler register map.
 * @returns {boolean} True for sampled texture resources.
 */
function isTextureResourceBinding(resource, textureSamplerUsage)
{
    const type = Number(resource.carbon?.type);
    if (type !== 2 && type !== 3 && type !== 4 && type !== 5) return false;
    return true;
}

/**
 * Compiles GLSL while preserving #version as the first line.
 *
 * @param {object} tw2 ccpwgl library instance.
 * @param {number} stageType ccpwgl stage type.
 * @param {string} shaderCode GLSL source.
 * @param {string} path Resource path.
 * @param {number} vertexStageType Vertex stage type.
 * @returns {WebGLShader} Compiled shader.
 */
function compileShader(tw2, stageType, shaderCode, path, vertexStageType)
{
    const { gl } = tw2.device;
    const shader = gl.createShader(stageType === vertexStageType ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER);
    gl.shaderSource(shader, shaderCode);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
    {
        throw new Error(`${path || "converted shader"} ${stageType === vertexStageType ? "vertex" : "fragment"} compile failed: ${gl.getShaderInfoLog(shader)}`);
    }

    return shader;
}

/**
 * Replaces whole identifier occurrences.
 *
 * @param {string} source Source text.
 * @param {string} from Identifier to replace.
 * @param {string} to Replacement identifier.
 * @returns {string} Rewritten text.
 */
function replaceIdentifier(source, from, to)
{
    return source.replace(new RegExp(`\\b${escapeRegExp(from)}\\b`, "g"), to);
}

/**
 * Escapes a string for use in a regular expression.
 *
 * @param {string} value Raw value.
 * @returns {string} Escaped value.
 */
function escapeRegExp(value)
{
    return value.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Converts a byte count to float count.
 *
 * @param {number} value Byte count.
 * @returns {number} Float count.
 */
function bytesToFloats(value)
{
    return Math.floor((value || 0) / 4);
}

/**
 * Normalizes a binary source to a Uint8Array view.
 *
 * @param {ArrayBuffer|ArrayBufferView} source Source bytes.
 * @returns {Uint8Array} Byte view.
 */
function normalizeBytes(source)
{
    if (source instanceof Uint8Array) return source;
    if (source instanceof ArrayBuffer) return new Uint8Array(source);
    if (ArrayBuffer.isView(source)) return new Uint8Array(source.buffer, source.byteOffset, source.byteLength);
    throw new Error("Unsupported CEWG source bytes");
}

/**
 * Reads ASCII text.
 *
 * @param {Uint8Array} bytes Byte source.
 * @param {number} offset Start offset.
 * @param {number} size Byte count.
 * @returns {string} ASCII text.
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
 * Copies a named Tw2RawData element into a target array.
 *
 * @param {object} raw Source raw data.
 * @param {string} name Source element name.
 * @param {Float32Array} target Target array.
 * @param {number} offset Target offset.
 * @param {number} size Copy size.
 * @returns {boolean} True if copied.
 */
function copyRawDataElement(raw, name, target, offset, size)
{
    const source = getRawDataElementArray(raw, name);
    if (!source?.length) return false;

    target.set(source.subarray(0, Math.min(size, source.length)), offset);
    return true;
}

/**
 * Gets a Tw2RawData element as a slice regardless of runtime backing shape.
 *
 * @param {object} raw Source raw data.
 * @param {string} name Source element name.
 * @returns {Float32Array|null} Element slice.
 */
function getRawDataElementArray(raw, name)
{
    return getRawDataElementInfo(raw, name)?.array || null;
}

/**
 * Gets a Tw2RawData element and describes which backing store was used.
 *
 * @param {object} raw Source raw data.
 * @param {string} name Source element name.
 * @returns {object|null} Element slice details.
 */
function getRawDataElementInfo(raw, name)
{
    const element = raw?.elements?.[name];
    if (!element) return null;
    const info = {
        name,
        offset: element.offset,
        size: element.size,
        dataLength: raw?.data?.length || 0,
        elementArrayLength: element.array?.length || 0,
        arrayLength: 0,
        source: null,
        array: null
    };

    if (raw?.data && Number.isFinite(element.offset) && Number.isFinite(element.size))
    {
        info.source = "raw.data";
        info.array = raw.data.subarray(element.offset, element.offset + element.size);
    }
    else if (element.array?.length === element.size)
    {
        info.source = "element.array";
        info.array = element.array;
    }
    else if (element.array?.length && Number.isFinite(element.offset) && Number.isFinite(element.size))
    {
        info.source = "element.array.slice";
        info.array = element.array.subarray(element.offset, element.offset + element.size);
    }
    else if (element.array)
    {
        info.source = "element.array.unsliced";
        info.array = element.array;
    }

    info.arrayLength = info.array?.length || 0;
    return info;
}

/**
 * Summarizes raw element backing details for reports.
 *
 * @param {object|null} info Raw element info.
 * @returns {object|null} Compact summary.
 */
function summarizeRawElementInfo(info)
{
    if (!info) return null;
    return {
        name: info.name,
        source: info.source,
        offset: info.offset,
        size: info.size,
        dataLength: info.dataLength,
        elementArrayLength: info.elementArrayLength,
        arrayLength: info.arrayLength,
        sample: sampleArray(info.array, 0, Math.min(info.arrayLength || 0, 24), { floatPrecision: 4 })
    };
}

if (typeof window !== "undefined")
{
    window.CarbonShaderPlugin = {
        RegisterCarbonShaders,
        EnsureCarbonDefaultVariables,
        QuadV5EveShip2PerObjectAdapter,
        InstallQuadV5EveShip2Adapter,
        RemoveQuadV5EveShip2Adapter,
        createAgentReport,
        logAgentReport
    };
}
