import {
    CcpwglLegacyAtlasComposer,
    isLegacyConfiguredBodyConsumerEffect
} from "./CcpwglLegacyAtlasComposer.mjs";
import {
    ValidateLegacyTextureContributions
} from "./CcpwglLegacyTextureContributions.mjs";
import { CcpwglLegacyPaletteCompatibility } from "./CcpwglLegacyPaletteCompatibility.mjs";
import { CcpwglLegacyTriangleCoverage } from "./CcpwglLegacyTriangleCoverage.mjs";

const DEFAULT_RESOURCE_BASE = "http://127.0.0.1:3000/ccp";
const FEMALE_LOD0_BODY_PATH = "res:/graphics/character/female/paperdoll/basenude/basenude.gr2";

// These demo-owned V8 interior-light inputs feed ccpwgl's legacy avatar
// per-object packing; they are not a runtime-character lighting contract.
const LEGACY_OPENGL_LIGHTS = [
    { name: "front", color: [ 2.2, 2.2, 2.2, 1 ], position: [ 0, 190, 135 ], radius: 300, falloff: 1 },
    { name: "left", color: [ 1.8, 1.8, 1.8, 1 ], position: [ -190, 0, 115 ], radius: 280, falloff: 1 },
    { name: "right", color: [ 1.8, 1.8, 1.8, 1 ], position: [ 190, 0, 115 ], radius: 280, falloff: 1 },
    { name: "back", color: [ 1.6, 1.6, 1.6, 1 ], position: [ 0, -200, 150 ], radius: 320, falloff: 1 }
];

const AREA_FIELDS = [
    "opaqueAreas",
    "transparentAreas",
    "additiveAreas",
    "decalAreas",
    "depthAreas",
    "depthNormalAreas",
    "distortionAreas",
    "pickableAreas"
];

const VISIBLE_AREA_FIELDS = [
    "opaqueAreas",
    "transparentAreas",
    "additiveAreas",
    "decalAreas",
    "distortionAreas"
];

/**
 * Bounded adapter for proving the existing ccpwgl OpenGL character path.
 * It realizes the sex-specific nude LOD0 foundation and exact resolved
 * configuration/geometry pairs plus the bounded body-diffuse proof while
 * leaving the remaining material channels and final bindings gated.
 */
export class CcpwglLegacyCharacterAdapter
{
    #atlasComposer;

    #foundationCutMaskEnabled;

    #upperSleeveMaterialEnabled;

    #initialization = null;

    #lowerSleeveMaterialEnabled;

    #paletteCompatibility;

    #resourceRoot;

    #resourceBase;

    #sourceBuild = null;

    #tiny;

    #triangleCoverage;

    #tuckPantsRgbEnabled;

    #tw2;

    constructor({
        tiny = globalThis.tiny,
        tw2 = globalThis.tw2,
        resourceBase = DEFAULT_RESOURCE_BASE,
        resourceRoot = null,
        atlasComposer = null,
        foundationCutMaskEnabled = true,
        lowerSleeveMaterialEnabled = true,
        tuckPantsRgbEnabled = false,
        upperSleeveMaterialEnabled = true,
        paletteCompatibility = CcpwglLegacyPaletteCompatibility,
        triangleCoverage = CcpwglLegacyTriangleCoverage
    } = {})
    {
        if (!tiny || typeof tiny.Initialize !== "function")
        {
            throw new TypeError("Legacy character adapter requires the ccpwgl tiny facade");
        }
        if (!tw2 || typeof tw2.Fetch !== "function")
        {
            throw new TypeError("Legacy character adapter requires the ccpwgl tw2 facade");
        }
        if (atlasComposer !== null && typeof atlasComposer?.Compose !== "function")
        {
            throw new TypeError("Legacy character atlasComposer must expose Compose(staged)");
        }
        if (typeof paletteCompatibility?.Apply !== "function")
        {
            throw new TypeError("Legacy character paletteCompatibility must expose Apply(resource, policy)");
        }
        if (typeof triangleCoverage?.Acquire !== "function"
            || typeof triangleCoverage?.Release !== "function")
        {
            throw new TypeError("Legacy character triangleCoverage must expose Acquire/Release");
        }
        if (typeof foundationCutMaskEnabled !== "boolean")
        {
            throw new TypeError("Legacy character foundationCutMaskEnabled must be boolean");
        }
        if (typeof upperSleeveMaterialEnabled !== "boolean")
        {
            throw new TypeError("Legacy character upperSleeveMaterialEnabled must be boolean");
        }
        if (typeof lowerSleeveMaterialEnabled !== "boolean")
        {
            throw new TypeError("Legacy character lowerSleeveMaterialEnabled must be boolean");
        }
        if (typeof tuckPantsRgbEnabled !== "boolean")
        {
            throw new TypeError("Legacy character tuckPantsRgbEnabled must be boolean");
        }

        this.#tiny = tiny;
        this.#tw2 = tw2;
        this.#resourceBase = String(resourceBase).replace(/\/+$/u, "");
        this.#resourceRoot = resourceRoot === null
            ? null
            : String(resourceRoot).replace(/\/+$/u, "");
        this.#atlasComposer = atlasComposer;
        this.#foundationCutMaskEnabled = foundationCutMaskEnabled;
        this.#lowerSleeveMaterialEnabled = lowerSleeveMaterialEnabled;
        this.#tuckPantsRgbEnabled = tuckPantsRgbEnabled;
        this.#upperSleeveMaterialEnabled = upperSleeveMaterialEnabled;
        this.#paletteCompatibility = paletteCompatibility;
        this.#triangleCoverage = triangleCoverage;
    }

    /** Prepares one hidden object by consuming an explicit ordered construction. */
    async Prepare(construction, context = {})
    {
        ValidateConstruction(construction);
        this.#ConfigureSourceBuild(construction.sourceBuild);
        await this.#Initialize();

        const staged = this.#CreateObject(construction.sex);
        staged.construction = construction;
        staged.appearancePlan = context.appearancePlan ?? null;
        staged.geometryPaths = [];
        staged.foundationResources = new Map();
        staged.configuredParts = [];
        staged.configuredPartBindings = [];
        staged.deferredContributions = [];
        staged.foundationCoverage = [];
        staged.paletteCompatibility = [];
        staged.pendingFoundationCoverage = [];
        staged.foundationCoverageLeases = [];
        staged.textureContributions = construction.textureContributions
            .map(CloneTextureContribution);

        try
        {
            for (const operation of construction.operations)
            {
                await this.#ExecuteOperation(staged, operation);
            }

            staged.compositionReport = staged.textureContributions.length
                ? await this.#atlasComposer.Compose(staged)
                : { status: "deferred", reason: "no-texture-contributions", passes: [] };

            await this.#tw2.resMan?.Watch?.(staged.backend);
            this.#FinalizeConfiguredParts(staged);
            staged.tuckSupportReport = typeof this.#atlasComposer.ComposeExactFemaleTuckSupport === "function"
                ? await this.#atlasComposer.ComposeExactFemaleTuckSupport(staged, {
                    usePantsRgb: this.#tuckPantsRgbEnabled
                })
                : { status: "deferred", reason: "exact-tuck-composer-unavailable" };
            staged.upperSleeveReport = typeof this.#atlasComposer.ComposeExactFemaleUpperSleeve === "function"
                ? await this.#atlasComposer.ComposeExactFemaleUpperSleeve(staged, {
                    attach: this.#upperSleeveMaterialEnabled
                })
                : { status: "deferred", reason: "exact-upper-sleeve-composer-unavailable" };
            staged.lowerSleeveReport = typeof this.#atlasComposer.ComposeExactFemaleLowerSleeve === "function"
                ? await this.#atlasComposer.ComposeExactFemaleLowerSleeve(staged, {
                    attach: this.#lowerSleeveMaterialEnabled
                })
                : { status: "deferred", reason: "exact-lower-sleeve-composer-unavailable" };
            staged.foundationCutMaskReport = typeof this.#atlasComposer.ComposeFoundationCutMask === "function"
                ? await this.#atlasComposer.ComposeFoundationCutMask(staged, {
                    attach: this.#foundationCutMaskEnabled
                })
                : { status: "deferred", reason: "foundation-cut-composer-unavailable" };
            this.#ApplyPendingFoundationCoverage(staged);
            this.#RefreshScene(staged.backend);
            return staged;
        }
        catch (error)
        {
            await this.Release(staged);
            throw error;
        }
    }

    #ConfigureSourceBuild(sourceBuild)
    {
        const build = String(sourceBuild);

        if (this.#sourceBuild !== null && this.#sourceBuild !== build)
        {
            throw new Error(
                `Legacy character adapter is already initialized for source build ${this.#sourceBuild}`
            );
        }

        this.#sourceBuild = build;
        this.#resourceRoot ??= `${this.#resourceBase}/${encodeURIComponent(build)}/resources`;
        this.#atlasComposer ??= new CcpwglLegacyAtlasComposer({
            tw2: this.#tw2,
            resourceRoot: this.#resourceRoot
        });
    }

    /** Publishes the fully prepared object without mutating its predecessor. */
    async Commit(staged)
    {
        RequireStaged(staged);
        const acquired = [];
        try
        {
            for (const pending of staged.pendingFoundationCoverage)
            {
                if (pending.result.status !== "pending-commit") continue;

                for (const role of pending.coverage.roles)
                {
                    const foundation = staged.foundationResources.get(role);
                    if (!foundation)
                    {
                        throw new Error(
                            `Legacy foundation coverage role ${JSON.stringify(role)}`
                            + " has no captured foundation resource"
                        );
                    }
                    const acquiredCoverage = await this.#triangleCoverage.Acquire(
                        foundation.geometryResource,
                        pending.coverage,
                        { gl: this.#tw2.device?.gl ?? null }
                    );
                    const lease = {
                        geometryResource: foundation.geometryResource,
                        lease: acquiredCoverage.lease
                    };
                    staged.foundationCoverageLeases.push(lease);
                    acquired.push(lease);
                    pending.result.applied.push({
                        role,
                        strategy: "triangle-mask",
                        ...acquiredCoverage.report
                    });
                }

                pending.result.status = "applied";
                pending.result.reason = null;
            }
        }
        catch (error)
        {
            for (const value of acquired.reverse())
            {
                try
                {
                    this.#triangleCoverage.Release(
                        value.geometryResource,
                        value.lease,
                        { gl: this.#tw2.device?.gl ?? null }
                    );
                }
                catch (releaseError)
                {
                    error.releaseError ??= releaseError;
                }
            }
            staged.foundationCoverageLeases = staged.foundationCoverageLeases
                .filter(value => !acquired.includes(value));
            throw error;
        }
        staged.backend.display = true;
        this.#RefreshScene(staged.backend);
        return staged;
    }

    /** Returns detached proof diagnostics without exposing live scene objects. */
    GetDiagnostics(staged)
    {
        RequireStaged(staged);
        return {
            foundationGeometryCount: staged.geometryPaths.length,
            configuredPartCount: staged.configuredParts.length,
            configuredParts: staged.configuredParts.map(value => ({ ...value })),
            deferredContributionCount: staged.deferredContributions.length,
            deferredContributions: staged.deferredContributions.map(value => ({ ...value })),
            foundationCoverageCount: staged.foundationCoverage.length,
            foundationCoverage: staged.foundationCoverage.map(CloneDiagnosticValue),
            paletteCompatibilityCount: staged.paletteCompatibility.length,
            paletteCompatibility: staged.paletteCompatibility.map(CloneDiagnosticValue),
            tuckSupport: CloneDiagnosticValue(staged.tuckSupportReport),
            upperSleeve: CloneDiagnosticValue(staged.upperSleeveReport),
            lowerSleeve: CloneDiagnosticValue(staged.lowerSleeveReport),
            foundationCutMask: CloneDiagnosticValue(staged.foundationCutMaskReport),
            textureContributionCount: staged.textureContributions.length,
            textureContributions: staged.textureContributions.map(CloneTextureContribution),
            composition: staged.compositionReport ? {
                ...CloneDiagnosticValue(staged.compositionReport),
                targetSize: staged.compositionReport.targetSize
                    ? [ ...staged.compositionReport.targetSize ]
                    : undefined,
                passes: staged.compositionReport.passes
                    ?.map(CloneDiagnosticValue),
                deferred: staged.compositionReport.deferred
                    ?.map(CloneDiagnosticValue)
            } : null
        };
    }

    /** Toggles one exact configured part for controlled visual isolation. */
    SetConfiguredPartDisplay(staged, partSourceRecordID, display)
    {
        RequireStaged(staged);
        const identity = String(partSourceRecordID ?? "").trim();
        if (!identity) throw new TypeError("Configured part display requires a partSourceRecordID");

        let meshCount = 0;
        for (const binding of staged.configuredPartBindings)
        {
            if (binding.configuredPart.partSourceRecordID !== identity) continue;
            binding.configuredPart.displayStatus = display ? "visible" : "hidden-for-isolation";
            for (const mesh of binding.configuredMeshes)
            {
                mesh.display = Boolean(display);
                meshCount++;
            }
        }

        if (!meshCount)
        {
            throw new Error(`Configured part is not attached: ${identity}`);
        }

        this.#RefreshScene(staged.backend);
        return { partSourceRecordID: identity, display: Boolean(display), meshCount };
    }

    /** Detaches one staged or replaced object from the demo scene. */
    Release(staged)
    {
        if (!staged) return false;

        for (const value of [ ...(staged.foundationCoverageLeases ?? []) ].reverse())
        {
            this.#triangleCoverage.Release(
                value.geometryResource,
                value.lease,
                { gl: this.#tw2.device?.gl ?? null }
            );
        }
        staged.foundationCoverageLeases = [];

        if (!staged.wrapper) return false;

        for (const target of staged.compositionTargets ?? []) target?.Destroy?.();
        staged.compositionTargets = [];
        staged.composedBodyDiffuseTexture = null;

        staged.backend.display = false;
        const scene = this.#tiny.scene;

        if (typeof scene?.RemoveObject === "function")
        {
            scene.RemoveObject(staged.wrapper);
        }
        else if (Array.isArray(scene?.objects))
        {
            const index = scene.objects.indexOf(staged.wrapper);
            if (index !== -1) scene.objects.splice(index, 1);
        }

        staged.wrapper = null;
        return true;
    }

    async #Initialize()
    {
        this.#initialization ||= this.#InitializeOnce();
        return this.#initialization;
    }

    async #InitializeOnce()
    {
        if (!GetClass(this.#tw2, "TnySpaceObject"))
        {
            this.#tw2.runtime?.RegisterTnyConstructors?.(this.#tw2);
        }

        await this.#tiny.Initialize({
            canvas: "character-canvas",
            debug: false,
            device: { webgl2: false },
            client: {
                clearColor: [ 0.035, 0.055, 0.08, 1 ],
                colorMask: [ 0, 0, 0, 0 ]
            },
            paths: {
                res: this.#resourceRoot,
                cdn: this.#resourceRoot,
                local: this.#resourceRoot,
                _cache: this.#resourceRoot,
                cache: this.#resourceRoot
            },
            pathAliases: {
                cdn: "res",
                local: "res"
            },
            scene: [ 0.035, 0.055, 0.08, 1 ],
            camera: {
                type: "testOrbit",
                canvas: "character-canvas",
                controller: true,
                poi: [ 0, 1.05, 0 ],
                distance: 3.2,
                minDistance: 0.5,
                maxDistance: 20,
                fov: 40,
                nearPlane: 0.05,
                farPlane: 200
            },
            gr2: {
                unpackTangents: true,
                aoGenerate: false
            }
        });

        this.#tiny.scene?.wrapped?.SetValues?.({
            visible: { fog: false, environment: false },
            sunDirection: [ 0, -1, 1 ],
            ambientColor: [ 0.28, 0.31, 0.36, 1 ],
            clearColor: [ 0.035, 0.055, 0.08, 1 ]
        });
    }

    #CreateObject(sex)
    {
        const Tr2IntSkinnedObject = RequireClass(this.#tw2, "Tr2IntSkinnedObject");
        const Tr2SkinnedModel = RequireClass(this.#tw2, "Tr2SkinnedModel");
        const Tw2Mesh = RequireClass(this.#tw2, "Tw2Mesh");
        const TnySpaceObject = RequireClass(this.#tw2, "TnySpaceObject");
        const backend = new Tr2IntSkinnedObject();

        backend.name = `${sex} character foundation proof`;
        backend.display = false;
        backend.interiorLights = CreateLegacyOpenGLLights(this.#tw2);
        backend.visualModel = new Tr2SkinnedModel();
        backend.visualModel.name = `${sex} character visual model`;

        if (typeof backend.visualModel.EnsureMesh === "function")
        {
            backend.visualModel.EnsureMesh();
        }
        else
        {
            backend.visualModel.meshes.push(new Tw2Mesh());
        }

        backend.Initialize?.();
        const wrapper = new TnySpaceObject(backend);

        if (typeof this.#tiny.scene?.AddObject === "function")
        {
            this.#tiny.scene.AddObject(wrapper);
        }
        else if (Array.isArray(this.#tiny.scene?.objects))
        {
            this.#tiny.scene.objects.push(wrapper);
        }
        else
        {
            throw new Error("The ccpwgl scene cannot accept a character object");
        }

        return { backend, wrapper, sex };
    }

    async #ExecuteOperation(staged, operation)
    {
        switch (operation.operation)
        {
            case "skeleton":
            {
                const skeleton = await this.#tw2.Fetch(operation.resourcePath);
                staged.backend.visualModel.SetSkeletonResource(skeleton);
                staged.skeletonPath = operation.resourcePath;
                break;
            }
            case "geometry":
            {
                const geometry = await this.#tw2.Fetch(operation.resourcePath);
                if (operation.compatibility)
                {
                    const report = await this.#paletteCompatibility.Apply(
                        geometry,
                        operation.compatibility,
                        { gl: this.#tw2.device?.gl ?? null }
                    );
                    staged.paletteCompatibility.push({
                        role: operation.role,
                        resourcePath: operation.resourcePath,
                        ...report
                    });
                }
                const mesh = staged.backend.visualModel.SetGeometryResource(
                    geometry,
                    operation.index
                );

                if (mesh)
                {
                    mesh.geometryResPath = operation.resourcePath;
                    mesh._characterFoundationRole = operation.role;
                    staged.foundationResources.set(operation.role, {
                        geometryResource: geometry,
                        resourcePath: operation.resourcePath,
                        baseMesh: mesh
                    });
                }
                staged.geometryPaths[operation.index] = operation.resourcePath;
                break;
            }
            case "rebuild-areas":
                staged.backend.visualModel.RebuildAreas?.(operation.shaderPath);
                PropagateFoundationRoles(staged.backend.visualModel);
                staged.shaderPath = operation.shaderPath;
                break;
            case "proof-textures":
                ApplyProofTextures(staged.backend.visualModel, operation.profile);
                break;
            case "configured-part":
                await this.#AttachConfiguredPart(staged, operation);
                break;
            case "deferred-contribution":
                staged.deferredContributions.push({
                    groupID: operation.groupID,
                    layerIndex: operation.layerIndex,
                    partIndex: operation.partIndex,
                    partSourceRecordID: operation.partSourceRecordID ?? null,
                    configurationPath: operation.configurationPath,
                    geometryPath: operation.geometryPath,
                    evidence: { ...operation.evidence },
                    status: "retained-not-rendered"
                });
                break;
            case "bind-animation":
                staged.backend.BindAnimationToVisualModel?.();
                break;
            default:
                throw new Error(`Unsupported legacy construction operation ${JSON.stringify(operation.operation)}`);
        }
    }

    async #AttachConfiguredPart(staged, operation)
    {
        const configuredModel = await this.#tw2.Fetch(operation.configurationPath);

        if (!Array.isArray(configuredModel?.meshes)
            || typeof configuredModel?.SetGeometryResource !== "function")
        {
            throw new Error(
                `Configured character part is not a skinned model: ${operation.configurationPath}`
            );
        }
        if (!configuredModel.meshes.length)
        {
            throw new Error(`Configured character part has no meshes: ${operation.configurationPath}`);
        }

        const geometry = await this.#tw2.Fetch(operation.geometryPath);

        if (!Array.isArray(geometry?.meshes) || !geometry.meshes.length)
        {
            throw new Error(`Configured character geometry has no meshes: ${operation.geometryPath}`);
        }

        const configuredMeshes = [];
        let authoredMeshIndexCount = 0;
        let modelBindingMeshIndexCount = 0;

        for (let index = 0; index < configuredModel.meshes.length; index++)
        {
            const mesh = configuredModel.meshes[index];
            const authoredMeshIndex = mesh?.meshIndex;

            if (!mesh)
            {
                throw new Error(`Configured character mesh ${index} is absent`);
            }

            configuredModel.SetGeometryResource(geometry, index);
            const configuredMesh = configuredModel.meshes[index];
            const resolved = ResolveConfiguredMeshIndex(
                geometry,
                authoredMeshIndex,
                configuredMesh?.meshIndex
            );

            if (!configuredMesh || resolved === null)
            {
                throw new Error(
                    `Configured character mesh ${index} has no exact geometry binding`
                    + ` (${operation.configurationPath}; authored=${String(authoredMeshIndex)};`
                    + ` model=${String(configuredMesh?.meshIndex)};`
                    + ` geometryMeshes=${geometry.meshes.length})`
                );
            }

            if (resolved.source === "authored") authoredMeshIndexCount++;
            else modelBindingMeshIndexCount++;

            configuredMesh.geometryResource = geometry;
            configuredMesh.geometryResPath = operation.geometryPath;
            configuredMesh.meshIndex = resolved.meshIndex;

            for (const field of AREA_FIELDS)
            {
                for (const area of configuredMesh[field] ?? [])
                {
                    area.meshIndex = resolved.meshIndex;
                }
            }

            configuredMeshes.push(configuredMesh);
        }

        await this.#tw2.resMan?.Watch?.(configuredModel);

        const effects = GetEffects(configuredMeshes);
        const authoredEffectsReady = effects.length > 0
            && effects.every(IsAuthoredConfiguredEffectRenderable);
        const proofEffects = [];

        for (const effect of effects)
        {
            PreserveAuthoredEffectState(effect);
            if (IsAuthoredConfiguredEffectRenderable(effect)) continue;

            if (typeof effect?.SetValues === "function")
            {
                effect.SetValues({ effectFilePath: staged.shaderPath });
            }
            else
            {
                effect.effectFilePath = staged.shaderPath;
            }
            effect?.Initialize?.();
            effect._characterProofFallback = true;
            proofEffects.push(effect);
        }

        if (proofEffects.length)
        {
            ApplyProofTexturesToEffects(proofEffects, "neutral");
            await this.#tw2.resMan?.Watch?.(configuredModel);
        }

        const proofEffectsReady = proofEffects.length > 0
            && proofEffects.every(effect => effect?.IsGood?.() === true);
        for (const mesh of configuredMeshes)
        {
            mesh._characterConfigPath = operation.configurationPath;
            mesh._characterGroupID = operation.groupID;
            mesh._characterPartIndex = operation.partIndex;
            mesh._characterPartSourceRecordID = operation.partSourceRecordID ?? null;
            staged.backend.visualModel.meshes.push(mesh);
        }

        const configuredPart = {
            groupID: operation.groupID,
            layerIndex: operation.layerIndex,
            partIndex: operation.partIndex,
            partSourceRecordID: operation.partSourceRecordID ?? null,
            configurationPath: operation.configurationPath,
            geometryPath: operation.geometryPath,
            meshCount: configuredMeshes.length,
            authoredMeshIndexCount,
            modelBindingMeshIndexCount,
            effectCount: effects.length,
            geometryStatus: "attached",
            authoredEffectStatus: authoredEffectsReady ? "ready" : "deferred",
            proofFallbackEffectCount: proofEffects.length,
            proofEffectStatus: proofEffects.length
                ? proofEffectsReady ? "ready" : "deferred"
                : "not-required",
            renderStatus: "pending-final-watch",
            displayStatus: "visible",
            materialStatus: "deferred",
            compositionStatus: "deferred",
            foundationCoverage: null
        };

        staged.configuredParts.push(configuredPart);
        staged.configuredPartBindings.push({
            configuredPart,
            configuredMeshes: [ ...configuredMeshes ]
        });
        this.#QueueFoundationCoverage(
            staged,
            operation,
            configuredPart,
            configuredMeshes
        );
    }

    #QueueFoundationCoverage(staged, operation, configuredPart, configuredMeshes)
    {
        const coverage = operation.foundationCoverage;
        if (!coverage) return null;

        const requestedRoles = new Set(
            staged.pendingFoundationCoverage.flatMap(value => value.coverage.roles)
        );

        for (const role of coverage.roles)
        {
            if (requestedRoles.has(role))
            {
                throw new Error(
                    `Legacy foundation coverage role ${JSON.stringify(role)}`
                    + " is requested by more than one configured part"
                );
            }
        }

        const result = {
            status: "pending-final-watch",
            reason: null,
            partSourceRecordID: operation.partSourceRecordID ?? null,
            roles: [ ...coverage.roles ],
            strategy: coverage.strategy,
            evidence: { ...coverage.evidence },
            applied: []
        };

        configuredPart.foundationCoverage = result;
        staged.foundationCoverage.push(result);
        staged.pendingFoundationCoverage.push({
            coverage,
            configuredMeshes: [ ...configuredMeshes ],
            configuredPart,
            result
        });
        return result;
    }

    #FinalizeConfiguredParts(staged)
    {
        for (const binding of staged.configuredPartBindings)
        {
            binding.configuredPart.renderStatus = IsConfiguredPartRenderable(
                binding.configuredMeshes
            )
                ? "ready"
                : "deferred-not-render-ready";
        }
    }

    #ApplyPendingFoundationCoverage(staged)
    {
        const meshes = staged.backend.visualModel.meshes;

        for (const pending of staged.pendingFoundationCoverage)
        {
            const { configuredPart, coverage, result } = pending;

            if (configuredPart.renderStatus !== "ready")
            {
                result.status = "deferred-not-render-ready";
                result.reason = "configured-part-not-render-ready";
                continue;
            }

            if (coverage.strategy === "triangle-mask")
            {
                result.status = "pending-commit";
                result.reason = "awaiting-atomic-commit";
                continue;
            }

            for (const role of coverage.roles)
            {
                const foundation = staged.foundationResources.get(role);

                if (!foundation)
                {
                    throw new Error(
                        `Legacy foundation coverage role ${JSON.stringify(role)}`
                        + " has no captured foundation resource"
                    );
                }

                const matches = meshes.filter(mesh =>
                    mesh?.geometryResource === foundation.geometryResource);

                if (!matches.length)
                {
                    throw new Error(
                        `Legacy foundation coverage role ${JSON.stringify(role)}`
                        + " has no foundation render carriers"
                    );
                }

                for (const mesh of matches)
                {
                    const meshIndex = meshes.indexOf(mesh);
                    const previousDisplay = mesh.display !== false;

                    mesh.display = false;
                    result.applied.push({ role, meshIndex, previousDisplay, display: false });
                }
            }

            result.status = "applied";
            result.reason = null;
        }
    }

    #RefreshScene(backend)
    {
        const scene = this.#tiny.scene?.wrapped;

        scene?.ApplyPerFrameData?.();
        backend?.UpdateViewDependentData?.();
        backend?.UpdatePerObjectData?.();
    }
}

function PropagateFoundationRoles(visualModel)
{
    const meshes = visualModel?.meshes ?? [];
    const bases = meshes.filter(mesh =>
        mesh?._characterFoundationRole && mesh?._interiorAutoPart !== true);

    for (const mesh of meshes)
    {
        if (mesh?._interiorAutoPart !== true || mesh._characterFoundationRole) continue;

        const source = bases.find(candidate =>
            (mesh.geometryResource && mesh.geometryResource === candidate.geometryResource)
            || (mesh.geometryResPath && mesh.geometryResPath === candidate.geometryResPath));

        if (source)
        {
            mesh._characterFoundationRole = source._characterFoundationRole;
        }
    }
}

function IsConfiguredPartRenderable(meshes)
{
    if (!meshes.length) return false;

    for (const mesh of meshes)
    {
        const geometry = mesh?.geometryResource;
        const meshIndex = mesh?.meshIndex;

        if (!mesh || mesh.display === false || !geometry)
        {
            return false;
        }
        if (typeof geometry.IsGood === "function" && geometry.IsGood() !== true)
        {
            return false;
        }
        if (!HasGeometryMesh(geometry, meshIndex))
        {
            return false;
        }

        const areas = VISIBLE_AREA_FIELDS
            .flatMap(field => mesh[field] ?? [])
            .filter(area => area?.display !== false);

        if (!areas.length || areas.some(area => area?.effect?.IsGood?.() !== true))
        {
            return false;
        }
    }

    return true;
}

function ResolveConfiguredMeshIndex(geometry, authoredMeshIndex, modelBindingMeshIndex)
{
    if (HasGeometryMesh(geometry, authoredMeshIndex))
    {
        return { meshIndex: authoredMeshIndex, source: "authored" };
    }
    if (HasGeometryMesh(geometry, modelBindingMeshIndex))
    {
        return { meshIndex: modelBindingMeshIndex, source: "skinned-model-binding" };
    }
    return null;
}

function HasGeometryMesh(geometry, meshIndex)
{
    return Number.isSafeInteger(meshIndex)
        && meshIndex >= 0
        && Boolean(geometry?.meshes?.[meshIndex]);
}

function CreateLegacyOpenGLLights(tw2)
{
    const LightSource = RequireClass(tw2, "Tr2InteriorLightSource");
    const lights = [];

    for (let index = 0; index < LEGACY_OPENGL_LIGHTS.length; index++)
    {
        const light = new LightSource();
        const values = LEGACY_OPENGL_LIGHTS[index];

        if (typeof light?.SetValues === "function")
        {
            light.SetValues({
                name: `character_${values.name}`,
                primaryLighting: true,
                position: [ ...values.position ],
                color: [ ...values.color ],
                radius: values.radius,
                falloff: values.falloff
            });
        }
        else if (light)
        {
            light.name = `character_${values.name}`;
            light.primaryLighting = true;
            CopyValues(light.position, values.position);
            CopyValues(light.color, values.color);
            light.radius = values.radius;
            light.falloff = values.falloff;
        }

        light?.Initialize?.();
        lights.push(light);
    }

    return lights;
}

function CopyValues(target, source)
{
    if (!target) return;
    for (let index = 0; index < source.length; index++) target[index] = source[index];
}

function ValidateConstruction(construction)
{
    if (!construction || typeof construction !== "object")
    {
        throw new TypeError("Legacy character adapter requires a construction object");
    }
    if (construction.backend !== "legacy-opengl")
    {
        throw new Error("Legacy character adapter requires the legacy-opengl backend");
    }
    if (construction.lod !== 0)
    {
        throw new Error("Legacy character adapter currently requires whole-character LOD 0");
    }
    if (construction.sex !== "female" && construction.sex !== "male")
    {
        throw new Error("Legacy character adapter requires a female or male construction");
    }
    if (!/^\d+$/u.test(String(construction.sourceBuild ?? "")))
    {
        throw new Error("Legacy character adapter requires an exact numeric sourceBuild");
    }
    const evidenceRule = construction.evidence?.rule;

    if (construction.evidence?.status !== "policy"
        || (evidenceRule !== "legacy-opengl-foundation-v1"
            && evidenceRule !== "legacy-opengl-appearance-v1"))
    {
        throw new Error("Legacy character adapter requires the explicit foundation policy label");
    }
    if (!Array.isArray(construction.operations) || construction.operations.length < 5)
    {
        throw new Error("Legacy character adapter requires ordered construction operations");
    }
    if (!Array.isArray(construction.textureContributions))
    {
        throw new TypeError("Legacy character construction requires texture contributions");
    }
    const operations = construction.operations;

    if (operations[0]?.operation !== "skeleton"
        || operations[operations.length - 1]?.operation !== "bind-animation")
    {
        throw new Error("Legacy character construction operation order is invalid");
    }

    RequireResourcePath(operations[0].resourcePath, "skeleton resourcePath");

    let cursor = 1;

    while (operations[cursor]?.operation === "geometry") cursor++;

    const geometry = operations.slice(1, cursor);

    if (!geometry.length)
    {
        throw new Error("Legacy character construction requires geometry operations");
    }

    for (let index = 0; index < geometry.length; index++)
    {
        const operation = geometry[index];

        if (operation?.operation !== "geometry" || operation.index !== index)
        {
            throw new Error("Legacy character geometry operations require contiguous ordered indices");
        }
        if (!String(operation.role ?? "").trim())
        {
            throw new Error("Legacy character geometry operations require a role");
        }
        RequireResourcePath(operation.resourcePath, `geometry ${index} resourcePath`);
        ValidatePaletteCompatibility(construction, operation);
    }

    const rebuild = operations[cursor++];
    const proofTextures = operations[cursor++];

    if (rebuild?.operation !== "rebuild-areas"
        || proofTextures?.operation !== "proof-textures")
    {
        throw new Error("Legacy character foundation operations are incomplete or unordered");
    }

    RequireResourcePath(rebuild.shaderPath, "shaderPath");

    if (proofTextures.profile !== "neutral")
    {
        throw new Error("Legacy character adapter only supports the neutral proof-texture profile");
    }

    const contributions = operations.slice(cursor, -1);
    let configuredPartCount = 0;
    let deferredContributionCount = 0;

    for (let index = 0; index < contributions.length; index++)
    {
        const operation = contributions[index];

        if ((operation?.operation !== "configured-part"
                && operation?.operation !== "deferred-contribution")
            || operation.layerIndex !== index
            || !Number.isSafeInteger(operation.partIndex)
            || operation.partIndex < 0)
        {
            throw new Error("Legacy contribution operations require ordered plan indices");
        }
        if (!String(operation.groupID ?? "").trim())
        {
            throw new Error("Legacy configured-part operations require a selection group");
        }
        if (operation.partSourceRecordID !== null
            && operation.partSourceRecordID !== undefined
            && !String(operation.partSourceRecordID).trim())
        {
            throw new Error("Legacy contribution partSourceRecordID must be null or non-empty");
        }

        if (operation.operation === "configured-part")
        {
            configuredPartCount++;
            RequireResourcePath(operation.configurationPath, `configured part ${index} configurationPath`);
            RequireResourcePath(operation.geometryPath, `configured part ${index} geometryPath`);
            ValidateFoundationCoverage(operation, construction.sex);
        }
        else
        {
            deferredContributionCount++;
            if (operation.foundationCoverage !== undefined)
            {
                throw new Error("Deferred legacy contributions cannot change foundation visibility");
            }
            if (operation.configurationPath !== null)
            {
                RequireResourcePath(operation.configurationPath, `deferred part ${index} configurationPath`);
            }
            if (operation.geometryPath !== null)
            {
                RequireResourcePath(operation.geometryPath, `deferred part ${index} geometryPath`);
            }
        }
    }

    ValidateLegacyTextureContributions(
        construction.textureContributions,
        contributions,
        "Legacy character adapter"
    );

    if (contributions.length)
    {
        if (evidenceRule !== "legacy-opengl-appearance-v1"
            || construction.resolvedPartCount !== contributions.length
            || construction.configuredPartCount !== configuredPartCount
            || construction.deferredContributionCount !== deferredContributionCount)
        {
            throw new Error("Legacy contributions require the explicit appearance policy label and counts");
        }
    }
    else if (evidenceRule !== "legacy-opengl-foundation-v1")
    {
        throw new Error("Legacy foundation-only construction requires the foundation policy label");
    }
}

function ValidatePaletteCompatibility(construction, operation)
{
    const policy = operation.compatibility;
    if (policy === undefined || policy === null) return;

    if (construction.sex !== "female"
        || operation.role !== "body"
        || operation.resourcePath !== FEMALE_LOD0_BODY_PATH
        || policy.status !== "policy"
        || policy.rule !== "legacy-opengl-bone-capacity-mask-v1"
        || policy.shaderCapacity !== 58
        || policy.requiredBoneCount !== 69
        || !Array.isArray(policy.bonePrefixes)
        || policy.bonePrefixes.length !== 1
        || policy.bonePrefixes[0] !== "RightHand")
    {
        throw new Error("Legacy palette compatibility is restricted to the exact female LOD0 body policy");
    }
}

function ValidateFoundationCoverage(operation, sex)
{
    const coverage = operation.foundationCoverage;
    if (coverage === undefined) return;

    if (!coverage || !Array.isArray(coverage.roles) || !coverage.roles.length)
    {
        throw new Error("Legacy foundation coverage requires one or more roles");
    }

    const roles = coverage.roles.map(role => String(role ?? "").trim());

    if (roles.some(role => !role) || new Set(roles).size !== roles.length)
    {
        throw new Error("Legacy foundation coverage roles must be unique non-empty strings");
    }

    const evidence = coverage.evidence;

    if (evidence?.status !== "policy"
        || evidence?.rule !== "legacy-opengl-exact-foundation-coverage-v1"
        || evidence?.sex !== sex
        || evidence?.groupID !== operation.groupID
        || evidence?.partSourceRecordID !== operation.partSourceRecordID)
    {
        throw new Error("Legacy foundation coverage requires matching explicit policy evidence");
    }

    if (coverage.strategy === "hide-carrier")
    {
        if (sex !== "male" || roles.length !== 1 || roles[0] !== "feet"
            || coverage.bonePrefixes !== undefined || coverage.triangleRule !== undefined)
        {
            throw new Error("Legacy hide-carrier coverage is restricted to the exact male feet policy");
        }
        return;
    }

    const expectedPrefixes = [ "LeftFoot", "RightFoot", "LeftToe", "RightToe" ];
    if (coverage.strategy !== "triangle-mask"
        || sex !== "female"
        || roles.length !== 1
        || roles[0] !== "body"
        || coverage.triangleRule !== "legacy-opengl-exact-foundation-triangle-coverage-v1"
        || !Array.isArray(coverage.bonePrefixes)
        || coverage.bonePrefixes.length !== expectedPrefixes.length
        || expectedPrefixes.some((value, index) => coverage.bonePrefixes[index] !== value))
    {
        throw new Error("Legacy triangle coverage is restricted to the exact female body boot policy");
    }
}

function CloneTextureContribution(value)
{
    return {
        ...value,
        source: { ...value.source },
        materialValues: CloneDiagnosticValue(value.materialValues),
        textureCandidates: value.textureCandidates.map(candidate => ({ ...candidate })),
        selectedTextures: value.selectedTextures.map(texture => ({ ...texture })),
        diagnostics: value.diagnostics.map(diagnostic => ({ ...diagnostic })),
        evidence: { ...value.evidence }
    };
}

function CloneDiagnosticValue(value)
{
    if (Array.isArray(value)) return value.map(CloneDiagnosticValue);
    if (!value || typeof value !== "object") return value;

    const result = {};
    for (const [ key, child ] of Object.entries(value))
    {
        result[key] = CloneDiagnosticValue(child);
    }
    return result;
}

function GetEffects(meshes)
{
    const effects = [];

    for (const mesh of meshes)
    {
        for (const field of AREA_FIELDS)
        {
            for (const area of mesh?.[field] ?? [])
            {
                if (area?.effect && !effects.includes(area.effect)) effects.push(area.effect);
            }
        }
    }

    return effects;
}

function PreserveAuthoredEffectState(effect)
{
    const texturePaths = {};

    effect._characterAuthoredEffectFilePath = String(effect?.effectFilePath ?? "");
    effect._characterAuthoredBodyAtlasConsumer = isLegacyConfiguredBodyConsumerEffect(effect);

    for (const [ name, parameter ] of Object.entries(effect?.parameters ?? {}))
    {
        const path = String(
            parameter?.resourcePath
            || parameter?.textureRes?.path
            || ""
        ).trim();
        if (/^res:\//iu.test(path)) texturePaths[name] = path;
    }

    effect._characterAuthoredTexturePaths = texturePaths;
    const transform = ReadVectorParameter(effect?.parameters?.TransformUV0, 4);
    if (transform) effect._characterAuthoredTransformUV0 = transform;
}

function IsAuthoredConfiguredEffectRenderable(effect)
{
    if (effect?.IsGood?.() !== true) return false;
    const parameter = effect?.parameters?.DiffuseMap;
    const path = String(
        parameter?.resourcePath
        || parameter?.textureRes?.path
        || ""
    ).trim();
    return /^res:\//iu.test(path);
}

function ReadVectorParameter(parameter, length)
{
    if (!parameter) return null;

    try
    {
        const value = typeof parameter.GetValue === "function"
            ? parameter.GetValue([])
            : parameter.value;
        if (!value || typeof value.length !== "number" || value.length < length) return null;
        const result = Array.from(value).slice(0, length).map(Number);
        return result.every(Number.isFinite) ? result : null;
    }
    catch
    {
        return null;
    }
}

function ApplyProofTextures(visualModel, profile)
{
    const effects = GetEffects(visualModel?.meshes ?? []);

    ApplyProofTexturesToEffects(effects, profile);
}

function ApplyProofTexturesToEffects(effects, profile)
{
    const textures = GetProofTextures(profile);

    for (const effect of effects)
    {
        effect?.SetTextures?.(textures);
    }
}

function GetProofTextures(profile)
{
    if (profile !== "neutral")
    {
        throw new Error(`Unsupported legacy proof-texture profile ${JSON.stringify(profile)}`);
    }

    return {
        DiffuseMap: "res:/dx9/model/decal/shared/bw_000_000_065.dds",
        SpecularMap: "res:/dx9/model/decal/shared/bw_000_000_015.dds",
        NormalMap: "res:/graphics/shared_texture/global/normal_flat.dds",
        ReflectionMap: "res:/graphics/shared_texture/global/white_cube.dds",
        ShadowCubeMap0: "res:/graphics/shared_texture/global/white_cube.dds",
        CutMaskMap: "res:/dx9/model/decal/shared/bw_000_000_100.dds",
        FresnelLookupMap: "res:/dx9/model/decal/shared/bw_000_000_065.dds"
    };
}

function RequireResourcePath(value, label)
{
    const result = String(value ?? "").trim();

    if (!/^res:\//iu.test(result))
    {
        throw new TypeError(`Legacy character adapter ${label} must be a res:/ path`);
    }

    return result;
}

function GetClass(tw2, name)
{
    try
    {
        return tw2.GetClass?.(name) ?? null;
    }
    catch
    {
        return null;
    }
}

function RequireClass(tw2, name)
{
    const Constructor = GetClass(tw2, name) ?? tw2[name];

    if (typeof Constructor !== "function")
    {
        throw new Error(`The ccpwgl bundle does not register ${name}`);
    }

    return Constructor;
}

function RequireStaged(staged)
{
    if (!staged?.backend || !staged?.wrapper)
    {
        throw new TypeError("Legacy character adapter requires a prepared stage");
    }
}

export default CcpwglLegacyCharacterAdapter;
