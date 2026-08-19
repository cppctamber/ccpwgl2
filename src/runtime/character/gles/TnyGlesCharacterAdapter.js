import { tw2 } from "global";
import {
    TnyGlesAtlasComposer,
    isLegacyConfiguredBodyConsumerEffect
} from "./TnyGlesAtlasComposer.js";
import {
    ValidateLegacyTextureContributions
} from "./TnyGlesTextureContributions.js";
import { TnyGlesPaletteCompatibility } from "./TnyGlesPaletteCompatibility.js";
import { TnyGlesTriangleCoverage } from "./TnyGlesTriangleCoverage.js";
import { TnyGlesMorphDeformation } from "./TnyGlesMorphDeformation.js";

const DEFAULT_RESOURCE_BASE = "http://127.0.0.1:5510/eve";
const DEFAULT_CLEAR_COLOR = [ 0.035, 0.055, 0.08, 1 ];
const WHITE_PROOF_TEXTURE = "res:/dx9/model/decal/shared/bw_000_000_100.dds";
const UNRESOLVED_GARMENT_COLOR = [ 1, 0, 1, 1 ];
const FEMALE_LOD0_BODY_PATH = "res:/graphics/character/female/paperdoll/basenude/basenude.gr2";
const FEMALE_LOD0_HANDS_PATH =
    "res:/graphics/character/female/paperdoll/hands/hands_nude/hands_nude.gr2";

// These demo-owned V8 interior-light inputs feed ccpwgl's legacy avatar
// per-object packing; they are not a runtime-character lighting contract.
const LEGACY_OPENGL_LIGHTS = [
    { name: "front", color: [ 4.4, 4.4, 4.4, 1 ], position: [ 0, 135, 190 ], radius: 300, falloff: 1 },
    { name: "left", color: [ 2.15, 2.15, 2.15, 1 ], position: [ -190, 115, 0 ], radius: 280, falloff: 1 },
    { name: "right", color: [ 2.15, 2.15, 2.15, 1 ], position: [ 190, 115, 0 ], radius: 280, falloff: 1 },
    { name: "back", color: [ 4.8, 4.8, 4.8, 1 ], position: [ 0, 150, -200 ], radius: 320, falloff: 1 }
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
export class TnyGlesCharacterAdapter
{
    _atlasComposer;

    _foundationCutMaskEnabled;

    _upperSleeveMaterialEnabled;

    _initialization = null;

    _lowerSleeveMaterialEnabled;

    _lights = [];

    _morphDeformation;

    _morphDeformationEnabled;

    _morphDeformationSkippedPaths;

    _morphDeformationSkippedTargets;

    _paletteCompatibility;

    _resourceRoot;

    _resourceBase;

    _sourceBuild = null;

    _client;

    _cameraDistance;

    _clearColor;

    _triangleCoverage;

    _tuckPantsRgbEnabled;

    _tuckSharedBodyRgbEnabled;

    _tuckCutMaskEnabled;

    _tuckDetailMaskEnabled;

    _tuckDepthTestEnabled;

    _tuckMaterialBaseEnabled;

    _tuckAlphaMode;

    _tuckBlendDetailEnabled;

    _tuckAuthoredUvEnabled;

    constructor({
        client = null,
        cameraDistance = 3.2,
        clearColor = DEFAULT_CLEAR_COLOR,
        resourceBase = DEFAULT_RESOURCE_BASE,
        resourceRoot = null,
        atlasComposer = null,
        foundationCutMaskEnabled = true,
        lowerSleeveMaterialEnabled = true,
        tuckAuthoredUvEnabled = false,
        tuckCutMaskEnabled = true,
        tuckDetailMaskEnabled = true,
        tuckDepthTestEnabled = true,
        tuckMaterialBaseEnabled = false,
        tuckAlphaMode = "source",
        tuckBlendDetailEnabled = false,
        tuckPantsRgbEnabled = false,
        tuckSharedBodyRgbEnabled = true,
        upperSleeveMaterialEnabled = true,
        paletteCompatibility = TnyGlesPaletteCompatibility,
        triangleCoverage = TnyGlesTriangleCoverage,
        morphDeformation = TnyGlesMorphDeformation,
        morphDeformationEnabled = true,
        morphDeformationSkippedPaths = [],
        morphDeformationSkippedTargets = []
    } = {})
    {
        if (!client || typeof client.Initialize !== "function")
        {
            throw new TypeError("GLES character adapter requires a Tny-compatible client");
        }
        if (!tw2 || typeof tw2.Fetch !== "function")
        {
            throw new TypeError("GLES character adapter requires the ccpwgl tw2 facade");
        }
        if (atlasComposer !== null && typeof atlasComposer?.Compose !== "function")
        {
            throw new TypeError("Legacy character atlasComposer must expose Compose(staged)");
        }
        if (!Number.isFinite(cameraDistance) || cameraDistance < 0.5 || cameraDistance > 20)
        {
            throw new TypeError("Legacy character cameraDistance must be between 0.5 and 20");
        }
        if (!Array.isArray(clearColor)
            || clearColor.length !== 4
            || clearColor.some(value => !Number.isFinite(value) || value < 0 || value > 1))
        {
            throw new TypeError("Legacy character clearColor must be four normalized values");
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
        if (typeof morphDeformation?.HasAnyTarget !== "function"
            || typeof morphDeformation?.Acquire !== "function"
            || typeof morphDeformation?.Release !== "function")
        {
            throw new TypeError(
                "Legacy character morphDeformation must expose HasAnyTarget/Acquire/Release"
            );
        }
        if (typeof morphDeformationEnabled !== "boolean")
        {
            throw new TypeError("Legacy character morphDeformationEnabled must be boolean");
        }
        if (!Array.isArray(morphDeformationSkippedPaths)
            || morphDeformationSkippedPaths.some(value => !/^res:\//iu.test(String(value))))
        {
            throw new TypeError("Legacy character morphDeformationSkippedPaths must be res:/ paths");
        }
        if (!Array.isArray(morphDeformationSkippedTargets)
            || morphDeformationSkippedTargets.some(value => !String(value).trim()))
        {
            throw new TypeError("Legacy character morphDeformationSkippedTargets must be names");
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
        if (typeof tuckSharedBodyRgbEnabled !== "boolean")
        {
            throw new TypeError("Legacy character tuckSharedBodyRgbEnabled must be boolean");
        }
        if (typeof tuckCutMaskEnabled !== "boolean")
        {
            throw new TypeError("Legacy character tuckCutMaskEnabled must be boolean");
        }
        if (typeof tuckDetailMaskEnabled !== "boolean")
        {
            throw new TypeError("Legacy character tuckDetailMaskEnabled must be boolean");
        }
        if (typeof tuckDepthTestEnabled !== "boolean")
        {
            throw new TypeError("Legacy character tuckDepthTestEnabled must be boolean");
        }
        if (typeof tuckMaterialBaseEnabled !== "boolean")
        {
            throw new TypeError("Legacy character tuckMaterialBaseEnabled must be boolean");
        }
        if (![ "source", "opaque", "transparent" ].includes(tuckAlphaMode))
        {
            throw new TypeError("Legacy character tuckAlphaMode is invalid");
        }
        if (typeof tuckBlendDetailEnabled !== "boolean")
        {
            throw new TypeError("Legacy character tuckBlendDetailEnabled must be boolean");
        }
        if (typeof tuckAuthoredUvEnabled !== "boolean")
        {
            throw new TypeError("Legacy character tuckAuthoredUvEnabled must be boolean");
        }

        this._client = client;
        this._cameraDistance = cameraDistance;
        this._clearColor = [ ...clearColor ];
        this._resourceBase = String(resourceBase).replace(/\/+$/u, "");
        this._resourceRoot = resourceRoot === null
            ? null
            : String(resourceRoot).replace(/\/+$/u, "");
        this._atlasComposer = atlasComposer;
        this._foundationCutMaskEnabled = foundationCutMaskEnabled;
        this._lowerSleeveMaterialEnabled = lowerSleeveMaterialEnabled;
        this._tuckAuthoredUvEnabled = tuckAuthoredUvEnabled;
        this._tuckCutMaskEnabled = tuckCutMaskEnabled;
        this._tuckDetailMaskEnabled = tuckDetailMaskEnabled;
        this._tuckDepthTestEnabled = tuckDepthTestEnabled;
        this._tuckMaterialBaseEnabled = tuckMaterialBaseEnabled;
        this._tuckAlphaMode = tuckAlphaMode;
        this._tuckBlendDetailEnabled = tuckBlendDetailEnabled;
        this._tuckPantsRgbEnabled = tuckPantsRgbEnabled;
        this._tuckSharedBodyRgbEnabled = tuckSharedBodyRgbEnabled;
        this._upperSleeveMaterialEnabled = upperSleeveMaterialEnabled;
        this._paletteCompatibility = paletteCompatibility;
        this._triangleCoverage = triangleCoverage;
        this._morphDeformation = morphDeformation;
        this._morphDeformationEnabled = morphDeformationEnabled;
        this._morphDeformationSkippedPaths = new Set(
            morphDeformationSkippedPaths.map(value => String(value).toLowerCase())
        );
        this._morphDeformationSkippedTargets = new Set(
            morphDeformationSkippedTargets.map(value => String(value).trim().toLowerCase())
        );
    }

    /** Prepares one hidden object by consuming an explicit ordered construction. */
    async Prepare(construction, context = {})
    {
        ValidateConstruction(construction);
        this._ConfigureSourceBuild(construction.sourceBuild);
        const libraryManager = context.source?.GetLibraryManager?.() ?? null;
        if (libraryManager && typeof this._atlasComposer.SetTextureMetadataSource === "function")
        {
            this._atlasComposer.SetTextureMetadataSource(libraryManager);
        }
        await this._Initialize();

        const staged = this._CreateObject(construction.sex);
        staged.construction = construction;
        staged.appearancePlan = context.appearancePlan ?? null;
        staged.geometryPaths = [];
        staged.foundationGeometry = [];
        staged.foundationResources = new Map();
        staged.configuredFoundations = [];
        staged.configuredFoundationBindings = [];
        staged.configuredFoundationSupports = [];
        staged.configuredFoundationSupportBindings = [];
        staged.configuredParts = [];
        staged.configuredPartBindings = [];
        staged.deferredContributions = [];
        staged.foundationCoverage = [];
        staged.paletteCompatibility = [];
        staged.pendingFoundationCoverage = [];
        staged.foundationCoverageLeases = [];
        staged.morphTargets = (construction.morphTargets ?? []).map(CloneMorphTarget);
        staged.morphDeformation = [];
        staged.pendingMorphDeformations = [];
        staged.morphDeformationLeases = [];
        staged.textureContributions = construction.textureContributions
            .map(CloneTextureContribution);

        try
        {
            for (const operation of construction.operations)
            {
                await this._ExecuteOperation(staged, operation);
            }

            staged.compositionReport = staged.textureContributions.length
                ? await this._atlasComposer.Compose(staged)
                : { status: "deferred", reason: "no-texture-contributions", passes: [] };

            await tw2.resMan?.Watch?.(staged.backend);
            for (const binding of staged.configuredPartBindings)
            {
                RestoreConfiguredMeshBindings(binding.resolvedMeshBindings);
            }
            for (const binding of staged.configuredFoundationBindings)
            {
                RestoreConfiguredMeshBindings(binding.resolvedMeshBindings);
            }
            for (const binding of staged.configuredFoundationSupportBindings)
            {
                RestoreConfiguredMeshBindings(binding.resolvedMeshBindings);
            }
            this._FinalizeConfiguredParts(staged);
            staged.configuredHeadMaterialReport =
                typeof this._atlasComposer.ComposeConfiguredHeadMaterials === "function"
                    ? await this._atlasComposer.ComposeConfiguredHeadMaterials(staged)
                    : { status: "deferred", reason: "configured-head-composer-unavailable" };
            staged.configuredHairMaterialReport =
                typeof this._atlasComposer.ComposeConfiguredHairMaterials === "function"
                    ? await this._atlasComposer.ComposeConfiguredHairMaterials(staged)
                    : { status: "deferred", reason: "configured-hair-composer-unavailable" };
            staged.configuredHeadwearMaterialReport =
                typeof this._atlasComposer.ComposeConfiguredHeadwearMaterials === "function"
                    ? await this._atlasComposer.ComposeConfiguredHeadwearMaterials(staged)
                    : { status: "deferred", reason: "configured-headwear-composer-unavailable" };
            staged.configuredGarmentMaterialReport =
                typeof this._atlasComposer.ComposeConfiguredGarmentMaterials === "function"
                    ? await this._atlasComposer.ComposeConfiguredGarmentMaterials(staged)
                    : { status: "deferred", reason: "configured-garment-composer-unavailable" };
            staged.selectedTopDrapeReport =
                typeof this._atlasComposer.ComposeSelectedTopDrapeSupport === "function"
                    ? await this._atlasComposer.ComposeSelectedTopDrapeSupport(staged)
                    : { status: "deferred", reason: "selected-top-drape-composer-unavailable" };
            staged.tuckSupportReport = typeof this._atlasComposer.ComposeExactFemaleTuckSupport === "function"
                ? await this._atlasComposer.ComposeExactFemaleTuckSupport(staged, {
                    applyCutMask: this._tuckCutMaskEnabled,
                    alphaMode: this._tuckAlphaMode,
                    blendDetail: this._tuckBlendDetailEnabled,
                    fillMaterialBase: this._tuckMaterialBaseEnabled,
                    depthTest: this._tuckDepthTestEnabled,
                    useAuthoredTransform: this._tuckAuthoredUvEnabled,
                    useDetailMask: this._tuckDetailMaskEnabled,
                    usePantsRgb: this._tuckPantsRgbEnabled,
                    useSharedBodyRgb: this._tuckSharedBodyRgbEnabled
                })
                : { status: "deferred", reason: "exact-tuck-composer-unavailable" };
            staged.upperSleeveReport = typeof this._atlasComposer.ComposeExactFemaleUpperSleeve === "function"
                ? await this._atlasComposer.ComposeExactFemaleUpperSleeve(staged, {
                    attach: this._upperSleeveMaterialEnabled
                })
                : { status: "deferred", reason: "exact-upper-sleeve-composer-unavailable" };
            staged.lowerSleeveReport = typeof this._atlasComposer.ComposeExactFemaleLowerSleeve === "function"
                ? await this._atlasComposer.ComposeExactFemaleLowerSleeve(staged, {
                    attach: this._lowerSleeveMaterialEnabled
                })
                : { status: "deferred", reason: "exact-lower-sleeve-composer-unavailable" };
            staged.foundationCutMaskReport = typeof this._atlasComposer.ComposeFoundationCutMask === "function"
                ? await this._atlasComposer.ComposeFoundationCutMask(staged, {
                    attach: this._foundationCutMaskEnabled
                })
                : { status: "deferred", reason: "foundation-cut-composer-unavailable" };
            this._ApplyPendingFoundationCoverage(staged);
            if (this._morphDeformationEnabled) this._PrepareMorphDeformations(staged);
            this._RefreshScene(staged.backend);
            return staged;
        }
        catch (error)
        {
            await this.Release(staged);
            throw error;
        }
    }

    _ConfigureSourceBuild(sourceBuild)
    {
        const build = String(sourceBuild);

        if (this._sourceBuild !== null && this._sourceBuild !== build)
        {
            throw new Error(
                `Legacy character adapter is already initialized for source build ${this._sourceBuild}`
            );
        }

        this._sourceBuild = build;
        this._resourceRoot ??= `${this._resourceBase}/${encodeURIComponent(build)}/resources`;
        this._atlasComposer ??= new TnyGlesAtlasComposer();
    }

    /** Publishes the fully prepared object without mutating its predecessor. */
    async Commit(staged)
    {
        RequireStaged(staged);
        const acquired = [];
        const acquiredMorphs = [];
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
                    const acquiredCoverage = await this._triangleCoverage.Acquire(
                        foundation.geometryResource,
                        pending.coverage,
                        { gl: tw2.device?.gl ?? null }
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

            for (const pending of staged.pendingMorphDeformations)
            {
                if (pending.result.status !== "pending-commit") continue;
                const acquiredDeformation = await this._morphDeformation.Acquire(
                    pending.geometryResource,
                    pending.targets,
                    { gl: tw2.device?.gl ?? null }
                );
                const lease = {
                    geometryResource: pending.geometryResource,
                    lease: acquiredDeformation.lease
                };
                staged.morphDeformationLeases.push(lease);
                acquiredMorphs.push(lease);
                pending.result.status = "applied";
                pending.result.reason = null;
                pending.result.report = acquiredDeformation.report;
                for (const targetResult of pending.results)
                {
                    targetResult.status = "applied";
                    targetResult.reason = null;
                    targetResult.appliedResources ??= [];
                    targetResult.appliedResources.push(pending.resourcePath);
                }
            }
        }
        catch (error)
        {
            for (const value of acquiredMorphs.reverse())
            {
                try
                {
                    this._morphDeformation.Release(
                        value.geometryResource,
                        value.lease,
                        { gl: tw2.device?.gl ?? null }
                    );
                }
                catch (releaseError)
                {
                    error.releaseError ??= releaseError;
                }
            }
            staged.morphDeformationLeases = staged.morphDeformationLeases
                .filter(value => !acquiredMorphs.includes(value));
            for (const value of acquired.reverse())
            {
                try
                {
                    this._triangleCoverage.Release(
                        value.geometryResource,
                        value.lease,
                        { gl: tw2.device?.gl ?? null }
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
        this._RefreshScene(staged.backend);
        return staged;
    }

    /**
     * Transfers shared geometry leases before publishing a prepared revision.
     * The prior revision remains visible and keeps its private render targets
     * until the replacement has committed successfully.
     */
    async Handoff(previous, staged)
    {
        RequireStaged(previous);
        RequireStaged(staged);
        if (previous === staged) return staged;

        this._ReleaseGeometryLeases(previous);
        this._RearmGeometryLeases(previous);

        try
        {
            await this.Commit(staged);
        }
        catch (error)
        {
            try
            {
                await this.Commit(previous);
            }
            catch (rollbackError)
            {
                error.rollbackError = rollbackError;
            }
            throw error;
        }

        previous.backend.display = false;
        this._RefreshScene(previous.backend);
        return staged;
    }

    /** Returns detached proof diagnostics without exposing live scene objects. */
    GetDiagnostics(staged)
    {
        RequireStaged(staged);
        return {
            foundationGeometryCount: staged.geometryPaths.length,
            foundationGeometry: staged.foundationGeometry.map(CloneDiagnosticValue),
            configuredFoundationCount: staged.configuredFoundations.length,
            configuredFoundations: staged.configuredFoundations.map(CloneDiagnosticValue),
            configuredFoundationSupportCount: staged.configuredFoundationSupports.length,
            configuredFoundationSupports: staged.configuredFoundationSupports
                .map(CloneDiagnosticValue),
            configuredPartCount: staged.configuredParts.length,
            configuredParts: staged.configuredParts.map(value => ({ ...value })),
            deferredContributionCount: staged.deferredContributions.length,
            deferredContributions: staged.deferredContributions.map(value => ({ ...value })),
            foundationCoverageCount: staged.foundationCoverage.length,
            foundationCoverage: staged.foundationCoverage.map(CloneDiagnosticValue),
            paletteCompatibilityCount: staged.paletteCompatibility.length,
            paletteCompatibility: staged.paletteCompatibility.map(CloneDiagnosticValue),
            configuredGarmentMaterials: CloneDiagnosticValue(
                staged.configuredGarmentMaterialReport
            ),
            configuredHeadMaterials: CloneDiagnosticValue(
                staged.configuredHeadMaterialReport
            ),
            configuredHairMaterials: CloneDiagnosticValue(
                staged.configuredHairMaterialReport
            ),
            configuredHeadwearMaterials: CloneDiagnosticValue(
                staged.configuredHeadwearMaterialReport
            ),
            selectedTopDrape: CloneDiagnosticValue(staged.selectedTopDrapeReport),
            tuckSupport: CloneDiagnosticValue(staged.tuckSupportReport),
            upperSleeve: CloneDiagnosticValue(staged.upperSleeveReport),
            lowerSleeve: CloneDiagnosticValue(staged.lowerSleeveReport),
            foundationCutMask: CloneDiagnosticValue(staged.foundationCutMaskReport),
            morphDeformation: staged.morphDeformation.map(CloneDiagnosticValue),
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

        this._RefreshScene(staged.backend);
        return { partSourceRecordID: identity, display: Boolean(display), meshCount };
    }

    /** Toggles one configured foundation role for controlled visual comparison. */
    SetFoundationDisplay(staged, role, display)
    {
        RequireStaged(staged);
        role = String(role ?? "").trim();
        if (!role) throw new TypeError("Foundation display requires a role");

        let meshCount = 0;
        for (const mesh of staged.backend?.visualModel?.meshes ?? [])
        {
            if (mesh?._characterFoundationRole !== role) continue;
            mesh.display = Boolean(display);
            meshCount++;
        }
        if (!meshCount) throw new Error(`Configured foundation is not attached: ${role}`);

        this._RefreshScene(staged.backend);
        return { role, display: Boolean(display), meshCount };
    }

    /** Detaches one staged or replaced object from the demo scene. */
    Release(staged)
    {
        if (!staged) return false;

        this._ReleaseGeometryLeases(staged);

        if (!staged.wrapper) return false;

        for (const target of staged.compositionTargets ?? []) target?.Destroy?.();
        staged.compositionTargets = [];
        staged.composedBodyDiffuseTexture = null;

        staged.backend.display = false;
        const scene = this._client.scene;

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

    /**
     * Releases transaction-owned morph and triangle-coverage geometry leases.
     *
     * @param {Object} staged Staged or committed character transaction.
     */
    _ReleaseGeometryLeases(staged)
    {
        for (const value of [ ...(staged.morphDeformationLeases ?? []) ].reverse())
        {
            this._morphDeformation.Release(
                value.geometryResource,
                value.lease,
                { gl: tw2.device?.gl ?? null }
            );
        }
        staged.morphDeformationLeases = [];

        for (const value of [ ...(staged.foundationCoverageLeases ?? []) ].reverse())
        {
            this._triangleCoverage.Release(
                value.geometryResource,
                value.lease,
                { gl: tw2.device?.gl ?? null }
            );
        }
        staged.foundationCoverageLeases = [];
    }

    /**
     * Returns previously applied geometry operations to their atomic pending
     * state so a prepared replacement can retry after losing a lease race.
     *
     * @param {Object} staged Staged character transaction.
     */
    _RearmGeometryLeases(staged)
    {
        for (const pending of staged.pendingFoundationCoverage ?? [])
        {
            if (pending.coverage.strategy !== "triangle-mask"
                || pending.result.status !== "applied") continue;
            pending.result.status = "pending-commit";
            pending.result.reason = "awaiting-atomic-commit";
            pending.result.applied = [];
        }

        for (const pending of staged.pendingMorphDeformations ?? [])
        {
            if (pending.result.status !== "applied") continue;
            pending.result.status = "pending-commit";
            pending.result.reason = "awaiting-atomic-commit";
            pending.result.report = null;
            for (const targetResult of pending.results)
            {
                targetResult.status = "pending-commit";
                targetResult.reason = "awaiting-atomic-commit";
                targetResult.appliedResources = [];
            }
        }
    }

    async _Initialize()
    {
        this._initialization ||= this._InitializeOnce();
        return this._initialization;
    }

    async _InitializeOnce()
    {
        const hasRuntimeStore = typeof this._client.GetClass === "function";
        ConfigureCharacterGeometryReaders(tw2);

        const initializeOptions = {
            canvas: "character-canvas",
            debug: false,
            device: { webgl2: false },
            client: {
                clearColor: this._clearColor,
                colorMask: [ 0, 0, 0, 0 ]
            },
            paths: {
                res: this._resourceRoot,
                cdn: this._resourceRoot,
                local: this._resourceRoot,
                _cache: this._resourceRoot,
                cache: this._resourceRoot
            },
            pathAliases: {
                cdn: "res",
                local: "res"
            }
        };

        if (hasRuntimeStore)
        {
            const Scene = RequireRuntimeClass(this._client, tw2, "TnyCharacterScene");
            const Camera = RequireRuntimeClass(this._client, tw2, "TnyCameraTest");
            const scene = new Scene();
            const camera = new Camera({
                type: "testOrbit",
                canvas: "character-canvas",
                controller: true,
                poi: [ 0, 1.05, 0 ],
                distance: this._cameraDistance,
                minDistance: 0.5,
                maxDistance: 20,
                fov: 40,
                nearPlane: 0.05,
                farPlane: 200
            });

            scene.Initialize?.();
            initializeOptions.scene = scene;
            initializeOptions.camera = camera;
        }
        else
        {
            // Temporary compatibility for the local bundle until it exposes
            // the source Tny singleton. Wrapped descriptors are not part of
            // the TnyClient contract.
            initializeOptions.scene = this._clearColor;
            initializeOptions.camera = {
                type: "testOrbit",
                canvas: "character-canvas",
                controller: true,
                poi: [ 0, 1.05, 0 ],
                distance: this._cameraDistance,
                minDistance: 0.5,
                maxDistance: 20,
                fov: 40,
                nearPlane: 0.05,
                farPlane: 200
            };
        }

        await this._client.Initialize(initializeOptions);

        this._lights = CreateLegacyOpenGLLights(tw2);
        InstallLegacyOpenGLLights(this._client.scene, this._lights);

        this._client.scene?.wrapped?.SetValues?.({
            visible: { fog: false, environment: false },
            sunDirection: [ 0, -1, 1 ],
            ambientColor: [ 0.08, 0.08, 0.09, 1 ],
            clearColor: this._clearColor
        });
    }

    _CreateObject(sex)
    {
        const Tr2IntSkinnedObject = RequireClass(tw2, "Tr2IntSkinnedObject");
        const Tr2SkinnedModel = RequireClass(tw2, "Tr2SkinnedModel");
        const Tw2Mesh = RequireClass(tw2, "Tw2Mesh");
        const TnySpaceObject = RequireRuntimeClass(this._client, tw2, "TnySpaceObject");
        const backend = new Tr2IntSkinnedObject();

        backend.name = `${sex} character foundation proof`;
        backend.display = false;
        // The interior scene owns the shared light set. Keep the same lights on
        // a newly staged object until the scene performs its active-light
        // selection; otherwise an unsupported host without an interior scene
        // still receives the character preview rig.
        backend.interiorLights = this._lights;
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

        if (typeof this._client.scene?.AddObject === "function")
        {
            this._client.scene.AddObject(wrapper);
        }
        else if (Array.isArray(this._client.scene?.objects))
        {
            this._client.scene.objects.push(wrapper);
        }
        else
        {
            throw new Error("The ccpwgl scene cannot accept a character object");
        }

        return { backend, wrapper, sex };
    }

    async _ExecuteOperation(staged, operation)
    {
        switch (operation.operation)
        {
            case "skeleton":
            {
                const skeleton = await tw2.Fetch(operation.resourcePath);
                staged.backend.visualModel.SetSkeletonResource(skeleton);
                staged.skeletonPath = operation.resourcePath;
                break;
            }
            case "geometry":
            {
                const geometry = await tw2.Fetch(operation.resourcePath);
                if (operation.compatibility)
                {
                    const report = await this._paletteCompatibility.Apply(
                        geometry,
                        operation.compatibility,
                        { gl: tw2.device?.gl ?? null }
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
                staged.foundationGeometry[operation.index] = {
                    role: operation.role,
                    index: operation.index,
                    resourcePath: operation.resourcePath,
                    evidence: operation.evidence ? CloneDiagnosticValue(operation.evidence) : null
                };
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
            case "configured-foundation":
                if (operation.renderConfiguredCarrier === false)
                {
                    staged.configuredFoundations.push({
                        role: operation.role,
                        index: operation.index,
                        configurationPath: operation.configurationPath,
                        geometryPath: operation.geometryPath,
                        status: "retained-not-rendered",
                        reason: "configured-body-carrier-visually-unqualified",
                        renderEvidence: { ...operation.renderEvidence },
                        skinTextureBindings: {
                            status: "retained",
                            ...operation.skinEvidence,
                            textures: { ...operation.skinTextures },
                            supportTextures: operation.supportTextures
                                ? { ...operation.supportTextures }
                                : null,
                            supportEvidence: operation.supportEvidence
                                ? { ...operation.supportEvidence }
                                : null,
                            colorization: CloneSkinColorization(operation.skinColorization)
                        }
                    });
                    break;
                }
                try
                {
                    await this._AttachConfiguredFoundation(staged, operation);
                }
                catch (error)
                {
                    if (operation.fallbackOnFailure !== true) throw error;
                    staged.configuredFoundations.push({
                        role: operation.role,
                        index: operation.index,
                        configurationPath: operation.configurationPath,
                        geometryPath: operation.geometryPath,
                        status: "deferred",
                        reason: error.message,
                        skinTextureBindings: {
                            status: "deferred",
                            ...operation.skinEvidence,
                            textures: { ...operation.skinTextures },
                            supportTextures: operation.supportTextures
                                ? { ...operation.supportTextures }
                                : null,
                            supportEvidence: operation.supportEvidence
                                ? { ...operation.supportEvidence }
                                : null
                        }
                    });
                }
                break;
            case "configured-foundation-support":
                await this._AttachConfiguredFoundationSupport(staged, operation);
                break;
            case "configured-part":
                await this._AttachConfiguredPart(staged, operation);
                break;
            case "deferred-contribution":
                staged.deferredContributions.push({
                    groupID: operation.groupID,
                    layerIndex: operation.layerIndex,
                    partIndex: operation.partIndex,
                    partSourceRecordID: operation.partSourceRecordID ?? null,
                    configurationPath: operation.configurationPath,
                    geometryPath: operation.geometryPath,
                    ...(operation.configuredVisualCandidateInventory ? {
                        configuredVisualCandidateInventory: {
                            ...operation.configuredVisualCandidateInventory
                        }
                    } : {}),
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

    async _AttachConfiguredPart(staged, operation)
    {
        const configuredModel = await tw2.Fetch(operation.configurationPath);

        if (!Array.isArray(configuredModel?.meshes)
            || typeof configuredModel?.SetGeometryResource !== "function")
        {
            throw new Error(
                `Configured character part is not a skinned model: ${operation.configurationPath}`
            );
        }
        if (!configuredModel.meshes.length)
        {
            // A retained dependency configuration may carry non-visual support
            // data without any render carriers. Preserve it in diagnostics,
            // but do not fabricate geometry or an effect for the GLES adapter.
            const configuredPart = {
                groupID: operation.groupID,
                layerIndex: operation.layerIndex,
                partIndex: operation.partIndex,
                partSourceRecordID: operation.partSourceRecordID ?? null,
                configurationPath: operation.configurationPath,
                geometryPath: operation.geometryPath,
                meshCount: 0,
                authoredMeshIndexCount: 0,
                modelBindingMeshIndexCount: 0,
                effectCount: 0,
                geometryStatus: "retained-support-only",
                authoredEffectStatus: "not-applicable",
                proofFallbackEffectCount: 0,
                proofEffectStatus: "not-required",
                renderStatus: "retained-not-rendered",
                displayStatus: "not-applicable",
                materialStatus: "not-applicable",
                compositionStatus: "not-applicable",
                foundationCoverage: null
            };
            staged.configuredParts.push(configuredPart);
            this._QueueFoundationCoverage(staged, operation, configuredPart, []);
            return;
        }

        const resolvedGeometry = ResolveConfiguredPartGeometryPath(configuredModel, operation);
        const geometryPath = resolvedGeometry.path;
        const geometry = await tw2.Fetch(geometryPath);

        if (!Array.isArray(geometry?.meshes) || !geometry.meshes.length)
        {
            throw new Error(`Configured character geometry has no meshes: ${geometryPath}`);
        }

        const strictCarrierSelection = ResolveStrictSingleGeometryCarrierSelection(
            geometry,
            configuredModel.meshes
        );
        let retainedUnboundConfiguredMeshes = strictCarrierSelection
            ? strictCarrierSelection.unbound.map(mesh => ({
                meshName: String(mesh?.name ?? ""),
                authoredMeshIndex: Number.isInteger(mesh?.meshIndex)
                    ? mesh.meshIndex
                    : null,
                reason: "stale-multi-carrier-single-geometry"
            }))
            : [];
        if (strictCarrierSelection)
        {
            configuredModel.meshes = [ strictCarrierSelection.mesh ];
        }
        else
        {
            const staleCarrierSelection = ResolveStaleConfiguredCarrierSelection(
                geometry,
                configuredModel.meshes
            );
            configuredModel.meshes = staleCarrierSelection.bound;
            retainedUnboundConfiguredMeshes = staleCarrierSelection.unbound;
        }

        const configuredMeshes = [];
        const resolvedMeshBindings = [];
        const configuredMeshClaims = configuredModel.meshes.map(mesh => ({
            name: mesh?.name,
            meshIndex: mesh?.meshIndex
        }));
        const authoredMeshIndices = configuredModel.meshes.map(mesh => mesh?.meshIndex);
        let authoredMeshIndexCount = 0;
        let namedMeshIndexCount = 0;
        let modelBindingMeshIndexCount = 0;
        let singleGeometryAliasCount = 0;

        for (let index = 0; index < configuredModel.meshes.length; index++)
        {
            const mesh = configuredModel.meshes[index];
            const authoredMeshIndex = authoredMeshIndices[index];

            if (!mesh)
            {
                throw new Error(`Configured character mesh ${index} is absent`);
            }

            configuredModel.SetGeometryResource(geometry, index);
            const configuredMesh = configuredModel.meshes[index];
            const resolved = ResolveConfiguredMeshIndex(
                geometry,
                authoredMeshIndex,
                configuredMesh?.meshIndex,
                configuredMesh?.name,
                configuredMeshClaims,
                index
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
            else if (resolved.source === "exact-mesh-name") namedMeshIndexCount++;
            else if (resolved.source === "single-geometry-configured-alias")
            {
                singleGeometryAliasCount++;
            }
            else if (resolved.source === "unique-authored-index-alias")
            {
                authoredMeshIndexCount++;
            }
            else modelBindingMeshIndexCount++;

            resolvedMeshBindings.push({
                mesh: configuredMesh,
                geometry,
                geometryPath,
                meshIndex: resolved.meshIndex,
                meshName: String(configuredMesh.name ?? ""),
                geometryMeshName: String(geometry.meshes[resolved.meshIndex]?.name ?? ""),
                source: resolved.source
            });

            configuredMeshes.push(configuredMesh);
        }

        RestoreConfiguredMeshBindings(resolvedMeshBindings);
        await tw2.resMan?.Watch?.(configuredModel);
        RestoreConfiguredMeshBindings(resolvedMeshBindings);
        const authoredEffects = GetEffects(configuredMeshes);
        const authoredEffectsReady = authoredEffects.length > 0
            && authoredEffects.every(IsAuthoredConfiguredEffectRenderable);
        const proofEffects = ReplaceUnrenderableConfiguredEffects(
            configuredMeshes,
            staged.shaderPath,
            {
                retainDeferredTextureConsumers:
                    operation.groupID === "makeup/eyebrowbase"
                    || operation.groupID === "hair"
            }
        );

        if (proofEffects.length)
        {
            ApplyProofTexturesToEffects(proofEffects, "neutral");
            await tw2.resMan?.Watch?.(configuredModel);
            RestoreConfiguredMeshBindings(resolvedMeshBindings);
            for (const effect of proofEffects)
            {
                const influence = effect?._characterAuthoredCutMaskInfluence;
                if (!influence) continue;
                if (!SetEffectVectorParameter(effect, "CutMaskInfluence", influence))
                {
                    throw new Error(
                        "Configured garment fallback cannot retain CutMaskInfluence"
                    );
                }
                effect._characterAppliedCutMaskInfluence = [ ...influence ];
                effect._characterAppliedCutMaskPolicy =
                    "authored-influence-with-neutral-white-mask";
            }
        }
        const cardAreaReport = applyLegacyConfiguredCardAreas(configuredMeshes);

        const proofMaterial = applyLegacyProofGarmentMaterial(
            proofEffects,
            staged.textureContributions.find(value => value.partIndex === operation.partIndex)
        );

        const proofEffectsReady = proofEffects.length > 0
            && proofEffects.every(effect => effect?.IsGood?.() === true);
        const renderMeshes = OrderConfiguredHairMeshesForRendering(
            operation.groupID,
            configuredMeshes
        );
        for (const mesh of renderMeshes)
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
            geometryPath,
            geometryBindingSource: resolvedGeometry.source,
            meshCount: configuredMeshes.length,
            authoredMeshIndexCount,
            ...(namedMeshIndexCount ? { namedMeshIndexCount } : {}),
            ...(singleGeometryAliasCount ? { singleGeometryAliasCount } : {}),
            ...(renderMeshes !== configuredMeshes ? {
                renderOrderPolicy: "transparent-glass-after-hair-consumers"
            } : {}),
            ...(retainedUnboundConfiguredMeshes.length ? {
                retainedUnboundMeshCount: retainedUnboundConfiguredMeshes.length,
                retainedUnboundConfiguredMeshes
            } : {}),
            modelBindingMeshIndexCount,
            effectCount: GetEffects(configuredMeshes).length,
            geometryStatus: "attached",
            authoredEffectStatus: authoredEffectsReady ? "ready" : "deferred",
            proofFallbackEffectCount: proofEffects.length,
            proofEffectStatus: proofEffects.length
                ? proofEffectsReady ? "ready" : "deferred"
                : "not-required",
            ...(cardAreaReport.status === "applied" ? { cardAreaReport } : {}),
            renderStatus: "pending-final-watch",
            displayStatus: "visible",
            materialStatus: proofMaterial.appliedEffects
                ? "retained-linear-color-fallback"
                : "deferred",
            compositionStatus: "deferred",
            ...(proofMaterial.appliedEffects ? { proofMaterial } : {}),
            foundationCoverage: null
        };

        staged.configuredParts.push(configuredPart);
        staged.configuredPartBindings.push({
            configuredPart,
            configuredMeshes: [ ...configuredMeshes ],
            resolvedMeshBindings
        });
        this._QueueFoundationCoverage(
            staged,
            operation,
            configuredPart,
            configuredMeshes
        );
    }

    async _AttachConfiguredFoundationSupport(staged, operation)
    {
        const partCount = staged.configuredParts.length;
        const bindingCount = staged.configuredPartBindings.length;
        await this._AttachConfiguredPart(staged, {
            ...operation,
            operation: "configured-part",
            groupID: "makeup/eyebrowbase",
            layerIndex: -1,
            partIndex: -1
        });

        if (staged.configuredParts.length !== partCount + 1
            || staged.configuredPartBindings.length !== bindingCount + 1)
        {
            throw new Error("Configured foundation support did not attach exactly one part");
        }
        const support = staged.configuredParts.pop();
        const binding = staged.configuredPartBindings.pop();
        support.role = operation.role;
        support.evidence = { ...operation.evidence };
        for (const mesh of binding.configuredMeshes)
        {
            mesh._characterFoundationSupportRole = operation.role;
        }
        staged.configuredFoundationSupports.push(support);
        staged.configuredFoundationSupportBindings.push({
            ...binding,
            role: operation.role,
            evidence: { ...operation.evidence }
        });
    }

    async _AttachConfiguredFoundation(staged, operation)
    {
        const configuredModel = await tw2.Fetch(operation.configurationPath);
        const geometry = await tw2.Fetch(operation.geometryPath);
        if (!Array.isArray(configuredModel?.meshes)
            || typeof configuredModel?.SetGeometryResource !== "function"
            || !configuredModel.meshes.length)
        {
            throw new Error(
                `Configured foundation is not a skinned model: ${operation.configurationPath}`
            );
        }
        if (!Array.isArray(geometry?.meshes) || !geometry.meshes.length)
        {
            throw new Error(
                `Configured foundation geometry has no meshes: ${operation.geometryPath}`
            );
        }

        const configuredMeshes = [];
        const resolvedMeshBindings = [];
        for (let index = 0; index < configuredModel.meshes.length; index++)
        {
            const authoredMeshIndex = configuredModel.meshes[index]?.meshIndex;
            configuredModel.SetGeometryResource(geometry, index);
            const mesh = configuredModel.meshes[index];
            const resolved = ResolveConfiguredMeshIndex(
                geometry,
                authoredMeshIndex,
                mesh?.meshIndex,
                mesh?.name
            );
            if (!mesh || resolved === null)
            {
                throw new Error(
                    `Configured foundation mesh ${index} has no exact geometry binding`
                );
            }
            resolvedMeshBindings.push({
                mesh,
                geometry,
                geometryPath: operation.geometryPath,
                meshIndex: resolved.meshIndex,
                meshName: String(mesh.name ?? ""),
                geometryMeshName: String(geometry.meshes[resolved.meshIndex]?.name ?? ""),
                source: resolved.source
            });
            configuredMeshes.push(mesh);
        }

        RestoreConfiguredMeshBindings(resolvedMeshBindings);
        // A configured head Black owns external-composition seams for the
        // small face carriers. Filling their declared-empty samplers with the
        // adapter's opaque proof resources turns a missing composition into a
        // plausible grey/white card. Keep those slots authored-empty and hide
        // the carriers until the atlas composer commits their exact material.
        // Non-head foundations still need the compatibility fill, while the
        // switched head-skin effect receives its own bounded fill below.
        const faceCarrierPreparation = operation.role === "head"
            ? PrepareConfiguredFaceCarriers(resolvedMeshBindings)
            : null;
        if (operation.role === "head")
        {
            const deferredCarrierEffects = new Set(
                resolvedMeshBindings
                    .filter(value => IsExternallyComposedFaceCarrier(value.meshName))
                    .flatMap(value => GetEffects([ value.mesh ]))
            );
            ApplyMissingProofTexturesToEffects(
                GetEffects(configuredMeshes).filter(effect =>
                    !deferredCarrierEffects.has(effect)),
                "neutral"
            );
        }
        else
        {
            ApplyMissingProofTexturesToEffects(GetEffects(configuredMeshes), "neutral");
        }
        await tw2.resMan?.Watch?.(configuredModel);
        RestoreConfiguredMeshBindings(resolvedMeshBindings);
        const cardAreaReport = applyLegacyConfiguredCardAreas(configuredMeshes);

        if (operation.role === "head")
        {
            const switchedSkinEffects = [];
            for (const binding of resolvedMeshBindings)
            {
                if (binding.meshIndex === 0)
                {
                    switchedSkinEffects.push(
                        ...ApplyConfiguredHeadSkinShader(binding.mesh, staged.shaderPath)
                    );
                }
            }
            // Reinitializing the authored effect can expose sampler slots that
            // its previous shader did not declare. Fill only those empty slots;
            // authored face and composed skin bindings remain untouched.
            ApplyMissingProofTexturesToEffects(switchedSkinEffects, "neutral");
        }

        const skinEffects = [];
        for (const binding of resolvedMeshBindings)
        {
            if (binding.meshIndex !== 0) continue;
            for (const effect of GetEffects([ binding.mesh ]))
            {
                if (!IsConfiguredFoundationSkinEffect(operation, binding, effect)) continue;
                effect.SetTextures?.(operation.skinTextures);
                skinEffects.push(effect);
            }
        }
        if (!skinEffects.length)
        {
            throw new Error(`Configured ${operation.role} foundation has no exact skin effect`);
        }
        await tw2.resMan?.Watch?.(configuredModel);
        RestoreConfiguredMeshBindings(resolvedMeshBindings);

        for (const mesh of configuredMeshes)
        {
            mesh._characterFoundationRole = operation.role;
            mesh._characterFoundationConfigPath = operation.configurationPath;
        }
        const visualMeshes = staged.backend.visualModel.meshes;
        for (let index = visualMeshes.length - 1; index >= 0; index--)
        {
            if (visualMeshes[index]?._characterFoundationRole === operation.role)
            {
                visualMeshes.splice(index, 1);
            }
        }
        visualMeshes.push(...configuredMeshes);
        staged.foundationResources.set(operation.role, {
            geometryResource: geometry,
            resourcePath: operation.geometryPath,
            configurationPath: operation.configurationPath,
            configuredMeshes: [ ...configuredMeshes ]
        });
        staged.configuredFoundations.push({
            role: operation.role,
            index: operation.index,
            configurationPath: operation.configurationPath,
            geometryPath: operation.geometryPath,
            meshCount: configuredMeshes.length,
            effectCount: GetEffects(configuredMeshes).length,
            skinTextureBindings: {
                status: "applied",
                ...operation.skinEvidence,
                effectCount: skinEffects.length,
                textures: { ...operation.skinTextures },
                supportTextures: operation.supportTextures
                    ? { ...operation.supportTextures }
                    : null,
                supportEvidence: operation.supportEvidence
                    ? { ...operation.supportEvidence }
                    : null,
                colorization: CloneSkinColorization(operation.skinColorization)
            },
            cardAreas: cardAreaReport,
            faceCarriers: faceCarrierPreparation,
            meshes: resolvedMeshBindings.map(value => ({
                meshIndex: value.meshIndex,
                meshName: value.meshName,
                geometryMeshName: value.geometryMeshName,
                source: value.source,
                effectNames: GetEffects([ value.mesh ]).map(effect => String(effect?.name ?? "")),
                effectPaths: GetEffects([ value.mesh ]).map(effect =>
                    String(effect?.effectFilePath ?? ""))
            }))
        });
        staged.configuredFoundationBindings.push({
            role: operation.role,
            configuredMeshes: [ ...configuredMeshes ],
            resolvedMeshBindings
        });
    }

    _QueueFoundationCoverage(staged, operation, configuredPart, configuredMeshes)
    {
        const coverage = operation.foundationCoverage
            ?? ResolveConfiguredFootwearReplacementCoverage(
                staged,
                operation,
                configuredMeshes
            );
        if (!coverage) return null;

        const requestedRoles = new Set(
            staged.pendingFoundationCoverage.flatMap(value => value.coverage.roles)
        );

        for (const role of coverage.roles)
        {
            if (requestedRoles.has(role)
                && coverage.strategy !== "triangle-mask")
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
            ...(coverage.authoredOcclusion ? {
                authoredOcclusion: coverage.authoredOcclusion
            } : {}),
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

    _FinalizeConfiguredParts(staged)
    {
        for (const binding of [
            ...staged.configuredPartBindings,
            ...staged.configuredFoundationSupportBindings
        ])
        {
            binding.configuredPart.renderStatus = IsConfiguredPartRenderable(
                binding.configuredMeshes
            )
                ? "ready"
                : "deferred-not-render-ready";
        }
    }

    _ApplyPendingFoundationCoverage(staged)
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

    _PrepareMorphDeformations(staged)
    {
        if (!staged.morphTargets.length) return;

        const resources = new Map();
        for (const value of staged.foundationResources.values())
        {
            resources.set(value.geometryResource, value.resourcePath);
        }
        for (const binding of staged.configuredPartBindings)
        {
            for (const value of binding.resolvedMeshBindings)
            {
                resources.set(value.geometry, value.geometryPath);
            }
        }

        const grouped = new Map();
        for (const target of staged.morphTargets)
        {
            if (this._morphDeformationSkippedTargets.has(target.targetName.toLowerCase()))
            {
                staged.morphDeformation.push({
                    modifierPath: target.modifierPath,
                    targetName: target.targetName,
                    weight: target.weight,
                    ownerGroupID: target.ownerGroupID,
                    evidence: { ...target.evidence },
                    status: "diagnostic-target-skipped",
                    reason: "explicit-diagnostic-target-exclusion",
                    resourcePaths: []
                });
                continue;
            }
            const matches = [];
            for (const [ geometryResource, resourcePath ] of resources)
            {
                if (this._morphDeformationSkippedPaths.has(resourcePath.toLowerCase())) continue;
                if (!this._morphDeformation.HasAnyTarget(geometryResource, [ target ])) continue;
                matches.push({ geometryResource, resourcePath });
            }

            const result = {
                modifierPath: target.modifierPath,
                targetName: target.targetName,
                weight: target.weight,
                ownerGroupID: target.ownerGroupID,
                evidence: { ...target.evidence },
                status: matches.length ? "pending-commit" : "deferred-target-unavailable",
                reason: matches.length ? "awaiting-atomic-commit" : "no-exact-loaded-morph-target",
                resourcePaths: matches.map(value => value.resourcePath)
            };
            staged.morphDeformation.push(result);

            for (const match of matches)
            {
                if (!grouped.has(match.geometryResource))
                {
                    grouped.set(match.geometryResource, {
                        geometryResource: match.geometryResource,
                        resourcePath: match.resourcePath,
                        targets: [],
                        results: []
                    });
                }
                const group = grouped.get(match.geometryResource);
                group.targets.push(target);
                group.results.push(result);
            }
        }

        for (const group of grouped.values())
        {
            const result = {
                status: "pending-commit",
                reason: "awaiting-atomic-commit",
                resourcePath: group.resourcePath,
                targetCount: group.targets.length,
                targetNames: group.targets.map(value => value.targetName)
            };
            staged.morphDeformation.push(result);
            staged.pendingMorphDeformations.push({ ...group, result });
        }
    }

    _RefreshScene(backend)
    {
        const scene = this._client.scene?.wrapped;

        scene?.ApplyPerFrameData?.();
        scene?.ApplyInteriorLights?.();
        backend?.UpdateViewDependentData?.();
        backend?.UpdatePerObjectData?.();
    }
}

/** Draws authored hair glass after the consumers visible through it. */
export function OrderConfiguredHairMeshesForRendering(groupID, meshes)
{
    if (groupID !== "hair" || !Array.isArray(meshes) || meshes.length < 2)
    {
        return meshes;
    }

    const glass = [];
    const consumers = [];
    for (const mesh of meshes)
    {
        (IsConfiguredHairGlassMesh(mesh) ? glass : consumers).push(mesh);
    }
    if (!glass.length || !consumers.length) return meshes;
    return [ ...consumers, ...glass ];
}

function IsConfiguredHairGlassMesh(mesh)
{
    return AREA_FIELDS.some(field => (mesh?.[field] ?? []).some(area =>
    {
        if (!area || area.display === false) return false;
        const effect = area.effect;
        const authored = effect?._characterAuthoredEffect;
        const identity = `${effect?.effectFilePath ?? ""} ${authored?.effectFilePath ?? ""}`;
        return /glassshader/iu.test(identity);
    }));
}

/** Collapses exact authored hair/eyelash forward/reversed card pairs to one draw. */
export function applyLegacyConfiguredCardAreas(meshes, d3d = tw2.const)
{
    const result = {
        status: "not-required",
        rule: "legacy-opengl-authored-two-sided-card-area-v2",
        correctness: "retained-source-policy",
        reversedAreas: 0,
        collapsedPairs: 0,
        areas: []
    };
    for (const mesh of meshes ?? [])
    {
        for (const field of AREA_FIELDS)
        {
            const areas = mesh?.[field] ?? [];
            for (const reversed of areas)
            {
                if (!reversed?.reversed) continue;
                if (!Number.isFinite(d3d?.RS_CULLMODE)
                    || !Number.isFinite(d3d?.CULL_NONE)
                    || !Number.isFinite(d3d?.CULL_CCW))
                {
                    throw new TypeError("Configured card areas require ccpwgl D3D constants");
                }
                const forward = IsTwoSidedCardEffect(reversed.effect)
                    ? areas.find(candidate =>
                        IsMatchingConfiguredCardArea(candidate, reversed)
                        && AreConfiguredCardEffectsEquivalent(
                            candidate.effect,
                            reversed.effect
                        ))
                    : null;
                const effect = forward?.effect ?? reversed.effect;
                const cullMode = forward ? d3d.CULL_NONE : d3d.CULL_CCW;
                let passCount = 0;

                for (const technique of Object.keys(effect?.techniques ?? {}))
                {
                    const count = effect.GetPassCount?.(technique) ?? 0;
                    for (let pass = 0; pass < count; pass++)
                    {
                        effect.SetTechniquePassStateOverride?.(
                            technique,
                            pass,
                            d3d.RS_CULLMODE,
                            cullMode
                        );
                        passCount++;
                    }
                }
                if (forward)
                {
                    reversed.display = false;
                    result.collapsedPairs++;
                }
                result.reversedAreas++;
                result.areas.push({
                    field,
                    meshName: String(mesh?.name ?? ""),
                    areaName: String(reversed.name ?? ""),
                    effectName: String(effect?.name ?? ""),
                    mode: forward ? "single-two-sided-draw" : "reversed-winding",
                    passCount
                });
            }
        }
    }
    if (result.reversedAreas) result.status = "applied";
    return result;
}

/** Keeps externally composed face carriers invisible until their material commits. */
export function PrepareConfiguredFaceCarriers(bindings)
{
    const result = {
        status: "not-required",
        rule: "configured-face-carrier-atomic-material-v1",
        correctness: "retained-source-policy",
        carriers: []
    };

    for (const binding of bindings ?? [])
    {
        const meshName = String(binding?.meshName ?? binding?.mesh?.name ?? "");
        if (!IsExternallyComposedFaceCarrier(meshName))
        {
            continue;
        }
        binding.mesh.display = false;
        result.carriers.push({
            meshName,
            geometryMeshName: String(binding?.geometryMeshName ?? ""),
            status: "awaiting-exact-material"
        });
    }

    if (result.carriers.length) result.status = "applied";
    return result;
}

function IsExternallyComposedFaceCarrier(meshName)
{
    return /^(?:EyeWet|Tearducts|Eyelashes|EyeShadow)_GeoShape$/iu.test(
        String(meshName ?? "")
    );
}

function IsTwoSidedCardEffect(effect)
{
    const identity = `${effect?.name ?? ""} ${effect?.effectFilePath ?? ""}`;
    return /eyelash/iu.test(identity) || /skinnedavatarhair/iu.test(identity);
}

function IsMatchingConfiguredCardArea(candidate, reversed)
{
    return Boolean(candidate
        && !candidate.reversed
        && candidate.display !== false
        && IsTwoSidedCardEffect(candidate.effect)
        && String(candidate.name ?? "") === String(reversed.name ?? "")
        && Number(candidate.meshIndex ?? 0) === Number(reversed.meshIndex ?? 0)
        && Number(candidate.index ?? 0) === Number(reversed.index ?? 0)
        && Number(candidate.count ?? 1) === Number(reversed.count ?? 1));
}

function AreConfiguredCardEffectsEquivalent(left, right)
{
    if (left === right) return true;
    if (!left || !right
        || String(left.name ?? "") !== String(right.name ?? "")
        || String(left.effectFilePath ?? "") !== String(right.effectFilePath ?? ""))
    {
        return false;
    }
    for (const field of [ "parameters", "textures", "samplerOverrides" ])
    {
        const leftValues = ComparableConfiguredEffectValues(left[field]);
        const rightValues = ComparableConfiguredEffectValues(right[field]);
        if (JSON.stringify(leftValues) !== JSON.stringify(rightValues)) return false;
    }
    const techniques = new Set([
        ...Object.keys(left.techniques ?? {}),
        ...Object.keys(right.techniques ?? {})
    ]);
    return [ ...techniques ].every(name =>
        Number(left.GetPassCount?.(name) ?? 0)
        === Number(right.GetPassCount?.(name) ?? 0));
}

function ComparableConfiguredEffectValues(values)
{
    return Object.keys(values ?? {}).sort().map(name => [
        name,
        ComparableConfiguredEffectValue(values[name])
    ]);
}

function ComparableConfiguredEffectValue(value)
{
    if (value === null || value === undefined) return value;
    if (typeof value === "string" || typeof value === "number"
        || typeof value === "boolean") return value;
    if (Array.isArray(value) || ArrayBuffer.isView(value)) return [ ...value ];
    if (typeof value.resourcePath === "string") return value.resourcePath;
    if (Array.isArray(value.value) || ArrayBuffer.isView(value.value))
    {
        return [ ...value.value ];
    }
    if ([ "string", "number", "boolean" ].includes(typeof value.value))
    {
        return value.value;
    }
    return null;
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

function ResolveConfiguredPartGeometryPath(configuredModel, operation)
{
    const candidates = new Map((operation.geometryCandidates ?? []).map(value => [
        NormalizeConfiguredGeometryPath(value),
        String(value).trim()
    ]));
    const authoredPaths = [ ...new Set(configuredModel.meshes
        .map(mesh => String(mesh?.geometryResPath ?? "").trim())
        .filter(Boolean)) ];
    if (operation.geometryPath)
    {
        const explicit = String(operation.geometryPath).trim();
        const retained = candidates.size
            ? candidates.get(NormalizeConfiguredGeometryPath(explicit))
            : explicit;
        if (!retained)
        {
            throw new Error(
                `Configured character geometry is outside the retained candidate inventory: ${explicit}`
            );
        }
        const source = authoredPaths.length === 1
            && NormalizeConfiguredGeometryPath(authoredPaths[0])
                !== NormalizeConfiguredGeometryPath(explicit)
            ? "retained-explicit-config-alias"
            : "retained-explicit";
        return { path: retained, source };
    }

    if (authoredPaths.length !== 1)
    {
        throw new Error(
            "Configured character part requires one authored geometry path"
            + ` (${operation.configurationPath}; found=${authoredPaths.length})`
        );
    }

    const retained = candidates.get(NormalizeConfiguredGeometryPath(authoredPaths[0]));
    if (!retained)
    {
        throw new Error(
            `Configured character geometry is outside the retained candidate inventory: ${authoredPaths[0]}`
        );
    }

    return { path: retained, source: "authored-retained" };
}

function NormalizeConfiguredGeometryPath(value)
{
    return String(value ?? "")
        .trim()
        .replace(/\\/gu, "/")
        .toLowerCase();
}

function ResolveStrictSingleGeometryCarrierSelection(geometry, configuredMeshes)
{
    if (geometry?.meshes?.length !== 1
        || !Array.isArray(configuredMeshes)
        || configuredMeshes.length <= 2)
    {
        return null;
    }
    const geometryName = String(geometry.meshes[0]?.name ?? "").trim().toLowerCase();
    if (!geometryName) return null;
    const exact = configuredMeshes.filter(mesh =>
        String(mesh?.name ?? "").trim().toLowerCase() === geometryName);
    if (exact.length !== 1) return null;
    return {
        mesh: exact[0],
        unbound: configuredMeshes.filter(mesh => mesh !== exact[0])
    };
}

function ResolveStaleConfiguredCarrierSelection(geometry, configuredMeshes)
{
    if ((geometry?.meshes?.length ?? 0) <= 1
        || !Array.isArray(configuredMeshes)
        || configuredMeshes.length <= geometry.meshes.length)
    {
        return { bound: configuredMeshes, unbound: [] };
    }
    const bound = [];
    const unbound = [];
    for (const mesh of configuredMeshes)
    {
        const meshName = String(mesh?.name ?? "").trim();
        const authoredMeshIndex = mesh?.meshIndex;
        if (Number.isInteger(authoredMeshIndex)
            && !HasGeometryMesh(geometry, authoredMeshIndex)
            && FindUniqueNamedGeometryMesh(geometry, meshName) === null)
        {
            unbound.push({
                meshName,
                authoredMeshIndex,
                reason: "stale-out-of-range-configured-carrier"
            });
            continue;
        }
        bound.push(mesh);
    }
    return { bound, unbound };
}

function ResolveConfiguredMeshIndex(
    geometry,
    authoredMeshIndex,
    modelBindingMeshIndex,
    meshName,
    configuredMeshes = null,
    configuredMeshIndex = -1
)
{
    const namedMeshIndex = FindUniqueNamedGeometryMesh(geometry, meshName);
    if (HasGeometryMesh(geometry, authoredMeshIndex))
    {
        if (namedMeshIndex !== null && namedMeshIndex !== authoredMeshIndex)
        {
            return { meshIndex: namedMeshIndex, source: "exact-mesh-name" };
        }
        if (IsUniqueUnclaimedAuthoredIndexAlias(
            geometry,
            authoredMeshIndex,
            meshName,
            configuredMeshes,
            configuredMeshIndex
        ))
        {
            return { meshIndex: authoredMeshIndex, source: "unique-authored-index-alias" };
        }
        return ValidateNamedMeshBinding(
            geometry,
            authoredMeshIndex,
            meshName,
            "authored"
        );
    }
    if (namedMeshIndex !== null)
    {
        return { meshIndex: namedMeshIndex, source: "exact-mesh-name" };
    }
    if (IsSingleGeometryConfiguredAlias(
        geometry,
        configuredMeshes,
        configuredMeshIndex
    ))
    {
        // Some retained Black documents expose two material carriers over one
        // geometry mesh. Admit the unmatched carrier only when a sibling in
        // the same document exactly names that sole mesh; this is deliberately
        // narrower than the old demo's general mesh-zero fallback.
        return { meshIndex: 0, source: "single-geometry-configured-alias" };
    }
    if (HasGeometryMesh(geometry, modelBindingMeshIndex))
    {
        return ValidateNamedMeshBinding(
            geometry,
            modelBindingMeshIndex,
            meshName,
            "skinned-model-binding"
        );
    }
    return null;
}

function IsUniqueUnclaimedAuthoredIndexAlias(
    geometry,
    authoredMeshIndex,
    meshName,
    configuredMeshes,
    configuredMeshIndex
)
{
    if (!Array.isArray(configuredMeshes)
        || FindUniqueNamedGeometryMesh(geometry, meshName) !== null)
    {
        return false;
    }
    const geometryName = String(geometry?.meshes?.[authoredMeshIndex]?.name ?? "")
        .trim()
        .toLowerCase();
    if (!geometryName) return false;
    if (configuredMeshes.some((mesh, index) =>
        index !== configuredMeshIndex
        && String(mesh?.name ?? "").trim().toLowerCase() === geometryName))
    {
        return false;
    }
    const claims = configuredMeshes.filter(mesh => mesh?.meshIndex === authoredMeshIndex);
    return claims.length === 1;
}

function IsSingleGeometryConfiguredAlias(
    geometry,
    configuredMeshes,
    configuredMeshIndex
)
{
    if (geometry?.meshes?.length !== 1 || !Array.isArray(configuredMeshes))
    {
        return false;
    }
    const geometryName = String(geometry.meshes[0]?.name ?? "").trim().toLowerCase();
    if (!geometryName) return false;

    const exactSiblings = configuredMeshes.filter((mesh, index) =>
        index !== configuredMeshIndex
        && String(mesh?.name ?? "").trim().toLowerCase() === geometryName
    );
    return exactSiblings.length === 1;
}

function ValidateNamedMeshBinding(geometry, meshIndex, meshName, source)
{
    const requestedName = String(meshName ?? "").trim();
    const geometryName = String(geometry?.meshes?.[meshIndex]?.name ?? "").trim();
    if (requestedName && geometryName
        && requestedName.toLowerCase() !== geometryName.toLowerCase())
    {
        throw new Error(
            `Configured mesh ${JSON.stringify(requestedName)} resolved to differently named `
            + `geometry mesh ${JSON.stringify(geometryName)} at index ${meshIndex}`
        );
    }
    return { meshIndex, source };
}

function FindUniqueNamedGeometryMesh(geometry, meshName)
{
    const requestedName = String(meshName ?? "").trim().toLowerCase();
    if (!requestedName) return null;
    const matches = [];
    for (let index = 0; index < (geometry?.meshes?.length ?? 0); index++)
    {
        if (String(geometry.meshes[index]?.name ?? "").trim().toLowerCase() === requestedName)
        {
            matches.push(index);
        }
    }
    return matches.length === 1 ? matches[0] : null;
}

function RestoreConfiguredMeshBindings(bindings)
{
    for (const binding of bindings ?? [])
    {
        const { mesh, geometry, geometryPath, meshIndex, meshName, geometryMeshName } = binding;
        if (!mesh || !HasGeometryMesh(geometry, meshIndex))
        {
            throw new Error(`Configured mesh binding ${JSON.stringify(meshName)} is unavailable`);
        }
        const currentGeometryName = String(geometry.meshes[meshIndex]?.name ?? "");
        if (geometryMeshName && currentGeometryName !== geometryMeshName)
        {
            throw new Error(
                `Configured mesh binding ${JSON.stringify(meshName)} changed geometry identity`
            );
        }
        mesh.geometryResource = geometry;
        mesh.geometryResPath = geometryPath;
        mesh.meshIndex = meshIndex;
        for (const field of AREA_FIELDS)
        {
            for (const area of mesh[field] ?? []) area.meshIndex = meshIndex;
        }
    }
}

function HasGeometryMesh(geometry, meshIndex)
{
    return Number.isSafeInteger(meshIndex)
        && meshIndex >= 0
        && Boolean(geometry?.meshes?.[meshIndex]);
}

function ConfigureCharacterGeometryReaders(tw2)
{
    const reader = tw2?.Gr2Reader;
    if (!reader?.DEFAULT_OPTIONS)
    {
        throw new Error("GLES character adapter requires configurable Gr2Reader defaults");
    }

    Object.assign(reader.DEFAULT_OPTIONS, {
        firstMeshOnly: false,
        unpackTangents: true,
        skipInvalidBoneBindings: true,
        aoGenerate: false
    });

    if (tw2.GR2JsonReader?.DEFAULT_OPTIONS)
    {
        tw2.GR2JsonReader.DEFAULT_OPTIONS.firstMeshOnly = false;
    }
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

function InstallLegacyOpenGLLights(scene, lights)
{
    if (typeof scene?.ClearLights === "function" && typeof scene?.AddLight === "function")
    {
        scene.ClearLights();
        for (const light of lights) scene.AddLight(light);
        return true;
    }

    const wrapped = scene?.wrapped ?? scene;
    if (!Array.isArray(wrapped?.lights)) return false;

    wrapped.lights.splice(0, wrapped.lights.length, ...lights);
    wrapped.ApplyInteriorLights?.();
    return true;
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
    if (construction.morphTargets !== undefined && !Array.isArray(construction.morphTargets))
    {
        throw new TypeError("Legacy character construction morphTargets must be an array");
    }
    for (const [ index, target ] of (construction.morphTargets ?? []).entries())
    {
        if (!String(target?.modifierPath ?? "").startsWith("utilityshapes/")
            || !String(target?.targetName ?? "").trim()
            || !Number.isFinite(target?.weight)
            || !String(target?.ownerGroupID ?? "").trim()
            || target?.evidence?.status !== "policy"
            || target?.evidence?.rule
                !== "legacy-gles-unique-normalized-morph-target-match-v1")
        {
            throw new TypeError(`Legacy character morph target ${index} is invalid`);
        }
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

    const configuredFoundationRoles = new Set();
    while (operations[cursor]?.operation === "configured-foundation")
    {
        const operation = operations[cursor++];
        const role = String(operation.role ?? "").trim();
        if (!role || configuredFoundationRoles.has(role)
            || !Number.isSafeInteger(operation.index) || operation.index < 0)
        {
            throw new Error("Configured foundation operations require unique roles and valid indices");
        }
        RequireResourcePath(
            operation.configurationPath,
            `configured foundation ${role} configurationPath`
        );
        RequireResourcePath(
            operation.geometryPath,
            `configured foundation ${role} geometryPath`
        );
        if (!operation.skinTextures || !operation.skinEvidence
            || Object.keys(operation.skinTextures).length !== 3)
        {
            throw new Error("Configured foundation requires explicit skin texture policy");
        }
        for (const name of [ "DiffuseMap", "NormalMap", "SpecularMap" ])
        {
            RequireResourcePath(
                operation.skinTextures[name],
                `configured foundation ${role} ${name}`
            );
        }
        if (operation.supportTextures)
        {
            for (const name of [ "DiffuseMap", "NormalMap", "SpecularMap" ])
            {
                RequireResourcePath(
                    operation.supportTextures[name],
                    `configured foundation ${role} support ${name}`
                );
            }
        }
        if (operation.skinColorization)
        {
            for (const name of [
                "headDetailPath", "headZonePath", "bodyDetailPath", "bodyZonePath"
            ])
            {
                RequireResourcePath(
                    operation.skinColorization[name],
                    `configured foundation ${role} skinColorization ${name}`
                );
            }
            if (!Array.isArray(operation.skinColorization.colors)
                || operation.skinColorization.colors.length !== 3
                || operation.skinColorization.colors.some(color =>
                    !Array.isArray(color) || color.length !== 4
                    || color.some(value => !Number.isFinite(value))))
            {
                throw new Error("Configured foundation requires three finite skin colours");
            }
        }
        if (![
            "exact-head-generic-texture-inventory-v1",
            "exact-skintone-prs-archetype-foundation-v1"
        ].includes(operation.skinEvidence.rule))
        {
            throw new Error("Configured foundation skin inventory requires its explicit evidence label");
        }
        if (operation.fallbackOnFailure !== undefined
            && (operation.fallbackOnFailure !== true || role !== "body"))
        {
            throw new Error("Only the exact configured body may retain its prepared fallback");
        }
        if (operation.renderConfiguredCarrier !== undefined)
        {
            if (operation.renderConfiguredCarrier !== false || role !== "body"
                || operation.renderEvidence?.status !== "observed"
                || operation.renderEvidence?.rule
                    !== "legacy-opengl-authored-body-carrier-unqualified-v1")
            {
                throw new Error(
                    "Only the configured body may retain an explicitly unqualified carrier"
                );
            }
        }
        const source = geometry.find(value => value.role === role && value.index === operation.index);
        if (!source || source.resourcePath !== operation.geometryPath)
        {
            throw new Error("Configured foundation must replace its exact foundation geometry operation");
        }
        configuredFoundationRoles.add(role);
    }

    const configuredFoundationSupportRoles = new Set();
    while (operations[cursor]?.operation === "configured-foundation-support")
    {
        const operation = operations[cursor++];
        const role = String(operation.role ?? "").trim();
        if (role !== "eyebrowbase" || configuredFoundationSupportRoles.has(role))
        {
            throw new Error("Configured foundation supports require one exact eyebrowbase role");
        }
        RequireResourcePath(
            operation.configurationPath,
            `configured foundation support ${role} configurationPath`
        );
        RequireResourcePath(
            operation.geometryPath,
            `configured foundation support ${role} geometryPath`
        );
        if (!String(operation.partSourceRecordID ?? "").trim()
            || operation.evidence?.status !== "derived"
            || operation.evidence?.rule
                !== "exact-head-archetype-brow-support-dependency-v1")
        {
            throw new Error(
                "Configured eyebrow support requires an exact retained head dependency"
            );
        }
        configuredFoundationSupportRoles.add(role);
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
            if (operation.geometryPath)
            {
                RequireResourcePath(operation.geometryPath, `configured part ${index} geometryPath`);
            }
            else
            {
                if (!Array.isArray(operation.geometryCandidates)
                    || !operation.geometryCandidates.length)
                {
                    throw new Error(
                        `Configured part ${index} requires a geometry path or retained candidates`
                    );
                }
                const candidates = new Set();
                for (const value of operation.geometryCandidates)
                {
                    const candidate = RequireResourcePath(
                        value,
                        `configured part ${index} geometry candidate`
                    );
                    candidates.add(candidate.toLowerCase());
                }
                if (candidates.size !== operation.geometryCandidates.length)
                {
                    throw new Error(`Configured part ${index} geometry candidates must be unique`);
                }
            }
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

    const exactCarrier = (operation.role === "body"
        && operation.resourcePath === FEMALE_LOD0_BODY_PATH)
        || (operation.role === "hands"
            && operation.resourcePath === FEMALE_LOD0_HANDS_PATH);
    if (construction.sex !== "female"
        || !exactCarrier
        || policy.status !== "policy"
        || policy.rule !== "legacy-opengl-bone-capacity-mask-v1"
        || policy.shaderCapacity !== 58
        || policy.requiredBoneCount !== 69
        || !Array.isArray(policy.bonePrefixes)
        || policy.bonePrefixes.length !== 1
        || policy.bonePrefixes[0] !== "RightHand")
    {
        throw new Error("Legacy palette compatibility is restricted to an exact female LOD0 foundation policy");
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

    const authoredFootwearPolicy = IsAuthoredFootwearCoverageEvidence(evidence);
    const authoredModifierPolicy = IsAuthoredModifierCoverageEvidence(evidence);

    if (evidence?.status !== "policy"
        || (!authoredFootwearPolicy && !authoredModifierPolicy)
        || evidence?.sex !== sex
        || evidence?.groupID !== operation.groupID
        || evidence?.partSourceRecordID !== operation.partSourceRecordID)
    {
        throw new Error("Legacy foundation coverage requires matching explicit policy evidence");
    }

    if (coverage.strategy === "hide-carrier")
    {
        const maleFeet = sex === "male"
            && operation.groupID === "feet"
            && authoredFootwearPolicy
            && roles.length === 1
            && roles[0] === "feet"
            && coverage.authoredOcclusion === undefined;
        const maleAuthoredCoverage = sex === "male"
            && authoredModifierPolicy
            && coverage.authoredOcclusion === undefined;
        if ((!maleFeet && !maleAuthoredCoverage)
            || coverage.bonePrefixes !== undefined || coverage.triangleRule !== undefined)
        {
            throw new Error("Legacy hide-carrier coverage requires reviewed exact foundation evidence");
        }
        return;
    }

    const expectedPrefixes = [ "LeftFoot", "RightFoot", "LeftToe", "RightToe" ];
    const femaleFoundationRole = roles.length === 1
        && (roles[0] === "body" || roles[0] === "feet");
    if (coverage.strategy !== "triangle-mask"
        || sex !== "female"
        || (!authoredFootwearPolicy
            && operation.partSourceRecordID !== "female/feet/bootscf01")
        || !femaleFoundationRole
        || coverage.triangleRule !== "legacy-opengl-exact-foundation-triangle-coverage-v1"
        || coverage.triangleSelection !== undefined
        || !Array.isArray(coverage.bonePrefixes)
        || coverage.bonePrefixes.length !== expectedPrefixes.length
        || expectedPrefixes.some((value, index) => coverage.bonePrefixes[index] !== value))
    {
        throw new Error(
            "Legacy triangle coverage requires an exact female authored foundation policy: "
            + JSON.stringify({
                sex,
                groupID: operation.groupID,
                partSourceRecordID: operation.partSourceRecordID,
                roles,
                evidenceRule: evidence?.rule ?? null,
                authoredFootwearPolicy,
                bonePrefixes: coverage.bonePrefixes ?? null
            })
        );
    }
}

function IsAuthoredModifierCoverageEvidence(evidence)
{
    const roles = new Map([
        [ "topinner", "torso" ],
        [ "bottominner", "legs" ],
        [ "feet", "feet" ],
        [ "hands", "hands" ]
    ]);
    return evidence?.rule === "legacy-opengl-authored-modifier-coverage-v1"
        && evidence.sex === "male"
        && Array.isArray(evidence.relationships)
        && evidence.relationships.length > 0
        && evidence.relationships.every(value =>
            typeof value.authoredValue === "string"
            && value.authoredValue.length > 0
            && roles.get(value.modifierLocationKey) === value.foundationRole
            && (value.relation === "typed-modifier-location"
                || value.relation === "exact-modifier-path-fallback"));
}

function IsAuthoredFootwearCoverageEvidence(evidence)
{
    const heights = new Set([ "low", "shin", "medium", "knee", "high", "xhigh" ]);
    return evidence?.rule === "legacy-opengl-authored-footwear-coverage-v1"
        && evidence.groupID === "feet"
        && heights.has(evidence.footwearHeight)
        && Array.isArray(evidence.authoredModifierPaths)
        && evidence.authoredModifierPaths.length > 0
        && evidence.authoredModifierPaths.every(value =>
            /^(?:utilityshapes\/pantstuck(?:low|shin|medium|knee|high|xhigh)shape|dependants\/bootmasks\/bootmask(?:low|shin|medium|knee|high|xhigh))$/u.test(value));
}

function ResolveConfiguredFootwearReplacementCoverage(staged, operation, configuredMeshes)
{
    if (staged?.sex !== "female" || operation?.groupID !== "feet") return null;

    // Some configured footwear supplies its own posed skin surface alongside
    // the private garment surface. That decoded consumer topology replaces the
    // generic nude-foot carrier even when the part metadata has no boot mask.
    const bodyConsumers = GetEffects(configuredMeshes)
        .filter(isLegacyConfiguredBodyConsumerEffect);
    const bodyConsumerCount = bodyConsumers.length;
    if (!bodyConsumerCount) return null;

    const splitFeet = staged.foundationResources.has("feet");
    const combinedBody = !splitFeet && staged.foundationResources.has("body");
    if (!splitFeet && !combinedBody) return null;

    // This is a geometry replacement, not a garment-alpha support surface.
    // Mark the exact consumers before atlas composition so they retain the
    // shared body D/N/S and remain visible when the nude carrier is removed.
    for (const effect of bodyConsumers)
    {
        effect._characterFoundationReplacementRole = "feet";
    }

    const coverage = {
        strategy: splitFeet ? "hide-carrier" : "triangle-mask",
        roles: [ splitFeet ? "feet" : "body" ],
        ...(combinedBody ? {
            triangleRule: "legacy-opengl-exact-foundation-triangle-coverage-v1",
            bonePrefixes: [ "LeftFoot", "RightFoot", "LeftToe", "RightToe" ]
        } : {}),
        evidence: {
            status: "policy",
            rule: "legacy-opengl-configured-footwear-skin-replacement-v1",
            sex: staged.sex,
            groupID: operation.groupID,
            partSourceRecordID: operation.partSourceRecordID ?? null,
            configurationPath: operation.configurationPath,
            geometryPath: operation.geometryPath,
            bodyConsumerCount
        }
    };

    return IsConfiguredFootwearReplacementEvidence(coverage.evidence)
        ? coverage
        : null;
}

function IsConfiguredFootwearReplacementEvidence(evidence)
{
    return evidence?.rule === "legacy-opengl-configured-footwear-skin-replacement-v1"
        && evidence.sex === "female"
        && evidence.groupID === "feet"
        && typeof evidence.configurationPath === "string"
        && /^res:\//u.test(evidence.configurationPath)
        && typeof evidence.geometryPath === "string"
        && /^res:\//u.test(evidence.geometryPath)
        && Number.isInteger(evidence.bodyConsumerCount)
        && evidence.bodyConsumerCount > 0;
}

function CloneTextureContribution(value)
{
    return {
        ...value,
        source: {
            ...value.source,
            ...(Array.isArray(value.source?.occludesModifiers) ? {
                occludesModifiers: [ ...value.source.occludesModifiers ]
            } : {})
        },
        ...(Array.isArray(value.occludedBy) ? {
            occludedBy: value.occludedBy.map(occlusion => ({ ...occlusion }))
        } : {}),
        materialValues: CloneDiagnosticValue(value.materialValues),
        ...(value.colorSelection ? {
            colorSelection: CloneDiagnosticValue(value.colorSelection)
        } : {}),
        textureCandidates: value.textureCandidates.map(candidate => ({ ...candidate })),
        selectedTextures: value.selectedTextures.map(texture => ({ ...texture })),
        diagnostics: value.diagnostics.map(diagnostic => ({ ...diagnostic })),
        evidence: { ...value.evidence }
    };
}

function CloneMorphTarget(value)
{
    return {
        ...value,
        evidence: { ...value.evidence }
    };
}

function CloneSkinColorization(value)
{
    if (!value) return null;
    return {
        ...value,
        colors: value.colors.map(color => [ ...color ])
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

function ReplaceUnrenderableConfiguredEffects(
    meshes,
    shaderPath,
    { retainDeferredTextureConsumers = false } = {}
)
{
    const Effect = RequireClass(tw2, "Tw2Effect");
    const replacements = new Map();

    for (const mesh of meshes)
    {
        for (const field of AREA_FIELDS)
        {
            for (const area of mesh?.[field] ?? [])
            {
                const authored = area?.effect;
                if (!authored) continue;

                PreserveAuthoredEffectState(authored);
                if (IsAuthoredConfiguredEffectRenderable(authored)
                    || (retainDeferredTextureConsumers
                        && IsDeferredConfiguredTextureConsumer(authored))) continue;

                if (!replacements.has(authored))
                {
                    const fallback = Effect.from({
                        name: authored.name ?? "",
                        effectFilePath: shaderPath,
                        autoParameter: true
                    });

                    fallback._characterAuthoredEffect = authored;
                    fallback._characterAuthoredEffectFilePath = authored._characterAuthoredEffectFilePath;
                    fallback._characterAuthoredBodyAtlasConsumer = authored._characterAuthoredBodyAtlasConsumer;
                    fallback._characterAuthoredTexturePaths = {
                        ...authored._characterAuthoredTexturePaths
                    };
                    fallback._characterAuthoredParameterNames = [
                        ...(authored._characterAuthoredParameterNames ?? [])
                    ];
                    fallback._characterAuthoredCutMaskInfluence = authored._characterAuthoredCutMaskInfluence
                        ? [ ...authored._characterAuthoredCutMaskInfluence ]
                        : null;
                    fallback._characterAuthoredCutMaskInfluenceSource = authored._characterAuthoredCutMaskInfluenceSource
                        ?? null;
                    fallback._characterAuthoredCutMaskBinding = authored._characterAuthoredCutMaskBinding
                        ? { ...authored._characterAuthoredCutMaskBinding }
                        : null;
                    if (authored._characterAuthoredTransformUV0)
                    {
                        fallback._characterAuthoredTransformUV0 = [
                            ...authored._characterAuthoredTransformUV0
                        ];
                    }
                    fallback._characterProofFallback = true;
                    replacements.set(authored, fallback);
                }

                area.effect = replacements.get(authored);
            }
        }
    }

    return [ ...replacements.values() ];
}

/** Keeps one authored atlas consumer whose exact texture is composed later. */
function IsDeferredConfiguredTextureConsumer(effect)
{
    const path = String(effect?.effectFilePath ?? "");
    if (effect?.IsGood?.() !== true
        || !/\/(?:glassshader|skinnedavatarbrdfdoublelinear|skinnedavatarhair_detailed)\.sm_[a-z0-9_]+$/iu.test(
            path
        ))
    {
        return false;
    }
    return [ "DiffuseMap", "NormalMap", "SpecularMap" ].every(name =>
        typeof effect?.parameters?.[name]?.AttachTextureRes === "function");
}

function IsConfiguredFoundationSkinEffect(operation, binding, effect)
{
    if (operation?.role === "head")
    {
        return /c_skin_blinn/iu.test(String(effect?.name ?? ""));
    }
    if (operation?.role !== "body"
        || String(binding?.meshName ?? "").toLowerCase() !== "basenudeshape"
        || String(binding?.geometryMeshName ?? "").toLowerCase() !== "basenudeshape"
        || String(effect?.name ?? "").toLowerCase() !== "c_skin_body")
    {
        return false;
    }
    return isLegacyConfiguredBodyConsumerEffect(effect);
}

function ApplyConfiguredHeadSkinShader(mesh, shaderPath)
{
    if (!/^res:\/.+\.sm_[a-z0-9_]+$/iu.test(String(shaderPath)))
    {
        throw new TypeError("Configured head skin shader must be a res:/ shader path");
    }
    const meshIndex = Number.isInteger(mesh?.meshIndex) ? mesh.meshIndex : 0;
    const declaration = mesh?.geometryResource?.meshes?.[meshIndex]?.declaration;
    if (declaration?.HasUsage
        && (!declaration.HasUsage(3, 0) || !declaration.HasUsage(4, 0)))
    {
        throw new Error("Configured head skin geometry has no tangent frame");
    }
    const switched = new Set();
    for (const field of AREA_FIELDS)
    {
        for (const area of mesh?.[field] ?? [])
        {
            const authored = area?.effect;
            if (!/c_skin_blinn/iu.test(String(authored?.name ?? ""))) continue;
            if (!switched.has(authored))
            {
                const transformUV0 = ReadVectorParameter(
                    authored?.parameters?.TransformUV0,
                    4
                );
                if (!transformUV0)
                {
                    throw new Error("Configured head skin effect has no authored TransformUV0");
                }
                PreserveAuthoredEffectState(authored);
                if (typeof authored.SetValues === "function")
                {
                    authored.SetValues({ effectFilePath: shaderPath });
                }
                else authored.effectFilePath = shaderPath;
                authored.Initialize?.();
                // The configured head starts with a different authored effect
                // contract. After switching resources, populate every sampler
                // and constant declared by the shared foundation shader before
                // restoring authored UVs or installing proof textures. This is
                // the lifecycle used by the reviewed GLES reference path.
                authored.AutoPopulate?.(false);
                if (!SetEffectVectorParameter(authored, "TransformUV0", transformUV0))
                {
                    throw new Error("Configured head skin shader cannot retain TransformUV0");
                }
                authored._characterAuthoredTransformUV0 = [ ...transformUV0 ];
                authored._characterFoundationSkinShader = {
                    status: "applied",
                    rule: "legacy-opengl-shared-foundation-skin-shader-v1",
                    shaderPath
                };
                switched.add(authored);
            }
        }
    }
    return [ ...switched ];
}

function SetEffectVectorParameter(effect, name, value)
{
    if (typeof effect?.SetParameters === "function")
    {
        effect.SetParameters({ [name]: [ ...value ] });
        return true;
    }
    const parameter = effect?.parameters?.[name];
    if (typeof parameter?.SetValue === "function")
    {
        parameter.SetValue([ ...value ]);
        return true;
    }
    return false;
}

function PreserveAuthoredEffectState(effect)
{
    const texturePaths = {};

    effect._characterAuthoredEffectFilePath = String(effect?.effectFilePath ?? "");
    effect._characterAuthoredParameterNames = Object.keys(effect?.parameters ?? {});
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
    const cutMaskInfluence = ReadEffectiveVectorParameter(effect, "CutMaskInfluence", 4);
    effect._characterAuthoredCutMaskInfluence = cutMaskInfluence?.value ?? null;
    effect._characterAuthoredCutMaskInfluenceSource = cutMaskInfluence?.source ?? null;
    const cutMask = effect?.parameters?.CutMaskMap;
    effect._characterAuthoredCutMaskBinding = cutMask
        ? {
            declared: true,
            resourcePath: String(
                cutMask?.resourcePath
                || cutMask?.textureRes?.path
                || ""
            ).trim() || null,
            attached: cutMask?.isAttached === true || Boolean(cutMask?.textureRes)
        }
        : { declared: false, resourcePath: null, attached: false };
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

function ReadEffectiveVectorParameter(effect, name, length)
{
    const parameterValue = ReadVectorParameter(effect?.parameters?.[name], length);
    if (parameterValue)
    {
        return { value: parameterValue, source: "public-parameter" };
    }

    const values = [];
    for (const [ techniqueName, shaderTechnique ] of Object.entries(
        effect?.shader?.techniques ?? {}
    ))
    {
        const runtimeTechnique = effect?.techniques?.[techniqueName];
        for (let passIndex = 0; passIndex < (shaderTechnique?.passes?.length ?? 0); passIndex++)
        {
            const shaderPass = shaderTechnique.passes[passIndex];
            const runtimePass = runtimeTechnique?.[passIndex];
            for (let stageIndex = 0; stageIndex < (shaderPass?.stages?.length ?? 0); stageIndex++)
            {
                const shaderStage = shaderPass.stages[stageIndex];
                const runtimeStage = runtimePass?.stages?.[stageIndex];
                const constant = shaderStage?.constants?.find(value => value?.name === name);
                if (!constant || constant.size < length || !runtimeStage?.constantBuffer) continue;
                const value = Array.from(runtimeStage.constantBuffer)
                    .slice(constant.offset, constant.offset + length)
                    .map(Number);
                if (value.length === length && value.every(Number.isFinite)) values.push(value);
            }
        }
    }
    if (!values.length) return null;
    const first = values[0];
    if (!values.every(value => value.every((item, index) =>
        Math.abs(item - first[index]) <= 1e-6))) return null;
    return { value: first, source: "shader-constant" };
}

/**
 * Marks proof fallbacks from their authored material channels. A primary
 * non-skin material owns a private garment target; a skin primary plus a
 * non-skin Material2 channel owns a body/garment hybrid target.
 */
export function applyLegacyProofGarmentMaterial(effects, contribution)
{
    const authoredColor = ReadLinearColor(contribution?.materialValues?.colors?.[0]);
    const specularColor = ReadLinearColor(
        contribution?.materialValues?.specularColors?.[0]
    );
    const report = {
        status: "deferred",
        rule: "legacy-opengl-diagnostic-garment-fallback-v2",
        materialDefinitionPath: contribution?.source?.materialDefinitionPath ?? null,
        authoredColor,
        fallbackColor: [ ...UNRESOLVED_GARMENT_COLOR ],
        specularColor,
        appliedEffects: 0,
        privateEffects: 0,
        hybridEffects: 0
    };

    const materialContracts = (effects ?? []).map(effect =>
    {
        const authored = effect?._characterAuthoredEffect;
        return {
            effect,
            materialLibraryID: ReadVectorParameter(
                authored?.parameters?.MaterialLibraryID,
                1
            )?.[0],
            material2LibraryID: ReadVectorParameter(
                authored?.parameters?.Material2LibraryID,
                1
            )?.[0]
        };
    });
    for (const contract of materialContracts)
    {
        const { effect, materialLibraryID, material2LibraryID } = contract;
        const privateGarment = Number.isFinite(materialLibraryID)
            && materialLibraryID !== 0;
        // DoubleLinear's non-skin secondary material remains a garment surface
        // even when the same configured part also contains a private sibling.
        // The owner layer's alpha decides which fragments of this carrier are
        // visible; sibling count does not decide its RGB ownership.
        const hybridGarment = materialLibraryID === 0
            && Number.isFinite(material2LibraryID)
            && material2LibraryID !== 0;

        if ((!privateGarment && !hybridGarment)
            || typeof effect?.SetParameters !== "function") continue;

        // Never let an unresolved proof surface look plausibly authored.
        // The private colorized target replaces this diagnostic magenta once
        // its retained material and texture evidence composes successfully.
        const parameters = { MaterialDiffuseColor: [ ...UNRESOLVED_GARMENT_COLOR ] };
        if (specularColor) parameters.MaterialSpecularColor = specularColor;
        if (effect.SetParameters(parameters) === false) continue;
        effect.SetTextures?.({ DiffuseMap: WHITE_PROOF_TEXTURE });
        if (privateGarment)
        {
            effect._characterGarmentMaterialFallback = true;
            report.privateEffects++;
        }
        else
        {
            effect._characterGarmentBodyFallback = true;
            report.hybridEffects++;
        }
        report.appliedEffects++;
    }

    if (report.appliedEffects) report.status = "applied";
    return report;
}

function ReadLinearColor(value)
{
    if (!Array.isArray(value) && !ArrayBuffer.isView(value)) return null;
    const color = Array.from(value).slice(0, 4).map(Number);
    if (color.length !== 4 || !color.every(Number.isFinite)) return null;
    return color;
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

function ApplyMissingProofTexturesToEffects(effects, profile)
{
    const proofTextures = GetProofTextures(profile);

    for (const effect of effects)
    {
        const missing = {};
        for (const [ name, resourcePath ] of Object.entries(proofTextures))
        {
            const parameter = effect?.parameters?.[name];
            if (!parameter) continue;
            const authoredPath = String(
                parameter.resourcePath
                || parameter.textureRes?.path
                || ""
            ).trim();
            if (authoredPath || parameter.textureRes) continue;
            missing[name] = resourcePath;
        }
        if (Object.keys(missing).length) effect?.SetTextures?.(missing);
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

function RequireRuntimeClass(client, tw2, name)
{
    let Constructor = null;

    try
    {
        Constructor = client.GetClass?.(name) ?? null;
    }
    catch
    {
        // The local proof bundle predates the client-owned constructor store.
    }

    return Constructor || RequireClass(tw2, name);
}

function RequireStaged(staged)
{
    if (!staged?.backend || !staged?.wrapper)
    {
        throw new TypeError("Legacy character adapter requires a prepared stage");
    }
}
