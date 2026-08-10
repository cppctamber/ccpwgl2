const COLORIZED_BLIT_SHADER = "res:/graphics/effect.gles2/utility/compositing/colorizedblit.sm_hi";
const COPY_BLIT_SHADER = "res:/graphics/effect.gles2/utility/compositing/copyblit.sm_hi";
const SIMPLE_BLIT_SHADER = "res:/graphics/effect.gles2/utility/compositing/simpleblit.sm_hi";
const TRANSPARENT = "rgba:/0,0,0,0";
const SOLID_BLACK = "rgba:/0,0,0,255";
const SOLID_WHITE = "rgba:/255,255,255,255";
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

const BODY_ROLES = new Set([ "body", "torso", "legs", "hands", "feet" ]);

// D3D render-state identifiers consumed by the legacy ccpwgl effect wrapper.
const RS_ZENABLE = 7;
const RS_ZWRITEENABLE = 14;
const RS_SRCBLEND = 19;
const RS_DESTBLEND = 20;
const RS_CULLMODE = 22;
const RS_ALPHABLENDENABLE = 27;
const RS_COLORWRITEENABLE = 168;
const RS_SEPARATEALPHABLENDENABLE = 206;
const RS_SRCBLENDALPHA = 207;
const RS_DESTBLENDALPHA = 208;
const CULL_NONE = 1;
const BLEND_ONE = 2;
const BLEND_ZERO = 1;
const BLEND_SRCALPHA = 5;
const BLEND_INVSRCALPHA = 6;
const COLOR_WRITE_RGB = 0x7;
const COLOR_WRITE_ALPHA = 0x8;
const COLOR_WRITE_RGBA = 0xf;
const CONFIGURED_AUTHORED_PASS_STATE = {
    blend: false,
    colorWrite: COLOR_WRITE_RGBA
};
const CONFIGURED_CUT_PASS_STATE = {
    blend: true,
    colorWrite: COLOR_WRITE_ALPHA,
    sourceBlend: BLEND_ZERO,
    destinationBlend: BLEND_INVSRCALPHA,
    sourceBlendAlpha: BLEND_ZERO,
    destinationBlendAlpha: BLEND_INVSRCALPHA
};
const CONFIGURED_SHARED_PASS_STATE = {
    blend: false,
    colorWrite: COLOR_WRITE_RGB
};

/** Composes the temporary legacy body diffuse atlas from retained library evidence. */
export class CcpwglLegacyAtlasComposer
{
    #fetch;

    #metadata = new Map();

    #resourceRoot;

    #tw2;

    constructor({
        tw2 = globalThis.tw2,
        resourceRoot,
        fetchImpl = globalThis.fetch?.bind(globalThis)
    } = {})
    {
        if (!tw2 || typeof tw2.GetClass !== "function")
        {
            throw new TypeError("Legacy atlas composer requires the ccpwgl tw2 facade");
        }
        if (typeof fetchImpl !== "function")
        {
            throw new TypeError("Legacy atlas composer requires fetch");
        }
        if (!/\/\d+\/(?:res|resources)\/?$/u.test(String(resourceRoot ?? "")))
        {
            throw new TypeError("Legacy atlas composer requires an exact-build resource root");
        }

        this.#tw2 = tw2;
        this.#fetch = fetchImpl;
        this.#resourceRoot = String(resourceRoot).replace(/\/+$/u, "");
    }

    /** Composes and attaches one body diffuse atlas, retaining a detailed report. */
    async Compose(staged)
    {
        const basePath = BODY_FOUNDATIONS[staged?.sex];
        const contributions = staged?.textureContributions;

        if (!Array.isArray(contributions))
        {
            throw new TypeError("Legacy atlas composer requires texture contributions");
        }

        if (!basePath)
        {
            return { status: "deferred", reason: "foundation-sex-unresolved", passes: [] };
        }

        const planned = planLegacyBodyDiffuseOperations(contributions);
        const deferred = [ ...planned.deferred ];

        const baseMetadata = await this.#ReadMetadata(basePath);
        const targetSize = ResolveTargetSize(baseMetadata);
        const passes = [ await this.#CreateCopyPass(basePath, targetSize) ];
        const composedContributions = new Set();

        for (const operation of planned.operations)
        {
            try
            {
                const pass = operation.operation === "restore-base"
                    ? await this.#CreateCutMaskRestorePass(operation, basePath, targetSize)
                    : await this.#CreateColorizedPass(operation.candidate, targetSize);
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

        const RenderTarget = RequireClass(this.#tw2, "Tw2RenderTarget");
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
            RenderPasses(this.#tw2, target, passes);
            const attachments = attachLegacyBodyDiffuse(
                staged.backend?.visualModel,
                target.texture
            );
            if (!attachments.foundation)
            {
                throw new Error("No foundation body effect accepts the composed DiffuseMap");
            }
            const configuredConsumers = await this.#ComposeConfiguredConsumers(
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
            staged.compositionTargets.push(target, ...configuredConsumers.targets);
            staged.composedBodyDiffuseTexture = target.texture;
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

    /** Applies the exact, experimentally proven female basic-tuck coverage target. */
    async ComposeExactFemaleTuckSupport(staged, { usePantsRgb = false } = {})
    {
        if (typeof usePantsRgb !== "boolean")
        {
            throw new TypeError("Exact female tuck usePantsRgb option must be boolean");
        }
        const planned = planLegacyExactFemaleTuckSupport(
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

        const basePath = BODY_FOUNDATIONS[staged.sex];
        const baseMetadata = await this.#ReadMetadata(basePath);
        const targetSize = ResolveTargetSize(baseMetadata);
        const targetIndex = (staged.compositionTargets ?? []).length;
        let target = null;

        try
        {
            const passes = [
                await this.#CreateAuthoredConsumerCopyPass(planned.alphaPath, targetSize),
                await this.#CreateConsumerCutMaskPass(planned.maskPath, targetSize),
                usePantsRgb
                    ? await this.#CreateColorizedPass(
                        planned.pantsCandidate,
                        targetSize,
                        { rgbOnly: true }
                    )
                    : await this.#CreateSharedConsumerRgbPass(
                        staged.composedBodyDiffuseTexture,
                        targetSize
                    )
            ];
            const RenderTarget = RequireClass(this.#tw2, "Tw2RenderTarget");
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

            RenderPasses(this.#tw2, target, passes);
            const attachedEffects = commitLegacyConfiguredConsumerBindings(
                planned.effects,
                target.texture
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
                tuckPartIndex: planned.tuckPartIndex,
                tuckPartSourceRecordID: planned.tuckPartSourceRecordID,
                supportOwnerSelectionIndex: planned.supportOwnerSelectionIndex,
                alphaLayerIndex: planned.alphaLayerIndex,
                alphaPartSourceRecordID: planned.alphaPartSourceRecordID,
                alphaPath: planned.alphaPath,
                maskLayerIndex: planned.maskLayerIndex,
                maskPartSourceRecordID: planned.maskPartSourceRecordID,
                maskPath: planned.maskPath,
                pantsLayerIndex: planned.pantsLayerIndex,
                pantsPartSourceRecordID: planned.pantsPartSourceRecordID,
                pantsDetailPath: planned.pantsDetailPath,
                pantsZonePath: planned.pantsZonePath,
                pantsMaterialDefinitionPath: planned.pantsMaterialDefinitionPath,
                rgbSource: usePantsRgb ? "same-owner-pants-colorized" : "shared-body-comparison",
                attachedEffects,
                targetSize,
                previousSampleBounds: planned.previousSampleBounds,
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

        const basePath = BODY_FOUNDATIONS[staged.sex];
        const baseMetadata = await this.#ReadMetadata(basePath);
        const targetSize = ResolveTargetSize(baseMetadata);
        const targetIndex = (staged.compositionTargets ?? []).length;
        let target = null;

        try
        {
            const passes = [
                await this.#CreateAuthoredConsumerCopyPass(planned.alphaPath, targetSize),
                await this.#CreateSharedConsumerRgbPass(
                    staged.composedBodyDiffuseTexture,
                    targetSize
                )
            ];
            const RenderTarget = RequireClass(this.#tw2, "Tw2RenderTarget");
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

            RenderPasses(this.#tw2, target, passes);
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

        const basePath = BODY_FOUNDATIONS[staged.sex];
        const baseMetadata = await this.#ReadMetadata(basePath);
        const targetSize = ResolveTargetSize(baseMetadata);
        const targetIndex = (staged.compositionTargets ?? []).length;
        let target = null;

        try
        {
            const passes = [
                await this.#CreateAuthoredConsumerCopyPass(planned.alphaPath, targetSize),
                await this.#CreateSharedConsumerRgbPass(
                    staged.composedBodyDiffuseTexture,
                    targetSize
                )
            ];
            const RenderTarget = RequireClass(this.#tw2, "Tw2RenderTarget");
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

            RenderPasses(this.#tw2, target, passes);
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

        const basePath = BODY_FOUNDATIONS[staged.sex];
        const baseMetadata = await this.#ReadMetadata(basePath);
        const targetSize = ResolveTargetSize(baseMetadata);
        const maskMetadata = await this.#ReadMetadata(planned.maskPath);
        const maskPlacement = Placement(maskMetadata);
        RequireCompatibleTargetAspect(
            planned.maskPath,
            ResolveTargetSize(maskMetadata),
            targetSize
        );

        const passes = [
            await this.#CreateSolidCopyPass(SOLID_WHITE, targetSize),
            await this.#CreateFoundationCutMaskPass(
                planned.maskPath,
                maskPlacement,
                targetSize
            )
        ];
        const RenderTarget = RequireClass(this.#tw2, "Tw2RenderTarget");
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
            RenderPasses(this.#tw2, target, passes);
            if (!attach)
            {
                staged.compositionTargets ??= [];
                staged.compositionTargets.push(target);
                return {
                    ...planned,
                    status: "prepared-disabled",
                    rule: "legacy-opengl-female-boots-cut-mask-v1",
                    correctness: "comparison-control",
                    targetSize,
                    maskPlacement,
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
                rule: "legacy-opengl-female-boots-cut-mask-v1",
                correctness: "experimental-live-proof-pending",
                targetSize,
                maskPlacement,
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

    async #ComposeConfiguredConsumers(staged, sharedTexture, targetSize)
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
                const passes = [ await this.#CreateAuthoredConsumerCopyPass(
                    group.authoredDiffusePath,
                    targetSize
                ) ];

                for (const path of group.cutMaskPaths)
                {
                    passes.push(await this.#CreateConsumerCutMaskPass(path, targetSize));
                }
                passes.push(await this.#CreateSharedConsumerRgbPass(sharedTexture, targetSize));

                const RenderTarget = RequireClass(this.#tw2, "Tw2RenderTarget");
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

                RenderPasses(this.#tw2, target, passes);
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

    async #CreateCopyPass(path, targetSize)
    {
        const metadata = await this.#ReadMetadata(path);
        const placement = Placement(metadata);
        RequireTargetSize(path, metadata, targetSize);
        const Effect = RequireClass(this.#tw2, "Tw2Effect");
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

        await PrepareEffect(this.#tw2, effect, COPY_BLIT_SHADER);
        ApplyRenderStates(effect, false);
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

    async #CreateSolidCopyPass(path, targetSize)
    {
        const Effect = RequireClass(this.#tw2, "Tw2Effect");
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

        await PrepareEffect(this.#tw2, effect, COPY_BLIT_SHADER);
        ApplyRenderStates(effect, false);
        return {
            effect,
            viewport: [ 0, 0, targetSize[0], targetSize[1] ],
            report: { mode: "foundation-cut-white", shader: COPY_BLIT_SHADER }
        };
    }

    async #CreateFoundationCutMaskPass(path, placement, targetSize)
    {
        const Effect = RequireClass(this.#tw2, "Tw2Effect");
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

        await PrepareEffect(this.#tw2, effect, SIMPLE_BLIT_SHADER);
        ApplyRenderStates(effect, true);
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

    async #CreateColorizedPass(candidate, targetSize, { rgbOnly = false } = {})
    {
        if (typeof rgbOnly !== "boolean")
        {
            throw new TypeError("Colorized pass rgbOnly option must be boolean");
        }
        const [ detailMetadata, zoneMetadata ] = await Promise.all([
            this.#ReadMetadata(candidate.detail.path),
            this.#ReadMetadata(candidate.zones.path)
        ]);
        const detailPlacement = Placement(detailMetadata);
        const zonePlacement = Placement(zoneMetadata);

        RequireTargetSize(candidate.detail.path, detailMetadata, targetSize);
        RequireTargetSize(candidate.zones.path, zoneMetadata, targetSize);

        const Effect = RequireClass(this.#tw2, "Tw2Effect");
        const effect = Effect.from({
            effectFilePath: COLORIZED_BLIT_SHADER,
            autoParameter: true,
            parameters: {
                SourceUVs: Bounds(detailPlacement),
                ZoneReverseUV: zonePlacement,
                DetailReverseUV: detailPlacement,
                OverlayReverseUV: [ 0, 0, 1, 1 ],
                MaskReverseUV2: detailPlacement,
                Color1: candidate.colors[0],
                Color2: candidate.colors[1],
                Color3: candidate.colors[2],
                Strength: [ 1, 0, 0, 0 ],
                UseMask: [ 1, 0, 0, 0 ]
            },
            textures: {
                ZoneMap: candidate.zones.path,
                DetailMap: candidate.detail.path,
                OverlayMap: TRANSPARENT,
                MaskMap: candidate.detail.path
            }
        });

        await PrepareEffect(this.#tw2, effect, COLORIZED_BLIT_SHADER);
        // The ordinary atlas layer uses source alpha to blend over the shared
        // atlas. A configured support target already owns its final alpha, so
        // its RGB-only pass must replace RGB outright; blending here leaves
        // the support's prior grayscale RGB visible through translucent pixels.
        ApplyRenderStates(
            effect,
            !rgbOnly,
            rgbOnly ? { colorWrite: COLOR_WRITE_RGB } : {}
        );
        return {
            effect,
            viewport: Viewport(targetSize, detailPlacement),
            report: {
                mode: rgbOnly ? "colorized-rgb" : "colorized",
                rgbOperation: rgbOnly ? "replace" : "source-alpha-blend",
                shader: COLORIZED_BLIT_SHADER,
                layerIndex: candidate.contribution.layerIndex,
                groupID: candidate.contribution.groupID,
                materialDefinitionPath: candidate.contribution.source.materialDefinitionPath,
                detailPath: candidate.detail.path,
                zonePath: candidate.zones.path,
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

    async #CreateCutMaskRestorePass(operation, basePath, targetSize)
    {
        const metadata = await this.#ReadMetadata(operation.mask.path);
        const placement = Placement(metadata);
        const maskTargetSize = ResolveTargetSize(metadata);
        RequireCompatibleTargetAspect(operation.mask.path, maskTargetSize, targetSize);
        const Effect = RequireClass(this.#tw2, "Tw2Effect");
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

        await PrepareEffect(this.#tw2, effect, SIMPLE_BLIT_SHADER);
        ApplyRenderStates(effect, true);
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

    async #CreateAuthoredConsumerCopyPass(path, targetSize)
    {
        const metadata = await this.#ReadMetadata(path);
        const placement = Placement(metadata);
        const sourceTargetSize = ResolveTargetSize(metadata);
        RequireCompatibleTargetAspect(path, sourceTargetSize, targetSize);
        const Effect = RequireClass(this.#tw2, "Tw2Effect");
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

        await PrepareEffect(this.#tw2, effect, COPY_BLIT_SHADER);
        ApplyConfiguredConsumerRenderStates(effect, CONFIGURED_AUTHORED_PASS_STATE);
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

    async #CreateConsumerCutMaskPass(path, targetSize)
    {
        const metadata = await this.#ReadMetadata(path);
        const placement = Placement(metadata);
        const maskTargetSize = ResolveTargetSize(metadata);
        RequireCompatibleTargetAspect(path, maskTargetSize, targetSize);
        const Effect = RequireClass(this.#tw2, "Tw2Effect");
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

        await PrepareEffect(this.#tw2, effect, SIMPLE_BLIT_SHADER);
        ApplyConfiguredConsumerRenderStates(effect, CONFIGURED_CUT_PASS_STATE);
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

    async #CreateSharedConsumerRgbPass(sharedTexture, targetSize)
    {
        const Effect = RequireClass(this.#tw2, "Tw2Effect");
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

        await PrepareEffect(this.#tw2, effect, COPY_BLIT_SHADER);
        ApplyConfiguredConsumerRenderStates(effect, CONFIGURED_SHARED_PASS_STATE);
        return {
            effect,
            viewport: [ 0, 0, targetSize[0], targetSize[1] ],
            report: {
                mode: "configured-shared-rgb",
                shader: COPY_BLIT_SHADER,
                placement: [ 0, 0, 1, 1 ]
            }
        };
    }

    async #ReadMetadata(path)
    {
        if (!this.#metadata.has(path))
        {
            this.#metadata.set(path, this.#FetchMetadata(path).catch(error =>
            {
                this.#metadata.delete(path);
                throw error;
            }));
        }
        return this.#metadata.get(path);
    }

    async #FetchMetadata(path)
    {
        const response = await this.#fetch(ToResourceURL(this.#resourceRoot, path));
        if (!response?.ok)
        {
            throw new Error(`Texture metadata request failed with HTTP ${response?.status ?? "unknown"}: ${path}`);
        }

        const metadata = parsePngAtlasMetadata(await response.arrayBuffer());
        if (!metadata)
        {
            throw new Error(`Texture has no readable PNG atlas metadata: ${path}`);
        }
        return metadata;
    }
}

/** Resolves one retained contribution for the bounded legacy body-diffuse proof. */
export function resolveLegacyBodyDiffuseContribution(contribution)
{
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
    if (String(contribution.materialValues?.pattern ?? "").trim())
    {
        return { status: "deferred", reason: "pattern-composition-unresolved" };
    }

    return {
        status: "ready",
        candidate: { contribution, detail, zones, colors }
    };
}

/**
 * Orders the bounded body-diffuse proof without dropping mask-only sources.
 * A typed owner mask restores the foundation immediately before that owner's
 * first colorized contribution. Other mask semantics remain deferred.
 */
export function planLegacyBodyDiffuseOperations(contributions)
{
    if (!Array.isArray(contributions))
    {
        throw new TypeError("Legacy body diffuse contributions must be an array");
    }

    const entries = contributions.map(contribution => ({
        contribution,
        resolved: resolveLegacyBodyDiffuseContribution(contribution),
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
    const deferred = [];
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
            continue;
        }

        const hasColorizeInput = (entry.contribution?.selectedTextures ?? []).some(value =>
            value?.target === "body"
            && (value?.role === "colorize-layer" || value?.role === "colorize-zones"));
        if (!entry.masks.length || hasColorizeInput)
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

/** Selects only the retained mask owned by the exact ready female boot. */
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

    const boots = configuredParts.filter(part => part?.partSourceRecordID === FEMALE_BOOT_PART);
    if (boots.length !== 1)
    {
        return { status: "deferred", reason: "exact-female-boot-unresolved" };
    }
    const boot = boots[0];
    if (boot.renderStatus !== "ready")
    {
        return { status: "deferred", reason: "exact-female-boot-not-render-ready" };
    }

    const bootContributions = contributions.filter(contribution =>
        contribution?.partIndex === boot.partIndex
        && contribution?.source?.partSourceRecordID === FEMALE_BOOT_PART);
    if (bootContributions.length !== 1
        || !Number.isInteger(bootContributions[0].ownerSelectionIndex)
        || bootContributions[0].ownerSelectionIndex < 0)
    {
        return { status: "deferred", reason: "exact-female-boot-owner-unresolved" };
    }
    const bootOwnerSelectionIndex = bootContributions[0].ownerSelectionIndex;

    const candidates = contributions.flatMap(contribution =>
    {
        if (contribution?.ownerSelectionIndex !== bootOwnerSelectionIndex
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

    if (candidates.length !== 1)
    {
        return { status: "deferred", reason: "exact-female-boot-mask-unresolved" };
    }

    return {
        status: "ready",
        bootPartIndex: boot.partIndex,
        bootPartSourceRecordID: boot.partSourceRecordID,
        bootOwnerSelectionIndex,
        maskLayerIndex: candidates[0].contribution.layerIndex,
        maskPartSourceRecordID: candidates[0].contribution.source.partSourceRecordID,
        maskPath: candidates[0].texture.path
    };
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

/** Returns the exact legacy render-state contract used by configured consumers. */
export function getLegacyConfiguredConsumerPassContract()
{
    return {
        authored: { ...CONFIGURED_AUTHORED_PASS_STATE },
        cut: { ...CONFIGURED_CUT_PASS_STATE },
        shared: { ...CONFIGURED_SHARED_PASS_STATE }
    };
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
export function commitLegacyConfiguredConsumerBindings(effects, texture)
{
    effects = Unique(effects);
    const snapshots = effects.map(CaptureConsumerBinding);

    try
    {
        for (const effect of effects)
        {
            if (!SetIdentityTransformUV0(effect))
            {
                throw new Error("Configured consumer does not accept TransformUV0");
            }
        }
        for (const effect of effects)
        {
            effect.parameters.DiffuseMap.AttachTextureRes(texture);
        }
        return effects.length;
    }
    catch (cause)
    {
        const error = new Error(cause.message, { cause });
        error.rollbackFailures = RestoreConsumerBindings(snapshots);
        throw error;
    }
}

/**
 * Attaches the full body atlas to authored foundation consumers and only to
 * demo-owned configured fallback effects. Private authored garment maps stay
 * untouched.
 */
export function attachLegacyBodyDiffuse(visualModel, texture)
{
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
        const configuredProof = Number.isInteger(mesh?._characterPartIndex);
        if (!foundation && !configuredProof) continue;

        for (const effect of GetEffects([ mesh ]))
        {
            if (seen.has(effect)) continue;
            if (!foundation && effect?._characterProofFallback !== true) continue;
            const parameter = effect?.parameters?.DiffuseMap;
            if (typeof parameter?.AttachTextureRes !== "function") continue;
            const previousSampleBounds = ReadTransformUV0(effect);
            if (!foundation && !SetIdentityTransformUV0(effect)) continue;
            parameter.AttachTextureRes(texture);
            if (!foundation)
            {
                result.configuredProof++;
                configuredPartIndices.add(mesh._characterPartIndex);
                result.configuredProofBindings.push({
                    status: "experimental-policy",
                    rule: "legacy-opengl-full-atlas-identity-v1",
                    correctness: "unverified",
                    partIndex: mesh._characterPartIndex,
                    groupID: mesh._characterGroupID ?? null,
                    partSourceRecordID: mesh._characterPartSourceRecordID ?? null,
                    effectFilePath: effect.effectFilePath ?? null,
                    previousSampleBounds,
                    sampleBounds: [ 0, 0, 1, 1 ],
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

function ReadTransformUV0(effect)
{
    const parameter = effect?.parameters?.TransformUV0;
    if (!parameter) return null;

    try
    {
        const value = typeof parameter.GetValue === "function"
            ? parameter.GetValue([])
            : parameter.value;
        if (!value || typeof value.length !== "number" || value.length < 4) return null;
        const result = Array.from(value).slice(0, 4).map(Number);
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
    if (typeof effect?.SetParameters !== "function") return false;
    const identity = [ 0, 0, 1, 1 ];
    const current = ReadTransformUV0(effect);
    if (current?.every((value, index) => value === identity[index])) return true;
    return effect.SetParameters({ TransformUV0: identity }) !== false;
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
        textureRes: parameter.textureRes ?? null,
        resourcePath: String(parameter.resourcePath ?? ""),
        isAttached: parameter.isAttached === true
    };
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

function ApplyRenderStates(effect, blend, {
    colorWrite = COLOR_WRITE_RGBA,
    sourceBlend = BLEND_SRCALPHA,
    destinationBlend = BLEND_INVSRCALPHA,
    sourceBlendAlpha = BLEND_ONE,
    destinationBlendAlpha = BLEND_INVSRCALPHA
} = {})
{
    for (const technique of Object.keys(effect.techniques ?? {}))
    {
        const passCount = effect.GetPassCount?.(technique) ?? 0;
        for (let pass = 0; pass < passCount; pass++)
        {
            effect.SetTechniquePassStateOverride(technique, pass, RS_ZENABLE, 0);
            effect.SetTechniquePassStateOverride(technique, pass, RS_ZWRITEENABLE, 0);
            effect.SetTechniquePassStateOverride(technique, pass, RS_CULLMODE, CULL_NONE);
            effect.SetTechniquePassStateOverride(technique, pass, RS_COLORWRITEENABLE, colorWrite);
            effect.SetTechniquePassStateOverride(technique, pass, RS_ALPHABLENDENABLE, blend ? 1 : 0);
            if (!blend) continue;
            effect.SetTechniquePassStateOverride(technique, pass, RS_SRCBLEND, sourceBlend);
            effect.SetTechniquePassStateOverride(technique, pass, RS_DESTBLEND, destinationBlend);
            effect.SetTechniquePassStateOverride(technique, pass, RS_SEPARATEALPHABLENDENABLE, 1);
            effect.SetTechniquePassStateOverride(technique, pass, RS_SRCBLENDALPHA, sourceBlendAlpha);
            effect.SetTechniquePassStateOverride(technique, pass, RS_DESTBLENDALPHA, destinationBlendAlpha);
        }
    }
}

function ApplyConfiguredConsumerRenderStates(effect, contract)
{
    const { blend, ...states } = contract;
    ApplyRenderStates(effect, blend, states);
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
                if (!tw2.device.RenderFullScreenQuad(pass.effect))
                {
                    throw new Error(`${pass.effect.effectFilePath} did not render`);
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

function DescribeUvDecision(metadata, targetSize, placement)
{
    return {
        status: "experimental-policy",
        rule: "legacy-opengl-normalized-png-placement-v1",
        metadata: {
            status: "decoded",
            encoding: "png-oFFs-pHYs-millionths",
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

function ToResourceURL(root, path)
{
    const value = String(path ?? "");
    if (!/^res:\//iu.test(value)) throw new TypeError("Legacy atlas source must be a res:/ path");
    return `${root}/${value.slice(5)}`;
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

export default CcpwglLegacyAtlasComposer;
