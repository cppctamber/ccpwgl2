import { tw2 } from "global";


const COLORIZED_BLIT_SHADER = "res:/graphics/effect.gles2/utility/compositing/colorizedblit.sm_hi";
const PATTERN_BLIT_SHADER = "res:/graphics/effect.gles2/utility/compositing/patternblit.sm_hi";
const COPY_BLIT_SHADER = "res:/graphics/effect.gles2/utility/compositing/copyblit.sm_hi";
const SIMPLE_BLIT_SHADER = "res:/graphics/effect.gles2/utility/compositing/simpleblit.sm_hi";
const MASKED_NORMAL_BLIT_SHADER =
    "res:/graphics/effect.gles2/utility/compositing/maskednormalblit.sm_hi";
const TWIST_NORMAL_BLIT_SHADER =
    "res:/graphics/effect.gles2/utility/compositing/twistnormalblit.sm_hi";
const SKINNED_AVATAR_TATTOO_BAKING_SHADER =
    "res:/graphics/effect.gles2/managed/interior/avatar/skinnedavatartattoobaking.sm_hi";
const TRANSPARENT = "dynamic:/color/0,0,0,0";
const SOLID_BLACK = "dynamic:/color/0,0,0,1";
const SOLID_WHITE = "dynamic:/color/1,1,1,1";
const NEUTRAL_NORMAL = "res:/graphics/shared_texture/global/normal_flat.dds";
const HEAD_BASE_SKIN_ORDER = 0;
const HEAD_COMPOSITION_GROUP_ORDER = new Map([
    [ "makeup/aging", 10 ],
    [ "makeup/blemish", 20 ],
    [ "makeup/scarring", 30 ],
    [ "scars/head", 30 ],
    [ "makeup/freckles", 40 ],
    [ "makeup/augmentations", 50 ],
    [ "tattoo/head", 60 ],
    [ "makeup/eyes", 70 ],
    [ "makeup/eyeshadow", 80 ],
    [ "makeup/eyebrowbase", 90 ],
    [ "makeup/eyebrows", 100 ],
    [ "makeup/implants", 110 ],
    [ "makeup/blush", 120 ],
    [ "makeup/eyeliner", 130 ],
    [ "makeup/lipstick", 140 ]
]);
const PROVED_HEAD_SKIN_MAKEUP_GROUPS = new Set([
    ...[ ...HEAD_COMPOSITION_GROUP_ORDER.keys() ].filter(value => value !== "tattoo/head")
]);
const PROVED_BODY_SKIN_MAKEUP_GROUPS = new Set([
    ...PROVED_HEAD_SKIN_MAKEUP_GROUPS,
    "makeup/bodyaugmentations"
]);
const NEUTRAL_SPECULAR = "res:/dx9/model/decal/shared/bw_000_000_015.dds";
const FEMALE_BOOT_PART = "female/feet/bootscf01";
const FEMALE_BOOT_MASK_PART = "female/dependants/bootmasks/bootmaskshin";
const FEMALE_BOOT_MASK_PATH = "res:/graphics/character/female/paperdoll/dependants/bootmasks/bootmaskshin/comp_body_m.png";
const FEMALE_TUCK_PART = "female/dependants/tuck/basic";
const FEMALE_TUCK_MASK_PART = "female/dependants/masktuck/tuckmaskmid";
const FEMALE_TUCK_MASK_PATH = "res:/graphics/character/female/paperdoll/dependants/masktuck/tuckmaskmid/comp_body_m.png";
const FEMALE_TUCK_TOP_PART = "female/topmiddle/shirtcf01";
const FEMALE_TUCK_TOP_ALPHA_PATH = "res:/graphics/character/female/paperdoll/topmiddle/shirtcf01/colorize_body_l_4k.png";
const FEMALE_TUCK_PANTS_PART = "female/bottomouter/pantscf01";
const FEMALE_UPPER_SLEEVE_PART = "female/dependants/sleevesupper/creased_01";
const FEMALE_LOWER_SLEEVE_PART = "female/dependants/sleeveslower/longcreased_01";

const BODY_FOUNDATIONS = {
    female: "res:/graphics/character/female/paperdoll/archetypes/ccshape/cd_female_body_d_4k.png",
    male: "res:/graphics/character/male/paperdoll/archetypes/ccshape/cd_male_body_d_4k.png"
};

const BODY_ROLES = new Set([
    "body",
    "torso",
    "sleevesUpper",
    "sleevesLower",
    "legs",
    "hands",
    "feet"
]);

const COLOR_WRITE_RGB = 0x7;
const COLOR_WRITE_ALPHA = 0x8;
const COLOR_WRITE_RGBA = 0xf;

/** Resolves the retained selected-archetype body diffuse before the sex fallback. */
export function resolveLegacyBodyFoundationPath(staged)
{
    const selected = (staged?.construction?.operations ?? []).filter(operation =>
        operation?.operation === "configured-foundation"
        && operation?.role === "head"
        && operation?.skinEvidence?.rule === "exact-skintone-prs-archetype-foundation-v1"
        && /^res:\//iu.test(String(operation?.skinEvidence?.bodyDiffusePath ?? "")));
    if (selected.length === 1) return selected[0].skinEvidence.bodyDiffusePath;
    return BODY_FOUNDATIONS[staged?.sex] ?? null;
}

/** Resolves the exact retained body specular foundation without inventing a path. */
export function resolveLegacyBodyFoundationSpecularPath(staged)
{
    const selected = (staged?.construction?.operations ?? []).filter(operation =>
        operation?.operation === "configured-foundation"
        && operation?.role === "head"
        && operation?.skinEvidence?.rule === "exact-skintone-prs-archetype-foundation-v1"
        && /^res:\//iu.test(String(operation?.skinEvidence?.bodySpecularPath ?? "")));
    return selected.length === 1 ? selected[0].skinEvidence.bodySpecularPath : null;
}

/** Composes the temporary legacy body diffuse atlas from retained library evidence. */
export class TnyGlesAtlasComposer
{
    _configuredPasses;

    _d3d;

    _metadata = new Map();

    _textureMetadataSource = null;

    _headNormalMode;

    _skinLightingMode;

    _tattooTextureOffsetY;

    constructor({
        headNormalMode = "detail",
        skinLightingMode = "authored",
        tattooTextureOffsetY = 0
    } = {})
    {
        if (!tw2 || typeof tw2.GetClass !== "function")
        {
            throw new TypeError("GLES atlas composer requires the ccpwgl tw2 facade");
        }
        if (!tw2.resMan
            || typeof tw2.resMan.FetchRaw !== "function"
            || typeof tw2.resMan.BuildUrl !== "function")
        {
            throw new TypeError("GLES atlas composer requires Tw2ResMan FetchRaw/BuildUrl");
        }
        if (![ "authored", "detail", "base", "neutral" ].includes(headNormalMode))
        {
            throw new TypeError(
                "GLES atlas headNormalMode must be authored, detail, base, or neutral"
            );
        }
        if (![ "authored", "head-diffuse", "body-diffuse", "diffuse" ].includes(
            skinLightingMode
        ))
        {
            throw new TypeError(
                "GLES atlas skinLightingMode must be authored, head-diffuse, body-diffuse, or diffuse"
            );
        }
        if (!Number.isFinite(tattooTextureOffsetY))
        {
            throw new TypeError("GLES atlas tattooTextureOffsetY must be finite");
        }
        this._d3d = RequireD3DConstants(tw2.const);
        this._configuredPasses = CreateConfiguredConsumerPassContract(this._d3d);
        this._headNormalMode = headNormalMode;
        this._skinLightingMode = skinLightingMode;
        this._tattooTextureOffsetY = tattooTextureOffsetY;
    }

    /** Uses one hydrated character library before falling back to PNG bytes. */
    SetTextureMetadataSource(source)
    {
        if (source !== null && typeof source?.Get !== "function")
        {
            throw new TypeError(
                "GLES atlas texture metadata source must expose Get(documentName, recordID)"
            );
        }
        if (this._textureMetadataSource !== source)
        {
            this._textureMetadataSource = source;
            this._metadata.clear();
        }
        return this;
    }

    /** Composes and attaches one body diffuse atlas, retaining a detailed report. */
    async Compose(staged)
    {
        const basePath = resolveLegacyBodyFoundationPath(staged);
        const contributions = staged?.textureContributions;

        if (!Array.isArray(contributions))
        {
            throw new TypeError("Legacy atlas composer requires texture contributions");
        }

        if (!basePath)
        {
            return { status: "deferred", reason: "foundation-sex-unresolved", passes: [] };
        }

        const configuredGarmentPartIndices = new Set(
            (staged.configuredParts ?? [])
                .filter(part => !IsConfiguredBodyAtlasDependency(part))
                .map(part => part.partIndex)
                .filter(Number.isInteger)
        );
        const planned = planLegacyBodyDiffuseOperations(contributions, {
            excludePartIndices: configuredGarmentPartIndices
        });
        const deferred = [ ...planned.deferred ];

        const baseMetadata = await this._ReadMetadata(basePath);
        const targetSize = ResolveTargetSize(baseMetadata);
        const passes = [ await this._CreateCopyPass(basePath, targetSize) ];
        const skinColorization = ResolveSkinColorizationCandidate(staged, "body");
        if (skinColorization)
        {
            passes.push(await this._CreateColorizedPass(skinColorization, targetSize));
        }
        const composedContributions = new Set();

        for (const operation of planned.operations)
        {
            try
            {
                const pass = operation.operation === "restore-base"
                    ? await this._CreateCutMaskRestorePass(operation, basePath, targetSize)
                    : operation.operation === "alpha-overlay"
                        ? await this._CreateAuthoredOverlayPass(
                            operation.texture.path,
                            targetSize,
                            {
                                ...operation.contribution,
                                role: operation.texture.role,
                                target: operation.texture.target
                            }
                        )
                        : await this._CreateColorizedPass(operation.candidate, targetSize);
                passes.push(pass);
                composedContributions.add(operation.contribution.layerIndex);
            }
            catch (error)
            {
                deferred.push({
                    layerIndex: operation.contribution.layerIndex,
                    groupID: operation.contribution.groupID,
                    reason: error.message
                });
            }
        }

        const RenderTarget = RequireClass(tw2, "Tw2RenderTarget");
        const target = new RenderTarget(
            `character-${staged.sex}-body-diffuse`,
            targetSize[0],
            targetSize[1],
            false
        );

        if (!target.IsGood?.())
        {
            throw new Error(`Unable to create ${targetSize.join("x")} legacy body diffuse target`);
        }

        try
        {
            RenderPasses(tw2, target, passes);
            const bodyNormal = await this._ComposeBodyNormal(
                staged,
                contributions,
                targetSize
            );
            const bodySpecular = await this._ComposeBodySpecular(
                staged,
                contributions,
                targetSize
            );
            const attachments = attachLegacyBodyDiffuse(
                staged.backend?.visualModel,
                target.texture,
                {
                    neutralLighting: [ "body-diffuse", "diffuse" ].includes(
                        this._skinLightingMode
                    )
                }
            );
            if (!attachments.foundation)
            {
                throw new Error("No foundation body effect accepts the composed DiffuseMap");
            }
            const configuredConsumers = await this._ComposeConfiguredConsumers(
                staged,
                target.texture,
                targetSize
            );

            const configuredPartIndices = new Set([
                ...attachments.configuredPartIndices,
                ...configuredConsumers.configuredPartIndices
            ]);
            for (const part of staged.configuredParts ?? [])
            {
                if (!configuredPartIndices.has(part.partIndex)) continue;
                const authored = configuredConsumers.configuredPartIndices.includes(part.partIndex);
                part.materialStatus = authored
                    ? "body-diffuse-consumer-policy"
                    : "body-diffuse-policy";
                part.compositionStatus = authored
                    ? "body-diffuse-consumer-attached"
                    : "body-diffuse-attached";
            }

            staged.compositionTargets ??= [];
            staged.compositionTargets.push(
                target,
                ...bodyNormal.targets,
                ...bodySpecular.targets,
                ...configuredConsumers.targets
            );
            staged.composedBodyDiffuseTexture = target.texture;
            if (bodyNormal.texture) staged.composedBodyNormalTexture = bodyNormal.texture;
            if (bodySpecular.texture)
            {
                staged.composedBodySpecularTexture = bodySpecular.texture;
            }
            return {
                status: "composed",
                rule: "legacy-opengl-body-diffuse-atlas-v1",
                uvStatus: "experimental-policy",
                basePath,
                targetSize,
                attachedEffects: attachments.total,
                foundationAttachedEffects: attachments.foundation,
                configuredProofAttachedEffects: attachments.configuredProof,
                configuredProofPartCount: attachments.configuredPartIndices.length,
                foundationBindings: attachments.foundationBindings,
                configuredProofBindings: attachments.configuredProofBindings,
                configuredAuthoredAttachedEffects: configuredConsumers.attachedEffects,
                configuredAuthoredPartCount: configuredConsumers.configuredPartIndices.length,
                configuredAuthoredBindings: configuredConsumers.bindings,
                configuredAuthoredDeferred: configuredConsumers.deferred,
                bodyNormal: bodyNormal.report,
                bodySpecular: bodySpecular.report,
                contributionCount: contributions.length,
                composedContributionCount: composedContributions.size,
                deferredContributionCount: new Set(deferred.map(value => value.layerIndex)).size,
                passes: passes.map(value => value.report),
                deferred
            };
        }
        catch (error)
        {
            target.Destroy?.();
            throw error;
        }
    }

    async _ComposeBodyNormal(staged, contributions, targetSize)
    {
        const planned = resolveLegacyBodyMaterialChannels(contributions);
        const operations = [ "body-diffuse", "diffuse" ].includes(this._skinLightingMode)
            ? []
            : planned.normal;
        const passes = [ await this._CreateSolidCopyPass(NEUTRAL_NORMAL, targetSize) ];
        const deferred = [ ...planned.deferred ];

        for (const operation of operations)
        {
            let accepted = false;
            const failures = [];
            for (const path of operation.candidatePaths ?? [ operation.path ])
            {
                try
                {
                    passes.push(await this._CreateAuthoredNormalPass(
                        path,
                        targetSize,
                        operation
                    ));
                    accepted = true;
                    break;
                }
                catch (error)
                {
                    failures.push({ ...operation, path, reason: error.message });
                }
            }
            if (!accepted)
            {
                deferred.push({
                    ...operation,
                    reason: failures.map(value => value.reason).join("; ")
                });
            }
        }

        const RenderTarget = RequireClass(tw2, "Tw2RenderTarget");
        const target = new RenderTarget(
            `character-${staged.sex}-body-normal`,
            targetSize[0],
            targetSize[1],
            false
        );
        if (!target.IsGood?.())
        {
            return {
                texture: null,
                targets: [],
                report: { status: "deferred", reason: "body-normal-target-unavailable" }
            };
        }

        try
        {
            RenderPasses(tw2, target, passes);
            const attachedEffects = attachLegacyBodyNormal(
                staged.backend?.visualModel,
                target.texture
            );
            if (!attachedEffects)
            {
                target.Destroy?.();
                return {
                    texture: null,
                    targets: [],
                    report: { status: "deferred", reason: "body-normal-consumer-unavailable" }
                };
            }
            return {
                texture: target.texture,
                targets: [ target ],
                report: {
                    status: "applied",
                    rule: "legacy-opengl-body-normal-atlas-v1",
                    correctness: "retained-source-policy-live-proof-pending",
                    diagnosticMode: operations.length ? "authored-additive-detail-normal" : "neutral-normal",
                    targetSize: [ ...targetSize ],
                    attachedEffects,
                    operationCount: operations.length,
                    passes: passes.map(value => value.report),
                    deferred
                }
            };
        }
        catch (error)
        {
            target.Destroy?.();
            return {
                texture: null,
                targets: [],
                report: { status: "deferred", reason: error.message, deferred }
            };
        }
    }

    async _ComposeBodySpecular(staged, contributions, targetSize)
    {
        const planned = resolveLegacyBodyMaterialChannels(contributions);
        const neutral = [ "body-diffuse", "diffuse" ].includes(this._skinLightingMode);
        const basePath = resolveLegacyBodyFoundationSpecularPath(staged);
        if (!neutral && !basePath)
        {
            return {
                texture: null,
                targets: [],
                report: {
                    status: "deferred",
                    reason: "body-specular-foundation-unresolved",
                    deferred: [ ...planned.deferred ]
                }
            };
        }

        const operations = neutral ? [] : planned.specular;
        const passes = [ neutral
            ? await this._CreateSolidCopyPass(SOLID_BLACK, targetSize)
            : await this._CreateAuthoredConsumerCopyPass(basePath, targetSize) ];
        const deferred = [ ...planned.deferred ];

        for (const operation of operations)
        {
            let accepted = false;
            const failures = [];
            for (const path of operation.candidatePaths ?? [ operation.path ])
            {
                try
                {
                    passes.push(await this._CreateAuthoredOverlayPass(
                        path,
                        targetSize,
                        operation
                    ));
                    accepted = true;
                    break;
                }
                catch (error)
                {
                    failures.push({ ...operation, path, reason: error.message });
                }
            }
            if (!accepted)
            {
                deferred.push({
                    ...operation,
                    reason: failures.map(value => value.reason).join("; ")
                });
            }
        }

        const RenderTarget = RequireClass(tw2, "Tw2RenderTarget");
        const target = new RenderTarget(
            `character-${staged.sex}-body-specular`,
            targetSize[0],
            targetSize[1],
            false
        );
        if (!target.IsGood?.())
        {
            return {
                texture: null,
                targets: [],
                report: { status: "deferred", reason: "body-specular-target-unavailable" }
            };
        }

        try
        {
            RenderPasses(tw2, target, passes);
            const attachedEffects = attachLegacyBodySpecular(
                staged.backend?.visualModel,
                target.texture
            );
            if (!attachedEffects)
            {
                target.Destroy?.();
                return {
                    texture: null,
                    targets: [],
                    report: { status: "deferred", reason: "body-specular-consumer-unavailable" }
                };
            }
            return {
                texture: target.texture,
                targets: [ target ],
                report: {
                    status: "applied",
                    rule: "legacy-opengl-body-specular-atlas-v1",
                    correctness: "retained-source-policy-live-proof-pending",
                    diagnosticMode: neutral ? "black-specular" : "authored",
                    basePath: basePath ?? null,
                    targetSize: [ ...targetSize ],
                    attachedEffects,
                    operationCount: operations.length,
                    passes: passes.map(value => value.report),
                    deferred
                }
            };
        }
        catch (error)
        {
            target.Destroy?.();
            return {
                texture: null,
                targets: [],
                report: { status: "deferred", reason: error.message, deferred }
            };
        }
    }

    /** Composes each configured non-skin proof surface from its own retained textures. */
    async ComposeConfiguredGarmentMaterials(staged)
    {
        const report = {
            status: "deferred",
            rule: "legacy-opengl-configured-garment-colorized-v1",
            correctness: "structurally-tested-live-proof-pending",
            applied: [],
            deferred: []
        };

        for (const binding of staged?.configuredPartBindings ?? [])
        {
            const part = binding?.configuredPart;
            const contribution = staged.textureContributions?.find(value =>
                value.partIndex === part?.partIndex);
            const allEffects = GetEffects(binding?.configuredMeshes ?? []);
            const effects = allEffects.filter(effect =>
                effect?._characterGarmentMaterialFallback === true);
            const hybridEffects = allEffects.filter(effect =>
                effect?._characterGarmentBodyFallback === true);

            if (!effects.length && !hybridEffects.length) continue;

            const resolved = resolveLegacyBodyDiffuseContribution(contribution);
            if (resolved.status !== "ready")
            {
                report.deferred.push({
                    partIndex: part?.partIndex ?? null,
                    groupID: part?.groupID ?? null,
                    partSourceRecordID: part?.partSourceRecordID ?? null,
                    reason: resolved.reason
                });
                continue;
            }
            const materialChannels = resolveLegacyGarmentMaterialChannels(contribution);

            const metadata = await this._ReadMetadata(resolved.candidate.detail.path);
            const targetSize = ResolveTargetSize(metadata);
            const surfaces = [];
            for (const [ surface, surfaceEffects ] of [
                [ "private-garment", effects ],
                [ "body-garment-hybrid", hybridEffects ]
            ])
            {
                if (!surfaceEffects.length) continue;
                const surfaceResult = await this._ComposeConfiguredGarmentSurface(
                    staged,
                    part,
                    resolved.candidate,
                    surfaceEffects,
                    targetSize,
                    surface,
                    materialChannels
                );
                if (surfaceResult.status === "applied")
                {
                    surfaces.push(surfaceResult);
                }
                else report.deferred.push({
                    partIndex: part.partIndex,
                    groupID: part.groupID,
                    partSourceRecordID: part.partSourceRecordID,
                    surface,
                    reason: surfaceResult.reason
                });
            }

            if (!surfaces.length) continue;
            part.materialStatus = "configured-garment-colorized-policy";
            part.compositionStatus = "configured-garment-colorized-attached";
            report.applied.push({
                partIndex: part.partIndex,
                groupID: part.groupID,
                partSourceRecordID: part.partSourceRecordID,
                materialDefinitionPath: contribution.source.materialDefinitionPath,
                detailPath: resolved.candidate.detail.path,
                zonePath: resolved.candidate.zones.path,
                colors: resolved.candidate.colors.map(color => [ ...color ]),
                materialChannels,
                targetSize,
                attachedEffects: surfaces.reduce(
                    (total, value) => total + value.attachedEffects,
                    0
                ),
                bindings: DescribeConfiguredGarmentBindings(
                    binding.configuredMeshes,
                    [ ...effects, ...hybridEffects ]
                ),
                surfaces
            });
        }

        if (report.applied.length) report.status = "applied";
        return report;
    }

    /**
     * Composes source-backed head diffuse, normal, and specular contributions
     * into independent full atlases before binding exact face carriers.
     */
    async ComposeConfiguredHeadMaterials(staged)
    {
        const report = {
            status: "deferred",
            rule: "legacy-opengl-configured-head-lighting-v1",
            correctness: "experimental-policy",
            channels: [],
            rejectedCandidates: [],
            deferred: []
        };
        const foundation = staged?.configuredFoundations?.find(value => value?.role === "head");
        const binding = staged?.configuredFoundationBindings?.find(value => value?.role === "head");
        const textures = foundation?.skinTextureBindings?.textures;

        if (!binding || !textures)
        {
            report.deferred.push({ reason: "configured-head-foundation-unavailable" });
            return report;
        }

        const effects = binding.resolvedMeshBindings
            .filter(value => value.meshIndex === 0
                && value.meshName === "meshShape"
                && value.geometryMeshName === "meshShape")
            .flatMap(value => GetEffects([ value.mesh ]))
            .filter(effect => effect?.name === "C_Skin_blinn1"
                && BoundsEqual(ReadTransformUV0(effect), [ 0.5, 0, 1, 0.5 ]));
        if (!effects.length)
        {
            report.deferred.push({ reason: "configured-head-skin-effect-unavailable" });
            return report;
        }

        const plan = resolveLegacyHeadMaterialChannels(
            staged.textureContributions,
            this._textureMetadataSource
        );
        const browFallback = resolveLegacyDefaultBrowCandidate(
            staged.textureContributions,
            this._textureMetadataSource,
            foundation.skinTextureBindings.definitionPath
        );
        const eyelashFallback = resolveLegacyDefaultEyelashCandidate(
            staged.textureContributions,
            this._textureMetadataSource,
            staged.sex
        );
        report.browFallback = browFallback;
        report.eyelashFallback = eyelashFallback;
        if (browFallback.status === "ready")
        {
            plan.diffuse.push(browFallback.operation);
            RemoveResolvedHeadColorizedDeferrals(plan, browFallback.operation);
            SortLegacyCompositionOperations(plan.diffuse, plan.order.rule);
        }
        else if (browFallback.status !== "not-present") report.deferred.push(browFallback);
        if (eyelashFallback.status !== "ready"
            && eyelashFallback.status !== "not-present")
        {
            report.deferred.push(eyelashFallback);
        }
        report.deferred.push(...plan.deferred);
        const targets = [];
        const bindings = {};

        try
        {
            for (const [ name, basePath, operations ] of [
                [ "DiffuseMap", textures.DiffuseMap, plan.diffuse ],
                [ "NormalMap", textures.NormalMap, plan.normal ],
                [ "SpecularMap", textures.SpecularMap, plan.specular ]
            ])
            {
                if (!basePath)
                {
                    report.deferred.push({ channel: name, reason: "head-base-channel-unresolved" });
                    continue;
                }

                const neutralNormal = name === "NormalMap"
                    && (this._headNormalMode === "neutral"
                        || [ "head-diffuse", "diffuse" ].includes(this._skinLightingMode));
                const neutralSpecular = name === "SpecularMap"
                    && [ "head-diffuse", "diffuse" ].includes(this._skinLightingMode);
                const baseNormal = name === "NormalMap"
                    && this._headNormalMode === "base";
                const metadata = await this._ReadMetadata(
                    neutralNormal || neutralSpecular ? textures.DiffuseMap : basePath
                );
                const targetSize = ResolveTargetSize(metadata);
                const passes = [ neutralNormal
                    ? await this._CreateSolidCopyPass(NEUTRAL_NORMAL, targetSize)
                    : neutralSpecular
                        ? await this._CreateSolidCopyPass(SOLID_BLACK, targetSize)
                        : await this._CreateAuthoredConsumerCopyPass(basePath, targetSize) ];
                const skinColorization = name === "DiffuseMap"
                    ? ResolveSkinColorizationCandidate(staged, "head")
                    : null;
                if (skinColorization)
                {
                    passes.push(await this._CreateColorizedPass(skinColorization, targetSize));
                }
                const selectedOperations = neutralNormal || neutralSpecular || baseNormal
                    ? []
                    : name === "NormalMap" && this._headNormalMode === "detail"
                        ? operations.filter(operation => operation.op === "normal-add")
                        : operations;
                for (const operation of selectedOperations)
                {
                    let accepted = false;
                    const failures = [];
                    if (operation.op === "mesh-projected-head-decal")
                    {
                        try
                        {
                            const baked = await this._CreateProjectedHeadTattooPass(
                                operation,
                                targetSize,
                                staged,
                                binding
                            );
                            passes.push(baked.pass);
                            targets.push(baked.target);
                            accepted = true;
                        }
                        catch (error)
                        {
                            failures.push({
                                channel: name,
                                ...operation,
                                reason: error.message
                            });
                        }
                    }
                    for (const path of operation.candidatePaths ?? [ operation.path ])
                    {
                        if (accepted || operation.op === "mesh-projected-head-decal") break;
                        try
                        {
                            passes.push(operation.candidate
                                ? await this._CreateColorizedPass(operation.candidate, targetSize)
                                : operation.op === "authored-head-tattoo-atlas"
                                    ? await this._CreateAuthoredHeadTattooPass(
                                        path,
                                        targetSize,
                                        operation
                                    )
                                    : operation.op === "normal-replace"
                                        || operation.op === "normal-add"
                                        ? await this._CreateAuthoredNormalPass(
                                            path,
                                            targetSize,
                                            operation
                                        )
                                        : await this._CreateAuthoredOverlayPass(
                                            path,
                                            targetSize,
                                            operation
                                        ));
                            accepted = true;
                            break;
                        }
                        catch (error)
                        {
                            const failure = {
                                channel: name,
                                ...operation,
                                path,
                                reason: error.message
                            };
                            delete failure.candidatePaths;
                            failures.push(failure);
                        }
                    }
                    report.rejectedCandidates.push(...failures);
                    if (!accepted)
                    {
                        report.deferred.push({
                            channel: name,
                            ...operation,
                            reason: failures.map(value => value.reason).join("; ")
                        });
                    }
                }

                const RenderTarget = RequireClass(tw2, "Tw2RenderTarget");
                const target = new RenderTarget(
                    `character-${staged.sex}-head-${name.toLowerCase()}`,
                    targetSize[0],
                    targetSize[1],
                    false
                );
                if (!target.IsGood?.())
                {
                    throw new Error(`Unable to create ${targetSize.join("x")} ${name} head target`);
                }
                RenderPasses(tw2, target, passes);
                targets.push(target);
                bindings[name] = target.texture;
                report.channels.push({
                    name,
                    basePath,
                    diagnosticMode: neutralNormal
                        ? "neutral-normal"
                        : neutralSpecular
                            ? "black-specular"
                            : baseNormal
                                ? "authored-base-normal"
                                : name === "NormalMap" && this._headNormalMode === "detail"
                                    ? "authored-additive-detail-normal"
                                    : "authored",
                    targetSize,
                    overlayCount: passes.length - 1,
                    overlays: passes.slice(1).map(value => ({
                        path: value.report.path ?? value.report.detailPath,
                        groupID: value.report.groupID,
                        layerIndex: value.report.layerIndex,
                        role: value.report.role
                    })),
                    passes: passes.map(value => value.report)
                });
            }

            if (!Object.keys(bindings).length) return report;
            let eyelashTexture = null;
            if (eyelashFallback.status === "ready")
            {
                try
                {
                    const eyelashMetadata = await this._ReadMetadata(
                        eyelashFallback.operation.candidate.detail.path
                    );
                    const targetSize = ResolveTargetSize(eyelashMetadata);
                    const passes = [
                        // The authored lash detail owns the sparse card alpha.
                        // Colourization owns RGB only; asking the generic
                        // colorizer to synthesize both channels turns the crop
                        // into an opaque or incorrectly weighted carrier.
                        await this._CreateAuthoredConsumerCopyPass(
                            eyelashFallback.operation.candidate.detail.path,
                            targetSize
                        ),
                        await this._CreateColorizedPass(
                            eyelashFallback.operation.candidate,
                            targetSize,
                            { rgbOnly: true, blend: false, useDetailMask: false }
                        )
                    ];
                    const RenderTarget = RequireClass(tw2, "Tw2RenderTarget");
                    const target = new RenderTarget(
                        `character-${staged.sex}-head-eyelashes`,
                        targetSize[0],
                        targetSize[1],
                        false
                    );
                    if (!target.IsGood?.())
                    {
                        throw new Error(`Unable to create ${targetSize.join("x")} eyelash target`);
                    }
                    RenderPasses(tw2, target, passes);
                    targets.push(target);
                    eyelashTexture = target.texture;
                    report.eyelashFallback = {
                        ...report.eyelashFallback,
                        binding: "colorized-transparent-head-atlas",
                        targetSize,
                        alphaEvidence: ReadTargetAlphaEvidence(target),
                        passes: passes.map(value => value.report)
                    };
                }
                catch (error)
                {
                    report.deferred.push({
                        role: "eyelashes",
                        path: eyelashFallback.operation.path,
                        reason: error.message
                    });
                }
            }
            report.browSupport = await this._ComposeConfiguredBrowSupport(
                staged,
                browFallback,
                bindings.DiffuseMap ?? null,
                report.channels.find(value => value.name === "DiffuseMap")?.targetSize,
                targets
            );
            const committed = await commitLegacyConfiguredHeadBindings(effects, bindings);
            report.faceTextures = applyLegacyConfiguredFaceTextures(
                binding,
                staged.textureContributions,
                {
                    headDiffuseTexture: bindings.DiffuseMap ?? null,
                    eyelashTexture,
                    eyelashSourcePath: eyelashFallback.status === "ready"
                        ? eyelashFallback.operation.candidate.detail.path
                        : null
                }
            );
            staged.compositionTargets ??= [];
            staged.compositionTargets.push(...targets);
            report.status = "applied";
            report.attachedEffects = committed.attachedEffects;
            return report;
        }
        catch (error)
        {
            for (const target of targets.reverse()) target.Destroy?.();
            report.deferred.push({ reason: error.message });
            return report;
        }
    }

    async _ComposeConfiguredBrowSupport(
        staged,
        browFallback,
        headDiffuseTexture,
        targetSize,
        targets
    )
    {
        const binding = staged?.configuredFoundationSupportBindings?.find(value =>
            value?.role === "eyebrowbase");
        if (!binding)
        {
            return { status: "deferred", reason: "configured-brow-support-unavailable" };
        }
        if (browFallback?.status !== "ready" || !headDiffuseTexture
            || !Array.isArray(targetSize))
        {
            return { status: "deferred", reason: "configured-brow-material-unavailable" };
        }

        const effects = GetEffects(binding.configuredMeshes).filter(effect =>
            typeof effect?.parameters?.DiffuseMap?.AttachTextureRes === "function"
            && typeof effect?.SetParameters === "function");
        if (!effects.length)
        {
            return { status: "deferred", reason: "configured-brow-effect-unavailable" };
        }

        const alphaPath = browFallback.operation.candidate.detail.path;
        const passes = [
            await this._CreateAuthoredConsumerCopyPass(alphaPath, targetSize),
            await this._CreateSharedConsumerRgbPass(headDiffuseTexture, targetSize)
        ];
        const RenderTarget = RequireClass(tw2, "Tw2RenderTarget");
        const target = new RenderTarget(
            `character-${staged.sex}-head-eyebrowbase`,
            targetSize[0],
            targetSize[1],
            false
        );
        if (!target.IsGood?.())
        {
            throw new Error(`Unable to create ${targetSize.join("x")} eyebrow support target`);
        }

        try
        {
            RenderPasses(tw2, target, passes);
            const attachedEffects = commitLegacyConfiguredConsumerBindings(
                effects,
                target.texture,
                {
                    alphaTest: true,
                    neutralizeDiffuseColor: true,
                    preserveAlphaBlend: true
                }
            );
            targets.push(target);
            const support = staged.configuredFoundationSupports?.find(value =>
                value?.role === "eyebrowbase");
            if (support)
            {
                support.materialStatus = "brow-support-policy";
                support.compositionStatus = "brow-support-attached";
            }
            return {
                status: "applied",
                rule: "exact-head-archetype-brow-support-dependency-v1",
                partSourceRecordID: support?.partSourceRecordID ?? null,
                alphaPath,
                targetSize: [ ...targetSize ],
                alphaEvidence: ReadTargetAlphaEvidence(target),
                attachedEffects,
                passes: passes.map(value => value.report)
            };
        }
        catch (error)
        {
            target.Destroy?.();
            throw error;
        }
    }

    /** Bakes one proved mode-1 projection through the authored skinned head mesh. */
    async _CreateProjectedHeadTattooPass(operation, targetSize, staged, binding)
    {
        const projection = NormalizeTattooProjection(operation.projection);
        if (projection.mode !== 1)
        {
            throw new Error("Only authored mode-1 head tattoo projection is proved");
        }
        const carrier = FindProjectedHeadTattooCarrier(binding);
        if (!carrier)
        {
            throw new Error("Configured head tattoo projection carrier is unavailable");
        }
        if (typeof staged?.backend?.GetPerMeshObjectData !== "function")
        {
            throw new Error("Configured head tattoo projection has no per-mesh object data");
        }
        const authoredFlipBits = Number(projection.flipY) * 10 + Number(projection.flipX);
        // The GLES head carrier already supplies the vertical texture convention.
        // Applying the authored Y bit again placed A01's forehead mark over the nose.
        const shaderFlipBits = Number(projection.flipX);
        const Effect = RequireClass(tw2, "Tw2Effect");
        const effect = Effect.from({
            effectFilePath: SKINNED_AVATAR_TATTOO_BAKING_SHADER,
            autoParameter: true,
            parameters: {
                CutMaskInfluence: [ 0, 0, 0, 0 ],
                TransformUV0: [ 0.5, 0, 1, 0.5 ],
                TattooVSUVTransform: [ -0.5, 0, 2, 2 ],
                TattooPosition: [ ...projection.position, projection.scale ],
                TattooOptions: [
                    projection.angleRotation,
                    shaderFlipBits,
                    projection.offset[1] + this._tattooTextureOffsetY,
                    projection.offset[0]
                ],
                TattooDimensions: [
                    projection.radius,
                    projection.height,
                    0,
                    0
                ],
                TattooYawPitchRoll: [
                    projection.yaw,
                    projection.pitch,
                    projection.roll,
                    projection.mode
                ],
                TattooAspectRatio: [ projection.aspectRatio, 0, 0, 0 ]
            },
            textures: {
                CutMaskMap: SOLID_WHITE,
                TattooTextureMask: projection.maskPathEnabled
                    ? projection.maskPath
                    : SOLID_WHITE,
                TattooTextureMap: operation.path
            }
        });
        await PrepareEffect(tw2, effect, SKINNED_AVATAR_TATTOO_BAKING_SHADER);
        ApplyRenderStates(this._d3d, effect, false);

        const RenderTarget = RequireClass(tw2, "Tw2RenderTarget");
        const target = new RenderTarget(
            `character-${staged.sex}-head-tattoo-${operation.layerIndex}`,
            targetSize[0],
            targetSize[1],
            false
        );
        if (!target.IsGood?.())
        {
            throw new Error(`Unable to create ${targetSize.join("x")} head tattoo bake target`);
        }

        try
        {
            RenderProjectedHeadTattoo(tw2, target, effect, carrier, staged.backend);
            const color = [ ...operation.colors[0] ];
            color[3] = Clamp01(color[3] * operation.weight);
            const pass = await this._CreateProjectedHeadTattooCompositePass(
                target.texture,
                color,
                targetSize,
                operation,
                [ 0, 0, 1, 1 ]
            );
            pass.report.bake = {
                shader: SKINNED_AVATAR_TATTOO_BAKING_SHADER,
                mode: projection.mode,
                carrier: carrier.meshName,
                targetSize: [ ...targetSize ],
                localHeadBounds: [ 0, 0, 1, 1 ],
                areas: carrier.areas.map(area => ({
                    name: area.name,
                    meshIndex: area.meshIndex,
                    index: area.index,
                    count: area.count
                })),
                constants: {
                    position: [ ...projection.position, projection.scale ],
                    options: [
                        projection.angleRotation,
                        shaderFlipBits,
                        projection.offset[1] + this._tattooTextureOffsetY,
                        projection.offset[0]
                    ],
                    textureOffsetY: this._tattooTextureOffsetY,
                    authoredOptions: [
                        projection.angleRotation,
                        authoredFlipBits,
                        projection.offset[1],
                        projection.offset[0]
                    ],
                    dimensions: [
                        projection.radius,
                        projection.height,
                        0
                    ],
                    yawPitchRoll: [
                        projection.yaw,
                        projection.pitch,
                        projection.roll,
                        projection.mode
                    ],
                    aspectRatio: projection.aspectRatio,
                    cutMaskInfluence: 0,
                    transformUV0: [ 0.5, 0, 1, 0.5 ],
                    tattooVSUVTransform: [ -0.5, 0, 2, 2 ],
                    authoredMaskPath: projection.maskPathEnabled ? projection.maskPath : null,
                    authoredMaskApplication: projection.maskPathEnabled
                        ? "applied"
                        : "not-authored"
                }
            };
            return { pass, target };
        }
        catch (error)
        {
            target.Destroy?.();
            throw error;
        }
    }

    async _CreateProjectedHeadTattooCompositePass(
        texture,
        color,
        targetSize,
        operation,
        sourceBounds
    )
    {
        const Effect = RequireClass(tw2, "Tw2Effect");
        const effect = Effect.from({
            effectFilePath: SIMPLE_BLIT_SHADER,
            autoParameter: true,
            parameters: {
                SourceUVs: sourceBounds,
                TextureReverseUV: [ 0, 0, 1, 1 ],
                MaskReverseUV: [ 0, 0, 1, 1 ],
                Strength: [ color[3], 0, 0, 0 ],
                MultAlpha: [ 0, 0, 0, 0 ]
            },
            textures: {
                Texture: `dynamic:/color/${color[0]},${color[1]},${color[2]},1`,
                MaskMap: typeof texture === "string" ? texture : TRANSPARENT
            }
        });
        if (typeof texture !== "string")
        {
            effect.parameters?.MaskMap?.AttachTextureRes?.(texture);
        }
        await PrepareEffect(tw2, effect, SIMPLE_BLIT_SHADER);
        ApplyRenderStates(this._d3d, effect, true);
        return {
            effect,
            viewport: [ 0, 0, targetSize[0], targetSize[1] ],
            report: {
                mode: "mesh-projected-head-tattoo",
                shader: SIMPLE_BLIT_SHADER,
                path: operation.path,
                groupID: operation.groupID,
                layerIndex: operation.layerIndex,
                role: operation.role,
                color,
                sourceBounds: [ ...sourceBounds ],
                projectionDefinitionPath: operation.projectionDefinitionPath
            }
        };
    }

    async _ComposeConfiguredGarmentSurface(
        staged,
        part,
        candidate,
        effects,
        targetSize,
        surface,
        materialChannels
    )
    {
        let target = null;
        let lighting = null;
        try
        {
            const hybrid = surface === "body-garment-hybrid";
            const passes = [ await this._CreateGarmentClearPass(targetSize) ];
            if (hybrid)
            {
                if (!staged.composedBodyDiffuseTexture)
                {
                    throw new Error("Shared body diffuse is unavailable for hybrid garment surface");
                }
                passes.push(await this._CreateSharedConsumerRgbaPass(
                    staged.composedBodyDiffuseTexture,
                    targetSize
                ));
            }
            else
            {
                passes.push(await this._CreateAuthoredConsumerCopyPass(
                    candidate.detail.path,
                    targetSize
                ));
            }
            passes.push(await this._CreateColorizedPass(candidate, targetSize, hybrid
                ? { blend: true, useDetailMask: true }
                : { rgbOnly: true, blend: false, useDetailMask: false }));

            const RenderTarget = RequireClass(tw2, "Tw2RenderTarget");
            const targetIndex = (staged.compositionTargets ?? []).length;
            target = new RenderTarget(
                `character-${staged.sex}-garment-${part.partIndex}-${surface}-${targetIndex}`,
                targetSize[0],
                targetSize[1],
                false
            );
            if (!target.IsGood?.())
            {
                throw new Error(`Unable to create ${targetSize.join("x")} garment target`);
            }

            RenderPasses(tw2, target, passes);
            lighting = materialChannels.status === "ready"
                ? await this._ComposeGarmentLightingTargets(
                    staged,
                    part,
                    materialChannels,
                    targetSize,
                    surface
                )
                : null;
            const binding = await commitLegacyConfiguredGarmentBindings(
                effects,
                target.texture,
                lighting
                    ? {
                        NormalMap: {
                            textureRes: lighting.normalTarget.texture,
                            sourcePath: materialChannels.normalPath
                        },
                        SpecularMap: {
                            textureRes: lighting.specularTarget.texture,
                            sourcePath: materialChannels.specularPath
                        }
                    }
                    : {}
            );
            staged.compositionTargets ??= [];
            staged.compositionTargets.push(
                target,
                ...(lighting ? [ lighting.normalTarget, lighting.specularTarget ] : [])
            );
            return {
                status: "applied",
                surface,
                attachedEffects: binding.attachedEffects,
                materialBinding: binding,
                lightingPasses: lighting?.passes ?? [],
                passes: passes.map(value => value.report)
            };
        }
        catch (error)
        {
            lighting?.normalTarget?.Destroy?.();
            lighting?.specularTarget?.Destroy?.();
            target?.Destroy?.();
            return { status: "deferred", surface, reason: error.message };
        }
    }

    async _ComposeGarmentLightingTargets(
        staged,
        part,
        materialChannels,
        targetSize,
        surface
    )
    {
        const RenderTarget = RequireClass(tw2, "Tw2RenderTarget");
        const targetIndex = (staged.compositionTargets ?? []).length;
        const channels = [
            [ "normal", materialChannels.normalPath, NEUTRAL_NORMAL ],
            [ "specular", materialChannels.specularPath, NEUTRAL_SPECULAR ]
        ];
        const targets = [];
        const reports = [];

        try
        {
            for (const [ name, path, neutralPath ] of channels)
            {
                const passes = [
                    await this._CreateSolidCopyPass(neutralPath, targetSize),
                    await this._CreateAuthoredConsumerCopyPass(path, targetSize)
                ];
                const target = new RenderTarget(
                    `character-${staged.sex}-garment-${part.partIndex}-${surface}-${name}-${targetIndex}`,
                    targetSize[0],
                    targetSize[1],
                    false
                );
                if (!target.IsGood?.())
                {
                    throw new Error(`Unable to create ${targetSize.join("x")} garment ${name} target`);
                }
                RenderPasses(tw2, target, passes);
                targets.push(target);
                reports.push({
                    channel: name,
                    sourcePath: path,
                    neutralPath,
                    passes: passes.map(value => value.report)
                });
            }
        }
        catch (error)
        {
            for (const target of targets) target.Destroy?.();
            throw error;
        }

        return {
            normalTarget: targets[0],
            specularTarget: targets[1],
            passes: reports
        };
    }

    /** Applies the exact, experimentally proven female basic-tuck coverage target. */
    async ComposeExactFemaleTuckSupport(
        staged,
        {
            applyCutMask = true,
            alphaMode = "source",
            blendDetail = false,
            depthTest = true,
            fillMaterialBase = false,
            useAuthoredTransform = false,
            useDetailMask = true,
            usePantsRgb = false,
            useSharedBodyRgb = false
        } = {}
    )
    {
        if (typeof applyCutMask !== "boolean"
            || ![ "source", "opaque", "transparent" ].includes(alphaMode)
            || typeof blendDetail !== "boolean"
            || typeof depthTest !== "boolean"
            || typeof fillMaterialBase !== "boolean"
            || typeof useAuthoredTransform !== "boolean"
            || typeof useDetailMask !== "boolean"
            || typeof usePantsRgb !== "boolean"
            || typeof useSharedBodyRgb !== "boolean")
        {
            throw new TypeError("Exact female tuck options must be boolean");
        }
        if (usePantsRgb && useSharedBodyRgb)
        {
            throw new TypeError("Exact female tuck RGB comparisons are mutually exclusive");
        }
        const planned = planLegacyExactFemaleTuckSupport(
            staged?.sex,
            staged?.backend?.visualModel,
            staged?.configuredParts,
            staged?.textureContributions
        );
        if (planned.status !== "ready") return planned;
        if (useSharedBodyRgb && !staged?.composedBodyDiffuseTexture)
        {
            return {
                ...WithoutEffects(planned),
                status: "deferred",
                reason: "shared-body-diffuse-unresolved"
            };
        }
        const basePath = resolveLegacyBodyFoundationPath(staged);
        const baseMetadata = await this._ReadMetadata(basePath);
        const targetSize = ResolveTargetSize(baseMetadata);
        const targetIndex = (staged.compositionTargets ?? []).length;
        let target = null;

        try
        {
            const passes = [
                await this._CreateAuthoredConsumerCopyPass(planned.alphaPath, targetSize)
            ];
            if (fillMaterialBase)
            {
                passes.push(await this._CreateSolidRgbPass(
                    planned.topCandidate.colors[0],
                    targetSize
                ));
            }
            if (applyCutMask)
            {
                passes.push(await this._CreateConsumerCutMaskPass(
                    planned.maskPath,
                    targetSize
                ));
            }
            if (useSharedBodyRgb)
            {
                passes.push(await this._CreateSharedConsumerRgbPass(
                    staged.composedBodyDiffuseTexture,
                    targetSize
                ));
            }
            else
            {
                passes.push(await this._CreateColorizedPass(
                    usePantsRgb ? planned.pantsCandidate : planned.topCandidate,
                    targetSize,
                    { blend: blendDetail, rgbOnly: true, useDetailMask }
                ));
            }
            if (alphaMode !== "source")
            {
                passes.push(await this._CreateSolidAlphaPass(alphaMode, targetSize));
            }
            const RenderTarget = RequireClass(tw2, "Tw2RenderTarget");
            target = new RenderTarget(
                `character-${staged.sex}-tuck-support-${targetIndex}`,
                targetSize[0],
                targetSize[1],
                false
            );
            if (!target.IsGood?.())
            {
                throw new Error(`Unable to create ${targetSize.join("x")} exact tuck support target`);
            }

            RenderPasses(tw2, target, passes);
            const alphaEvidence = ReadTargetAlphaEvidence(target);
            const attachedEffects = commitLegacyConfiguredConsumerBindings(
                planned.effects,
                target.texture,
                {
                    depthTest,
                    transformUV0: useAuthoredTransform
                        ? planned.authoredSampleBounds
                        : null
                }
            );
            const part = staged.configuredParts.find(value =>
                value.partIndex === planned.tuckPartIndex);
            if (part)
            {
                part.materialStatus = "tuck-support-policy";
                part.compositionStatus = "tuck-support-attached";
            }
            staged.compositionTargets ??= [];
            staged.compositionTargets.push(target);

            return {
                status: "applied",
                rule: "legacy-opengl-exact-female-tuck-support-v1",
                correctness: "fixture-verified-experimental-policy",
                renderStateRule: "authored-decal-area-state-v1",
                tuckPartIndex: planned.tuckPartIndex,
                tuckPartSourceRecordID: planned.tuckPartSourceRecordID,
                supportOwnerSelectionIndex: planned.supportOwnerSelectionIndex,
                alphaLayerIndex: planned.alphaLayerIndex,
                alphaPartSourceRecordID: planned.alphaPartSourceRecordID,
                alphaPath: planned.alphaPath,
                maskLayerIndex: planned.maskLayerIndex,
                maskPartSourceRecordID: planned.maskPartSourceRecordID,
                maskPath: planned.maskPath,
                maskApplication: applyCutMask
                    ? "experimental-support-alpha-cut"
                    : "retained-not-applied-comparison",
                alphaPolicy: alphaMode === "source"
                    ? "selected-top-source-alpha"
                    : `${alphaMode}-comparison`,
                alphaEvidence,
                baseRgbPolicy: fillMaterialBase
                    ? "selected-top-material-color1-comparison"
                    : "authored-source-rgb",
                pantsLayerIndex: planned.pantsLayerIndex,
                pantsPartSourceRecordID: planned.pantsPartSourceRecordID,
                pantsDetailPath: planned.pantsDetailPath,
                pantsZonePath: planned.pantsZonePath,
                pantsMaterialDefinitionPath: planned.pantsMaterialDefinitionPath,
                topDetailPath: planned.topDetailPath,
                topZonePath: planned.topZonePath,
                topMaterialDefinitionPath: planned.topMaterialDefinitionPath,
                rgbSource: useSharedBodyRgb
                    ? "historical-shared-body-comparison"
                    : usePantsRgb
                        ? "same-owner-pants-colorized"
                        : "selected-top-colorized",
                detailMask: useDetailMask ? "enabled" : "disabled-comparison",
                detailRgbOperation: blendDetail ? "source-alpha-blend" : "replace",
                depthTest: depthTest
                    ? "enabled-comparison"
                    : "disabled-exact-decal-coverage-workaround",
                attachedEffects,
                targetSize,
                previousSampleBounds: planned.previousSampleBounds,
                authoredSampleBounds: planned.authoredSampleBounds,
                geometryBindings: planned.geometryBindings,
                sampleBounds: useAuthoredTransform
                    ? planned.authoredSampleBounds
                    : [ 0, 0, 1, 1 ],
                passes: passes.map(value => value.report)
            };
        }
        catch (error)
        {
            const rollbackFailures = error?.rollbackFailures ?? [];
            if (rollbackFailures.length && target)
            {
                staged.compositionTargets ??= [];
                staged.compositionTargets.push(target);
            }
            else
            {
                target?.Destroy?.();
            }
            return {
                ...WithoutEffects(planned),
                status: "deferred",
                reason: rollbackFailures.length
                    ? `${error.message}; ${rollbackFailures.length} binding rollback(s) failed`
                    : error.message
            };
        }
    }

    /** Applies the exact 3000001 selected-top alpha to its upper-sleeve dependency. */
    async ComposeExactFemaleUpperSleeve(staged, { attach = true } = {})
    {
        if (typeof attach !== "boolean")
        {
            throw new TypeError("Exact upper-sleeve attach option must be boolean");
        }
        const planned = planLegacyExactFemaleUpperSleeve(
            staged?.construction?.paperdollRecordID,
            staged?.sex,
            staged?.backend?.visualModel,
            staged?.configuredParts,
            staged?.textureContributions
        );
        if (planned.status !== "ready") return planned;
        if (!staged?.composedBodyDiffuseTexture)
        {
            return {
                ...WithoutEffects(planned),
                status: "deferred",
                reason: "shared-body-diffuse-unresolved"
            };
        }

        const basePath = resolveLegacyBodyFoundationPath(staged);
        const baseMetadata = await this._ReadMetadata(basePath);
        const targetSize = ResolveTargetSize(baseMetadata);
        const targetIndex = (staged.compositionTargets ?? []).length;
        let target = null;

        try
        {
            const passes = [
                await this._CreateAuthoredConsumerCopyPass(planned.alphaPath, targetSize),
                await this._CreateSharedConsumerRgbPass(
                    staged.composedBodyDiffuseTexture,
                    targetSize
                )
            ];
            const RenderTarget = RequireClass(tw2, "Tw2RenderTarget");
            target = new RenderTarget(
                `character-${staged.sex}-upper-sleeve-${targetIndex}`,
                targetSize[0],
                targetSize[1],
                false
            );
            if (!target.IsGood?.())
            {
                throw new Error(`Unable to create ${targetSize.join("x")} exact upper-sleeve target`);
            }

            RenderPasses(tw2, target, passes);
            if (!attach)
            {
                staged.compositionTargets ??= [];
                staged.compositionTargets.push(target);
                return {
                    ...WithoutEffects(planned),
                    status: "prepared-disabled",
                    rule: "legacy-opengl-exact-3000001-upper-sleeve-v1",
                    correctness: "comparison-control",
                    attachedEffects: 0,
                    targetSize,
                    sampleBounds: [ 0, 0, 1, 1 ],
                    passes: passes.map(value => value.report)
                };
            }
            const attachedEffects = commitLegacyConfiguredConsumerBindings(
                planned.effects,
                target.texture
            );
            const part = staged.configuredParts.find(value =>
                value.partIndex === planned.sleevePartIndex);
            if (part)
            {
                part.materialStatus = "upper-sleeve-material-policy";
                part.compositionStatus = "upper-sleeve-material-attached";
            }
            staged.compositionTargets ??= [];
            staged.compositionTargets.push(target);

            return {
                ...WithoutEffects(planned),
                status: "applied",
                rule: "legacy-opengl-exact-3000001-upper-sleeve-v1",
                correctness: "structurally-tested-live-proof-pending",
                attachedEffects,
                targetSize,
                sampleBounds: [ 0, 0, 1, 1 ],
                passes: passes.map(value => value.report)
            };
        }
        catch (error)
        {
            const rollbackFailures = error?.rollbackFailures ?? [];
            if (rollbackFailures.length && target)
            {
                staged.compositionTargets ??= [];
                staged.compositionTargets.push(target);
            }
            else
            {
                target?.Destroy?.();
            }
            return {
                ...WithoutEffects(planned),
                status: "deferred",
                reason: rollbackFailures.length
                    ? `${error.message}; ${rollbackFailures.length} binding rollback(s) failed`
                    : error.message
            };
        }
    }

    /** Applies the exact 3000001 selected-top alpha to its lower-sleeve dependency. */
    async ComposeExactFemaleLowerSleeve(staged, { attach = true } = {})
    {
        if (typeof attach !== "boolean")
        {
            throw new TypeError("Exact lower-sleeve attach option must be boolean");
        }
        const planned = planLegacyExactFemaleLowerSleeve(
            staged?.construction?.paperdollRecordID,
            staged?.sex,
            staged?.backend?.visualModel,
            staged?.configuredParts,
            staged?.textureContributions
        );
        if (planned.status !== "ready") return planned;
        if (!staged?.composedBodyDiffuseTexture)
        {
            return {
                ...WithoutEffects(planned),
                status: "deferred",
                reason: "shared-body-diffuse-unresolved"
            };
        }

        const basePath = resolveLegacyBodyFoundationPath(staged);
        const baseMetadata = await this._ReadMetadata(basePath);
        const targetSize = ResolveTargetSize(baseMetadata);
        const targetIndex = (staged.compositionTargets ?? []).length;
        let target = null;

        try
        {
            const passes = [
                await this._CreateAuthoredConsumerCopyPass(planned.alphaPath, targetSize),
                await this._CreateSharedConsumerRgbPass(
                    staged.composedBodyDiffuseTexture,
                    targetSize
                )
            ];
            const RenderTarget = RequireClass(tw2, "Tw2RenderTarget");
            target = new RenderTarget(
                `character-${staged.sex}-lower-sleeve-${targetIndex}`,
                targetSize[0],
                targetSize[1],
                false
            );
            if (!target.IsGood?.())
            {
                throw new Error(`Unable to create ${targetSize.join("x")} exact lower-sleeve target`);
            }

            RenderPasses(tw2, target, passes);
            if (!attach)
            {
                staged.compositionTargets ??= [];
                staged.compositionTargets.push(target);
                return {
                    ...WithoutEffects(planned),
                    status: "prepared-disabled",
                    rule: "legacy-opengl-exact-3000001-lower-sleeve-v1",
                    correctness: "comparison-control",
                    attachedEffects: 0,
                    targetSize,
                    sampleBounds: [ 0, 0, 1, 1 ],
                    passes: passes.map(value => value.report)
                };
            }
            const attachedEffects = commitLegacyConfiguredConsumerBindings(
                planned.effects,
                target.texture
            );
            const part = staged.configuredParts.find(value =>
                value.partIndex === planned.sleevePartIndex);
            if (part)
            {
                part.materialStatus = "lower-sleeve-material-policy";
                part.compositionStatus = "lower-sleeve-material-attached";
            }
            staged.compositionTargets ??= [];
            staged.compositionTargets.push(target);

            return {
                ...WithoutEffects(planned),
                status: "applied",
                rule: "legacy-opengl-exact-3000001-lower-sleeve-v1",
                correctness: "structurally-tested-live-proof-pending",
                attachedEffects,
                targetSize,
                sampleBounds: [ 0, 0, 1, 1 ],
                passes: passes.map(value => value.report)
            };
        }
        catch (error)
        {
            const rollbackFailures = error?.rollbackFailures ?? [];
            if (rollbackFailures.length && target)
            {
                staged.compositionTargets ??= [];
                staged.compositionTargets.push(target);
            }
            else
            {
                target?.Destroy?.();
            }
            return {
                ...WithoutEffects(planned),
                status: "deferred",
                reason: rollbackFailures.length
                    ? `${error.message}; ${rollbackFailures.length} binding rollback(s) failed`
                    : error.message
            };
        }
    }

    /** Builds and attaches the exact female boot CutMaskMap after final readiness. */
    async ComposeFoundationCutMask(staged, { attach = true } = {})
    {
        if (typeof attach !== "boolean")
        {
            throw new TypeError("Foundation cut-mask attach option must be boolean");
        }
        const planned = planLegacyFemaleFoundationCutMask(
            staged?.sex,
            staged?.configuredParts,
            staged?.textureContributions
        );
        if (planned.status !== "ready") return planned;

        const basePath = resolveLegacyBodyFoundationPath(staged);
        const baseMetadata = await this._ReadMetadata(basePath);
        const targetSize = ResolveTargetSize(baseMetadata);
        const masks = [];
        for (const mask of planned.masks)
        {
            const metadata = await this._ReadMetadata(mask.maskPath);
            const placement = Placement(metadata);
            RequireCompatibleTargetAspect(
                mask.maskPath,
                ResolveTargetSize(metadata),
                targetSize
            );
            masks.push({ ...mask, placement });
        }
        const passes = [ await this._CreateSolidCopyPass(SOLID_WHITE, targetSize) ];
        for (const mask of masks)
        {
            passes.push(await this._CreateFoundationCutMaskPass(
                mask.maskPath,
                mask.placement,
                targetSize
            ));
        }
        const RenderTarget = RequireClass(tw2, "Tw2RenderTarget");
        const target = new RenderTarget(
            `character-${staged.sex}-foundation-cut-mask`,
            targetSize[0],
            targetSize[1],
            false
        );

        if (!target.IsGood?.())
        {
            return { ...planned, status: "deferred", reason: "foundation-cut-target-unavailable" };
        }

        try
        {
            RenderPasses(tw2, target, passes);
            if (!attach)
            {
                staged.compositionTargets ??= [];
                staged.compositionTargets.push(target);
                return {
                    ...planned,
                    status: "prepared-disabled",
                    rule: "legacy-opengl-female-foundation-cut-mask-v2",
                    correctness: "comparison-control",
                    targetSize,
                    masks,
                    attachedEffects: 0,
                    bindings: [],
                    passes: passes.map(value => value.report)
                };
            }
            const bindings = commitLegacyFoundationCutMaskBindings(
                staged.backend?.visualModel,
                target.texture
            );
            staged.compositionTargets ??= [];
            staged.compositionTargets.push(target);
            return {
                ...planned,
                status: "applied",
                rule: "legacy-opengl-female-foundation-cut-mask-v2",
                correctness: "experimental-live-proof-pending",
                targetSize,
                masks,
                attachedEffects: bindings.length,
                bindings,
                passes: passes.map(value => value.report)
            };
        }
        catch (error)
        {
            const rollbackFailures = error?.rollbackFailures ?? [];
            if (rollbackFailures.length)
            {
                staged.compositionTargets ??= [];
                staged.compositionTargets.push(target);
            }
            else
            {
                target.Destroy?.();
            }
            return {
                ...planned,
                status: "deferred",
                reason: rollbackFailures.length
                    ? `${error.message}; ${rollbackFailures.length} binding rollback(s) failed`
                    : error.message
            };
        }
    }

    async _ComposeConfiguredConsumers(staged, sharedTexture, targetSize)
    {
        const planned = planLegacyConfiguredBodyConsumers(
            staged.backend?.visualModel,
            staged.textureContributions
        );
        const result = {
            attachedEffects: 0,
            configuredPartIndices: [],
            bindings: [],
            deferred: [ ...planned.deferred ],
            targets: []
        };
        const partIndices = new Set();

        for (let index = 0; index < planned.groups.length; index++)
        {
            const group = planned.groups[index];
            const effects = Unique(group.consumers.map(value => value.effect));
            let target = null;

            try
            {
                const passes = [ await this._CreateAuthoredConsumerCopyPass(
                    group.authoredDiffusePath,
                    targetSize
                ) ];

                for (const path of group.cutMaskPaths)
                {
                    passes.push(await this._CreateConsumerCutMaskPass(path, targetSize));
                }
                passes.push(await this._CreateSharedConsumerRgbPass(sharedTexture, targetSize));

                const RenderTarget = RequireClass(tw2, "Tw2RenderTarget");
                target = new RenderTarget(
                    `character-${staged.sex}-body-consumer-${index}`,
                    targetSize[0],
                    targetSize[1],
                    false
                );
                if (!target.IsGood?.())
                {
                    throw new Error(`Unable to create configured body consumer target ${index}`);
                }

                RenderPasses(tw2, target, passes);
                result.attachedEffects += commitLegacyConfiguredConsumerBindings(
                    effects,
                    target.texture
                );
                for (const consumer of group.consumers)
                {
                    partIndices.add(consumer.partIndex);
                    result.bindings.push({
                        status: "experimental-policy",
                        rule: "legacy-opengl-authored-alpha-shared-rgb-v1",
                        correctness: "structurally-tested-visual-proof-pending",
                        partIndex: consumer.partIndex,
                        groupID: consumer.groupID,
                        effectFilePath: consumer.effect.effectFilePath ?? null,
                        authoredDiffusePath: group.authoredDiffusePath,
                        cutMaskPaths: [ ...group.cutMaskPaths ],
                        previousSampleBounds: consumer.previousSampleBounds,
                        sampleBounds: [ 0, 0, 1, 1 ],
                        source: "configured-body-consumer-target"
                    });
                }
                result.targets.push(target);
            }
            catch (error)
            {
                const rollbackFailures = error?.rollbackFailures ?? [];
                let reason = error.message;
                if (rollbackFailures.length && target)
                {
                    // Keep the target alive if any consumer could not be restored;
                    // destroying it would leave that effect with a dangling texture.
                    result.targets.push(target);
                    reason += `; ${rollbackFailures.length} binding rollback(s) failed`;
                }
                else
                {
                    target?.Destroy?.();
                }
                result.deferred.push({
                    partIndices: Unique(group.consumers.map(value => value.partIndex)),
                    groupIDs: Unique(group.consumers.map(value => value.groupID)),
                    authoredDiffusePath: group.authoredDiffusePath,
                    cutMaskPaths: [ ...group.cutMaskPaths ],
                    reason
                });
            }
        }

        result.configuredPartIndices = [ ...partIndices ];
        return result;
    }

    async _CreateCopyPass(path, targetSize)
    {
        const metadata = await this._ReadMetadata(path);
        const placement = Placement(metadata);
        RequireTargetSize(path, metadata, targetSize);
        const Effect = RequireClass(tw2, "Tw2Effect");
        const effect = Effect.from({
            effectFilePath: COPY_BLIT_SHADER,
            autoParameter: true,
            parameters: {
                SourceUVs: Bounds(placement),
                TextureReverseUV: placement,
                AlphaMultiplier: [ 1, 0, 0, 0 ]
            },
            textures: { Texture: path }
        });

        await PrepareEffect(tw2, effect, COPY_BLIT_SHADER);
        ApplyRenderStates(this._d3d, effect, false);
        return {
            effect,
            viewport: Viewport(targetSize, placement),
            report: {
                mode: "foundation-copy",
                shader: COPY_BLIT_SHADER,
                path,
                placement,
                uv: DescribeUvDecision(metadata, targetSize, placement)
            }
        };
    }

    async _CreateSolidCopyPass(path, targetSize)
    {
        const Effect = RequireClass(tw2, "Tw2Effect");
        const effect = Effect.from({
            effectFilePath: COPY_BLIT_SHADER,
            autoParameter: true,
            parameters: {
                SourceUVs: [ 0, 0, 1, 1 ],
                TextureReverseUV: [ 0, 0, 1, 1 ],
                AlphaMultiplier: [ 1, 0, 0, 0 ]
            },
            textures: { Texture: path }
        });

        await PrepareEffect(tw2, effect, COPY_BLIT_SHADER);
        ApplyRenderStates(this._d3d, effect, false);
        return {
            effect,
            viewport: [ 0, 0, targetSize[0], targetSize[1] ],
            report: { mode: "foundation-cut-white", shader: COPY_BLIT_SHADER }
        };
    }

    async _CreateGarmentClearPass(targetSize)
    {
        const pass = await this._CreateSolidCopyPass(TRANSPARENT, targetSize);
        pass.report = {
            mode: "configured-garment-clear",
            shader: COPY_BLIT_SHADER,
            placement: [ 0, 0, 1, 1 ]
        };
        return pass;
    }

    async _CreateSolidAlphaPass(alphaMode, targetSize)
    {
        const pass = await this._CreateSolidCopyPass(
            alphaMode === "opaque" ? SOLID_WHITE : TRANSPARENT,
            targetSize
        );
        ApplyRenderStates(this._d3d, pass.effect, false, {
            colorWrite: COLOR_WRITE_ALPHA
        });
        pass.report = {
            mode: `configured-${alphaMode}-alpha-comparison`,
            shader: COPY_BLIT_SHADER,
            placement: [ 0, 0, 1, 1 ]
        };
        return pass;
    }

    async _CreateSolidRgbPass(color, targetSize)
    {
        if (!Array.isArray(color) || color.length !== 4 || !color.every(Number.isFinite))
        {
            throw new TypeError("Solid RGB pass requires one RGBA color");
        }
        const path = `dynamic:/color/${color.join(",")}`;
        const pass = await this._CreateSolidCopyPass(path, targetSize);
        ApplyRenderStates(this._d3d, pass.effect, false, {
            colorWrite: COLOR_WRITE_RGB
        });
        pass.report = {
            mode: "configured-material-base-rgb-comparison",
            shader: COPY_BLIT_SHADER,
            color: [ ...color ],
            placement: [ 0, 0, 1, 1 ]
        };
        return pass;
    }

    async _CreateFoundationCutMaskPass(path, placement, targetSize)
    {
        const Effect = RequireClass(tw2, "Tw2Effect");
        const effect = Effect.from({
            effectFilePath: SIMPLE_BLIT_SHADER,
            autoParameter: true,
            parameters: {
                SourceUVs: Bounds(placement),
                TextureReverseUV: [ 0, 0, 1, 1 ],
                MaskReverseUV: placement,
                Strength: [ 1, 0, 0, 0 ],
                MultAlpha: [ 1, 0, 0, 0 ]
            },
            textures: { Texture: SOLID_BLACK, MaskMap: path }
        });

        await PrepareEffect(tw2, effect, SIMPLE_BLIT_SHADER);
        ApplyRenderStates(this._d3d, effect, true);
        return {
            effect,
            viewport: Viewport(targetSize, placement),
            report: {
                mode: "foundation-cut-black-through-mask",
                shader: SIMPLE_BLIT_SHADER,
                maskPath: path,
                placement
            }
        };
    }

    async _CreateColorizedPass(
        candidate,
        targetSize,
        { rgbOnly = false, blend = !rgbOnly, useDetailMask = true } = {}
    )
    {
        if (typeof rgbOnly !== "boolean")
        {
            throw new TypeError("Colorized pass rgbOnly option must be boolean");
        }
        if (typeof useDetailMask !== "boolean")
        {
            throw new TypeError("Colorized pass useDetailMask option must be boolean");
        }
        if (typeof blend !== "boolean")
        {
            throw new TypeError("Colorized pass blend option must be boolean");
        }
        const [ detailMetadata, zoneMetadata ] = await Promise.all([
            this._ReadMetadata(candidate.detail.path),
            this._ReadMetadata(candidate.zones.path)
        ]);
        const detailPlacement = Placement(detailMetadata);
        const zonePlacement = Placement(zoneMetadata);

        // Detail inputs are authored atlas regions. Zone maps are normalized
        // palette selectors, not atlas surfaces: valid authored inputs include
        // uniform 16x16 maps for a 2048x1024 lash target, so their pixel aspect
        // is deliberately free.

        // Colorization detail inputs are authored as normalized atlases and may be a
        // lower resolution than the destination (for example 1024² masks over
        // a 2048² skin atlas). Their placement metadata, not pixel equality,
        // defines where the detail samples; its atlas aspect must agree.
        RequireCompatibleTargetAspect(
            candidate.detail.path,
            ResolveTargetSize(detailMetadata),
            targetSize
        );
        if (!BoundsEqual(zonePlacement, [ 0, 0, 1, 1 ]))
        {
            RequireCompatibleTargetAspect(
                candidate.zones.path,
                ResolveTargetSize(zoneMetadata),
                targetSize
            );
        }
        const pattern = candidate.pattern ?? null;
        const weight = candidate.contribution?.weight ?? 1;
        if (!Number.isFinite(weight))
        {
            throw new TypeError("Colorized pass contribution weight must be finite");
        }
        const shader = pattern ? PATTERN_BLIT_SHADER : COLORIZED_BLIT_SHADER;
        const Effect = RequireClass(tw2, "Tw2Effect");
        const effect = Effect.from({
            effectFilePath: shader,
            autoParameter: true,
            parameters: {
                SourceUVs: Bounds(detailPlacement),
                ZoneReverseUV: zonePlacement,
                DetailReverseUV: detailPlacement,
                OverlayReverseUV: [ 0, 0, 1, 1 ],
                Color1: candidate.colors[0],
                Color2: candidate.colors[1],
                Color3: candidate.colors[2],
                ...(pattern ? {
                    PatternColor1: pattern.colors[0],
                    PatternColor2: pattern.colors[1],
                    PatternColor3: pattern.colors[2],
                    PatternTransform: pattern.transform,
                    PatternRotation: pattern.rotation
                } : {
                    MaskReverseUV2: useDetailMask ? detailPlacement : [ 0, 0, 1, 1 ],
                    Strength: [ weight, 0, 0, 0 ],
                    UseMask: useDetailMask ? [ 1, 0, 0, 0 ] : [ 0, 0, 0, 0 ]
                })
            },
            textures: {
                ZoneMap: candidate.zones.path,
                DetailMap: candidate.detail.path,
                OverlayMap: TRANSPARENT,
                ...(pattern
                    ? { PatternMap: pattern.path }
                    : { MaskMap: useDetailMask ? candidate.detail.path : TRANSPARENT })
            }
        });

        await PrepareEffect(tw2, effect, shader);
        // The ordinary atlas layer uses source alpha to blend over the shared
        // atlas. A configured support target already owns its final alpha, so
        // its RGB-only pass must replace RGB outright; blending here leaves
        // the support's prior grayscale RGB visible through translucent pixels.
        ApplyRenderStates(
            this._d3d,
            effect,
            blend,
            rgbOnly ? { colorWrite: COLOR_WRITE_RGB } : {}
        );
        return {
            effect,
            viewport: Viewport(targetSize, detailPlacement),
            report: {
                mode: pattern
                    ? (rgbOnly ? "patterned-rgb" : "patterned")
                    : (rgbOnly ? "colorized-rgb" : "colorized"),
                rgbOperation: blend ? "source-alpha-blend" : "replace",
                blend: blend ? "source-alpha" : "disabled",
                detailMask: useDetailMask ? "enabled" : "disabled",
                shader,
                layerIndex: candidate.contribution.layerIndex,
                groupID: candidate.contribution.groupID,
                weight,
                materialDefinitionPath: candidate.contribution.source.materialDefinitionPath,
                materialControls: DescribeRetainedMaterialControls(candidate.contribution),
                detailPath: candidate.detail.path,
                zonePath: candidate.zones.path,
                pattern: pattern ? {
                    name: pattern.name,
                    path: pattern.path,
                    colors: pattern.colors.map(value => [ ...value ]),
                    transform: [ ...pattern.transform ],
                    rotation: pattern.rotation
                } : null,
                placement: detailPlacement,
                uv: {
                    status: "experimental-policy",
                    rule: "legacy-opengl-normalized-png-placement-v1",
                    detail: DescribeUvDecision(detailMetadata, targetSize, detailPlacement),
                    zones: DescribeUvDecision(zoneMetadata, targetSize, zonePlacement)
                }
            }
        };
    }

    async _CreateCutMaskRestorePass(operation, basePath, targetSize)
    {
        const metadata = await this._ReadMetadata(operation.mask.path);
        const placement = Placement(metadata);
        const maskTargetSize = ResolveTargetSize(metadata);
        RequireCompatibleTargetAspect(operation.mask.path, maskTargetSize, targetSize);
        const Effect = RequireClass(tw2, "Tw2Effect");
        const effect = Effect.from({
            effectFilePath: SIMPLE_BLIT_SHADER,
            autoParameter: true,
            parameters: {
                SourceUVs: Bounds(placement),
                TextureReverseUV: [ 0, 0, 1, 1 ],
                MaskReverseUV: placement,
                Strength: [ 1, 0, 0, 0 ],
                MultAlpha: [ 1, 0, 0, 0 ]
            },
            textures: {
                Texture: basePath,
                MaskMap: operation.mask.path
            }
        });

        await PrepareEffect(tw2, effect, SIMPLE_BLIT_SHADER);
        ApplyRenderStates(this._d3d, effect, true);
        return {
            effect,
            viewport: Viewport(targetSize, placement),
            report: {
                mode: "restore-base-through-cut-mask",
                shader: SIMPLE_BLIT_SHADER,
                layerIndex: operation.contribution.layerIndex,
                groupID: operation.contribution.groupID,
                ownerSelectionIndex: operation.contribution.ownerSelectionIndex,
                basePath,
                maskPath: operation.mask.path,
                maskTargetSize,
                placement,
                uv: DescribeUvDecision(metadata, targetSize, placement)
            }
        };
    }

    async _CreateAuthoredConsumerCopyPass(path, targetSize)
    {
        const metadata = await this._ReadMetadata(path);
        const placement = Placement(metadata);
        const sourceTargetSize = ResolveTargetSize(metadata);
        RequireCompatibleTargetAspect(path, sourceTargetSize, targetSize);
        const Effect = RequireClass(tw2, "Tw2Effect");
        const effect = Effect.from({
            effectFilePath: COPY_BLIT_SHADER,
            autoParameter: true,
            parameters: {
                SourceUVs: Bounds(placement),
                TextureReverseUV: placement,
                AlphaMultiplier: [ 1, 0, 0, 0 ]
            },
            textures: { Texture: path }
        });

        await PrepareEffect(tw2, effect, COPY_BLIT_SHADER);
        ApplyConfiguredConsumerRenderStates(
            this._d3d,
            effect,
            this._configuredPasses.authored
        );
        return {
            effect,
            viewport: Viewport(targetSize, placement),
            report: {
                mode: "configured-authored-rgba",
                shader: COPY_BLIT_SHADER,
                path,
                sourceTargetSize,
                placement,
                uv: DescribeUvDecision(metadata, targetSize, placement)
            }
        };
    }

    async _CreateAuthoredOverlayPass(path, targetSize, operation)
    {
        const metadata = await this._ReadMetadata(path);
        const placement = Placement(metadata);
        const fullNormalized = BoundsEqual(placement, [ 0, 0, 1, 1 ]);
        if (!fullNormalized)
        {
            RequireCompatibleTargetAspect(path, ResolveTargetSize(metadata), targetSize);
        }
        const Effect = RequireClass(tw2, "Tw2Effect");
        const weight = Number.isFinite(operation?.weight) ? operation.weight : 1;
        const effect = Effect.from({
            effectFilePath: COPY_BLIT_SHADER,
            autoParameter: true,
            parameters: {
                SourceUVs: Bounds(placement),
                TextureReverseUV: placement,
                AlphaMultiplier: [ weight, 0, 0, 0 ]
            },
            textures: { Texture: path }
        });

        await PrepareEffect(tw2, effect, COPY_BLIT_SHADER);
        ApplyRenderStates(this._d3d, effect, true);
        return {
            effect,
            viewport: Viewport(targetSize, placement),
            report: {
                mode: operation?.projectionDefinitionPath
                    ? "configured-head-authored-tattoo-atlas"
                    : `configured-${operation?.target ?? "head"}-source-alpha-overlay`,
                shader: COPY_BLIT_SHADER,
                path,
                groupID: operation.groupID,
                layerIndex: operation.layerIndex,
                role: operation.role,
                materialControls: operation.materialControls ?? null,
                weight,
                placement,
                samplingContract: fullNormalized
                    ? "full-normalized-stretch"
                    : "authored-atlas-placement",
                projectionDefinitionPath: operation?.projectionDefinitionPath ?? null,
                authoredColorSelection: operation?.colors?.map(value => [ ...value ]) ?? null,
                colorSelectionApplication: operation?.projectionDefinitionPath
                    ? "retained-not-applied"
                    : null,
                uv: DescribeUvDecision(metadata, targetSize, placement)
            }
        };
    }

    async _CreateAuthoredHeadTattooPass(path, targetSize, operation)
    {
        const placement = [ 0, 0, 1, 1 ];
        const weight = Number.isFinite(operation?.weight) ? operation.weight : 1;
        const ink = operation?.colors?.[0];
        if (!Array.isArray(ink) || ink.length < 4
            || ink.slice(0, 4).some(value => !Number.isFinite(Number(value))))
        {
            throw new TypeError("Authored head tattoo requires one retained RGBA ink colour");
        }
        const alphaMask = await CreateLegacyBc3AlphaMaskTexture(tw2, path);
        const inkPath = `dynamic:/color/${ink.slice(0, 4).map(Number).join(",")}`;
        const Effect = RequireClass(tw2, "Tw2Effect");
        const effect = Effect.from({
            effectFilePath: SIMPLE_BLIT_SHADER,
            autoParameter: true,
            parameters: {
                SourceUVs: [ 0, 0, 1, 1 ],
                TextureReverseUV: [ 0, 0, 1, 1 ],
                MaskReverseUV: [ 0, 0, 1, 1 ],
                Strength: [ weight, 0, 0, 0 ],
                MultAlpha: [ 1, 0, 0, 0 ]
            },
            textures: {
                Texture: inkPath,
                MaskMap: TRANSPARENT
            }
        });

        await PrepareEffect(tw2, effect, SIMPLE_BLIT_SHADER);
        effect.parameters?.MaskMap?.AttachTextureRes?.(alphaMask.resource);
        // The shipped head tattoo is already laid out in full head-atlas UVs.
        // Blend its authored alpha into RGB while preserving the foundation
        // alpha that controls the skin carrier's cutout coverage.
        ApplyRenderStates(this._d3d, effect, true, {
            colorWrite: COLOR_WRITE_RGB
        });
        return {
            effect,
            viewport: [ 0, 0, targetSize[0], targetSize[1] ],
            report: {
                mode: "configured-head-authored-tattoo-atlas",
                shader: SIMPLE_BLIT_SHADER,
                path,
                inkPath,
                groupID: operation.groupID,
                layerIndex: operation.layerIndex,
                role: operation.role,
                weight,
                placement,
                projectionDefinitionPath: operation?.projectionDefinitionPath ?? null,
                authoredColorSelection: operation?.colors?.map(value => [ ...value ]) ?? null,
                colorSelectionApplication: "retained-ink-over-authored-alpha",
                alphaOperation: "source-alpha-rgb-preserve-foundation-alpha",
                sourceLayout: "authored-complete-head-atlas",
                alphaRealization: alphaMask.report,
                renderStates: DescribeConfiguredFaceCarrier(null, effect).techniques
            },
            cleanup: alphaMask.destroy
        };
    }

    async _CreateAuthoredNormalPass(path, targetSize, operation)
    {
        const additive = operation?.op === "normal-add";
        const metadata = await this._ReadMetadata(path);
        const placement = Placement(metadata);
        RequireCompatibleTargetAspect(path, ResolveTargetSize(metadata), targetSize);
        const shader = additive ? TWIST_NORMAL_BLIT_SHADER : MASKED_NORMAL_BLIT_SHADER;
        const strength = Number.isFinite(operation?.weight) ? operation.weight : 1;
        const Effect = RequireClass(tw2, "Tw2Effect");
        const effect = Effect.from({
            effectFilePath: shader,
            autoParameter: true,
            parameters: {
                SourceUVs: Bounds(placement),
                TextureReverseUV: placement,
                Strength: [ strength, 0, 0, 0 ]
            },
            textures: { Texture: path }
        });

        await PrepareEffect(tw2, effect, shader);
        if (additive)
        {
            ApplyRenderStates(this._d3d, effect, true, {
                sourceBlend: this._d3d.BLEND_ONE,
                destinationBlend: this._d3d.BLEND_ONE,
                sourceBlendAlpha: this._d3d.BLEND_ONE,
                destinationBlendAlpha: this._d3d.BLEND_ONE
            });
        }
        else ApplyRenderStates(this._d3d, effect, true);
        return {
            effect,
            viewport: Viewport(targetSize, placement),
            report: {
                mode: `configured-${operation?.target ?? "head"}-normal-${
                    additive ? "add" : "replace"
                }`,
                shader,
                path,
                groupID: operation.groupID,
                layerIndex: operation.layerIndex,
                role: operation.role,
                materialControls: operation.materialControls ?? null,
                strength,
                placement,
                uv: DescribeUvDecision(metadata, targetSize, placement)
            }
        };
    }

    async _CreateConsumerCutMaskPass(path, targetSize)
    {
        const metadata = await this._ReadMetadata(path);
        const placement = Placement(metadata);
        const maskTargetSize = ResolveTargetSize(metadata);
        RequireCompatibleTargetAspect(path, maskTargetSize, targetSize);
        const Effect = RequireClass(tw2, "Tw2Effect");
        const effect = Effect.from({
            effectFilePath: SIMPLE_BLIT_SHADER,
            autoParameter: true,
            parameters: {
                SourceUVs: Bounds(placement),
                TextureReverseUV: [ 0, 0, 1, 1 ],
                MaskReverseUV: placement,
                Strength: [ 1, 0, 0, 0 ],
                MultAlpha: [ 1, 0, 0, 0 ]
            },
            textures: {
                Texture: SOLID_BLACK,
                MaskMap: path
            }
        });

        await PrepareEffect(tw2, effect, SIMPLE_BLIT_SHADER);
        ApplyConfiguredConsumerRenderStates(
            this._d3d,
            effect,
            this._configuredPasses.cut
        );
        return {
            effect,
            viewport: Viewport(targetSize, placement),
            report: {
                mode: "configured-cut-alpha",
                shader: SIMPLE_BLIT_SHADER,
                maskPath: path,
                maskTargetSize,
                placement,
                uv: DescribeUvDecision(metadata, targetSize, placement)
            }
        };
    }

    async _CreateSharedConsumerRgbPass(sharedTexture, targetSize)
    {
        return this._CreateSharedConsumerCopyPass(sharedTexture, targetSize, false);
    }

    async _CreateSharedConsumerRgbaPass(sharedTexture, targetSize)
    {
        return this._CreateSharedConsumerCopyPass(sharedTexture, targetSize, true);
    }

    async _CreateSharedConsumerCopyPass(sharedTexture, targetSize, copyAlpha)
    {
        const Effect = RequireClass(tw2, "Tw2Effect");
        const effect = Effect.from({
            effectFilePath: COPY_BLIT_SHADER,
            autoParameter: true,
            parameters: {
                SourceUVs: [ 0, 0, 1, 1 ],
                TextureReverseUV: [ 0, 0, 1, 1 ],
                AlphaMultiplier: [ 1, 0, 0, 0 ]
            }
        });
        const parameter = effect?.parameters?.Texture;
        if (typeof parameter?.AttachTextureRes !== "function")
        {
            throw new Error("Shared RGB copy shader has no Texture parameter");
        }
        parameter.AttachTextureRes(sharedTexture);

        await PrepareEffect(tw2, effect, COPY_BLIT_SHADER);
        if (copyAlpha)
        {
            ApplyRenderStates(this._d3d, effect, false);
        }
        else
        {
            ApplyConfiguredConsumerRenderStates(
                this._d3d,
                effect,
                this._configuredPasses.shared
            );
        }
        return {
            effect,
            viewport: [ 0, 0, targetSize[0], targetSize[1] ],
            report: {
                mode: copyAlpha ? "configured-shared-rgba" : "configured-shared-rgb",
                shader: COPY_BLIT_SHADER,
                placement: [ 0, 0, 1, 1 ]
            }
        };
    }

    async _ReadMetadata(path)
    {
        if (!this._metadata.has(path))
        {
            this._metadata.set(path, this._FetchMetadata(path).catch(error =>
            {
                this._metadata.delete(path);
                throw error;
            }));
        }
        return this._metadata.get(path);
    }

    async _FetchMetadata(path)
    {
        const identity = NormalizeTextureMetadataIdentity(path);
        const retained = this._textureMetadataSource?.Get(
            "characterTextureMetadata",
            identity
        );
        if (retained)
        {
            return ReadLibraryAtlasMetadata(retained, identity);
        }

        const metadataPath = `${identity}.png`;
        const url = tw2.resMan.BuildUrl(metadataPath);
        const metadata = parsePngAtlasMetadata(
            await tw2.resMan.FetchRaw(url, "arraybuffer")
        );
        if (!metadata)
        {
            throw new Error(`Texture has no readable PNG atlas metadata: ${metadataPath}`);
        }
        metadata.source = "png-bytes";
        metadata.sourcePath = metadataPath;
        return metadata;
    }
}

function SortLegacyCompositionOperations(operations, orderRule)
{
    operations.sort((a, b) =>
        (a.layerOrder ?? Number.MAX_SAFE_INTEGER)
        - (b.layerOrder ?? Number.MAX_SAFE_INTEGER)
        || (a.compositionIndex ?? Number.MAX_SAFE_INTEGER)
        - (b.compositionIndex ?? Number.MAX_SAFE_INTEGER));
    operations.forEach((operation, compositionIndex) =>
    {
        operation.compositionIndex = compositionIndex;
        operation.orderRule = orderRule;
    });
}

/** Resolves one retained contribution for the bounded legacy body-diffuse proof. */
export function resolveLegacyBodyDiffuseContribution(contribution)
{
    const targetsBody = contribution?.selectedTextures?.some(value =>
        value?.target === "body");
    if (!targetsBody)
    {
        return { status: "deferred", reason: "body-target-unavailable" };
    }
    const detail = contribution?.selectedTextures?.find(value =>
        value.target === "body" && value.role === "colorize-layer");
    const zones = contribution?.selectedTextures?.find(value =>
        value.target === "body" && value.role === "colorize-zones");
    const colors = NormalizeColors(contribution?.materialValues?.colors);

    if (!detail)
    {
        return { status: "deferred", reason: "body-colorize-layer-unresolved" };
    }
    if (!zones)
    {
        return { status: "deferred", reason: "body-colorize-zones-unresolved" };
    }
    if (!colors)
    {
        return { status: "deferred", reason: "material-colors-unresolved" };
    }
    const pattern = ResolvePattern(contribution.materialValues);
    if (pattern?.status === "deferred")
    {
        return pattern;
    }

    return {
        status: "ready",
        candidate: {
            contribution,
            detail,
            zones,
            colors,
            ...(pattern ? { pattern } : {})
        }
    };
}

/** Resolves the exact retained direct-lighting maps for one garment surface. */
export function resolveLegacyGarmentMaterialChannels(contribution)
{
    const selected = contribution?.selectedTextures ?? [];
    const normals = selected.filter(value =>
        value?.target === "body"
        && [ "normal-source", "normal-overlay" ].includes(value?.role));
    const specular = selected.filter(value =>
        value?.target === "body"
        && [ "specular-source", "specular-overlay" ].includes(value?.role));

    if (normals.length !== 1)
    {
        return {
            status: "deferred",
            reason: normals.length
                ? "garment-normal-map-ambiguous"
                : "garment-normal-map-unresolved",
            normalCandidates: normals.map(value => value.path),
            specularCandidates: specular.map(value => value.path)
        };
    }
    if (specular.length !== 1)
    {
        return {
            status: "deferred",
            reason: specular.length
                ? "garment-specular-map-ambiguous"
                : "garment-specular-map-unresolved",
            normalCandidates: normals.map(value => value.path),
            specularCandidates: specular.map(value => value.path)
        };
    }

    return {
        status: "ready",
        rule: "legacy-opengl-retained-garment-lighting-v1",
        correctness: "retained-source-policy",
        normalPath: normals[0].path,
        specularPath: specular[0].path
    };
}

/** Plans only source-alpha head overlays whose channel role is explicit. */
export function resolveLegacyHeadMaterialChannels(contributions, source = null)
{
    if (!Array.isArray(contributions))
    {
        throw new TypeError("Legacy head material contributions must be an array");
    }

    const result = {
        diffuse: [],
        normal: [],
        specular: [],
        deferred: [],
        order: {
            status: "experimental-policy",
            rule: "experimental-head-composition-order-v1",
            source: "operator-ordering-hypothesis",
            layers: [
                { groupID: "base-skin-colours", order: HEAD_BASE_SKIN_ORDER },
                ...[ ...HEAD_COMPOSITION_GROUP_ORDER ].map(([ groupID, order ]) => ({
                    groupID,
                    order
                }))
            ]
        }
    };
    const orderedContributions = contributions
        .map((contribution, sourceIndex) => ({ contribution, sourceIndex }))
        .sort((a, b) =>
        {
            const rankA = HEAD_COMPOSITION_GROUP_ORDER.get(a.contribution?.groupID);
            const rankB = HEAD_COMPOSITION_GROUP_ORDER.get(b.contribution?.groupID);
            return (rankA ?? Number.MAX_SAFE_INTEGER)
                - (rankB ?? Number.MAX_SAFE_INTEGER)
                || a.sourceIndex - b.sourceIndex;
        });
    for (const { contribution } of orderedContributions)
    {
        const separateFaceCard = String(
            contribution?.source?.partSourceRecordID ?? ""
        ).includes("/makeup/eyelashes/");
        const currentProof = PROVED_HEAD_SKIN_MAKEUP_GROUPS.has(
            contribution?.groupID
        ) && !separateFaceCard;
        const selected = contribution?.selectedTextures ?? [];
        if (contribution?.groupID === "tattoo/head")
        {
            const tattoo = ResolveLegacyHeadTattooProjection(contribution, source);
            if (tattoo.status === "ready") result.diffuse.push(tattoo.operation);
            else result.deferred.push({
                ...tattoo.operation,
                layerIndex: contribution.layerIndex,
                groupID: contribution.groupID,
                reason: tattoo.reason
            });
            continue;
        }
        const hasColorizedInputs = selected.some(value => value?.target === "head"
            && [ "colorize-layer", "colorize-zones" ].includes(value?.role));
        if (currentProof && hasColorizedInputs)
        {
            const resolved = ResolveLegacyHeadColorizedContribution(contribution);
            if (resolved.status === "ready")
            {
                result.diffuse.push({
                    path: resolved.candidate.detail.path,
                    op: "colorize",
                    role: resolved.candidate.detail.role,
                    groupID: contribution.groupID,
                    layerOrder: HEAD_COMPOSITION_GROUP_ORDER.get(contribution.groupID),
                    layerIndex: contribution.layerIndex,
                    candidate: resolved.candidate
                });
            }
            else
            {
                result.deferred.push({
                    layerIndex: contribution.layerIndex,
                    groupID: contribution.groupID,
                    reason: resolved.reason
                });
            }
        }
        for (const texture of selected.filter(value => value?.target === "head"))
        {
            const operation = {
                path: texture.path,
                candidatePaths: ResolveFamilyCandidatePaths(contribution, texture),
                role: texture.role,
                target: texture.target,
                groupID: contribution.groupID,
                materialControls: DescribeRetainedMaterialControls(contribution),
                layerOrder: HEAD_COMPOSITION_GROUP_ORDER.get(contribution.groupID) ?? null,
                layerIndex: contribution.layerIndex,
                weight: Number.isFinite(contribution?.weight) ? contribution.weight : 1,
                partSourceRecordID: contribution.source?.partSourceRecordID ?? null
            };
            if (currentProof
                && [ "colorize-layer", "colorize-zones" ].includes(texture.role)) continue;
            if (currentProof && texture.role === "diffuse-overlay")
            {
                result.diffuse.push({ ...operation, op: "alpha-overlay" });
            }
            else if (currentProof && texture.role === "normal-overlay")
            {
                result.normal.push({ ...operation, op: "normal-replace" });
            }
            else if (currentProof && texture.role === "specular-overlay")
            {
                result.specular.push({ ...operation, op: "alpha-overlay" });
            }
            else if (currentProof && texture.role === "twist-normal")
            {
                result.normal.push({ ...operation, op: "normal-add" });
            }
            else
            {
                let reason = "head-contribution-outside-current-proof";
                if (separateFaceCard)
                {
                    reason = "head-separate-face-card-contribution";
                }
                else if (currentProof
                    && [ "colorize-layer", "colorize-zones" ].includes(texture.role))
                {
                    reason = "head-color-selection-unresolved";
                }
                result.deferred.push({ ...operation, reason });
            }
        }
    }
    for (const operations of [ result.diffuse, result.normal, result.specular ])
    {
        operations.forEach((operation, compositionIndex) =>
        {
            operation.compositionIndex = compositionIndex;
            operation.orderRule = result.order.rule;
        });
    }
    result.targets = [
        { output: "diffuse", passes: result.diffuse },
        { output: "normal", passes: result.normal },
        { output: "specular", passes: result.specular }
    ];
    return result;
}

/** Plans retained body normal/specular makeup channels without inventing absent maps. */
export function resolveLegacyBodyMaterialChannels(contributions)
{
    if (!Array.isArray(contributions))
    {
        throw new TypeError("Legacy body material contributions must be an array");
    }
    const result = { normal: [], specular: [], deferred: [] };
    const ordered = contributions
        .map((contribution, sourceIndex) => ({ contribution, sourceIndex }))
        .sort((a, b) =>
        {
            const rankA = HEAD_COMPOSITION_GROUP_ORDER.get(a.contribution?.groupID);
            const rankB = HEAD_COMPOSITION_GROUP_ORDER.get(b.contribution?.groupID);
            return (rankA ?? Number.MAX_SAFE_INTEGER)
                - (rankB ?? Number.MAX_SAFE_INTEGER)
                || a.sourceIndex - b.sourceIndex;
        });

    for (const { contribution } of ordered)
    {
        const currentProof = PROVED_BODY_SKIN_MAKEUP_GROUPS.has(contribution?.groupID);
        for (const texture of (contribution?.selectedTextures ?? []).filter(value =>
            value?.target === "body"
            && [ "normal-overlay", "twist-normal", "specular-overlay" ].includes(value?.role)))
        {
            const operation = {
                path: texture.path,
                candidatePaths: ResolveFamilyCandidatePaths(contribution, texture),
                role: texture.role,
                target: texture.target,
                groupID: contribution.groupID,
                materialControls: DescribeRetainedMaterialControls(contribution),
                layerOrder: HEAD_COMPOSITION_GROUP_ORDER.get(contribution.groupID) ?? null,
                layerIndex: contribution.layerIndex,
                weight: Number.isFinite(contribution?.weight) ? contribution.weight : 1,
                partSourceRecordID: contribution.source?.partSourceRecordID ?? null
            };
            if (!currentProof)
            {
                result.deferred.push({
                    ...operation,
                    reason: "body-lighting-contribution-outside-current-proof"
                });
            }
            else if (texture.role === "twist-normal")
            {
                result.normal.push({ ...operation, op: "normal-add" });
            }
            else if (texture.role === "normal-overlay")
            {
                if (contribution?.groupID === "makeup/bodyaugmentations")
                {
                    result.deferred.push({
                        ...operation,
                        reason: "body-normal-replacement-unproved"
                    });
                }
                else result.normal.push({ ...operation, op: "normal-replace" });
            }
            else
            {
                result.specular.push({ ...operation, op: "alpha-overlay" });
            }
        }
    }
    for (const operations of [ result.normal, result.specular ])
    {
        operations.forEach((operation, compositionIndex) =>
        {
            operation.compositionIndex = compositionIndex;
            operation.orderRule = "experimental-head-composition-order-v1";
        });
    }
    return result;
}

function ResolveLegacyHeadTattooProjection(contribution, source)
{
    const sourceID = String(contribution?.source?.partSourceRecordID ?? "");
    const match = /^(female|male)\/tattoo\/head\/([^/]+)$/iu.exec(sourceID);
    if (!match) return { status: "deferred", reason: "head-tattoo-source-unresolved" };
    const definitionPath = `res:/graphics/character/${match[1].toLowerCase()}`
        + `/paperdoll/tattoo/head/${match[2].toLowerCase()}/projection.proj`;
    const projection = source?.Get?.("characterDefinitions", definitionPath)?.values;
    if (projection?.headEnabled !== true
        || typeof projection?.texturePath !== "string"
        || !/^res:\/.+\.dds$/iu.test(projection.texturePath))
    {
        return { status: "deferred", reason: "head-tattoo-projection-unresolved" };
    }
    const colors = NormalizeColors(contribution?.materialValues?.colors);
    if (!colors) return { status: "deferred", reason: "head-tattoo-color-unresolved" };
    const operation = {
        path: projection.texturePath,
        candidatePaths: [ projection.texturePath ],
        // Shipped head-tattoo textures are already authored in the complete
        // head-atlas layout. Keep the projection definition as provenance,
        // but do not apply its mesh projection a second time in this adapter.
        op: "authored-head-tattoo-atlas",
        role: "projection-decal",
        groupID: contribution.groupID,
        layerOrder: HEAD_COMPOSITION_GROUP_ORDER.get(contribution.groupID),
        layerIndex: contribution.layerIndex,
        weight: Number.isFinite(contribution?.weight) ? contribution.weight : 1,
        projectionDefinitionPath: definitionPath,
        projection: { ...projection },
        colors
    };
    if (Number(projection.mode) !== 1)
    {
        return {
            status: "deferred",
            reason: "head-tattoo-projection-mode-unproved",
            operation
        };
    }
    return {
        status: "ready",
        operation
    };
}

function NormalizeTattooProjection(value)
{
    const read = (camel, lower = camel.toLowerCase(), fallback = 0) =>
    {
        const number = Number(value?.[camel] ?? value?.[lower]);
        return Number.isFinite(number) ? number : fallback;
    };
    const bool = (camel, lower = camel.toLowerCase()) =>
        value?.[camel] === true || value?.[lower] === true;
    const position = Array.isArray(value?.position)
        ? value.position.slice(0, 3).map(Number)
        : [ read("posX", "posx"), read("posY", "posy"), read("posZ", "posz") ];
    const offset = Array.isArray(value?.offset)
        ? value.offset.slice(0, 2).map(Number)
        : [ read("offsetX", "offsetx"), read("offsetY", "offsety") ];
    if (position.length !== 3 || !position.every(Number.isFinite)
        || offset.length !== 2 || !offset.every(Number.isFinite))
    {
        throw new TypeError("Head tattoo projection position/offset is invalid");
    }
    const maskPath = String(value?.maskPath ?? value?.maskpath ?? "");
    const maskPathEnabled = bool("maskPathEnabled", "maskpathenabled");
    if (maskPathEnabled && !/^res:\/.+\.dds$/iu.test(maskPath))
    {
        throw new TypeError("Head tattoo projection mask path is invalid");
    }
    return {
        mode: read("mode", "mode", -1),
        position,
        offset,
        scale: read("scale"),
        angleRotation: read("angleRotation", "anglerotation"),
        flipX: bool("flipX", "flipx"),
        flipY: bool("flipY", "flipy"),
        radius: read("radius"),
        height: read("height"),
        yaw: read("yaw"),
        pitch: read("pitch"),
        roll: read("roll"),
        aspectRatio: read("aspectRatio", "aspectratio", 1),
        maskPathEnabled,
        maskPath
    };
}

function FindProjectedHeadTattooCarrier(binding)
{
    for (const resolved of binding?.resolvedMeshBindings ?? [])
    {
        if (resolved?.meshIndex !== 0
            || resolved?.meshName !== "meshShape"
            || resolved?.geometryMeshName !== "meshShape") continue;
        const mesh = resolved.mesh;
        const areas = [];
        for (const key of [
            "opaqueAreas", "decalAreas", "transparentAreas", "additiveAreas"
        ])
        {
            for (const area of mesh?.[key] ?? [])
            {
                if (area?.effect?.name === "C_Skin_blinn1"
                    && BoundsEqual(ReadTransformUV0(area.effect), [ 0.5, 0, 1, 0.5 ]))
                {
                    areas.push(area);
                }
            }
        }
        if (areas.length)
        {
            return {
                mesh,
                meshName: resolved.meshName,
                geometry: resolved.geometry ?? mesh.geometryResource,
                transformUV0: ReadTransformUV0(areas[0].effect),
                areas
            };
        }
    }
    return null;
}

function ResolveLegacyHeadColorizedContribution(contribution)
{
    const detail = contribution?.selectedTextures?.find(value =>
        value?.target === "head" && value?.role === "colorize-layer");
    const zones = contribution?.selectedTextures?.find(value =>
        value?.target === "head" && value?.role === "colorize-zones");
    const colors = NormalizeColors(contribution?.materialValues?.colors);
    if (!colors) return { status: "deferred", reason: "head-color-selection-unresolved" };
    if (!detail) return { status: "deferred", reason: "head-colorize-layer-unresolved" };
    if (!zones) return { status: "deferred", reason: "head-colorize-zones-unresolved" };
    return {
        status: "ready",
        candidate: { contribution, detail, zones, colors, pattern: null }
    };
}

function ResolveSkinColorizationCandidate(staged, region)
{
    const bindings = (staged?.configuredFoundations ?? [])
        .filter(value => value?.role === "head")
        .map(value => value?.skinTextureBindings?.colorization)
        .filter(Boolean);
    if (bindings.length !== 1) return null;
    const value = bindings[0];
    const detailPath = value[`${region}DetailPath`];
    const zonePath = value[`${region}ZonePath`];
    if (!detailPath || !zonePath || !Array.isArray(value.colors)) return null;
    return {
        contribution: {
            layerIndex: HEAD_BASE_SKIN_ORDER,
            groupID: "base-skin-colours",
            weight: 1,
            source: { materialDefinitionPath: value.materialDefinitionPath ?? null }
        },
        detail: { path: detailPath },
        zones: { path: zonePath },
        colors: value.colors.map(color => [ ...color ]),
        pattern: null
    };
}

/** Binds full-atlas eyes and one retained colorized lash atlas to exact face carriers. */
export function applyLegacyConfiguredFaceTextures(
    binding,
    contributions,
    {
        headDiffuseTexture = null,
        eyelashTexture = null,
        eyelashSourcePath = null
    } = {}
)
{
    const result = {
        status: "deferred",
        rule: "legacy-opengl-configured-face-textures-v1",
        correctness: "retained-source-policy",
        eyes: { status: "deferred", reason: "eye-texture-unresolved" },
        eyelashes: { status: "deferred", reason: "eyelash-texture-unresolved" }
    };
    const eyePath = ResolveConfiguredFaceTexturePath(contributions, "eyes");
    const eyelashPath = ResolveConfiguredFaceTexturePath(contributions, "eyelashes")
        ?? eyelashSourcePath;
    const eyelashSpecularPath = ResolveConfiguredFaceTexturePath(
        contributions,
        "eyelashes",
        "specular-overlay"
    );
    let appliedEffects = 0;

    for (const value of binding?.resolvedMeshBindings ?? [])
    {
        const meshName = String(value?.meshName ?? "");
        for (const effect of GetEffects([ value?.mesh ]))
        {
            const effectName = String(effect?.name ?? "");
            if (eyePath && headDiffuseTexture
                && /^Eyeball_(?:Right|Left)_GeoShape$/iu.test(meshName)
                && /^C_Eyes$/iu.test(effectName))
            {
                SetConfiguredFaceDiffuse(effect, headDiffuseTexture, {
                    transform: [ 0, 0, 1, 1 ]
                });
                result.eyes = {
                    status: "applied",
                    sourcePath: eyePath,
                    binding: "composed-head-diffuse"
                };
                appliedEffects++;
            }
            else if (eyelashPath && eyelashTexture
                && /^(?:Eyelashes|EyeShadow)_GeoShape$/iu.test(meshName)
                && /eyelashes/iu.test(effectName))
            {
                const isEyeShadow = /^EyeShadow_GeoShape$/iu.test(meshName);
                SetConfiguredFaceDiffuse(effect, eyelashTexture, isEyeShadow
                    ? { preserveTransform: true }
                    : { transform: [ 0, 0, 1, 1 ] });
                if (eyelashSpecularPath)
                {
                    SetConfiguredFaceTexturePath(
                        effect,
                        "SpecularMap",
                        eyelashSpecularPath
                    );
                }
                const carrier = DescribeConfiguredFaceCarrier(
                    value.mesh,
                    effect,
                    meshName
                );
                const carriers = result.eyelashes.carriers ?? [];
                carriers.push(carrier);
                result.eyelashes = {
                    status: "applied",
                    sourcePath: eyelashPath,
                    specularPath: eyelashSpecularPath,
                    binding: "colorized-transparent-head-atlas",
                    transform: "carrier-specific",
                    carriers
                };
                appliedEffects++;
            }
        }
    }

    result.appliedEffects = appliedEffects;
    if (appliedEffects) result.status = "applied";
    return result;
}

/** Resolves eyebrow colour from the selected appearance preset, then its sibling fallback. */
export function resolveLegacyDefaultBrowCandidate(
    contributions,
    source,
    presetDefinitionPath = null
)
{
    const brows = (contributions ?? []).filter(value =>
        value?.groupID === "makeup/eyebrows");
    const preset = ResolveLegacyPresetMaterial(
        source,
        presetDefinitionPath,
        "makeup/eyebrows"
    );
    if (preset)
    {
        return ResolveLegacyExactDefaultColorCandidate(brows, source, {
            label: "eyebrow",
            identity: /^(?:female|male)\/makeup\/eyebrows\/[^/]+$/iu,
            rule: "legacy-opengl-selected-preset-eyebrow-color-v1",
            correctness: "retained-preset",
            material: preset
        });
    }
    return ResolveLegacyExactDefaultColorCandidate(brows, source, {
        label: "eyebrow",
        identity: /^(?:female|male)\/makeup\/eyebrows\/[^/]+$/iu,
        rule: "legacy-opengl-explicit-eyebrow-default-color-fallback-v1"
    });
}

/** Resolves the authored eyelash default beside its exact retained source. */
export function resolveLegacyDefaultEyelashCandidate(contributions, source, sex = null)
{
    let eyelashes = (contributions ?? []).filter(value =>
        /^(?:female|male)\/makeup\/eyelashes\/[^/]+$/iu.test(
            String(value?.source?.partSourceRecordID ?? "")
        ));
    let rule = "legacy-opengl-explicit-eyelash-default-color-v1";
    let correctness = "authored-presentation-fallback";
    let material = null;
    if (!eyelashes.length && /^(?:female|male)$/u.test(String(sex ?? "")))
    {
        const fallback = ResolveLegacyReferenceEyelashContribution(source, sex);
        if (fallback.status !== "ready") return fallback;
        eyelashes = [ fallback.contribution ];
        rule = "legacy-opengl-sex-default-eyelash-01-v1";
        correctness = "reference-fallback";
        material = {
            definitionPath: null,
            colors: Array.from({ length: 3 }, () => [ 0, 0, 0, 1 ])
        };
    }
    return ResolveLegacyExactDefaultColorCandidate(eyelashes, source, {
        label: "eyelash",
        identity: /^(?:female|male)\/makeup\/eyelashes\/[^/]+$/iu,
        rule,
        correctness,
        material
    });
}

function ResolveLegacyReferenceEyelashContribution(source, sex)
{
    const sourceID = `${sex}/makeup/eyelashes/eyelashes_01`;
    const partSource = source?.Get?.("characterPartSources", sourceID);
    const texturePaths = (partSource?.versions ?? [])
        .flatMap(value => value?.textureCandidates ?? [])
        .filter((value, index, all) => typeof value === "string"
            && all.indexOf(value) === index);
    const textureCandidates = texturePaths
        .map(ClassifyLegacyReferenceEyelashTexture)
        .filter(Boolean);
    const selectedTextures = [ "colorize-layer", "colorize-zones" ]
        .map(role => SelectLegacyReferenceTexture(textureCandidates, role))
        .filter(Boolean)
        .map(value => ({
            path: value.path,
            role: value.role,
            target: value.target,
            quality: value.quality
        }));
    if (selectedTextures.length !== 2)
    {
        return {
            status: "deferred",
            reason: "eyelash-reference-colorize-inputs-unresolved",
            sourceID
        };
    }
    return {
        status: "ready",
        contribution: {
            layerIndex: null,
            groupID: "makeup/eyelashes",
            weight: 1,
            source: { partSourceRecordID: sourceID },
            textureCandidates,
            selectedTextures
        }
    };
}

function ClassifyLegacyReferenceEyelashTexture(path)
{
    const exactPath = String(path ?? "");
    const stem = exactPath.replaceAll("\\", "/").split("/").at(-1)
        ?.replace(/\.[^.]+$/u, "").toLowerCase();
    const match = stem?.match(/^colorize_head_([lz])(?:_(4k|512|256))?$/u);
    if (!match) return null;
    return {
        path: exactPath,
        family: `colorize_head_${match[1]}`,
        quality: match[2] ?? "standard",
        role: match[1] === "l" ? "colorize-layer" : "colorize-zones",
        target: "head",
        recognized: true,
        selected: false
    };
}

function SelectLegacyReferenceTexture(candidates, role)
{
    const scores = { "4k": 4, standard: 3, "512": 2, "256": 1 };
    const selected = candidates
        .filter(value => value.role === role)
        .sort((a, b) => scores[b.quality] - scores[a.quality])[0] ?? null;
    if (selected) selected.selected = true;
    return selected;
}

function ResolveLegacyExactDefaultColorCandidate(
    contributions,
    source,
    { label, identity, rule, correctness = "authored-presentation-fallback", material = null }
)
{
    if (!contributions.length) return { status: "not-present" };
    if (contributions.length !== 1)
    {
        return { status: "deferred", reason: `${label}-contribution-ambiguous` };
    }

    const contribution = contributions[0];
    const detail = contribution.selectedTextures?.filter(value =>
        value?.target === "head" && value?.role === "colorize-layer") ?? [];
    const zoneCandidates = (contribution.textureCandidates ?? []).filter(value =>
        value?.recognized
        && value?.target === "head"
        && value?.role === "colorize-zones");
    const zones = zoneCandidates
        .map(value => ({
            value,
            metadata: source?.Get?.(
                "characterTextureMetadata",
                String(value.path).replace(/\.[^/.]+$/u, "")
            )
        }))
        .filter(value => Number.isFinite(value.metadata?.width)
            && Number.isFinite(value.metadata?.height))
        .sort((a, b) => (b.metadata.width * b.metadata.height)
            - (a.metadata.width * a.metadata.height));
    if (detail.length !== 1 || !zones.length)
    {
        return { status: "deferred", reason: `${label}-colorize-inputs-unresolved` };
    }

    const sourceID = String(contribution.source?.partSourceRecordID ?? "");
    if (!identity.test(sourceID))
    {
        return { status: "deferred", reason: `${label}-source-identity-unresolved` };
    }
    const separator = sourceID.indexOf("/");
    const hasProvidedMaterial = Array.isArray(material?.colors);
    const materialDefinitionPath = hasProvidedMaterial
        ? material.definitionPath
        : (`res:/graphics/character/${sourceID.slice(0, separator)}`
            + `/paperdoll/${sourceID.slice(separator + 1)}/default.color`);
    const definition = hasProvidedMaterial
        ? material
        : source?.Get?.("characterDefinitions", materialDefinitionPath);
    const colors = material?.colors ?? definition?.values?.colors;
    if (!Array.isArray(colors) || colors.length < 3
        || colors.slice(0, 3).some(color => !Array.isArray(color)
            || color.length < 4
            || color.slice(0, 4).some(value => !Number.isFinite(Number(value)))))
    {
        return { status: "deferred", reason: `${label}-default-color-unresolved` };
    }

    const candidateContribution = {
        ...contribution,
        source: { ...contribution.source, materialDefinitionPath }
    };
    return {
        status: "ready",
        rule,
        correctness,
        materialDefinitionPath,
        operation: {
            path: detail[0].path,
            role: detail[0].role,
            groupID: contribution.groupID,
            layerOrder: HEAD_COMPOSITION_GROUP_ORDER.get(contribution.groupID) ?? null,
            layerIndex: contribution.layerIndex,
            candidate: {
                contribution: candidateContribution,
                detail: detail[0],
                zones: zones[0].value,
                colors: colors.slice(0, 3).map(color => color.slice(0, 4).map(Number)),
                pattern: null
            }
        }
    };
}

function ResolveLegacyPresetMaterial(source, definitionPath, groupID)
{
    if (!/^res:\/.+\.prs$/iu.test(String(definitionPath ?? ""))) return null;
    const definition = source?.Get?.("characterDefinitions", definitionPath);
    const entries = (definition?.values ?? []).filter(value =>
        value?.category === "makeup"
        && String(value?.path ?? "").toLowerCase().startsWith(`${groupID}/`));
    if (entries.length !== 1) return null;
    const colors = ParseRetainedPresetColors(entries[0].colors);
    if (!colors) return null;
    return {
        definitionPath,
        partPath: entries[0].path,
        weight: entries[0].weight,
        colors
    };
}

function ParseRetainedPresetColors(value)
{
    if (typeof value !== "string") return null;
    let parsed;
    try
    {
        parsed = JSON.parse(value.replace(/\(/gu, "[").replace(/\)/gu, "]"));
    }
    catch
    {
        return null;
    }
    return Array.isArray(parsed) && parsed.length >= 3
        && parsed.slice(0, 3).every(color => Array.isArray(color)
            && color.length >= 4
            && color.slice(0, 4).every(Number.isFinite))
        ? parsed.slice(0, 3).map(color => color.slice(0, 4))
        : null;
}

function RemoveResolvedHeadColorizedDeferrals(plan, operation)
{
    const sourceID = operation?.candidate?.contribution?.source?.partSourceRecordID;
    plan.deferred = plan.deferred.filter(value =>
        value.partSourceRecordID !== sourceID
        || ![ "colorize-layer", "colorize-zones" ].includes(value.role));
}

function ResolveConfiguredFaceTexturePath(
    contributions,
    role,
    textureRole = "colorize-layer"
)
{
    const matches = [];
    for (const contribution of contributions ?? [])
    {
        const sourceID = String(contribution?.source?.partSourceRecordID ?? "");
        const relevant = role === "eyes"
            ? contribution?.groupID === "makeup/eyes"
            : /\/makeup\/eyelashes\//iu.test(`/${sourceID}`);
        if (!relevant) continue;
        for (const texture of contribution?.selectedTextures ?? [])
        {
            if (texture?.target !== "head" || texture?.role !== textureRole) continue;
            if (!matches.includes(texture.path)) matches.push(texture.path);
        }
    }
    return matches.length === 1 ? matches[0] : null;
}

function SetConfiguredFaceDiffuse(
    effect,
    resource,
    { color = null, transform = null, preserveTransform = false } = {}
)
{
    if (typeof resource === "string") SetConfiguredFaceTexturePath(effect, "DiffuseMap", resource);
    else
    {
        effect?.parameters?.DiffuseMap?.AttachTextureRes?.(resource);
    }
    if (!preserveTransform)
    {
        effect?.SetParameters?.({ TransformUV0: transform ?? [ 0, 0, 1, 1 ] });
    }
    if (Array.isArray(color) && color.length === 4 && color.every(Number.isFinite))
    {
        effect?.SetParameters?.({ MaterialDiffuseColor: color });
    }
}

function SetConfiguredFaceTexturePath(effect, name, resourcePath)
{
    const parameter = effect?.parameters?.[name];
    if (parameter?.isAttached) parameter.AttachTextureRes?.(null);
    if (effect?.SetTextures) effect.SetTextures({ [name]: resourcePath });
    else parameter?.SetValue?.(resourcePath);
}

function DescribeConfiguredFaceCarrier(mesh, effect, meshName = "")
{
    const fields = [
        "opaqueAreas", "transparentAreas", "additiveAreas", "decalAreas",
        "depthAreas", "depthNormalAreas", "distortionAreas", "pickableAreas"
    ];
    const areas = [];
    for (const field of fields)
    {
        for (const area of mesh?.[field] ?? [])
        {
            if (area?.effect !== effect) continue;
            areas.push({
                field,
                name: String(area.name ?? ""),
                display: area.display !== false,
                reversed: area.reversed === true
            });
        }
    }
    const techniques = [];
    for (const technique of Object.keys(effect?.techniques ?? {}))
    {
        const passCount = effect.GetPassCount?.(technique) ?? 0;
        for (let pass = 0; pass < passCount; pass++)
        {
            techniques.push({
                technique,
                pass,
                overrides: (effect.GetTechniquePassStateOverrides?.(technique, pass) ?? [])
                    .map(value => ({ state: value.state, value: value.value }))
            });
        }
    }
    return {
        meshName,
        effectName: String(effect?.name ?? ""),
        effectFilePath: String(effect?.effectFilePath ?? ""),
        materialDiffuseColor: ReadEffectVectorParameter(
            effect,
            "MaterialDiffuseColor",
            4
        ),
        transformUV0: ReadTransformUV0(effect),
        areas,
        techniques
    };
}

/** Maps authored atlas UVs into one retained cropped texture's local UVs. */
export function resolveLegacyCroppedTextureTransform(metadata)
{
    const placement = Placement(metadata);
    if (!metadata?.hasPlacementMetadata
        || placement.some(value => !Number.isFinite(value))
        || placement[2] <= 0
        || placement[3] <= 0)
    {
        throw new TypeError("Cropped texture transform requires retained placement metadata");
    }
    return [
        placement[0] === 0 ? 0 : -placement[0] / placement[2],
        placement[1] === 0 ? 0 : -placement[1] / placement[3],
        (1 - placement[0]) / placement[2],
        (1 - placement[1]) / placement[3]
    ];
}

function ResolveFamilyCandidatePaths(contribution, selected)
{
    const selectedRecord = contribution?.textureCandidates?.find(value =>
        value?.path === selected?.path);
    const family = selectedRecord?.family;
    const candidates = (contribution?.textureCandidates ?? [])
        .filter(value => value?.recognized
            && value?.target === selected?.target
            && value?.role === selected?.role
            && (!family || value?.family === family))
        .map(value => value.path);
    return [ selected.path, ...candidates ]
        .filter((value, index, all) => value && all.indexOf(value) === index);
}

/**
 * Orders the bounded body-diffuse proof without dropping mask-only sources.
 * A typed owner mask restores the foundation immediately before that owner's
 * first colorized contribution. Other mask semantics remain deferred.
 */
export function planLegacyBodyDiffuseOperations(
    contributions,
    { excludePartIndices = new Set() } = {}
)
{
    if (!Array.isArray(contributions))
    {
        throw new TypeError("Legacy body diffuse contributions must be an array");
    }
    if (!(excludePartIndices instanceof Set)
        || [ ...excludePartIndices ].some(value => !Number.isInteger(value)))
    {
        throw new TypeError("Legacy body diffuse excluded part indices must be an integer Set");
    }

    const authoredOccluded = contributions.filter(contribution =>
        Array.isArray(contribution?.occludedBy) && contribution.occludedBy.length);
    const excluded = contributions.filter(contribution =>
        excludePartIndices.has(contribution?.partIndex));
    const entries = contributions
        .filter(contribution => !excludePartIndices.has(contribution?.partIndex)
            && !authoredOccluded.includes(contribution))
        .map(contribution => ({
            contribution,
            resolved: resolveLegacyBodyDiffuseContribution(contribution),
            overlays: (contribution?.selectedTextures ?? []).filter(value =>
                value?.target === "body" && value?.role === "diffuse-overlay"),
            masks: (contribution?.selectedTextures ?? []).filter(value =>
                value?.target === "body" && value?.role === "cut-mask")
        }));
    const masksByOwner = new Map();

    for (const entry of entries)
    {
        const owner = entry.contribution?.ownerSelectionIndex;
        if (!entry.masks.length || !Number.isInteger(owner) || owner < 0) continue;
        if (!masksByOwner.has(owner)) masksByOwner.set(owner, []);
        for (const mask of entry.masks) masksByOwner.get(owner).push({ entry, mask });
    }

    const operations = [];
    const deferred = excluded.map(contribution => DeferredContribution(
        contribution,
        "configured-garment-material-owned-separately"
    ));
    deferred.push(...authoredOccluded.map(contribution => DeferredContribution(
        contribution,
        "authored-modifier-occluded"
    )));
    const consumedMasks = new Set();
    const restoredOwners = new Set();

    for (const entry of entries)
    {
        if (entry.resolved.status === "ready")
        {
            const owner = entry.contribution?.ownerSelectionIndex;
            if (Number.isInteger(owner) && owner >= 0 && !restoredOwners.has(owner))
            {
                for (const value of masksByOwner.get(owner) ?? [])
                {
                    // This exact mask owns the separate foundation CutMaskMap.
                    // Restoring nude diffuse here overwrites the already drawn
                    // PantsCF01Shape pixels at the boot cover with skin.
                    if (value.entry.contribution?.source?.partSourceRecordID
                            === FEMALE_BOOT_MASK_PART
                        && value.mask?.path === FEMALE_BOOT_MASK_PATH)
                    {
                        consumedMasks.add(value.entry);
                        deferred.push(DeferredContribution(
                            value.entry.contribution,
                            "foundation-cut-mask-owned-separately"
                        ));
                        continue;
                    }
                    operations.push({
                        operation: "restore-base",
                        contribution: value.entry.contribution,
                        mask: value.mask
                    });
                    consumedMasks.add(value.entry);
                }
                restoredOwners.add(owner);
            }

            operations.push({
                operation: "colorized",
                contribution: entry.contribution,
                candidate: entry.resolved.candidate
            });
        }

        for (const texture of entry.overlays)
        {
            operations.push({
                operation: "alpha-overlay",
                contribution: entry.contribution,
                texture
            });
        }

        const hasColorizeInput = (entry.contribution?.selectedTextures ?? []).some(value =>
            value?.target === "body"
            && (value?.role === "colorize-layer" || value?.role === "colorize-zones"));
        if (entry.resolved.status !== "ready"
            && (hasColorizeInput || (!entry.masks.length && !entry.overlays.length)))
        {
            deferred.push(DeferredContribution(entry.contribution, entry.resolved.reason));
        }
    }

    for (const entry of entries)
    {
        if (!entry.masks.length || consumedMasks.has(entry)) continue;
        const owner = entry.contribution?.ownerSelectionIndex;
        deferred.push(DeferredContribution(
            entry.contribution,
            Number.isInteger(owner) && owner >= 0
                ? "owner-body-colorized-contribution-unresolved"
                : "cut-mask-owner-unresolved"
        ));
    }

    return { operations, deferred };
}

/** Selects only source-backed masks owned by exact ready female garments. */
export function planLegacyFemaleFoundationCutMask(sex, configuredParts, contributions)
{
    if (sex !== "female")
    {
        return { status: "deferred", reason: "female-foundation-cut-not-applicable" };
    }
    if (!Array.isArray(configuredParts) || !Array.isArray(contributions))
    {
        throw new TypeError("Female foundation cut planning requires configured parts and contributions");
    }

    const masks = [];
    const boot = configuredParts.find(part => part?.partSourceRecordID === FEMALE_BOOT_PART);
    if (boot?.renderStatus === "ready")
    {
        const owner = FindExactContribution(contributions, boot, FEMALE_BOOT_PART);
        if (owner && Number.isInteger(owner.ownerSelectionIndex) && owner.ownerSelectionIndex >= 0)
        {
            const candidate = contributions.flatMap(contribution =>
            {
                if (contribution?.ownerSelectionIndex !== owner.ownerSelectionIndex
                    || contribution?.source?.partSourceRecordID !== FEMALE_BOOT_MASK_PART)
                {
                    return [];
                }
                return (contribution.selectedTextures ?? [])
                    .filter(texture => texture?.target === "body"
                        && texture?.role === "cut-mask"
                        && texture?.path === FEMALE_BOOT_MASK_PATH)
                    .map(texture => ({ contribution, texture }));
            });
            if (candidate.length === 1)
            {
                masks.push({
                    owner: "female-bootscf01",
                    ownerPartIndex: boot.partIndex,
                    ownerPartSourceRecordID: boot.partSourceRecordID,
                    ownerSelectionIndex: owner.ownerSelectionIndex,
                    maskLayerIndex: candidate[0].contribution.layerIndex,
                    maskPartSourceRecordID: candidate[0].contribution.source.partSourceRecordID,
                    maskPath: candidate[0].texture.path
                });
            }
        }
    }

    const fullLegGarments = configuredParts.flatMap(part =>
    {
        if (part?.groupID !== "bottomouter" || part?.renderStatus !== "ready") return [];
        const contribution = FindExactContribution(
            contributions,
            part,
            part.partSourceRecordID
        );
        const authoredOcclusions = new Set(
            (contribution?.source?.occludesModifiers ?? [])
                .map(value => String(value).toLowerCase())
        );
        const candidates = (contribution?.selectedTextures ?? []).filter(texture =>
            texture?.target === "body" && texture?.role === "colorize-layer");
        if (!authoredOcclusions.has("tattoo/leftleg")
            || !authoredOcclusions.has("tattoo/rightleg")
            || candidates.length !== 1)
        {
            return [];
        }
        return [ { part, contribution, texture: candidates[0] } ];
    });
    if (fullLegGarments.length === 1)
    {
        const { part, contribution, texture } = fullLegGarments[0];
        masks.push({
            owner: "female-authored-full-leg-garment",
            ownerPartIndex: part.partIndex,
            ownerPartSourceRecordID: part.partSourceRecordID,
            ownerSelectionIndex: contribution.ownerSelectionIndex,
            maskLayerIndex: contribution.layerIndex,
            maskPartSourceRecordID: contribution.source.partSourceRecordID,
            maskPath: texture.path
        });
    }

    if (!masks.length)
    {
        if (boot && boot.renderStatus !== "ready")
        {
            return { status: "deferred", reason: "exact-female-boot-not-render-ready" };
        }
        return { status: "deferred", reason: "exact-female-foundation-mask-unresolved" };
    }
    return { status: "ready", masks };
}

function FindExactContribution(contributions, part, partSourceRecordID)
{
    const candidates = contributions.filter(contribution =>
        contribution?.partIndex === part?.partIndex
        && contribution?.source?.partSourceRecordID === partSourceRecordID);
    return candidates.length === 1 ? candidates[0] : null;
}

/**
 * Qualifies only the exact female basic-tuck support proven by fixture 3000001.
 * The tuck and cut mask share an owner; the selected shirt is deliberately a
 * different owner because it supplies the visible coverage alpha.
 */
export function planLegacyExactFemaleTuckSupport(
    sex,
    visualModel,
    configuredParts,
    contributions
)
{
    if (sex !== "female")
    {
        return { status: "deferred", reason: "exact-female-tuck-not-applicable" };
    }
    if (!Array.isArray(configuredParts) || !Array.isArray(contributions))
    {
        throw new TypeError("Exact female tuck planning requires configured parts and contributions");
    }

    const tuckParts = configuredParts.filter(part =>
        part?.partSourceRecordID === FEMALE_TUCK_PART);
    if (tuckParts.length !== 1)
    {
        return { status: "deferred", reason: "exact-female-tuck-part-unresolved" };
    }
    const tuckPart = tuckParts[0];
    if (tuckPart.renderStatus !== "ready")
    {
        return { status: "deferred", reason: "exact-female-tuck-not-render-ready" };
    }

    const supportContributions = contributions.filter(contribution =>
        contribution?.partIndex === tuckPart.partIndex
        && contribution?.source?.partSourceRecordID === FEMALE_TUCK_PART);
    if (supportContributions.length !== 1
        || !Number.isInteger(supportContributions[0].ownerSelectionIndex)
        || supportContributions[0].ownerSelectionIndex < 0)
    {
        return { status: "deferred", reason: "exact-female-tuck-owner-unresolved" };
    }
    const support = supportContributions[0];

    const pantsContributions = contributions.filter(contribution =>
        contribution?.ownerSelectionIndex === support.ownerSelectionIndex
        && contribution?.groupID === "bottomouter"
        && contribution?.source?.partSourceRecordID === FEMALE_TUCK_PANTS_PART);
    if (pantsContributions.length !== 1)
    {
        return { status: "deferred", reason: "exact-female-tuck-pants-unresolved" };
    }
    const pantsResolved = resolveLegacyBodyDiffuseContribution(pantsContributions[0]);
    if (pantsResolved.status !== "ready")
    {
        return {
            status: "deferred",
            reason: `exact-female-tuck-pants-${pantsResolved.reason}`
        };
    }

    const masks = contributions.flatMap(contribution =>
    {
        if (contribution?.ownerSelectionIndex !== support.ownerSelectionIndex
            || contribution?.source?.partSourceRecordID !== FEMALE_TUCK_MASK_PART)
        {
            return [];
        }
        return (contribution.selectedTextures ?? [])
            .filter(texture => texture?.target === "body"
                && texture?.role === "cut-mask"
                && texture?.path === FEMALE_TUCK_MASK_PATH)
            .map(texture => ({ contribution, texture }));
    });
    if (masks.length !== 1)
    {
        return { status: "deferred", reason: "exact-female-tuck-mask-unresolved" };
    }

    const alphaSources = contributions.flatMap(contribution =>
    {
        if (contribution?.groupID !== "topmiddle"
            || !Number.isInteger(contribution?.ownerSelectionIndex)
            || contribution.ownerSelectionIndex < 0
            || contribution.ownerSelectionIndex === support.ownerSelectionIndex
            || contribution?.source?.partSourceRecordID !== FEMALE_TUCK_TOP_PART)
        {
            return [];
        }
        return (contribution.selectedTextures ?? [])
            .filter(texture => texture?.target === "body"
                && texture?.role === "colorize-layer"
                && texture?.path === FEMALE_TUCK_TOP_ALPHA_PATH)
            .map(texture => ({ contribution, texture }));
    });
    if (alphaSources.length !== 1)
    {
        return { status: "deferred", reason: "exact-female-tuck-alpha-unresolved" };
    }
    const topResolved = resolveLegacyBodyDiffuseContribution(alphaSources[0].contribution);
    if (topResolved.status !== "ready")
    {
        return {
            status: "deferred",
            reason: `exact-female-tuck-top-${topResolved.reason}`
        };
    }

    const meshes = (visualModel?.meshes ?? []).filter(mesh =>
        mesh?._characterPartIndex === tuckPart.partIndex);
    if (meshes.length !== 1)
    {
        return { status: "deferred", reason: "exact-female-tuck-mesh-unresolved" };
    }
    const effects = Unique(GetEffects(meshes).filter(effect =>
        effect?._characterProofFallback === true
        && typeof effect?.parameters?.DiffuseMap?.AttachTextureRes === "function"
        && typeof effect?.SetParameters === "function"
        && ReadTransformUV0(effect)));
    if (effects.length !== 1)
    {
        return { status: "deferred", reason: "exact-female-tuck-effect-unresolved" };
    }
    if ((visualModel?.meshes ?? []).some(mesh =>
        mesh !== meshes[0] && GetEffects([ mesh ]).includes(effects[0])))
    {
        return { status: "deferred", reason: "exact-female-tuck-effect-shared" };
    }

    return {
        status: "ready",
        tuckPartIndex: tuckPart.partIndex,
        tuckPartSourceRecordID: tuckPart.partSourceRecordID,
        supportOwnerSelectionIndex: support.ownerSelectionIndex,
        alphaLayerIndex: alphaSources[0].contribution.layerIndex,
        alphaPartSourceRecordID: alphaSources[0].contribution.source.partSourceRecordID,
        alphaPath: alphaSources[0].texture.path,
        topDetailPath: topResolved.candidate.detail.path,
        topZonePath: topResolved.candidate.zones.path,
        topMaterialDefinitionPath: alphaSources[0].contribution.source.materialDefinitionPath,
        topCandidate: topResolved.candidate,
        pantsLayerIndex: pantsContributions[0].layerIndex,
        pantsPartSourceRecordID: pantsContributions[0].source.partSourceRecordID,
        pantsDetailPath: pantsResolved.candidate.detail.path,
        pantsZonePath: pantsResolved.candidate.zones.path,
        pantsMaterialDefinitionPath: pantsContributions[0].source.materialDefinitionPath,
        pantsCandidate: pantsResolved.candidate,
        maskLayerIndex: masks[0].contribution.layerIndex,
        maskPartSourceRecordID: masks[0].contribution.source.partSourceRecordID,
        maskPath: masks[0].texture.path,
        previousSampleBounds: ReadTransformUV0(effects[0]),
        authoredSampleBounds: Array.isArray(effects[0]._characterAuthoredTransformUV0)
            ? [ ...effects[0]._characterAuthoredTransformUV0 ]
            : null,
        geometryBindings: DescribeConfiguredGarmentBindings(meshes, effects),
        effects
    };
}

/** Qualifies only paper doll 3000001's exact selected-top upper-sleeve tuple. */
export function planLegacyExactFemaleUpperSleeve(
    paperdollRecordID,
    sex,
    visualModel,
    configuredParts,
    contributions
)
{
    if (String(paperdollRecordID) !== "3000001" || sex !== "female")
    {
        return { status: "deferred", reason: "exact-upper-sleeve-not-applicable" };
    }
    if (!Array.isArray(configuredParts) || !Array.isArray(contributions))
    {
        throw new TypeError("Exact upper-sleeve planning requires configured parts and contributions");
    }

    const sleeveParts = configuredParts.filter(part =>
        part?.partSourceRecordID === FEMALE_UPPER_SLEEVE_PART);
    if (sleeveParts.length !== 1)
    {
        return { status: "deferred", reason: "exact-upper-sleeve-part-unresolved" };
    }
    const sleevePart = sleeveParts[0];
    if (sleevePart.renderStatus !== "ready")
    {
        return { status: "deferred", reason: "exact-upper-sleeve-not-render-ready" };
    }

    const sleeveContributions = contributions.filter(contribution =>
        contribution?.partIndex === sleevePart.partIndex
        && contribution?.groupID === "topmiddle"
        && contribution?.source?.partSourceRecordID === FEMALE_UPPER_SLEEVE_PART);
    if (sleeveContributions.length !== 1
        || !Number.isInteger(sleeveContributions[0].ownerSelectionIndex)
        || sleeveContributions[0].ownerSelectionIndex < 0)
    {
        return { status: "deferred", reason: "exact-upper-sleeve-owner-unresolved" };
    }
    const sleeve = sleeveContributions[0];

    const alphaSources = contributions.flatMap(contribution =>
    {
        if (contribution?.groupID !== "topmiddle"
            || contribution?.ownerSelectionIndex !== sleeve.ownerSelectionIndex
            || contribution?.source?.partSourceRecordID !== FEMALE_TUCK_TOP_PART)
        {
            return [];
        }
        return (contribution.selectedTextures ?? [])
            .filter(texture => texture?.target === "body"
                && texture?.role === "colorize-layer"
                && texture?.path === FEMALE_TUCK_TOP_ALPHA_PATH)
            .map(texture => ({ contribution, texture }));
    });
    if (alphaSources.length !== 1)
    {
        return { status: "deferred", reason: "exact-upper-sleeve-alpha-unresolved" };
    }

    const meshes = (visualModel?.meshes ?? []).filter(mesh =>
        mesh?._characterPartIndex === sleevePart.partIndex);
    if (meshes.length !== 1)
    {
        return { status: "deferred", reason: "exact-upper-sleeve-mesh-unresolved" };
    }
    const effects = Unique(GetEffects(meshes).filter(effect =>
        effect?._characterProofFallback === true
        && typeof effect?.parameters?.DiffuseMap?.AttachTextureRes === "function"
        && typeof effect?.SetParameters === "function"
        && ReadTransformUV0(effect)));
    if (effects.length !== 1)
    {
        return { status: "deferred", reason: "exact-upper-sleeve-effect-unresolved" };
    }
    if ((visualModel?.meshes ?? []).some(mesh =>
        mesh !== meshes[0] && GetEffects([ mesh ]).includes(effects[0])))
    {
        return { status: "deferred", reason: "exact-upper-sleeve-effect-shared" };
    }

    return {
        status: "ready",
        paperdollRecordID: "3000001",
        sleevePartIndex: sleevePart.partIndex,
        sleevePartSourceRecordID: sleevePart.partSourceRecordID,
        ownerSelectionIndex: sleeve.ownerSelectionIndex,
        alphaLayerIndex: alphaSources[0].contribution.layerIndex,
        alphaPartSourceRecordID: alphaSources[0].contribution.source.partSourceRecordID,
        alphaPath: alphaSources[0].texture.path,
        previousSampleBounds: ReadTransformUV0(effects[0]),
        effects
    };
}

/** Qualifies only paper doll 3000001's exact selected-top lower-sleeve tuple. */
export function planLegacyExactFemaleLowerSleeve(
    paperdollRecordID,
    sex,
    visualModel,
    configuredParts,
    contributions
)
{
    if (String(paperdollRecordID) !== "3000001" || sex !== "female")
    {
        return { status: "deferred", reason: "exact-lower-sleeve-not-applicable" };
    }
    if (!Array.isArray(configuredParts) || !Array.isArray(contributions))
    {
        throw new TypeError("Exact lower-sleeve planning requires configured parts and contributions");
    }

    const sleeveParts = configuredParts.filter(part =>
        part?.partSourceRecordID === FEMALE_LOWER_SLEEVE_PART);
    if (sleeveParts.length !== 1)
    {
        return { status: "deferred", reason: "exact-lower-sleeve-part-unresolved" };
    }
    const sleevePart = sleeveParts[0];
    if (sleevePart.renderStatus !== "ready")
    {
        return { status: "deferred", reason: "exact-lower-sleeve-not-render-ready" };
    }

    const sleeveContributions = contributions.filter(contribution =>
        contribution?.partIndex === sleevePart.partIndex
        && contribution?.groupID === "topmiddle"
        && contribution?.source?.partSourceRecordID === FEMALE_LOWER_SLEEVE_PART);
    if (sleeveContributions.length !== 1
        || !Number.isInteger(sleeveContributions[0].ownerSelectionIndex)
        || sleeveContributions[0].ownerSelectionIndex < 0)
    {
        return { status: "deferred", reason: "exact-lower-sleeve-owner-unresolved" };
    }
    const sleeve = sleeveContributions[0];

    const alphaSources = contributions.flatMap(contribution =>
    {
        if (contribution?.groupID !== "topmiddle"
            || contribution?.ownerSelectionIndex !== sleeve.ownerSelectionIndex
            || contribution?.source?.partSourceRecordID !== FEMALE_TUCK_TOP_PART)
        {
            return [];
        }
        return (contribution.selectedTextures ?? [])
            .filter(texture => texture?.target === "body"
                && texture?.role === "colorize-layer"
                && texture?.path === FEMALE_TUCK_TOP_ALPHA_PATH)
            .map(texture => ({ contribution, texture }));
    });
    if (alphaSources.length !== 1)
    {
        return { status: "deferred", reason: "exact-lower-sleeve-alpha-unresolved" };
    }

    const meshes = (visualModel?.meshes ?? []).filter(mesh =>
        mesh?._characterPartIndex === sleevePart.partIndex);
    if (meshes.length !== 1)
    {
        return { status: "deferred", reason: "exact-lower-sleeve-mesh-unresolved" };
    }
    const effects = Unique(GetEffects(meshes).filter(effect =>
        effect?._characterProofFallback === true
        && typeof effect?.parameters?.DiffuseMap?.AttachTextureRes === "function"
        && typeof effect?.SetParameters === "function"
        && ReadTransformUV0(effect)));
    if (effects.length !== 1)
    {
        return { status: "deferred", reason: "exact-lower-sleeve-effect-unresolved" };
    }
    if ((visualModel?.meshes ?? []).some(mesh =>
        mesh !== meshes[0] && GetEffects([ mesh ]).includes(effects[0])))
    {
        return { status: "deferred", reason: "exact-lower-sleeve-effect-shared" };
    }

    return {
        status: "ready",
        paperdollRecordID: "3000001",
        sleevePartIndex: sleevePart.partIndex,
        sleevePartSourceRecordID: sleevePart.partSourceRecordID,
        ownerSelectionIndex: sleeve.ownerSelectionIndex,
        alphaLayerIndex: alphaSources[0].contribution.layerIndex,
        alphaPartSourceRecordID: alphaSources[0].contribution.source.partSourceRecordID,
        alphaPath: alphaSources[0].texture.path,
        previousSampleBounds: ReadTransformUV0(effects[0]),
        effects
    };
}

/** CPU oracle for the white-visible, black-cut foundation mask contract. */
export function composeLegacyFoundationCutMaskPixel(maskAlpha)
{
    return 1 - Clamp01(maskAlpha);
}

/** Summarizes one RGBA target's alpha without retaining its pixel buffer. */
export function summarizeLegacyTextureAlpha(pixels, width, height)
{
    const expected = Number(width) * Number(height) * 4;
    if (!(pixels instanceof Uint8Array)
        || !Number.isSafeInteger(width) || width <= 0
        || !Number.isSafeInteger(height) || height <= 0
        || pixels.length < expected)
    {
        throw new TypeError("Texture alpha evidence requires a complete Uint8 RGBA buffer");
    }

    let nonzeroPixels = 0;
    let alphaSum = 0;
    let maximumAlpha = 0;
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;
    for (let index = 0; index < expected; index += 4)
    {
        const alpha = pixels[index + 3];
        if (!alpha) continue;
        const pixel = index / 4;
        const x = pixel % width;
        const y = Math.floor(pixel / width);
        nonzeroPixels++;
        alphaSum += alpha;
        maximumAlpha = Math.max(maximumAlpha, alpha);
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
    }

    return {
        nonzeroPixels,
        alphaSum,
        maximumAlpha,
        bounds: nonzeroPixels ? [ minX, minY, maxX, maxY ] : null
    };
}

/** Atomically attaches one CutMaskMap only to foundation body effects. */
export function commitLegacyFoundationCutMaskBindings(visualModel, texture)
{
    const effects = Unique((visualModel?.meshes ?? [])
        .filter(mesh => mesh?._characterFoundationRole === "body")
        .flatMap(mesh => GetEffects([ mesh ])));
    const snapshots = effects.map(effect =>
    {
        const parameter = effect?.parameters?.CutMaskMap;
        if (typeof parameter?.AttachTextureRes !== "function")
        {
            throw new Error("Foundation body effect has no attachable CutMaskMap");
        }
        return {
            effect,
            parameter,
            textureRes: parameter.textureRes ?? null,
            resourcePath: String(parameter.resourcePath ?? ""),
            isAttached: parameter.isAttached === true
        };
    });

    if (!snapshots.length)
    {
        throw new Error("No foundation body effect accepts CutMaskMap");
    }

    try
    {
        for (const snapshot of snapshots) snapshot.parameter.AttachTextureRes(texture);
        return snapshots.map(snapshot => ({
            role: "body",
            effectFilePath: snapshot.effect.effectFilePath ?? null,
            previousResourcePath: snapshot.resourcePath || null
        }));
    }
    catch (cause)
    {
        const rollbackFailures = [];
        for (const snapshot of [ ...snapshots ].reverse())
        {
            try
            {
                snapshot.parameter.AttachTextureRes(snapshot.isAttached ? snapshot.textureRes : null);
                if (!snapshot.isAttached && snapshot.resourcePath)
                {
                    snapshot.parameter.SetValue?.(snapshot.resourcePath);
                }
            }
            catch (error)
            {
                rollbackFailures.push(error);
            }
        }
        const error = new Error(cause.message, { cause });
        error.rollbackFailures = rollbackFailures;
        throw error;
    }
}

function DeferredContribution(contribution, reason)
{
    return {
        layerIndex: contribution?.layerIndex ?? null,
        groupID: contribution?.groupID ?? null,
        reason
    };
}

function WithoutEffects(value)
{
    const { effects: ignoredEffects, pantsCandidate: ignoredPantsCandidate, ...result } = value;
    return result;
}

function NormalizeColors(values)
{
    if (!Array.isArray(values) || values.length < 3) return null;
    const result = [];

    for (let index = 0; index < 3; index++)
    {
        if (!Array.isArray(values[index]) || values[index].length < 3) return null;
        const color = values[index].slice(0, 4).map(Number);
        while (color.length < 4) color.push(color.length === 3 ? 1 : 0);
        if (color.some(value => !Number.isFinite(value))) return null;
        result.push(color);
    }
    return result;
}

function DescribeRetainedMaterialControls(contribution)
{
    const layerWeight = Number.isFinite(contribution?.weight)
        ? contribution.weight
        : 1;
    const colorSelectionWeight = Number.isFinite(contribution?.colorSelection?.weight)
        ? contribution.colorSelection.weight
        : null;
    const gloss = Number.isFinite(contribution?.colorSelection?.gloss)
        ? contribution.colorSelection.gloss
        : null;
    const specularColors = Array.isArray(contribution?.materialValues?.specularColors)
        ? contribution.materialValues.specularColors.map(color =>
            Array.isArray(color) ? color.map(Number) : color)
        : null;
    const retainedNotApplied = [];
    if (colorSelectionWeight !== null) retainedNotApplied.push("colorSelectionWeight");
    if (gloss !== null) retainedNotApplied.push("gloss");
    if (specularColors !== null) retainedNotApplied.push("specularColors");
    return {
        layerWeight,
        colorSelectionWeight,
        gloss,
        specularColors,
        applied: [ "layerWeight" ],
        retainedNotApplied
    };
}

function ResolvePattern(materialValues)
{
    const name = String(materialValues?.pattern ?? "").trim();
    if (!name) return null;

    const colors = NormalizeColors(materialValues?.patternColors);
    if (!colors)
    {
        return { status: "deferred", reason: "pattern-colors-unresolved" };
    }

    const encoded = materialValues.patternColors;
    const transform = NormalizeVector(
        materialValues.patternTransform ?? encoded?.[5],
        4
    );
    if (!transform)
    {
        return { status: "deferred", reason: "pattern-transform-unresolved" };
    }

    const rotation = Number(materialValues.patternRotation ?? encoded?.[6] ?? 0);
    if (!Number.isFinite(rotation))
    {
        return { status: "deferred", reason: "pattern-rotation-unresolved" };
    }

    let path;
    if (/^res:\//iu.test(name))
    {
        path = name;
    }
    else
    {
        const token = name.toLowerCase()
            .replace(/[^a-z0-9]+/gu, "_")
            .replace(/^_+|_+$/gu, "");
        if (!token)
        {
            return { status: "deferred", reason: "pattern-identity-unresolved" };
        }
        path = `res:/graphics/character/patterns/${token}_z.dds`;
    }

    return { name, path, colors, transform, rotation };
}

function NormalizeVector(value, length)
{
    if ((!Array.isArray(value) && !ArrayBuffer.isView(value))
        || value.length < length) return null;
    const result = Array.from(value).slice(0, length).map(Number);
    return result.every(Number.isFinite) ? result : null;
}

/** Qualifies only the two reviewed paper-doll body-atlas effect contracts. */
export function isLegacyConfiguredBodyConsumerEffect(effect)
{
    const path = String(
        effect?._characterAuthoredEffectFilePath
        || effect?.effectFilePath
        || ""
    )
        .replace(/[?#].*$/u, "")
        .replaceAll("\\", "/")
        .toLowerCase();
    const fileName = path.split("/").at(-1) ?? "";
    const family = fileName.replace(/\.(?:fx|sm_[a-z0-9_]+)$/u, "");

    if (family === "skinnedavatarbrdfdoublelinear") return true;
    if (family !== "skinnedavatarbrdflinear") return false;

    return [
        "TransformUV0",
        "WrinkleParams",
        "Material2LibraryID",
        "ColorCorrectionSource"
    ].every(name => HasEffectParameter(effect, name));
}

/** Returns the exact GLES render-state contract used by configured consumers. */
export function getLegacyConfiguredConsumerPassContract(constants = tw2.const)
{
    return CreateConfiguredConsumerPassContract(RequireD3DConstants(constants));
}

/** Plans one reusable private-alpha/shared-RGB target per exact consumer signature. */
export function planLegacyConfiguredBodyConsumers(
    visualModel,
    contributions,
    { resolveCutMaskPaths = null } = {}
)
{
    if (!Array.isArray(contributions))
    {
        throw new TypeError("Configured body consumer contributions must be an array");
    }
    if (resolveCutMaskPaths !== null && typeof resolveCutMaskPaths !== "function")
    {
        throw new TypeError("Configured body consumer cut-mask resolver must be a function");
    }

    const groups = new Map();
    const deferred = [];
    const seenEffects = new Map();
    const invalidEffects = new Set();
    const invalidEffectDeferrals = new Map();
    const contributionsByPart = new Map();

    for (const contribution of contributions)
    {
        const partIndex = contribution?.partIndex;
        if (!Number.isInteger(partIndex))
        {
            deferred.push({
                partIndex: null,
                groupID: contribution?.groupID ?? null,
                reason: "configured-consumer-part-index-invalid"
            });
            continue;
        }
        if (!contributionsByPart.has(partIndex)) contributionsByPart.set(partIndex, []);
        contributionsByPart.get(partIndex).push(contribution);
    }

    for (const mesh of visualModel?.meshes ?? [])
    {
        const partIndex = mesh?._characterPartIndex;
        if (!Number.isInteger(partIndex)) continue;

        const matches = contributionsByPart.get(partIndex) ?? [];
        if (matches.length !== 1)
        {
            deferred.push({
                partIndex,
                groupID: mesh?._characterGroupID ?? null,
                reason: matches.length
                    ? "configured-consumer-contribution-ambiguous"
                    : "configured-consumer-contribution-unresolved"
            });
            continue;
        }

        const contribution = matches[0];
        const ownerSelectionIndex = contribution.ownerSelectionIndex;
        const retainedCutMaskPaths = Number.isInteger(ownerSelectionIndex) && ownerSelectionIndex >= 0
            ? Unique(contributions.flatMap(value =>
                value?.ownerSelectionIndex === ownerSelectionIndex
                    ? (value.selectedTextures ?? [])
                        .filter(texture => texture?.target === "body" && texture?.role === "cut-mask")
                        .map(texture => texture.path)
                    : []))
            : [];
        let cutMaskPaths = [];
        let cutMaskDeferral = null;
        if (retainedCutMaskPaths.length)
        {
            if (!resolveCutMaskPaths)
            {
                cutMaskDeferral = "configured-consumer-cut-target-unresolved";
            }
            else
            {
                const resolved = resolveCutMaskPaths({
                    contribution,
                    retainedCutMaskPaths: [ ...retainedCutMaskPaths ],
                    contributions
                });
                const retained = new Map(retainedCutMaskPaths.map(path => [
                    String(path).toLowerCase(),
                    path
                ]));
                if (!Array.isArray(resolved)
                    || resolved.some(path => !retained.has(String(path).toLowerCase())))
                {
                    cutMaskDeferral = "configured-consumer-cut-target-invalid";
                }
                else
                {
                    cutMaskPaths = Unique(resolved.map(path => retained.get(String(path).toLowerCase())));
                }
            }
        }
        let cutMaskDeferralReported = false;

        for (const effect of GetEffects([ mesh ]))
        {
            if (invalidEffects.has(effect))
            {
                const entry = invalidEffectDeferrals.get(effect);
                if (entry)
                {
                    entry.partIndices = Unique([ ...entry.partIndices, partIndex ]);
                    entry.groupIDs = Unique([ ...entry.groupIDs, contribution.groupID ]);
                }
                continue;
            }
            if (effect?._characterAuthoredBodyAtlasConsumer !== true
                && !isLegacyConfiguredBodyConsumerEffect(effect)) continue;
            if (cutMaskDeferral && !cutMaskDeferralReported)
            {
                deferred.push({
                    partIndex,
                    groupID: contribution.groupID,
                    ownerSelectionIndex,
                    cutMaskPaths: [ ...retainedCutMaskPaths ],
                    reason: cutMaskDeferral
                });
                cutMaskDeferralReported = true;
            }
            const parameter = effect?.parameters?.DiffuseMap;
            const preservedAuthoredDiffusePath = String(
                effect?._characterAuthoredTexturePaths?.DiffuseMap || ""
            ).trim();
            if (effect?._characterProofFallback === true && !preservedAuthoredDiffusePath) continue;
            const authoredDiffusePath = String(
                preservedAuthoredDiffusePath
                || ReadTexturePath(parameter)
            ).trim();
            const previousSampleBounds = effect?._characterAuthoredTransformUV0
                ? [ ...effect._characterAuthoredTransformUV0 ]
                : ReadTransformUV0(effect);

            if (!/^res:\//iu.test(authoredDiffusePath)
                || typeof parameter?.AttachTextureRes !== "function"
                || typeof effect?.SetParameters !== "function")
            {
                deferred.push({
                    partIndex,
                    groupID: contribution.groupID,
                    effectFilePath: effect?.effectFilePath ?? null,
                    authoredDiffusePath: authoredDiffusePath || null,
                    reason: "configured-consumer-authored-diffuse-unresolved"
                });
                continue;
            }
            if (!previousSampleBounds)
            {
                deferred.push({
                    partIndex,
                    groupID: contribution.groupID,
                    effectFilePath: effect?.effectFilePath ?? null,
                    authoredDiffusePath,
                    reason: "configured-consumer-transform-unresolved"
                });
                continue;
            }

            const signature = [
                authoredDiffusePath.toLowerCase(),
                ...cutMaskPaths.map(path => String(path).toLowerCase())
            ].join("\0");
            const priorSignature = seenEffects.get(effect);
            if (priorSignature)
            {
                const priorGroup = groups.get(priorSignature);
                if (priorSignature !== signature)
                {
                    const priorConsumers = priorGroup?.consumers?.filter(value => value.effect === effect) ?? [];
                    if (priorGroup)
                    {
                        priorGroup.consumers = priorGroup.consumers.filter(value => value.effect !== effect);
                        if (!priorGroup.consumers.length) groups.delete(priorSignature);
                    }
                    invalidEffects.add(effect);
                    const entry = {
                        partIndices: Unique([ ...priorConsumers.map(value => value.partIndex), partIndex ]),
                        groupIDs: Unique([ ...priorConsumers.map(value => value.groupID), contribution.groupID ]),
                        effectFilePath: effect.effectFilePath ?? null,
                        authoredDiffusePath,
                        reason: "configured-consumer-shared-effect-ambiguous"
                    };
                    invalidEffectDeferrals.set(effect, entry);
                    deferred.push(entry);
                }
                else if (priorGroup && !priorGroup.consumers.some(value =>
                    value.effect === effect
                    && value.partIndex === partIndex
                    && value.groupID === contribution.groupID))
                {
                    priorGroup.consumers.push({
                        effect,
                        partIndex,
                        groupID: contribution.groupID,
                        ownerSelectionIndex,
                        previousSampleBounds
                    });
                }
                continue;
            }
            seenEffects.set(effect, signature);

            if (!groups.has(signature))
            {
                groups.set(signature, {
                    authoredDiffusePath,
                    cutMaskPaths,
                    consumers: []
                });
            }
            groups.get(signature).consumers.push({
                effect,
                partIndex,
                groupID: contribution.groupID,
                ownerSelectionIndex,
                previousSampleBounds
            });
        }
    }

    return { groups: [ ...groups.values() ], deferred };
}

/** CPU oracle for the configured-consumer render-target contract. */
export function composeLegacyConfiguredConsumerPixel(authored, maskAlphas, shared)
{
    if (!Array.isArray(authored) || authored.length < 4
        || !Array.isArray(maskAlphas)
        || !Array.isArray(shared) || shared.length < 3)
    {
        throw new TypeError("Configured consumer pixel inputs are incomplete");
    }

    let alpha = Clamp01(authored[3]);
    for (const maskAlpha of maskAlphas) alpha *= 1 - Clamp01(maskAlpha);
    return [
        Clamp01(shared[0]),
        Clamp01(shared[1]),
        Clamp01(shared[2]),
        alpha
    ];
}

/** Atomically switches configured consumer effects to identity/full-atlas sampling. */
export function commitLegacyConfiguredConsumerBindings(
    effects,
    texture,
    {
        neutralizeDiffuseColor = false,
        alphaTest = false,
        depthTest = true,
        preserveAlphaBlend = false,
        transformUV0 = null
    } = {}
)
{
    if (typeof neutralizeDiffuseColor !== "boolean"
        || typeof alphaTest !== "boolean"
        || typeof depthTest !== "boolean"
        || typeof preserveAlphaBlend !== "boolean")
    {
        throw new TypeError("Configured consumer options must be boolean");
    }
    if (transformUV0 !== null
        && (!Array.isArray(transformUV0)
            || transformUV0.length !== 4
            || !transformUV0.every(Number.isFinite)))
    {
        throw new TypeError("Configured consumer transformUV0 must contain four numbers");
    }
    effects = Unique(effects);
    const snapshots = effects.map(CaptureConsumerBinding);
    const stateSnapshots = alphaTest || !depthTest
        ? effects.map(CaptureTechniquePassStates)
        : [];

    try
    {
        for (const effect of effects)
        {
            if (!SetTransformUV0(effect, transformUV0 ?? [ 0, 0, 1, 1 ]))
            {
                throw new Error("Configured consumer does not accept TransformUV0");
            }
        }
        for (const effect of effects)
        {
            effect.parameters.DiffuseMap.AttachTextureRes(texture);
        }
        if (neutralizeDiffuseColor)
        {
            for (const effect of effects)
            {
                const parameter = effect.parameters?.MaterialDiffuseColor;
                if (typeof parameter?.SetValue === "function")
                {
                    parameter.SetValue([ 1, 1, 1, 1 ]);
                }
                else if (parameter
                    && effect.SetParameters({ MaterialDiffuseColor: [ 1, 1, 1, 1 ] }) === false)
                {
                    throw new Error("Configured consumer does not accept MaterialDiffuseColor");
                }
            }
        }
        if (alphaTest)
        {
            for (const effect of effects)
            {
                ApplyLegacyConsumerAlphaTest(tw2.const, effect, !preserveAlphaBlend);
            }
        }
        if (!depthTest)
        {
            for (const effect of effects)
            {
                ApplyLegacyConsumerDepthTest(tw2.const, effect, false);
            }
        }
        return effects.length;
    }
    catch (cause)
    {
        const error = new Error(cause.message, { cause });
        error.rollbackFailures = [
            ...RestoreTechniquePassStates(stateSnapshots),
            ...RestoreConsumerBindings(snapshots)
        ];
        throw error;
    }
}

/**
 * Atomically attaches one composed garment diffuse plus exact retained
 * normal/specular paths to the currently visible GLES proof material. This is
 * intentionally not authored-effect promotion: promotion remains gated on the
 * authored shader's complete lookup/environment contract.
 */
export async function commitLegacyConfiguredGarmentBindings(
    effects,
    texture,
    textureBindings = {}
)
{
    effects = Unique(effects);
    const entries = Object.entries(textureBindings);
    for (const [ name, binding ] of entries)
    {
        if (![ "NormalMap", "SpecularMap" ].includes(name)
            || !binding?.textureRes
            || !/^res:\//iu.test(String(binding?.sourcePath ?? "")))
        {
            throw new TypeError("Configured garment lighting bindings require retained NormalMap/SpecularMap sources");
        }
    }

    const snapshots = effects.map(effect => ({
        consumer: CaptureConsumerBinding(effect),
        textures: entries.map(([ name ]) => CaptureTextureBinding(effect, name))
    }));

    try
    {
        for (const effect of effects)
        {
            if (!SetIdentityTransformUV0(effect))
            {
                throw new Error("Configured garment does not accept TransformUV0");
            }
            effect.parameters.DiffuseMap.AttachTextureRes(texture);
            if (effect.SetParameters?.({ MaterialDiffuseColor: [ 1, 1, 1, 1 ] }) === false)
            {
                throw new Error("Configured garment does not accept MaterialDiffuseColor");
            }
            for (const [ name, binding ] of entries)
            {
                const parameter = effect?.parameters?.[name];
                if (typeof parameter?.AttachTextureRes !== "function")
                {
                    throw new Error(`Configured garment does not accept ${name}`);
                }
                parameter.AttachTextureRes(binding.textureRes);
            }
        }

        for (const effect of effects)
        {
            await tw2.resMan?.Watch?.(effect);
            if (effect?.IsGood?.() === false)
            {
                throw new Error("Configured garment effect failed to prepare");
            }
            for (const [ name ] of entries)
            {
                if (effect.parameters[name]?.IsGood?.() === false)
                {
                    throw new Error(`Configured garment ${name} failed to prepare`);
                }
            }
        }

        return {
            status: "applied",
            rule: "legacy-opengl-visible-garment-lighting-v1",
            correctness: "retained-source-policy",
            attachedEffects: effects.length,
            texturePaths: Object.fromEntries(entries.map(([ name, binding ]) => [
                name,
                binding.sourcePath
            ])),
            authoredPromotion: "deferred-incomplete-shader-contract"
        };
    }
    catch (cause)
    {
        const rollbackFailures = [];
        for (const snapshot of [ ...snapshots ].reverse())
        {
            rollbackFailures.push(...RestoreTextureBindings(snapshot.textures));
            rollbackFailures.push(...RestoreConsumerBindings([ snapshot.consumer ]));
        }
        const error = new Error(cause.message, { cause });
        error.rollbackFailures = rollbackFailures;
        throw error;
    }
}

/** Atomically installs independently composed head lighting atlases. */
export async function commitLegacyConfiguredHeadBindings(effects, textureBindings)
{
    effects = Unique(effects);
    const entries = Object.entries(textureBindings ?? {});
    if (!effects.length || !entries.length
        || entries.some(([ name, texture ]) =>
            ![ "DiffuseMap", "NormalMap", "SpecularMap" ].includes(name) || !texture))
    {
        throw new TypeError("Configured head bindings require effects and D/N/S atlas textures");
    }

    const snapshots = effects.map(effect => ({
        consumer: CaptureConsumerBinding(effect),
        textures: entries.map(([ name ]) => CaptureTextureBinding(effect, name))
    }));
    try
    {
        for (const effect of effects)
        {
            if (!SetIdentityTransformUV0(effect))
            {
                throw new Error("Configured head skin does not accept TransformUV0");
            }
            for (const [ name, texture ] of entries)
            {
                const parameter = effect?.parameters?.[name];
                if (typeof parameter?.AttachTextureRes !== "function")
                {
                    throw new Error(`Configured head skin does not accept ${name}`);
                }
                parameter.AttachTextureRes(texture);
            }
            await tw2.resMan?.Watch?.(effect);
            if (effect?.IsGood?.() === false)
            {
                throw new Error("Configured head skin effect failed to prepare");
            }
        }
        return {
            status: "applied",
            rule: "legacy-opengl-configured-head-lighting-v1",
            attachedEffects: effects.length,
            sampleBounds: [ 0, 0, 1, 1 ]
        };
    }
    catch (cause)
    {
        const error = new Error(cause.message, { cause });
        const rollbackFailures = [];
        for (const snapshot of [ ...snapshots ].reverse())
        {
            rollbackFailures.push(...RestoreTextureBindings(snapshot.textures));
            rollbackFailures.push(...RestoreConsumerBindings([ snapshot.consumer ]));
        }
        error.rollbackFailures = rollbackFailures;
        throw error;
    }
}

/**
 * Attaches the full body atlas to authored foundation consumers and configured
 * effects with a reviewed body-atlas contract. This is deliberately per effect:
 * a mixed garment may contain both private cloth geometry and a separate skin
 * carrier, regardless of whether the owning part lives under `/dependants/`.
 * An ordinary garment fallback must never inherit skin merely because its
 * authored shader or private material is unresolved.
 */
export function attachLegacyBodyDiffuse(visualModel, texture, { neutralLighting = false } = {})
{
    if (typeof neutralLighting !== "boolean")
    {
        throw new TypeError("Legacy body diffuse neutralLighting must be boolean");
    }
    const result = {
        total: 0,
        foundation: 0,
        configuredProof: 0,
        configuredPartIndices: [],
        foundationBindings: [],
        configuredProofBindings: []
    };
    const configuredPartIndices = new Set();
    const seen = new Set();

    for (const mesh of visualModel?.meshes ?? [])
    {
        const foundation = BODY_ROLES.has(mesh?._characterFoundationRole);
        const configured = Number.isInteger(mesh?._characterPartIndex);
        if (!foundation && !configured) continue;

        for (const effect of GetEffects([ mesh ]))
        {
            if (seen.has(effect)) continue;
            const configuredProof = configured
                && effect?._characterAuthoredBodyAtlasConsumer === true;
            if (!foundation && !configuredProof) continue;
            const parameter = effect?.parameters?.DiffuseMap;
            if (typeof parameter?.AttachTextureRes !== "function") continue;
            const previousSampleBounds = ReadTransformUV0(effect);
            parameter.AttachTextureRes(texture);
            if (neutralLighting)
            {
                effect.SetTextures?.({
                    NormalMap: NEUTRAL_NORMAL,
                    SpecularMap: SOLID_BLACK
                });
            }
            if (!foundation)
            {
                result.configuredProof++;
                configuredPartIndices.add(mesh._characterPartIndex);
                result.configuredProofBindings.push({
                    status: "experimental-policy",
                    rule: "authored-transform-retained-v1",
                    correctness: "unverified",
                    partIndex: mesh._characterPartIndex,
                    groupID: mesh._characterGroupID ?? null,
                    partSourceRecordID: mesh._characterPartSourceRecordID ?? null,
                    effectFilePath: effect.effectFilePath ?? null,
                    previousSampleBounds,
                    sampleBounds: previousSampleBounds,
                    source: "shared-body-diffuse-target"
                });
            }
            else
            {
                result.foundation++;
                result.foundationBindings.push({
                    status: previousSampleBounds ? "retained" : "unresolved",
                    rule: "authored-transform-retained-v1",
                    correctness: "unverified",
                    role: mesh._characterFoundationRole ?? null,
                    effectFilePath: effect.effectFilePath ?? null,
                    sampleBounds: previousSampleBounds,
                    source: "shared-body-diffuse-target"
                });
            }
            seen.add(effect);
            result.total++;
        }
    }

    result.configuredPartIndices = [ ...configuredPartIndices ];
    return result;
}

/** Attaches one composed body normal only to explicit nude-foundation carriers. */
export function attachLegacyBodyNormal(visualModel, texture)
{
    const seen = new Set();
    let attachedEffects = 0;
    for (const mesh of visualModel?.meshes ?? [])
    {
        if (!BODY_ROLES.has(mesh?._characterFoundationRole)) continue;
        for (const effect of GetEffects([ mesh ]))
        {
            if (seen.has(effect)) continue;
            const parameter = effect?.parameters?.NormalMap;
            if (typeof parameter?.AttachTextureRes !== "function") continue;
            parameter.AttachTextureRes(texture);
            seen.add(effect);
            attachedEffects++;
        }
    }
    return attachedEffects;
}

/** Attaches one composed body specular atlas only to explicit nude-foundation carriers. */
export function attachLegacyBodySpecular(visualModel, texture)
{
    const seen = new Set();
    let attachedEffects = 0;
    for (const mesh of visualModel?.meshes ?? [])
    {
        if (!BODY_ROLES.has(mesh?._characterFoundationRole)) continue;
        for (const effect of GetEffects([ mesh ]))
        {
            if (seen.has(effect)) continue;
            const parameter = effect?.parameters?.SpecularMap;
            if (typeof parameter?.AttachTextureRes !== "function") continue;
            parameter.AttachTextureRes(texture);
            seen.add(effect);
            attachedEffects++;
        }
    }
    return attachedEffects;
}

function IsConfiguredBodyAtlasDependency(value)
{
    const source = String(value?._characterPartSourceRecordID
        ?? value?.partSourceRecordID
        ?? "")
        .replace(/\\/gu, "/")
        .toLowerCase();

    return source.includes("/dependants/");
}

function ReadTransformUV0(effect)
{
    return ReadEffectVectorParameter(effect, "TransformUV0", 4);
}

function BoundsEqual(left, right)
{
    return Array.isArray(left) && Array.isArray(right)
        && left.length === right.length
        && left.every((value, index) => Math.abs(value - right[index]) <= 1e-6);
}

function ReadEffectVectorParameter(effect, name, length)
{
    const parameter = effect?.parameters?.[name];
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

function ReadTexturePath(parameter)
{
    const path = String(
        parameter?.resourcePath
        || parameter?.textureRes?.path
        || ""
    ).trim();
    return path;
}

function HasEffectParameter(effect, name)
{
    const runtime = effect?.GetParameters?.();
    if (runtime && Object.prototype.hasOwnProperty.call(runtime, name)) return true;
    const parameters = effect?.parameters;
    if (Array.isArray(parameters)) return parameters.some(value => value?.name === name);
    if (!parameters || typeof parameters !== "object") return false;
    if (Object.prototype.hasOwnProperty.call(parameters, name)) return true;
    return Object.values(parameters).some(value => value?.name === name);
}

function SetIdentityTransformUV0(effect)
{
    return SetTransformUV0(effect, [ 0, 0, 1, 1 ]);
}

function SetTransformUV0(effect, transform)
{
    if (typeof effect?.SetParameters !== "function") return false;
    const current = ReadTransformUV0(effect);
    if (current?.every((value, index) => value === transform[index])) return true;
    return effect.SetParameters({ TransformUV0: transform }) !== false;
}

function CaptureConsumerBinding(effect)
{
    const parameter = effect?.parameters?.DiffuseMap;
    const transform = ReadTransformUV0(effect);
    if (!transform || typeof parameter?.AttachTextureRes !== "function")
    {
        throw new Error("Configured consumer binding cannot be captured");
    }
    return {
        effect,
        transform,
        materialDiffuseColor: ReadEffectVectorParameter(
            effect,
            "MaterialDiffuseColor",
            4
        ),
        textureRes: parameter.textureRes ?? null,
        resourcePath: String(parameter.resourcePath ?? ""),
        isAttached: parameter.isAttached === true
    };
}

function CaptureTechniquePassStates(effect)
{
    if (typeof effect?.GetPassCount !== "function"
        || typeof effect?.SetTechniquePassStateOverride !== "function")
    {
        throw new Error("Configured consumer render states cannot be captured");
    }
    const passes = [];
    for (const technique of Object.keys(effect.techniques ?? {}))
    {
        const passCount = effect.GetPassCount(technique);
        for (let pass = 0; pass < passCount; pass++)
        {
            const holder = effect.techniques?.[technique]?.[pass];
            passes.push({
                technique,
                pass,
                hadState: Array.isArray(holder?.state),
                state: Array.isArray(holder?.state)
                    ? holder.state.map(value => ({ ...value }))
                    : []
            });
        }
    }
    if (!passes.length) throw new Error("Configured consumer has no renderable passes");
    return { effect, passes };
}

function RestoreTechniquePassStates(snapshots)
{
    const failures = [];
    for (const snapshot of [ ...snapshots ].reverse())
    {
        try
        {
            for (const pass of snapshot.passes)
            {
                const holder = snapshot.effect.techniques?.[pass.technique]?.[pass.pass];
                if (!holder) continue;
                if (pass.hadState)
                {
                    holder.state = pass.state.map(value => ({ ...value }));
                }
                else
                {
                    delete holder.state;
                }
            }
        }
        catch (error)
        {
            failures.push(error);
        }
    }
    return failures;
}

function ApplyLegacyConsumerAlphaTest(d3d, effect, disableBlend = true)
{
    const required = [
        "RS_ALPHATESTENABLE",
        "RS_ALPHAREF",
        "RS_ALPHAFUNC",
        "CMP_GREATER"
    ];
    if (disableBlend) required.push("RS_ALPHABLENDENABLE");
    if (!d3d || required.some(name => !Number.isFinite(d3d[name])))
    {
        throw new Error("Configured consumer alpha test requires ccpwgl D3D constants");
    }
    for (const technique of Object.keys(effect.techniques ?? {}))
    {
        const passCount = effect.GetPassCount(technique);
        for (let pass = 0; pass < passCount; pass++)
        {
            effect.SetTechniquePassStateOverride(technique, pass, d3d.RS_ALPHATESTENABLE, 1);
            effect.SetTechniquePassStateOverride(technique, pass, d3d.RS_ALPHAREF, 0);
            effect.SetTechniquePassStateOverride(technique, pass, d3d.RS_ALPHAFUNC, d3d.CMP_GREATER);
            if (disableBlend)
            {
                effect.SetTechniquePassStateOverride(
                    technique,
                    pass,
                    d3d.RS_ALPHABLENDENABLE,
                    0
                );
            }
        }
    }
}

function ApplyLegacyConsumerDepthTest(d3d, effect, enabled)
{
    if (!Number.isFinite(d3d?.RS_ZENABLE) || !Number.isFinite(d3d?.RS_ZWRITEENABLE))
    {
        throw new Error("Configured consumer depth test requires ccpwgl D3D constants");
    }
    for (const technique of Object.keys(effect.techniques ?? {}))
    {
        const passCount = effect.GetPassCount(technique);
        for (let pass = 0; pass < passCount; pass++)
        {
            effect.SetTechniquePassStateOverride(
                technique,
                pass,
                d3d.RS_ZENABLE,
                enabled ? 1 : 0
            );
            effect.SetTechniquePassStateOverride(technique, pass, d3d.RS_ZWRITEENABLE, 0);
        }
    }
}

function CaptureTextureBinding(effect, name)
{
    const parameter = effect?.parameters?.[name];
    if (!parameter || typeof parameter.AttachTextureRes !== "function")
    {
        throw new Error(`Configured garment ${name} binding cannot be captured`);
    }
    return {
        parameter,
        textureRes: parameter.textureRes ?? null,
        resourcePath: String(parameter.resourcePath ?? ""),
        isAttached: parameter.isAttached === true
    };
}

function RestoreTextureBindings(snapshots)
{
    const failures = [];
    for (const snapshot of [ ...snapshots ].reverse())
    {
        try
        {
            snapshot.parameter.AttachTextureRes(
                snapshot.isAttached ? snapshot.textureRes : null
            );
            if (!snapshot.isAttached && typeof snapshot.parameter.SetValue === "function")
            {
                snapshot.parameter.SetValue(snapshot.resourcePath);
            }
        }
        catch (error)
        {
            failures.push(error);
        }
    }
    return failures;
}

function RestoreConsumerBindings(snapshots)
{
    const failures = [];
    for (const snapshot of [ ...snapshots ].reverse())
    {
        try
        {
            const parameter = snapshot.effect.parameters.DiffuseMap;
            snapshot.effect.SetParameters({ TransformUV0: snapshot.transform });
            if (snapshot.materialDiffuseColor)
            {
                snapshot.effect.SetParameters({
                    MaterialDiffuseColor: snapshot.materialDiffuseColor
                });
            }
            if (snapshot.isAttached)
            {
                parameter.AttachTextureRes(snapshot.textureRes);
            }
            else
            {
                parameter.AttachTextureRes(null);
                if (snapshot.resourcePath)
                {
                    if (typeof parameter.SetValue !== "function")
                    {
                        throw new Error("Configured consumer texture path cannot be restored");
                    }
                    parameter.SetValue(snapshot.resourcePath);
                }
            }
        }
        catch (error)
        {
            failures.push(error);
        }
    }
    return failures;
}

function GetEffects(meshes)
{
    const fields = [
        "opaqueAreas", "transparentAreas", "additiveAreas", "decalAreas",
        "depthAreas", "depthNormalAreas", "distortionAreas", "pickableAreas"
    ];
    const effects = [];

    for (const mesh of meshes)
    {
        for (const field of fields)
        {
            for (const area of mesh?.[field] ?? [])
            {
                if (area?.effect && !effects.includes(area.effect)) effects.push(area.effect);
            }
        }
    }
    return effects;
}

function DescribeConfiguredGarmentBindings(meshes, effects)
{
    const fields = [
        "opaqueAreas", "transparentAreas", "additiveAreas", "decalAreas",
        "depthAreas", "depthNormalAreas", "distortionAreas", "pickableAreas"
    ];

    return Unique(effects).map(effect =>
    {
        const consumers = [];

        for (let meshIndex = 0; meshIndex < (meshes?.length ?? 0); meshIndex++)
        {
            const mesh = meshes[meshIndex];
            for (const field of fields)
            {
                for (let areaIndex = 0; areaIndex < (mesh?.[field]?.length ?? 0); areaIndex++)
                {
                    if (mesh[field][areaIndex]?.effect !== effect) continue;
                    const geometryMesh = mesh?.geometryResource?.meshes?.[mesh?.meshIndex];
                    consumers.push({
                        meshIndex,
                        meshName: String(mesh?.name ?? ""),
                        geometryMeshIndex: Number.isInteger(mesh?.meshIndex)
                            ? mesh.meshIndex
                            : null,
                        geometryMeshName: String(geometryMesh?.name ?? ""),
                        geometryBounds: ReadGeometryBounds(geometryMesh),
                        geometryUv0Bounds: ReadGeometryUvBounds(geometryMesh, 0),
                        geometryUv1Bounds: ReadGeometryUvBounds(geometryMesh, 1),
                        vertexCount: Number(geometryMesh?._vertices) || 0,
                        triangleCount: Number(geometryMesh?._faces) || 0,
                        boneBindings: Array.isArray(geometryMesh?.boneBindings)
                            ? geometryMesh.boneBindings.map(String)
                            : [],
                        morphTargetCount: Array.isArray(geometryMesh?.morphTargets)
                            ? geometryMesh.morphTargets.length
                            : 0,
                        morphTargetNames: Array.isArray(geometryMesh?.morphTargets)
                            ? geometryMesh.morphTargets.map(value => String(value?.name ?? ""))
                            : [],
                        matchingMorphTargets: FindMatchingMorphTargets(
                            geometryMesh?.morphTargets,
                            mesh?.name
                        ),
                        areaField: field,
                        areaIndex
                    });
                }
            }
        }

        return {
            effectName: String(effect?.name ?? ""),
            authoredEffectFilePath: String(effect?._characterAuthoredEffectFilePath ?? ""),
            authoredTexturePaths: { ...(effect?._characterAuthoredTexturePaths ?? {}) },
            authoredTextureSlots: DescribeAuthoredTextureSlots(
                effect?._characterAuthoredEffect ?? effect
            ),
            sampleBounds: ReadTransformUV0(effect),
            consumers
        };
    });
}

function DescribeAuthoredTextureSlots(effect)
{
    const result = [];
    for (const [ name, parameter ] of Object.entries(effect?.parameters ?? {}))
    {
        if (!/map$/iu.test(name) && typeof parameter?.AttachTextureRes !== "function") continue;
        const texture = parameter?.textureRes ?? null;
        const resourcePath = String(parameter?.resourcePath || texture?.path || "").trim();
        const ready = typeof texture?.IsGood === "function"
            ? texture.IsGood() === true
            : null;
        result.push({
            name,
            resourcePath: resourcePath || null,
            attached: parameter?.isAttached === true || Boolean(texture),
            ready,
            status: ready === true
                ? "ready"
                : texture
                    ? "attached-unready"
                    : resourcePath
                        ? "path-only"
                        : "unbound"
        });
    }
    return result.sort((a, b) => a.name.localeCompare(b.name));
}

function ReadGeometryBounds(mesh)
{
    const min = Array.from(mesh?.minBounds ?? []).slice(0, 3).map(Number);
    const max = Array.from(mesh?.maxBounds ?? []).slice(0, 3).map(Number);
    if (min.length !== 3 || max.length !== 3
        || !min.every(Number.isFinite) || !max.every(Number.isFinite)) return null;
    return { min, max };
}

function ReadGeometryUvBounds(mesh, usageIndex)
{
    const vertexCount = Number(mesh?._vertices) || 0;
    const method = usageIndex === 0 ? "GetVertexTexCoord0" : "GetVertexTexCoord1";
    if (!vertexCount || typeof mesh?.[method] !== "function") return null;

    const value = [ 0, 0 ];
    const min = [ Infinity, Infinity ];
    const max = [ -Infinity, -Infinity ];
    try
    {
        for (let index = 0; index < vertexCount; index++)
        {
            mesh[method](value, index);
            for (let component = 0; component < 2; component++)
            {
                const number = Number(value[component]);
                if (!Number.isFinite(number)) return null;
                min[component] = Math.min(min[component], number);
                max[component] = Math.max(max[component], number);
            }
        }
    }
    catch
    {
        return null;
    }
    return { min, max };
}

function FindMatchingMorphTargets(targets, meshName)
{
    if (!Array.isArray(targets)) return [];
    const identity = String(meshName ?? "").toLowerCase().replace(/shape$/u, "");
    if (!identity) return [];
    return targets
        .filter(target => String(target?.name ?? "").toLowerCase() === identity)
        .map(target => String(target?.sourceName || target?.name || ""));
}

function Unique(values)
{
    return [ ...new Set(values) ];
}

function Clamp01(value)
{
    value = Number(value);
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(1, value));
}

function CreateConfiguredConsumerPassContract(d3d)
{
    return {
        authored: {
            blend: false,
            colorWrite: COLOR_WRITE_RGBA
        },
        cut: {
            blend: true,
            colorWrite: COLOR_WRITE_ALPHA,
            sourceBlend: d3d.BLEND_ZERO,
            destinationBlend: d3d.BLEND_INVSRCALPHA,
            sourceBlendAlpha: d3d.BLEND_ZERO,
            destinationBlendAlpha: d3d.BLEND_INVSRCALPHA
        },
        shared: {
            blend: false,
            colorWrite: COLOR_WRITE_RGB
        }
    };
}

function RequireD3DConstants(constants)
{
    const required = [
        "RS_ZENABLE",
        "RS_ZWRITEENABLE",
        "RS_SRCBLEND",
        "RS_DESTBLEND",
        "RS_CULLMODE",
        "RS_ALPHATESTENABLE",
        "RS_ALPHAREF",
        "RS_ALPHAFUNC",
        "RS_ALPHABLENDENABLE",
        "RS_COLORWRITEENABLE",
        "RS_SEPARATEALPHABLENDENABLE",
        "RS_SRCBLENDALPHA",
        "RS_DESTBLENDALPHA",
        "CULL_NONE",
        "BLEND_ONE",
        "BLEND_ZERO",
        "BLEND_SRCALPHA",
        "BLEND_INVSRCALPHA",
        "CMP_GREATER"
    ];

    if (!constants || required.some(name => !Number.isFinite(constants[name])))
    {
        throw new TypeError("GLES atlas composer requires ccpwgl D3D constants");
    }
    return constants;
}

function ApplyRenderStates(d3d, effect, blend, {
    colorWrite = COLOR_WRITE_RGBA,
    sourceBlend = d3d.BLEND_SRCALPHA,
    destinationBlend = d3d.BLEND_INVSRCALPHA,
    sourceBlendAlpha = d3d.BLEND_ONE,
    destinationBlendAlpha = d3d.BLEND_INVSRCALPHA
} = {})
{
    for (const technique of Object.keys(effect.techniques ?? {}))
    {
        const passCount = effect.GetPassCount?.(technique) ?? 0;
        for (let pass = 0; pass < passCount; pass++)
        {
            effect.SetTechniquePassStateOverride(technique, pass, d3d.RS_ZENABLE, 0);
            effect.SetTechniquePassStateOverride(technique, pass, d3d.RS_ZWRITEENABLE, 0);
            effect.SetTechniquePassStateOverride(technique, pass, d3d.RS_CULLMODE, d3d.CULL_NONE);
            effect.SetTechniquePassStateOverride(technique, pass, d3d.RS_COLORWRITEENABLE, colorWrite);
            effect.SetTechniquePassStateOverride(technique, pass, d3d.RS_ALPHABLENDENABLE, blend ? 1 : 0);
            if (!blend) continue;
            effect.SetTechniquePassStateOverride(technique, pass, d3d.RS_SRCBLEND, sourceBlend);
            effect.SetTechniquePassStateOverride(technique, pass, d3d.RS_DESTBLEND, destinationBlend);
            effect.SetTechniquePassStateOverride(technique, pass, d3d.RS_SEPARATEALPHABLENDENABLE, 1);
            effect.SetTechniquePassStateOverride(technique, pass, d3d.RS_SRCBLENDALPHA, sourceBlendAlpha);
            effect.SetTechniquePassStateOverride(technique, pass, d3d.RS_DESTBLENDALPHA, destinationBlendAlpha);
        }
    }
}

function ApplyConfiguredConsumerRenderStates(d3d, effect, contract)
{
    const { blend, ...states } = contract;
    ApplyRenderStates(d3d, effect, blend, states);
}

async function PrepareEffect(tw2, effect, shaderPath)
{
    await tw2.resMan?.Watch?.(effect);
    if (!effect?.IsGood?.()) throw new Error(`Compositing shader did not load: ${shaderPath}`);
}

function RenderPasses(tw2, target, passes)
{
    const rendered = target.SetCallUnset(() =>
    {
        const gl = tw2.device.gl;
        const clear = gl.getParameter(gl.COLOR_CLEAR_VALUE);
        const mask = gl.getParameter(gl.COLOR_WRITEMASK);
        const scissor = gl.isEnabled(gl.SCISSOR_TEST);

        try
        {
            gl.disable(gl.SCISSOR_TEST);
            gl.colorMask(true, true, true, true);
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);

            for (const pass of passes)
            {
                gl.viewport(...pass.viewport);
                try
                {
                    if (!tw2.device.RenderFullScreenQuad(pass.effect))
                    {
                        throw new Error(`${pass.effect.effectFilePath} did not render`);
                    }
                }
                finally
                {
                    pass.cleanup?.();
                }
            }
        }
        finally
        {
            gl.clearColor(clear[0], clear[1], clear[2], clear[3]);
            gl.colorMask(mask[0], mask[1], mask[2], mask[3]);
            if (scissor) gl.enable(gl.SCISSOR_TEST);
            else gl.disable(gl.SCISSOR_TEST);
        }
    });

    if (!rendered) throw new Error("Legacy atlas render target is not ready");
}

function RenderProjectedHeadTattoo(tw2, target, effect, carrier, backend)
{
    const rendered = target.SetCallUnset(() =>
    {
        const gl = tw2.device.gl;
        const clear = gl.getParameter(gl.COLOR_CLEAR_VALUE);
        const mask = gl.getParameter(gl.COLOR_WRITEMASK);
        const scissor = gl.isEnabled(gl.SCISSOR_TEST);
        const perObjectData = tw2.device.perObjectData;

        try
        {
            gl.disable(gl.SCISSOR_TEST);
            gl.colorMask(true, true, true, true);
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.viewport(0, 0, target.width, target.height);
            tw2.device.perObjectData = backend.GetPerMeshObjectData(carrier.mesh, 0);
            for (const area of carrier.areas)
            {
                if (!carrier.geometry?.RenderAreas?.(
                    area.meshIndex,
                    area.index,
                    area.count,
                    effect
                ))
                {
                    throw new Error(
                        `Head tattoo projection area ${area.name || area.index} did not render`
                    );
                }
            }
        }
        finally
        {
            tw2.device.perObjectData = perObjectData;
            gl.clearColor(clear[0], clear[1], clear[2], clear[3]);
            gl.colorMask(mask[0], mask[1], mask[2], mask[3]);
            if (scissor) gl.enable(gl.SCISSOR_TEST);
            else gl.disable(gl.SCISSOR_TEST);
        }
    });

    if (!rendered) throw new Error("Head tattoo projection render target is not ready");
}

function ReadTargetAlphaEvidence(target)
{
    if (typeof target?.ReadPixels !== "function")
    {
        return { status: "unavailable", reason: "render-target-readback-unavailable" };
    }
    const pixels = new Uint8Array(target.width * target.height * 4);
    target.ReadPixels(pixels, 0, 0, target.width, target.height);
    let hash = 2166136261;
    for (const value of pixels)
    {
        hash ^= value;
        hash = Math.imul(hash, 16777619);
    }
    return {
        status: "readback",
        rgbaFnv1a: (hash >>> 0).toString(16).padStart(8, "0"),
        ...summarizeLegacyTextureAlpha(pixels, target.width, target.height)
    };
}

/** Decodes one authored BC3/DXT5 DDS into an RGBA mask without changing its layout. */
export function decodeLegacyBc3AlphaMask(buffer)
{
    const bytes = new Uint8Array(buffer);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    if (bytes.length < 128
        || view.getUint32(0, true) !== 0x20534444
        || view.getUint32(84, true) !== 0x35545844)
    {
        throw new TypeError("Authored tattoo alpha requires a BC3/DXT5 DDS");
    }
    const height = view.getUint32(12, true);
    const width = view.getUint32(16, true);
    if (!width || !height) throw new TypeError("Authored tattoo DDS has invalid dimensions");

    const blocksX = Math.ceil(width / 4);
    const blocksY = Math.ceil(height / 4);
    const required = 128 + blocksX * blocksY * 16;
    if (bytes.length < required) throw new TypeError("Authored tattoo DDS is truncated");

    const rgba = new Uint8Array(width * height * 4);
    let source = 128;
    for (let blockY = 0; blockY < blocksY; blockY++)
    {
        for (let blockX = 0; blockX < blocksX; blockX++, source += 16)
        {
            const alpha0 = bytes[source];
            const alpha1 = bytes[source + 1];
            const palette = CreateBc3AlphaPalette(alpha0, alpha1);
            for (let pixel = 0; pixel < 16; pixel++)
            {
                const bit = pixel * 3;
                const byte = source + 2 + (bit >> 3);
                const index = ((bytes[byte] | ((bytes[byte + 1] ?? 0) << 8))
                    >> (bit & 7)) & 7;
                const x = blockX * 4 + (pixel & 3);
                const y = blockY * 4 + (pixel >> 2);
                if (x >= width || y >= height) continue;
                const target = (y * width + x) * 4;
                rgba[target] = 255;
                rgba[target + 1] = 255;
                rgba[target + 2] = 255;
                rgba[target + 3] = palette[index];
            }
        }
    }
    return { width, height, rgba };
}

function CreateBc3AlphaPalette(alpha0, alpha1)
{
    const values = new Uint8Array(8);
    values[0] = alpha0;
    values[1] = alpha1;
    if (alpha0 > alpha1)
    {
        for (let index = 2; index < 8; index++)
        {
            values[index] = Math.round(
                ((8 - index) * alpha0 + (index - 1) * alpha1) / 7
            );
        }
    }
    else
    {
        for (let index = 2; index < 6; index++)
        {
            values[index] = Math.round(
                ((6 - index) * alpha0 + (index - 1) * alpha1) / 5
            );
        }
        values[6] = 0;
        values[7] = 255;
    }
    return values;
}

async function CreateLegacyBc3AlphaMaskTexture(tw2, path)
{
    const url = tw2.resMan.BuildUrl(path);
    const buffer = await tw2.resMan.FetchRaw(url, "arraybuffer");
    const decoded = decodeLegacyBc3AlphaMask(buffer);
    const gl = tw2.device.gl;
    const texture = gl.createTexture();
    if (!texture) throw new Error("Unable to allocate authored tattoo alpha texture");
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        decoded.width,
        decoded.height,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        decoded.rgba
    );
    gl.bindTexture(gl.TEXTURE_2D, null);

    const TextureRes = RequireClass(tw2, "Tw2TextureRes");
    const resource = new TextureRes();
    resource.Attach(texture, `#character-tattoo-alpha:${path}`);
    resource._target = gl.TEXTURE_2D;
    resource._width = decoded.width;
    resource._height = decoded.height;
    resource._format = gl.RGBA;
    resource._internalFormat = gl.RGBA;
    resource._type = gl.UNSIGNED_BYTE;
    resource._hasMipMaps = false;
    resource._useNoMipFilter = true;
    return {
        resource,
        report: {
            status: "decoded",
            rule: "gles-bc3-alpha-mask-realization-v1",
            sourcePath: path,
            sourceFormat: "BC3/DXT5",
            size: [ decoded.width, decoded.height ]
        },
        destroy()
        {
            resource.DeleteGL?.();
        }
    };
}

/** Reads normalized oFFs/pHYs atlas placement from a PNG byte buffer. */
export function parsePngAtlasMetadata(buffer)
{
    const bytes = new Uint8Array(buffer);
    const signature = [ 137, 80, 78, 71, 13, 10, 26, 10 ];
    if (bytes.length < 24 || !signature.every((value, index) => bytes[index] === value)) return null;

    const view = new DataView(buffer, bytes.byteOffset, bytes.byteLength);
    let width = null;
    let height = null;
    let offset = null;
    let extent = null;
    let cursor = 8;

    while (cursor + 12 <= bytes.length)
    {
        const length = view.getUint32(cursor, false);
        const data = cursor + 8;
        const end = data + length;
        if (end + 4 > bytes.length) break;

        const type = String.fromCharCode(...bytes.slice(cursor + 4, cursor + 8));
        if (type === "IHDR" && length >= 8)
        {
            width = view.getUint32(data, false);
            height = view.getUint32(data + 4, false);
        }
        else if (type === "oFFs" && length >= 9 && view.getUint8(data + 8) === 0)
        {
            offset = [
                view.getInt32(data, false) / 1e6,
                view.getInt32(data + 4, false) / 1e6
            ];
        }
        else if (type === "pHYs" && length >= 9 && view.getUint8(data + 8) === 0)
        {
            const value = [
                view.getUint32(data, false) / 1e6,
                view.getUint32(data + 4, false) / 1e6
            ];
            if (value[0] > 0 && value[1] > 0) extent = value;
        }

        cursor = end + 4;
        if (type === "IEND") break;
    }

    if (!width || !height) return null;
    return {
        width,
        height,
        offset: extent ? offset ?? [ 0, 0 ] : [ 0, 0 ],
        extent: extent ?? [ 1, 1 ],
        hasOffsetMetadata: offset !== null,
        hasPlacementMetadata: extent !== null
    };
}

/** Converts one hydrated schema-v9 texture-metadata record for composition. */
export function ReadLibraryAtlasMetadata(record, identity = record?.recordID)
{
    const width = Number(record?.width);
    const height = Number(record?.height);
    const hasPlacementMetadata = record?.hasPlacementMetadata === true;
    const extent = hasPlacementMetadata
        ? [ Number(record.extentX), Number(record.extentY) ]
        : [ 1, 1 ];
    const offset = hasPlacementMetadata
        ? [ Number(record.offsetX), Number(record.offsetY) ]
        : [ 0, 0 ];

    if (!Number.isSafeInteger(width) || width <= 0
        || !Number.isSafeInteger(height) || height <= 0
        || !extent.every(value => Number.isFinite(value) && value > 0)
        || !offset.every(Number.isFinite))
    {
        throw new TypeError(
            `Character library has invalid texture metadata for ${identity}`
        );
    }

    return {
        width,
        height,
        offset,
        extent,
        hasOffsetMetadata: record.hasOffsetMetadata === true,
        hasPlacementMetadata,
        source: "character-library",
        sourcePath: record.sourcePath ?? null,
        placementEncoding: record.placementEncoding ?? null,
        placementPolicy: record.placementPolicy ?? null,
        placementStatus: record.placementStatus ?? null
    };
}

function DescribeUvDecision(metadata, targetSize, placement)
{
    return {
        status: "experimental-policy",
        rule: "legacy-opengl-normalized-png-placement-v1",
        metadata: {
            status: metadata.source === "character-library" ? "retained" : "decoded",
            source: metadata.source ?? "png-bytes",
            sourcePath: metadata.sourcePath ?? null,
            encoding: metadata.placementEncoding ?? "png-oFFs-pHYs-millionths",
            policy: metadata.placementPolicy ?? null,
            imageSize: [ metadata.width, metadata.height ],
            offset: [ ...metadata.offset ],
            extent: [ ...metadata.extent ],
            targetSize: ResolveTargetSize(metadata),
            hasOffsetMetadata: metadata.hasOffsetMetadata === true,
            hasPlacementMetadata: metadata.hasPlacementMetadata === true
        },
        sourceBounds: Bounds(placement),
        destinationViewport: Viewport(targetSize, placement),
        correctness: "unverified"
    };
}

function NormalizeTextureMetadataIdentity(value)
{
    const path = String(value ?? "").trim().replace(/\\/gu, "/").toLowerCase();
    if (!/^res:\/.+\.(?:dds|png)$/u.test(path))
    {
        throw new TypeError(`Texture metadata requires a DDS or PNG res path: ${value}`);
    }
    return path.replace(/\.(?:dds|png)$/u, "");
}

function ResolveTargetSize(metadata)
{
    return [
        Math.round(metadata.width / metadata.extent[0]),
        Math.round(metadata.height / metadata.extent[1])
    ];
}

function RequireTargetSize(path, metadata, expected)
{
    const actual = ResolveTargetSize(metadata);
    if (actual[0] !== expected[0] || actual[1] !== expected[1])
    {
        throw new Error(`Texture atlas size mismatch for ${path}: ${actual.join("x")} != ${expected.join("x")}`);
    }
}

function RequireCompatibleTargetAspect(path, actual, expected)
{
    if (actual[0] * expected[1] !== actual[1] * expected[0])
    {
        throw new Error(
            `Texture atlas aspect mismatch for ${path}: ${actual.join("x")} != ${expected.join("x")}`
        );
    }
}

function Placement(metadata)
{
    return [ metadata.offset[0], metadata.offset[1], metadata.extent[0], metadata.extent[1] ];
}

function Bounds(placement)
{
    return [
        placement[0],
        placement[1],
        placement[0] + placement[2],
        placement[1] + placement[3]
    ];
}

function Viewport(size, placement)
{
    const left = Math.max(0, Math.round(placement[0] * size[0]));
    const bottom = Math.max(0, Math.round(placement[1] * size[1]));
    const right = Math.min(size[0], Math.round((placement[0] + placement[2]) * size[0]));
    const top = Math.min(size[1], Math.round((placement[1] + placement[3]) * size[1]));
    return [ left, bottom, Math.max(1, right - left), Math.max(1, top - bottom) ];
}

function RequireClass(tw2, name)
{
    const Constructor = tw2.GetClass?.(name) ?? tw2[name];
    if (typeof Constructor !== "function")
    {
        throw new Error(`The ccpwgl bundle does not register ${name}`);
    }
    return Constructor;
}
