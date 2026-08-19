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
const LEGACY_GLASS_IRRADIANCE = "res:/graphics/shared_texture/global/white_cube.dds";
const HEAD_BASE_SKIN_ORDER = 0;
const HEAD_COMPOSITION_GROUP_ORDER = new Map([
    // The selected skintype is an authored whole-skin colourization input.
    // Keep it immediately above the resolved base skintone and below every
    // additive appearance layer. The legacy GLES reference used the same
    // selected skin contribution for both head and body atlases; admitting it
    // here closes that region split without making the reference authoritative.
    [ "skintype", 1 ],
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
    [ "hair", 95 ],
    [ "makeup/eyebrows", 100 ],
    [ "makeup/implants", 110 ],
    [ "makeup/blush", 120 ],
    [ "makeup/eyeliner", 130 ],
    [ "makeup/lipstick", 140 ]
]);
const PROVED_HEAD_SKIN_MAKEUP_GROUPS = new Set([
    ...[ ...HEAD_COMPOSITION_GROUP_ORDER.keys() ].filter(value => value !== "tattoo/head")
]);
const BODY_SKIN_AUGMENTATION_GROUPS = [
    "makeup/bodyaugmentations",
    "makeup/armleft",
    "makeup/armright"
];
const BODY_COMPOSITION_GROUP_ORDER = new Map([
    ...HEAD_COMPOSITION_GROUP_ORDER,
    // Body augmentations are painted onto skin. Authored underwear and
    // texture-drawn tops then replace their diffuse and lighting channels only
    // inside their own coverage. Keeping this category order explicit makes
    // diffuse, normal, and specular independent of resolver inventory order.
    ...BODY_SKIN_AUGMENTATION_GROUPS.map(groupID => [ groupID, 150 ]),
    // Garment categories intentionally share a rank. Their retained relative
    // order is preserved while every garment remains above skin augmentation.
    [ "topinner", 200 ],
    [ "topunderwear", 200 ],
    [ "bottominner", 200 ],
    [ "bottomunderwear", 200 ],
    [ "topmiddle", 200 ],
    [ "bottomouter", 200 ],
    [ "feet", 200 ],
    [ "topouter", 200 ],
    [ "outer", 200 ]
]);
const PROVED_BODY_SKIN_MAKEUP_GROUPS = new Set([
    ...PROVED_HEAD_SKIN_MAKEUP_GROUPS,
    ...BODY_SKIN_AUGMENTATION_GROUPS,
    "bottominner",
    "bottomunderwear",
    "topinner",
    "topunderwear",
    "topmiddle"
]);
const NEUTRAL_SPECULAR = "res:/dx9/model/decal/shared/bw_000_000_015.dds";
const MATERIAL_ONLY_ACCESSORY_VECTOR_LENGTHS = Object.freeze({
    MaterialLibraryID: 4,
    MaterialSpecularCurve: 4,
    MaterialSpecularFactors: 4,
    FresnelFactors: 4,
    FilmicMappingParams1: 4,
    FilmicMappingParams2: 4,
    MaterialCubeReflection: 4,
    MaterialCubeReflectionControl: 4
});
const FEMALE_BOOT_PART = "female/feet/bootscf01";
const FEMALE_BOOT_MASK_PART = "female/dependants/bootmasks/bootmaskshin";
const FEMALE_BOOT_MASK_PATH = "res:/graphics/character/female/paperdoll/dependants/bootmasks/bootmaskshin/comp_body_m.png";
const FEMALE_UPPER_SLEEVE_PART = "female/dependants/sleevesupper/creased_01";
const FEMALE_LOWER_SLEEVE_PART = "female/dependants/sleeveslower/longcreased_01";
const FEMALE_TUCK_TOP_PART = "female/topmiddle/shirtcf01";
const FEMALE_TUCK_TOP_ALPHA_PATH = "res:/graphics/character/female/paperdoll/topmiddle/shirtcf01/colorize_body_l_4k.png";
const STANDARD_DRAPE_PART_PATH = "dependants/drape/standard";

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
export function resolveLegacyBodyFoundationSpecularPath(staged, contributions = [])
{
    const selected = (staged?.construction?.operations ?? []).filter(operation =>
        operation?.operation === "configured-foundation"
        && operation?.role === "head"
        && (operation?.skinEvidence?.rule === "exact-skintone-prs-archetype-foundation-v1"
            || operation?.skinEvidence?.bodySpecularRule
                === "exact-foundation-diffuse-token-specular-match-v1")
        && /^res:\//iu.test(String(operation?.skinEvidence?.bodySpecularPath ?? "")));
    if (selected.length === 1) return selected[0].skinEvidence.bodySpecularPath;
    if (selected.length > 1 || !Array.isArray(contributions)) return null;

    const selectedSkin = contributions.filter(contribution =>
        contribution?.groupID === "skintype"
        && !(Array.isArray(contribution?.occludedBy) && contribution.occludedBy.length))
        .flatMap(contribution => (contribution?.selectedTextures ?? []).filter(texture =>
            texture?.target === "body"
            && texture?.role === "specular-source"
            && /^res:\//iu.test(String(texture?.path ?? ""))));
    return selectedSkin.length === 1 ? selectedSkin[0].path : null;
}

/** Composes the temporary legacy body diffuse atlas from retained library evidence. */
export class TnyGlesAtlasComposer
{
    _configuredPasses;

    _d3d;

    _metadata = new Map();

    _textureMetadataSource = null;

    _headNormalMode;

    _headMaterialMode;

    _browSupportEnabled;

    _browLightingMode;

    _browDiffuseColorMode;

    _tearductsEnabled;

    _tearductLightingMode;

    _tearductUvMode;

    _tearductDiffuseMode;

    _eyeWetEnabled;

    _eyeWetMaterialMode;

    _eyeballsEnabled;

    _eyelashCarrierMode;

    _eyelashUvMode;

    _eyelashDepthMode;

    _eyelashAlphaMode;

    _eyeShadowDiffuseMode;

    _eyeShadowLightingMode;

    _skinLightingMode;

    _skinDiffuseMode;

    _hairLightingMode;

    _hairMaterialMode;

    _glassLightingMode;

    _tattooTextureOffsetY;

    _characterAtlasLayout;

    constructor({
        headNormalMode = "detail",
        headMaterialMode = "authored",
        skinLightingMode = "authored",
        skinDiffuseMode = "authored",
        hairLightingMode = "neutral-specular",
        hairMaterialMode = "selected",
        glassLightingMode = "transmission",
        tattooTextureOffsetY = 0,
        characterAtlasLayout = null,
        browSupportEnabled = true,
        browLightingMode = "authored",
        browDiffuseColorMode = "authored",
        tearductsEnabled = true,
        tearductLightingMode = "authored",
        tearductUvMode = "authored",
        tearductDiffuseMode = "base",
        eyeWetEnabled = true,
        eyeWetMaterialMode = "composed",
        eyeballsEnabled = true,
        eyelashCarrierMode = "all",
        eyelashUvMode = "carrier-specific",
        eyelashDepthMode = "authored",
        eyelashAlphaMode = "source",
        eyeShadowDiffuseMode = "lash",
        eyeShadowLightingMode = "authored"
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
        if (![ "authored", "body-default" ].includes(headMaterialMode))
        {
            throw new TypeError(
                "GLES atlas headMaterialMode must be authored or body-default"
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
        if (![ "authored", "solid", "base", "basecolor", "colorized", "replace" ].includes(
            skinDiffuseMode
        ))
        {
            throw new TypeError(
                "GLES atlas skinDiffuseMode must be authored, solid, base, basecolor, colorized, or replace"
            );
        }
        if (![ "authored", "neutral", "neutral-normal", "neutral-specular" ].includes(
            hairLightingMode
        ))
        {
            throw new TypeError(
                "GLES atlas hairLightingMode must be authored, neutral, neutral-normal, or neutral-specular"
            );
        }
        if (![ "selected", "authored" ].includes(hairMaterialMode))
        {
            throw new TypeError(
                "GLES atlas hairMaterialMode must be selected or authored"
            );
        }
        if (![ "transmission", "authored", "legacy" ].includes(glassLightingMode))
        {
            throw new TypeError(
                "GLES atlas glassLightingMode must be transmission, authored, or legacy"
            );
        }
        if (!Number.isFinite(tattooTextureOffsetY))
        {
            throw new TypeError("GLES atlas tattooTextureOffsetY must be finite");
        }
        if (characterAtlasLayout !== null
            && typeof characterAtlasLayout?.getNormalizedRect !== "function")
        {
            throw new TypeError(
                "GLES atlas characterAtlasLayout must expose getNormalizedRect"
            );
        }
        if (typeof browSupportEnabled !== "boolean"
            || typeof tearductsEnabled !== "boolean"
            || typeof eyeWetEnabled !== "boolean"
            || typeof eyeballsEnabled !== "boolean")
        {
            throw new TypeError("GLES face comparison controls must be boolean");
        }
        if (![ "authored", "neutral" ].includes(browLightingMode))
        {
            throw new TypeError("GLES browLightingMode must be authored or neutral");
        }
        if (![ "authored", "neutral" ].includes(browDiffuseColorMode))
        {
            throw new TypeError("GLES browDiffuseColorMode must be authored or neutral");
        }
        if (![ "authored", "neutral" ].includes(tearductLightingMode))
        {
            throw new TypeError("GLES tearductLightingMode must be authored or neutral");
        }
        if (![ "authored", "identity" ].includes(tearductUvMode))
        {
            throw new TypeError("GLES tearductUvMode must be authored or identity");
        }
        if (![ "composed", "base", "dark" ].includes(tearductDiffuseMode))
        {
            throw new TypeError("GLES tearductDiffuseMode must be composed, base, or dark");
        }
        if (![ "retained", "composed" ].includes(eyeWetMaterialMode))
        {
            throw new TypeError(
                "GLES eyeWetMaterialMode must be retained or composed"
            );
        }
        if (![ "all", "off", "eyelashes-off", "eyeshadow-off" ].includes(eyelashCarrierMode))
        {
            throw new TypeError(
                "GLES eyelashCarrierMode must be all, off, eyelashes-off, or eyeshadow-off"
            );
        }
        if (![ "carrier-specific", "identity", "raw-direct" ].includes(eyelashUvMode))
        {
            throw new TypeError(
                "GLES eyelashUvMode must be carrier-specific, identity, or raw-direct"
            );
        }
        if (![ "authored", "test-no-write", "off" ].includes(eyelashDepthMode))
        {
            throw new TypeError(
                "GLES eyelashDepthMode must be authored, test-no-write, or off"
            );
        }
        if (![ "source", "weighted" ].includes(eyelashAlphaMode))
        {
            throw new TypeError("GLES eyelashAlphaMode must be source or weighted");
        }
        if (![ "lash", "transparent" ].includes(eyeShadowDiffuseMode))
        {
            throw new TypeError(
                "GLES eyeShadowDiffuseMode must be lash or transparent"
            );
        }
        if (![ "authored", "neutral" ].includes(eyeShadowLightingMode))
        {
            throw new TypeError(
                "GLES eyeShadowLightingMode must be authored or neutral"
            );
        }
        this._d3d = RequireD3DConstants(tw2.const);
        this._configuredPasses = CreateConfiguredConsumerPassContract(this._d3d);
        this._headNormalMode = headNormalMode;
        this._headMaterialMode = headMaterialMode;
        this._skinLightingMode = skinLightingMode;
        this._skinDiffuseMode = skinDiffuseMode;
        this._hairLightingMode = hairLightingMode;
        this._hairMaterialMode = hairMaterialMode;
        this._glassLightingMode = glassLightingMode;
        this._tattooTextureOffsetY = tattooTextureOffsetY;
        this._characterAtlasLayout = characterAtlasLayout;
        this._browSupportEnabled = browSupportEnabled;
        this._browLightingMode = browLightingMode;
        this._browDiffuseColorMode = browDiffuseColorMode;
        this._tearductsEnabled = tearductsEnabled;
        this._tearductLightingMode = tearductLightingMode;
        this._tearductUvMode = tearductUvMode;
        this._tearductDiffuseMode = tearductDiffuseMode;
        this._eyeWetEnabled = eyeWetEnabled;
        this._eyeWetMaterialMode = eyeWetMaterialMode;
        this._eyeballsEnabled = eyeballsEnabled;
        this._eyelashCarrierMode = eyelashCarrierMode;
        this._eyelashUvMode = eyelashUvMode;
        this._eyelashDepthMode = eyelashDepthMode;
        this._eyelashAlphaMode = eyelashAlphaMode;
        this._eyeShadowDiffuseMode = eyeShadowDiffuseMode;
        this._eyeShadowLightingMode = eyeShadowLightingMode;
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
        const notApplicable = [ ...planned.notApplicable ];

        const baseMetadata = await this._ReadMetadata(basePath);
        const targetSize = ResolveTargetSize(baseMetadata);
        const diagnosticDiffuse = this._skinDiffuseMode !== "authored";
        const skinBaseColorPath = ResolveSkinBaseColorPath(staged);
        const solidBase = [ "solid", "basecolor", "colorized" ].includes(
            this._skinDiffuseMode
        );
        if (this._skinDiffuseMode === "basecolor" && !skinBaseColorPath)
        {
            throw new Error("Selected skin base colour is unresolved");
        }
        const basePass = solidBase
            ? await this._CreateSolidCopyPass(
                this._skinDiffuseMode === "basecolor" ? skinBaseColorPath : SOLID_WHITE,
                targetSize
            )
            : await this._CreateCopyPass(basePath, targetSize);
        if (solidBase)
        {
            basePass.report = {
                mode: this._skinDiffuseMode === "basecolor"
                    ? "retained-skin-base-color"
                    : "diagnostic-solid-diffuse",
                shader: COPY_BLIT_SHADER,
                path: this._skinDiffuseMode === "basecolor"
                    ? skinBaseColorPath
                    : SOLID_WHITE,
                placement: [ 0, 0, 1, 1 ]
            };
        }
        const passes = [ basePass ];
        const skinColorization = ResolveSkinColorizationCandidate(staged, "body");
        if (skinColorization
            && [ "authored", "basecolor", "colorized", "replace" ].includes(
                this._skinDiffuseMode
            ))
        {
            // The skin L map supplies colour detail, not coverage. Treating its
            // alpha as a mask leaves the independently authored head/body bases
            // visible by different amounts and creates a colour seam at the neck.
            passes.push(await this._CreateColorizedPass(
                skinColorization,
                targetSize,
                {
                    useDetailMask: false,
                    rgbOnly: this._skinDiffuseMode === "replace",
                    blend: this._skinDiffuseMode !== "replace"
                }
            ));
        }
        const composedContributions = new Set();

        for (const operation of diagnosticDiffuse ? [] : planned.operations)
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
                diagnosticMode: this._skinDiffuseMode,
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
                applicableContributionCount: contributions.length
                    - new Set(notApplicable.map(value => value.layerIndex)).size,
                notApplicableContributionCount: new Set(
                    notApplicable.map(value => value.layerIndex)
                ).size,
                composedContributionCount: composedContributions.size,
                deferredContributionCount: new Set(deferred.map(value => value.layerIndex)).size,
                passes: passes.map(value => value.report),
                deferred,
                notApplicable
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
        const basePath = resolveLegacyBodyFoundationSpecularPath(staged, contributions);
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

        const operations = neutral ? [] : planned.specular.filter(operation =>
            !(operation.groupID === "skintype"
                && operation.role === "specular-source"
                && operation.path === basePath));
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

    /**
     * Composes configured accessories from one exact retained target tuple.
     *
     * The selected texture roles decide whether a private consumer owns the
     * head or accessory texture space. Mixed targets and skin-hybrid consumers
     * remain deferred rather than being inferred from an accessory family.
     */
    async ComposeConfiguredAccessoryMaterials(staged)
    {
        const report = {
            status: "deferred",
            rule: "legacy-opengl-configured-accessory-material-v2",
            correctness: "retained-source-policy-live-proof",
            applied: [],
            deferred: []
        };

        for (const binding of staged?.configuredPartBindings ?? [])
        {
            const part = binding?.configuredPart;
            if (!String(part?.groupID ?? "").startsWith("accessories/")) continue;

            const contribution = staged.textureContributions?.find(value =>
                value.partIndex === part?.partIndex);
            const consumers = resolveLegacyConfiguredAccessoryConsumers(
                binding?.configuredMeshes ?? []
            );
            const effects = consumers.materialEffects;
            const glassEffects = consumers.glassEffects;
            const hybridEffects = consumers.hybridEffects;
            if (!effects.length && !hybridEffects.length && !glassEffects.length) continue;
            if (hybridEffects.length)
            {
                report.deferred.push({
                    partIndex: part?.partIndex ?? null,
                    groupID: part?.groupID ?? null,
                    partSourceRecordID: part?.partSourceRecordID ?? null,
                    reason: "accessory-skin-hybrid-consumer-unqualified"
                });
                continue;
            }

            const resolved = resolveLegacyConfiguredAccessoryMaterial(contribution);
            if (resolved.status !== "ready")
            {
                const materialOnly = resolveLegacyConfiguredMaterialOnlyAccessory(
                    effects,
                    contribution
                );
                if (materialOnly.status === "ready")
                {
                    try
                    {
                        const committed = await commitLegacyConfiguredMaterialOnlyAccessoryBindings(
                            effects,
                            materialOnly.contracts,
                            binding.configuredMeshes
                        );
                        const activeEffects = committed.activeEffects ?? effects;
                        part.materialStatus = "configured-accessory-material-only-policy";
                        part.compositionStatus = "configured-accessory-material-only-attached";
                        report.applied.push({
                            partIndex: part.partIndex,
                            groupID: part.groupID,
                            partSourceRecordID: part.partSourceRecordID,
                            target: "material-library",
                            materialDefinitionPath: contribution?.source?.materialDefinitionPath
                                ?? null,
                            realizationStatus: "complete",
                            attachedEffects: committed.attachedEffects,
                            bindings: DescribeConfiguredGarmentBindings(
                                binding.configuredMeshes,
                                activeEffects
                            ),
                            materialOnly: committed
                        });
                    }
                    catch (error)
                    {
                        report.deferred.push({
                            partIndex: part?.partIndex ?? null,
                            groupID: part?.groupID ?? null,
                            partSourceRecordID: part?.partSourceRecordID ?? null,
                            reason: error.message
                        });
                    }
                    continue;
                }
                report.deferred.push({
                    partIndex: part?.partIndex ?? null,
                    groupID: part?.groupID ?? null,
                    partSourceRecordID: part?.partSourceRecordID ?? null,
                    reason: resolved.reason,
                    materialOnlyReason: materialOnly.reason
                });
                continue;
            }

            const metadata = await this._ReadMetadata(resolved.candidate.detail.path);
            const targetSize = ResolveTargetSize(metadata);
            const surface = await this._ComposeConfiguredGarmentSurface(
                staged,
                part,
                resolved.candidate,
                effects,
                targetSize,
                `private-accessory-${resolved.target}`,
                resolved.materialChannels,
                { glassEffects }
            );
            if (![ "applied", "partial" ].includes(surface.status))
            {
                report.deferred.push({
                    partIndex: part.partIndex,
                    groupID: part.groupID,
                    partSourceRecordID: part.partSourceRecordID,
                    target: resolved.target,
                    reason: surface.reason
                });
                continue;
            }

            const deferredConsumerCount = consumers.deferredConsumers.length;
            const partial = surface.status === "partial" || deferredConsumerCount > 0;
            const diffuseMode = resolved.candidate.mode === "baked-direct"
                ? "baked"
                : "colorized";
            part.materialStatus = `configured-accessory-${diffuseMode}-${partial ? "partial" : "policy"}`;
            part.compositionStatus = `configured-accessory-${diffuseMode}-${partial ? "partial" : "attached"}`;
            if (partial)
            {
                if (surface.status === "partial")
                {
                    report.deferred.push({
                        partIndex: part.partIndex,
                        groupID: part.groupID,
                        partSourceRecordID: part.partSourceRecordID,
                        target: resolved.target,
                        channel: "lighting",
                        reason: surface.reason
                    });
                }
                report.deferred.push(...consumers.deferredConsumers.map(value => ({
                    partIndex: part.partIndex,
                    groupID: part.groupID,
                    partSourceRecordID: part.partSourceRecordID,
                    target: resolved.target,
                    ...value
                })));
            }
            report.applied.push({
                partIndex: part.partIndex,
                groupID: part.groupID,
                partSourceRecordID: part.partSourceRecordID,
                target: resolved.target,
                materialDefinitionPath: contribution.source.materialDefinitionPath,
                detailPath: resolved.candidate.detail.path,
                diffuseMode: resolved.candidate.mode,
                zonePath: resolved.candidate.zones?.path ?? null,
                colors: resolved.candidate.colors?.map(color => [ ...color ]) ?? null,
                materialChannels: resolved.materialChannels,
                retainedCutMasks: resolved.retainedCutMasks,
                targetSize,
                realizationStatus: partial ? "partial" : "complete",
                attachedEffects: surface.attachedEffects,
                consumerPartitions: {
                    privateMaterial: effects.length,
                    transparentGlass: glassEffects.length,
                    retainedAuthored: consumers.retainedEffects.length,
                    deferred: deferredConsumerCount
                },
                bindings: DescribeConfiguredGarmentBindings(
                    binding.configuredMeshes,
                    [ ...effects, ...glassEffects ]
                ),
                surface
            });
        }

        if (report.applied.length) report.status = "applied";
        return report;
    }

    /** Composes each configured non-skin surface from its own retained textures. */
    async ComposeConfiguredGarmentMaterials(staged)
    {
        const report = {
            status: "deferred",
            rule: "legacy-opengl-configured-garment-material-v2",
            correctness: "structurally-tested-live-proof-pending",
            applied: [],
            deferred: []
        };

        for (const binding of staged?.configuredPartBindings ?? [])
        {
            const part = binding?.configuredPart;
            if (String(part?.groupID ?? "").startsWith("accessories/")) continue;
            if (part?.groupID === "hair"
                && [
                    "configured-hair-attached",
                    "configured-headwear-attached"
                ].includes(part?.compositionStatus))
            {
                continue;
            }
            const contribution = staged.textureContributions?.find(value =>
                value.partIndex === part?.partIndex);
            const allEffects = GetEffects(binding?.configuredMeshes ?? []);
            const effects = allEffects.filter(effect =>
                effect?._characterGarmentMaterialFallback === true);
            const hybridEffects = allEffects.filter(effect =>
                effect?._characterGarmentBodyFallback === true
                && !effect?._characterFoundationReplacementRole);

            if (!effects.length && !hybridEffects.length) continue;

            const resolved = resolveLegacyConfiguredGarmentDiffuseContribution(
                contribution
            );
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
            const expectedSurfaceCount = Number(effects.length > 0)
                + Number(hybridEffects.length > 0);
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
                if ([ "applied", "partial" ].includes(surfaceResult.status))
                {
                    surfaces.push(surfaceResult);
                    if (surfaceResult.status === "partial")
                    {
                        report.deferred.push({
                            partIndex: part.partIndex,
                            groupID: part.groupID,
                            partSourceRecordID: part.partSourceRecordID,
                            surface,
                            channel: "lighting",
                            reason: surfaceResult.reason
                        });
                    }
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
            const bakedDirect = resolved.candidate.mode === "baked-direct";
            const partial = surfaces.length !== expectedSurfaceCount
                || surfaces.some(value => value.status !== "applied");
            const materialPrefix = bakedDirect
                ? "configured-garment-baked"
                : "configured-garment-colorized";
            part.materialStatus = `${materialPrefix}-${partial ? "partial" : "policy"}`;
            part.compositionStatus = `${materialPrefix}-${partial ? "partial" : "attached"}`;
            report.applied.push({
                partIndex: part.partIndex,
                groupID: part.groupID,
                partSourceRecordID: part.partSourceRecordID,
                materialDefinitionPath: contribution.source.materialDefinitionPath,
                detailPath: resolved.candidate.detail.path,
                diffuseMode: resolved.candidate.mode,
                zonePath: resolved.candidate.zones?.path ?? null,
                colors: resolved.candidate.colors?.map(color => [ ...color ]) ?? null,
                materialChannels,
                targetSize,
                realizationStatus: partial ? "partial" : "complete",
                expectedSurfaceCount,
                completedSurfaceCount: surfaces.filter(value =>
                    value.status === "applied").length,
                partialSurfaceCount: surfaces.filter(value =>
                    value.status === "partial").length,
                deferredSurfaceCount: expectedSurfaceCount - surfaces.length,
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
            policySuppressed: [],
            deferred: []
        };
        const foundation = staged?.configuredFoundations?.find(value => value?.role === "head");
        const binding = staged?.configuredFoundationBindings?.find(value => value?.role === "head");
        const textures = foundation?.skinTextureBindings?.textures;
        const supportTextures = foundation?.skinTextureBindings?.supportTextures;
        const faceSupportTextures = supportTextures
            ?? (foundation?.skinTextureBindings?.rule
                === "exact-head-generic-texture-inventory-v1"
                ? textures
                : null);

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

        const availability = resolveLegacyReadyHeadContributions(
            staged.textureContributions ?? [],
            staged.deferredContributions ?? []
        );
        report.deferred.push(...availability.deferred);
        const plan = resolveLegacyHeadMaterialChannels(
            availability.contributions,
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
        const tearductFoundationTextures = {};
        const eyeWetSupportTextures = {};
        const effectiveTearductDiffuseMode = this._tearductDiffuseMode === "base"
            && !faceSupportTextures?.DiffuseMap
            ? "composed"
            : this._tearductDiffuseMode;
        if (effectiveTearductDiffuseMode !== this._tearductDiffuseMode)
        {
            report.faceTextureFallbacks = [ {
                role: "tearducts",
                requested: this._tearductDiffuseMode,
                applied: effectiveTearductDiffuseMode,
                reason: "generic-head-support-unavailable"
            } ];
        }

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
                const diagnosticDiffuse = name === "DiffuseMap"
                    && this._skinDiffuseMode !== "authored";
                const skinBaseColorPath = ResolveSkinBaseColorPath(staged);
                const solidBase = name === "DiffuseMap"
                    && [ "solid", "basecolor", "colorized" ].includes(
                        this._skinDiffuseMode
                    );
                if (name === "DiffuseMap" && this._skinDiffuseMode === "basecolor"
                    && !skinBaseColorPath)
                {
                    throw new Error("Selected skin base colour is unresolved");
                }
                const metadata = await this._ReadMetadata(
                    neutralNormal || neutralSpecular ? textures.DiffuseMap : basePath
                );
                const targetSize = ResolveTargetSize(metadata);
                let basePass;
                if (solidBase)
                {
                    basePass = await this._CreateSolidCopyPass(
                        this._skinDiffuseMode === "basecolor"
                            ? skinBaseColorPath
                            : SOLID_WHITE,
                        targetSize
                    );
                    if (this._skinDiffuseMode === "basecolor")
                    {
                        basePass.report = {
                            mode: "retained-skin-base-color",
                            shader: COPY_BLIT_SHADER,
                            path: skinBaseColorPath,
                            placement: [ 0, 0, 1, 1 ]
                        };
                    }
                }
                else if (neutralNormal)
                {
                    basePass = await this._CreateSolidCopyPass(NEUTRAL_NORMAL, targetSize);
                }
                else if (neutralSpecular)
                {
                    basePass = await this._CreateSolidCopyPass(SOLID_BLACK, targetSize);
                }
                else
                {
                    basePass = await this._CreateAuthoredConsumerCopyPass(
                        basePath,
                        targetSize
                    );
                }
                const passes = [ basePass ];
                // The generic-head diffuse is the topology support source for
                // EyeWet: unlike the selected skin atlas, its authored alpha
                // is empty across that lower-lid carrier. Keep the sibling
                // normal/specular maps available only for the tear-duct
                // comparison; EyeWet still receives bounded neutral lighting.
                const foundationSupportPasses = (effectiveTearductDiffuseMode === "base"
                    || this._eyeWetMaterialMode === "composed")
                    && faceSupportTextures?.[name]
                    ? [ await this._CreateAuthoredConsumerCopyPass(
                        faceSupportTextures[name],
                        targetSize
                    ) ]
                    : null;
                const skinColorization = name === "DiffuseMap"
                    ? ResolveSkinColorizationCandidate(staged, "head")
                    : null;
                if (skinColorization
                    && [ "authored", "basecolor", "colorized", "replace" ].includes(
                        this._skinDiffuseMode
                    ))
                {
                    passes.push(await this._CreateColorizedPass(
                        skinColorization,
                        targetSize,
                        {
                            useDetailMask: false,
                            // Skin colour and additive appearance layers do not
                            // own face-carrier coverage. Preserve the authored
                            // foundation alpha used by EyeWet and other
                            // transparent consumers while changing only RGB.
                            rgbOnly: true,
                            blend: this._skinDiffuseMode !== "replace"
                        }
                    ));
                }
                const selectedOperations = diagnosticDiffuse
                    || neutralNormal || neutralSpecular || baseNormal
                    ? []
                    : name === "NormalMap" && this._headNormalMode === "detail"
                        ? operations.filter(operation => operation.op === "normal-add")
                        : operations;
                const policySuppressedOperations = name === "NormalMap"
                    && this._headNormalMode === "detail"
                    ? operations.filter(operation => operation.op !== "normal-add")
                    : [];
                for (const operation of policySuppressedOperations)
                {
                    report.policySuppressed.push({
                        channel: name,
                        ...operation,
                        reason: "detail-mode-withholds-replacement-normal"
                    });
                }
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
                                ? await this._CreateColorizedPass(
                                    operation.candidate,
                                    targetSize,
                                    name === "DiffuseMap"
                                        ? { rgbOnly: true, blend: true }
                                        : undefined
                                )
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
                                            operation,
                                            { rgbOnly: name === "DiffuseMap" }
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

                if (name === "DiffuseMap")
                {
                    // The selected foundation effect is an opaque skin surface.
                    // Its texture alpha is also source data for separate
                    // transparent face carriers, so those carriers receive the
                    // private support target while the skin target owns opaque
                    // framebuffer alpha independently.
                    const opaqueSkinAlpha = await this._CreateSolidAlphaPass(
                        "opaque",
                        targetSize
                    );
                    opaqueSkinAlpha.report = {
                        mode: "configured-head-opaque-skin-alpha",
                        shader: COPY_BLIT_SHADER,
                        placement: [ 0, 0, 1, 1 ]
                    };
                    passes.push(opaqueSkinAlpha);
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
                if (foundationSupportPasses)
                {
                    const foundationTarget = new RenderTarget(
                        `character-${staged.sex}-head-foundation-${name.toLowerCase()}`,
                        targetSize[0],
                        targetSize[1],
                        false
                    );
                    if (!foundationTarget.IsGood?.())
                    {
                        throw new Error(
                            `Unable to create ${targetSize.join("x")} head foundation target`
                        );
                    }
                    RenderPasses(tw2, foundationTarget, foundationSupportPasses);
                    targets.push(foundationTarget);
                    eyeWetSupportTextures[name] = foundationTarget.texture;
                    if (name === "DiffuseMap" && effectiveTearductDiffuseMode === "base")
                    {
                        const tearductPasses = [
                            await this._CreateAuthoredConsumerCopyPass(
                                faceSupportTextures[name],
                                targetSize
                            ),
                            await this._CreateSolidAlphaPass("opaque", targetSize)
                        ];
                        const tearductTarget = new RenderTarget(
                            `character-${staged.sex}-head-tearduct-${name.toLowerCase()}`,
                            targetSize[0],
                            targetSize[1],
                            false
                        );
                        if (!tearductTarget.IsGood?.())
                        {
                            throw new Error(
                                `Unable to create ${targetSize.join("x")} tear-duct target`
                            );
                        }
                        RenderPasses(tw2, tearductTarget, tearductPasses);
                        targets.push(tearductTarget);
                        tearductFoundationTextures[name] = tearductTarget.texture;
                    }
                    else
                    {
                        tearductFoundationTextures[name] = foundationTarget.texture;
                    }
                }
                let diagnosticMode = "authored";
                if (neutralNormal) diagnosticMode = "neutral-normal";
                else if (neutralSpecular) diagnosticMode = "black-specular";
                else if (diagnosticDiffuse)
                {
                    diagnosticMode = `${this._skinDiffuseMode}-diffuse`;
                }
                else if (baseNormal) diagnosticMode = "authored-base-normal";
                else if (name === "NormalMap" && this._headNormalMode === "detail")
                {
                    diagnosticMode = "authored-additive-detail-normal";
                }
                report.channels.push({
                    name,
                    basePath,
                    diagnosticMode,
                    targetSize,
                    ...(name === "DiffuseMap" ? {
                        framebufferAlpha: "opaque-skin-surface"
                    } : {}),
                    overlayCount: passes.filter(value =>
                        value.report.mode !== "configured-head-opaque-skin-alpha"
                    ).length - 1,
                    overlays: passes.slice(1).filter(value =>
                        value.report.mode !== "configured-head-opaque-skin-alpha"
                    ).map(value => ({
                        path: value.report.path ?? value.report.detailPath,
                        groupID: value.report.groupID,
                        layerIndex: value.report.layerIndex,
                        role: value.report.role
                    })),
                    policySuppressed: policySuppressedOperations.map(operation => ({
                        path: operation.path,
                        groupID: operation.groupID,
                        layerIndex: operation.layerIndex,
                        role: operation.role,
                        reason: "detail-mode-withholds-replacement-normal"
                    })),
                    passes: passes.filter(value =>
                        value.report.mode !== "configured-head-opaque-skin-alpha"
                    ).map(value => value.report)
                });
            }

            if (!Object.keys(bindings).length) return report;
            let eyelashTexture = null;
            let eyelashTarget = null;
            let eyelashDirectTransform = null;
            if (eyelashFallback.status === "ready")
            {
                try
                {
                    const eyelashMetadata = await this._ReadMetadata(
                        eyelashFallback.operation.candidate.detail.path
                    );
                    eyelashDirectTransform = resolveLegacyCroppedTextureTransform(
                        eyelashMetadata
                    );
                    const targetSize = ResolveTargetSize(eyelashMetadata);
                    const passes = [
                        // The authored lash detail owns the sparse card alpha.
                        // Colourization owns RGB only; asking the generic
                        // colorizer to synthesize both channels turns the crop
                        // into an opaque or incorrectly weighted carrier.
                        await this._CreateAuthoredConsumerCopyPass(
                            eyelashFallback.operation.candidate.detail.path,
                            targetSize,
                            { alphaMultiplier: this._eyelashAlphaMode === "weighted"
                                ? eyelashFallback.operation.candidate
                                    .contribution?.weight ?? 1
                                : 1 }
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
                    eyelashTarget = target;
                    eyelashTexture = target.texture;
                    report.eyelashFallback = {
                        ...report.eyelashFallback,
                        binding: "colorized-transparent-head-atlas",
                        targetSize,
                        alphaEvidence: ReadTargetAlphaEvidence(target),
                        alphaMode: this._eyelashAlphaMode,
                        retainedDependencyWeight: eyelashFallback.operation.candidate
                            .contribution?.weight ?? 1,
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
                bindings,
                report.channels.find(value => value.name === "DiffuseMap")?.targetSize,
                targets
            );
            const committed = await commitLegacyConfiguredHeadBindings(effects, bindings, {
                materialMode: this._headMaterialMode
            });
            staged.composedHeadTextures = { ...bindings };
            report.faceTextures = applyLegacyConfiguredFaceTextures(
                binding,
                staged.textureContributions,
                {
                    headTextures: bindings,
                    eyelashTexture,
                    eyelashSourcePath: eyelashFallback.status === "ready"
                        ? eyelashFallback.operation.candidate.detail.path
                        : null,
                    eyelashDirectTransform,
                    tearductsEnabled: this._tearductsEnabled,
                    tearductLightingMode: this._tearductLightingMode,
                    tearductUvMode: this._tearductUvMode,
                    tearductDiffuseMode: effectiveTearductDiffuseMode,
                    tearductBaseDiffusePath: faceSupportTextures?.DiffuseMap ?? null,
                    tearductFoundationTextures,
                    tearductFoundationEvidence:
                        foundation?.skinTextureBindings?.supportEvidence ?? null,
                    eyeWetSupportTextures,
                    tearductSolidDiffusePath: NEUTRAL_SPECULAR,
                    eyeWetEnabled: this._eyeWetEnabled,
                    eyeWetMaterialMode: this._eyeWetMaterialMode,
                    eyeballsEnabled: this._eyeballsEnabled,
                    eyelashCarrierMode: this._eyelashCarrierMode,
                    eyelashUvMode: this._eyelashUvMode,
                    eyelashDepthMode: this._eyelashDepthMode,
                    eyeShadowDiffuseMode: this._eyeShadowDiffuseMode,
                    eyeShadowLightingMode: this._eyeShadowLightingMode
                }
            );
            if (eyelashTarget)
            {
                report.eyelashFallback.carrierAlphaEvidence =
                    ReadConfiguredFaceCarrierAlphaEvidence(eyelashTarget, binding);
            }
            staged.compositionTargets ??= [];
            staged.compositionTargets.push(...targets);
            report.status = "applied";
            report.attachedEffects = committed.attachedEffects;
            report.effectBindings = committed.effectBindings;
            return report;
        }
        catch (error)
        {
            for (const target of targets.reverse()) target.Destroy?.();
            report.deferred.push({ reason: error.message });
            return report;
        }
    }

    /** Composes exact retained hair channels onto authored detailed-hair cards. */
    async ComposeConfiguredHairMaterials(staged)
    {
        const report = {
            status: "deferred",
            rule: "configured-detailed-hair-material-v1",
            correctness: "structurally-tested-live-proof-pending",
            applied: [],
            deferred: []
        };

        for (const binding of staged?.configuredPartBindings ?? [])
        {
            const part = binding?.configuredPart;
            if (part?.groupID !== "hair") continue;
            const contribution = staged.textureContributions?.find(value =>
                value.partIndex === part.partIndex);
            const resolved = resolveLegacyConfiguredHairDiffuseContribution(contribution);
            const channels = resolveLegacyHairMaterialChannels(contribution);
            const material = resolveLegacyHairShaderMaterial(contribution);
            const regions = {
                hair: this._characterAtlasLayout?.getNormalizedRect?.("hair") ?? null,
                head: this._characterAtlasLayout?.getNormalizedRect?.("head") ?? null
            };
            const consumers = resolveLegacyConfiguredHairConsumers(binding, regions);
            hideLegacyConfiguredHairHeadShells(consumers);
            const effects = consumers.effects;
            const rigidEffects = consumers.rigidEffects;
            if (resolved.status !== "ready" || channels.status !== "ready"
                || material.status !== "ready"
                || effects.length + rigidEffects.length === 0)
            {
                report.deferred.push({
                    partIndex: part.partIndex,
                    partSourceRecordID: part.partSourceRecordID,
                    consumers: consumers.consumers,
                    rigidConsumers: consumers.rigidConsumers,
                    headShellConsumers: consumers.headShellConsumers,
                    excludedConsumers: consumers.excludedConsumers,
                    reason: effects.length + rigidEffects.length === 0
                        ? consumers.reason
                        : resolved.status !== "ready"
                            ? resolved.reason
                            : channels.status !== "ready" ? channels.reason : material.reason
                });
                continue;
            }

            let target = null;
            let siblingTarget = null;
            let lighting = null;
            try
            {
                const metadata = await this._ReadMetadata(resolved.candidate.detail.path);
                const targetSize = ResolveTargetSize(metadata);
                const glassEffects = consumers.glassEffects;
                const ordinaryRigidEffects = rigidEffects.filter(effect =>
                    !glassEffects.includes(effect));
                const separatesRigidDiffuse = effects.length > 0
                    && ordinaryRigidEffects.length > 0;
                const passes = [
                    await this._CreateAuthoredConsumerCopyPass(
                        resolved.candidate.detail.path,
                        targetSize
                    ),
                    await this._CreateColorizedPass(
                        resolved.candidate,
                        targetSize,
                        { rgbOnly: true, blend: false, useDetailMask: false }
                    )
                ];
                const RenderTarget = RequireClass(tw2, "Tw2RenderTarget");
                target = new RenderTarget(
                    `character-${staged.sex}-hair-${part.partIndex}-diffuse`,
                    targetSize[0],
                    targetSize[1],
                    false
                );
                if (!target.IsGood?.())
                {
                    throw new Error(`Unable to create ${targetSize.join("x")} hair target`);
                }
                RenderPasses(tw2, target, passes);
                let siblingPasses = [];
                if (separatesRigidDiffuse
                    || glassEffects.length && this._glassLightingMode !== "legacy")
                {
                    siblingPasses = [ await this._CreateAuthoredConsumerCopyPass(
                        resolved.candidate.detail.path,
                        targetSize
                    ) ];
                    siblingTarget = new RenderTarget(
                        `character-${staged.sex}-hair-${part.partIndex}-authored-diffuse`,
                        targetSize[0],
                        targetSize[1],
                        false
                    );
                    if (!siblingTarget.IsGood?.())
                    {
                        throw new Error(
                            `Unable to create ${targetSize.join("x")} hair sibling target`
                        );
                    }
                    RenderPasses(tw2, siblingTarget, siblingPasses);
                }
                const neutralHairNormal = [ "neutral", "neutral-normal" ].includes(
                    this._hairLightingMode
                );
                const neutralHairSpecular = [ "neutral", "neutral-specular" ].includes(
                    this._hairLightingMode
                );
                lighting = await this._ComposeGarmentLightingTargets(
                    staged,
                    part,
                    channels,
                    targetSize,
                    "detailed-hair",
                    {
                        normal: neutralHairNormal,
                        specular: neutralHairSpecular,
                        specularPath: SOLID_BLACK,
                        specularPreserveAlpha: true
                    }
                );
                const appliedHairMaterial = this._hairMaterialMode === "authored"
                    ? null
                    : material.parameters;
                const committed = await commitLegacyConfiguredHairBindings(
                    effects,
                    target.texture,
                    {
                        NormalMap: {
                            textureRes: lighting.normalTarget.texture,
                            sourcePath: neutralHairNormal
                                ? NEUTRAL_NORMAL
                                : channels.normalPath
                        },
                        SpecularMap: {
                            textureRes: lighting.specularTarget.texture,
                            sourcePath: neutralHairSpecular
                                ? channels.specularPath
                                : channels.specularPath
                        }
                    },
                    appliedHairMaterial,
                    ordinaryRigidEffects,
                    {
                        rigidTexture: separatesRigidDiffuse
                            ? siblingTarget?.texture ?? null
                            : target.texture,
                        glassEffects,
                        glassTexture: this._glassLightingMode === "legacy"
                            ? target.texture
                            : siblingTarget?.texture ?? null,
                        glassLightingMode: this._glassLightingMode
                    }
                );
                for (const area of consumers.deferredAreas)
                {
                    area.display = false;
                }
                staged.compositionTargets ??= [];
                staged.compositionTargets.push(
                    target,
                    ...(siblingTarget ? [ siblingTarget ] : []),
                    lighting.normalTarget,
                    lighting.specularTarget
                );
                part.materialStatus = "configured-hair-policy";
                part.compositionStatus = "configured-hair-attached";
                report.applied.push({
                    partIndex: part.partIndex,
                    partSourceRecordID: part.partSourceRecordID,
                    targetSize,
                    detailPath: resolved.candidate.detail.path,
                    zonePath: resolved.candidate.zones.path,
                    normalPath: channels.normalPath,
                    specularPath: channels.specularPath,
                    lightingMode: this._hairLightingMode,
                    materialParameters: appliedHairMaterial ?? "authored-preserved",
                    effectiveMaterialParameters: committed.effectiveMaterialParameters,
                    materialMode: this._hairMaterialMode,
                    retainedHairDarkness: material.retainedHairDarkness,
                    attachedEffects: committed.attachedEffects,
                    attachedRigidEffects: committed.attachedRigidEffects,
                    attachedGlassEffects: committed.attachedGlassEffects,
                    glassEffectContracts: committed.glassEffectContracts,
                    glassLightingMode: committed.glassLightingMode,
                    rigidDiffuseMode: ordinaryRigidEffects.length
                        ? separatesRigidDiffuse
                            ? "authored-rgba-uncolorized"
                            : "selected-colorized-private-hair"
                        : null,
                    glassDiffuseMode: glassEffects.length && siblingTarget
                        ? "authored-rgba-uncolorized"
                        : null,
                    framebufferAlpha: committed.framebufferAlpha,
                    consumers: consumers.consumers,
                    excludedConsumers: consumers.excludedConsumers,
                    headShellConsumers: consumers.headShellConsumers,
                    headShellStatus: consumers.headShellAreas.length
                        ? "head-shell-hidden-pending-material-contract"
                        : "not-present",
                    hiddenDeferredConsumers: consumers.deferredAreas.length,
                    alphaEvidence: ReadTargetAlphaEvidence(target),
                    passes: passes.map(value => value.report),
                    rigidPasses: separatesRigidDiffuse
                        ? siblingPasses.map(value => value.report)
                        : [],
                    glassPasses: glassEffects.length
                        ? siblingPasses.map(value => value.report)
                        : []
                });
            }
            catch (error)
            {
                lighting?.normalTarget?.Destroy?.();
                lighting?.specularTarget?.Destroy?.();
                siblingTarget?.Destroy?.();
                target?.Destroy?.();
                report.deferred.push({
                    partIndex: part.partIndex,
                    partSourceRecordID: part.partSourceRecordID,
                    reason: error.message
                });
            }
        }
        if (report.applied.length) report.status = "applied";
        return report;
    }

    /** Composes retained unzoned private headwear surfaces. */
    async ComposeConfiguredHeadwearMaterials(staged)
    {
        const report = {
            status: "deferred",
            rule: "configured-private-headwear-material-v1",
            correctness: "structurally-tested-live-proof-pending",
            applied: [],
            deferred: []
        };

        for (const binding of staged?.configuredPartBindings ?? [])
        {
            const part = binding?.configuredPart;
            if (part?.groupID !== "hair") continue;
            const contribution = staged.textureContributions?.find(value =>
                value.partIndex === part.partIndex);
            const resolved = resolveLegacyConfiguredHeadwearMaterial(contribution);
            const effects = GetEffects(binding.configuredMeshes).filter(effect =>
            {
                const authoredPath = String(
                    effect?._characterAuthoredEffectFilePath
                    || effect?.effectFilePath
                    || ""
                );
                return effect?._characterGarmentMaterialFallback === true
                    && /\/skinnedavatarbrdflinear\.sm_[a-z0-9_]+$/iu.test(authoredPath)
                    && typeof effect?.parameters?.DiffuseMap?.AttachTextureRes === "function"
                    && typeof effect?.parameters?.NormalMap?.AttachTextureRes === "function"
                    && typeof effect?.parameters?.SpecularMap?.AttachTextureRes === "function";
            });
            if (resolved.status !== "ready" || !effects.length)
            {
                report.deferred.push({
                    partIndex: part.partIndex,
                    partSourceRecordID: part.partSourceRecordID,
                    reason: !effects.length
                        ? "private-headwear-effect-unavailable"
                        : resolved.reason
                });
                continue;
            }

            let target = null;
            let lighting = null;
            try
            {
                const metadata = await this._ReadMetadata(resolved.detailPath);
                const targetSize = ResolveTargetSize(metadata);
                const passes = [];
                if (resolved.underlayPath)
                {
                    passes.push(await this._CreateAuthoredConsumerCopyPass(
                        resolved.underlayPath,
                        targetSize
                    ));
                }
                passes.push(await this._CreateAuthoredConsumerCopyPass(
                    resolved.detailPath,
                    targetSize,
                    { blend: Boolean(resolved.underlayPath) }
                ));
                const RenderTarget = RequireClass(tw2, "Tw2RenderTarget");
                target = new RenderTarget(
                    `character-${staged.sex}-headwear-${part.partIndex}-diffuse`,
                    targetSize[0],
                    targetSize[1],
                    false
                );
                if (!target.IsGood?.())
                {
                    throw new Error(`Unable to create ${targetSize.join("x")} headwear target`);
                }
                RenderPasses(tw2, target, passes);
                lighting = await this._ComposeGarmentLightingTargets(
                    staged,
                    part,
                    {
                        normalPath: resolved.normalPath,
                        specularPath: resolved.specularPath
                    },
                    targetSize,
                    "private-headwear"
                );
                const committed = await commitLegacyConfiguredHeadwearBindings(
                    effects,
                    target.texture,
                    {
                        NormalMap: {
                            textureRes: lighting.normalTarget.texture,
                            sourcePath: resolved.normalPath
                        },
                        SpecularMap: {
                            textureRes: lighting.specularTarget.texture,
                            sourcePath: resolved.specularPath
                        }
                    },
                    resolved.materialParameters,
                    resolved.materialMode
                );
                staged.compositionTargets ??= [];
                staged.compositionTargets.push(
                    target,
                    lighting.normalTarget,
                    lighting.specularTarget
                );
                part.materialStatus = "configured-headwear-policy";
                part.compositionStatus = "configured-headwear-attached";
                report.applied.push({
                    partIndex: part.partIndex,
                    partSourceRecordID: part.partSourceRecordID,
                    targetSize,
                    detailPath: resolved.detailPath,
                    normalPath: resolved.normalPath,
                    specularPath: resolved.specularPath,
                    materialParameters: resolved.materialParameters,
                    effectiveMaterialParameters: committed.effectiveMaterialParameters,
                    attachedEffects: committed.attachedEffects,
                    alphaEvidence: ReadTargetAlphaEvidence(target),
                    passes: passes.map(value => value.report)
                });
            }
            catch (error)
            {
                lighting?.normalTarget?.Destroy?.();
                lighting?.specularTarget?.Destroy?.();
                target?.Destroy?.();
                report.deferred.push({
                    partIndex: part.partIndex,
                    partSourceRecordID: part.partSourceRecordID,
                    reason: error.message
                });
            }
        }
        if (report.applied.length) report.status = "applied";
        return report;
    }

    /**
     * Composes the configured eyebrow support carrier from authored alpha and
     * the completed shared-head diffuse target.
     *
     * @param {Object} staged Staged character transaction.
     * @param {Object} browFallback Resolved eyebrow material contribution.
     * @param {Object} headTextures Completed shared-head textures.
     * @param {Array<Number>} targetSize Output width and height.
     * @param {Array<Object>} targets Transaction-owned render targets.
     * @returns {Promise<Object>} Composition status and binding evidence.
     */
    async _ComposeConfiguredBrowSupport(
        staged,
        browFallback,
        headTextures,
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
        if (!this._browSupportEnabled)
        {
            for (const mesh of binding.configuredMeshes ?? []) mesh.display = false;
            return {
                status: "disabled",
                rule: "configured-brow-support-comparison-control-v1",
                correctness: "comparison-control",
                partSourceRecordID: staged.configuredFoundationSupports?.find(value =>
                    value?.role === "eyebrowbase")?.partSourceRecordID ?? null
            };
        }
        const headDiffuseTexture = headTextures?.DiffuseMap ?? null;
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
                    neutralizeDiffuseColor: this._browDiffuseColorMode === "neutral",
                    alphaTest: true,
                    preserveAlphaBlend: true,
                    coverageAlpha: true,
                    textureBindings: this._browLightingMode === "neutral"
                        ? {}
                        : {
                            NormalMap: headTextures?.NormalMap ?? null,
                            SpecularMap: headTextures?.SpecularMap ?? null
                        }
                }
            );
            if (this._browLightingMode === "neutral")
            {
                for (const effect of effects)
                {
                    SetConfiguredFaceTexturePath(effect, "NormalMap", NEUTRAL_NORMAL);
                    SetConfiguredFaceTexturePath(effect, "SpecularMap", NEUTRAL_SPECULAR);
                }
            }
            const carriers = [];
            for (const mesh of binding.configuredMeshes ?? [])
            {
                for (const effect of GetEffects([ mesh ]))
                {
                    if (!effects.includes(effect)) continue;
                    carriers.push(DescribeConfiguredFaceCarrier(
                        mesh,
                        effect,
                        String(mesh?.name ?? "")
                    ));
                }
            }
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
                rule: this._browDiffuseColorMode === "neutral"
                    ? "configured-brow-support-neutral-diffuse-multiplier-comparison-v1"
                    : this._browLightingMode === "neutral"
                        ? "configured-brow-support-neutral-lighting-comparison-v1"
                        : "exact-head-archetype-brow-support-dependency-v1",
                correctness: this._browLightingMode === "neutral"
                    || this._browDiffuseColorMode === "neutral"
                    ? "comparison-control"
                    : "reference-parity",
                framebufferAlpha: "source-over-coverage",
                partSourceRecordID: support?.partSourceRecordID ?? null,
                alphaPath,
                targetSize: [ ...targetSize ],
                alphaEvidence: ReadTargetAlphaEvidence(target),
                attachedEffects,
                carriers,
                lightingBindings: this._browLightingMode === "neutral"
                    ? [ "NormalMap", "SpecularMap" ]
                    : [ "NormalMap", "SpecularMap" ].filter(name =>
                        Boolean(headTextures?.[name])),
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
        materialChannels,
        { glassEffects = [] } = {}
    )
    {
        let target = null;
        let lighting = null;
        try
        {
            const hybrid = surface === "body-garment-hybrid";
            const bakedDirect = candidate.mode === "baked-direct";
            if (hybrid && bakedDirect)
            {
                throw new Error(
                    "Baked garment diffuse is not qualified for a hybrid body surface"
                );
            }
            const passes = [ await this._CreateGarmentClearPass(targetSize) ];
            if (hybrid)
            {
                if (!staged.composedBodyDiffuseTexture)
                {
                    throw new Error("Shared body diffuse is unavailable for hybrid garment surface");
                }
                // Preserve the owner layer's coverage while replacing only
                // its base RGB with shared skin before the secondary material.
                passes.push(await this._CreateAuthoredConsumerCopyPass(
                    candidate.detail.path,
                    targetSize
                ));
                passes.push(await this._CreateSharedConsumerRgbPass(
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
            if (!bakedDirect)
            {
                passes.push(await this._CreateColorizedPass(candidate, targetSize, hybrid
                    ? { rgbOnly: true, blend: true, useDetailMask: true }
                    : { rgbOnly: true, blend: false, useDetailMask: false }));
            }

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
            const textureBindings = lighting
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
                : {};
            const binding = glassEffects.length
                ? await commitLegacyConfiguredAccessoryBindings(
                    effects,
                    glassEffects,
                    target.texture,
                    textureBindings
                )
                : await commitLegacyConfiguredGarmentBindings(
                    effects,
                    target.texture,
                    textureBindings,
                    { alphaTest: hybrid }
                );
            staged.compositionTargets ??= [];
            staged.compositionTargets.push(
                target,
                ...(lighting ? [ lighting.normalTarget, lighting.specularTarget ] : [])
            );
            return {
                status: lighting ? "applied" : "partial",
                surface,
                reason: lighting ? null : materialChannels.reason,
                lightingStatus: lighting ? "applied" : "deferred",
                attachedEffects: binding.attachedEffects,
                materialBinding: binding,
                alphaEvidence: ReadTargetAlphaEvidence(target),
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
        surface,
        neutralOnly = {}
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
                const effectiveNeutralPath = neutralOnly[`${name}Path`] ?? neutralPath;
                const preserveNeutralAlpha = neutralOnly[`${name}PreserveAlpha`] === true;
                const passes = preserveNeutralAlpha
                    ? [
                        await this._CreateAuthoredConsumerCopyPass(path, targetSize, {
                            allowFullNormalizedStretch: true
                        }),
                        await this._CreateSolidRgbPass([ 0, 0, 0, 1 ], targetSize)
                    ]
                    : [ await this._CreateSolidCopyPass(effectiveNeutralPath, targetSize) ];
                if (neutralOnly[name] !== true && !preserveNeutralAlpha)
                {
                    passes.push(await this._CreateAuthoredConsumerCopyPass(path, targetSize, {
                        allowFullNormalizedStretch: true
                    }));
                }
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
                    sourcePath: preserveNeutralAlpha || neutralOnly[name] !== true
                        ? path
                        : effectiveNeutralPath,
                    neutralPath: effectiveNeutralPath,
                    preservedAlpha: preserveNeutralAlpha,
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

    /** Applies one owner-qualified female bottom/tuck/top coverage tuple. */
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
            throw new TypeError("Female tuck options must be boolean");
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
        if (planned.status !== "ready")
        {
            if (Number.isInteger(planned.tuckPartIndex))
            {
                SetConfiguredPartCompositionDisplay(
                    staged,
                    planned.tuckPartIndex,
                    false,
                    "hidden-without-material-owner"
                );
            }
            return planned;
        }
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
                throw new Error(`Unable to create ${targetSize.join("x")} tuck support target`);
            }

            RenderPasses(tw2, target, passes);
            const alphaEvidence = ReadTargetAlphaEvidence(target);
            const attachedEffects = commitLegacyConfiguredConsumerBindings(
                planned.effects,
                target.texture,
                {
                    depthTest,
                    neutralizeDiffuseColor: true,
                    transformUV0: useAuthoredTransform
                        ? planned.authoredSampleBounds
                        : null
                }
            );
            const coordinatedDrape = SuppressReadyCompetingTopDrape(staged, planned);
            SetConfiguredPartCompositionDisplay(
                staged,
                planned.tuckPartIndex,
                true,
                "visible"
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
                rule: "legacy-opengl-owner-qualified-female-tuck-support-v2",
                correctness: "relationship-qualified-experimental-policy",
                renderStateRule: "authored-decal-area-state-v1",
                tuckPartIndex: planned.tuckPartIndex,
                tuckPartSourceRecordID: planned.tuckPartSourceRecordID,
                supportOwnerSelectionIndex: planned.supportOwnerSelectionIndex,
                topOwnerSelectionIndex: planned.topOwnerSelectionIndex,
                coordinatedDrape,
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
                    ? "completed-body-diffuse"
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

    /** Applies a selected top's material and alpha to its standard drape support. */
    async ComposeSelectedTopDrapeSupport(staged)
    {
        const planned = planLegacySelectedTopDrapeSupport(
            staged?.sex,
            staged?.backend?.visualModel,
            staged?.configuredParts,
            staged?.textureContributions
        );
        if (planned.status !== "ready") return planned;

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
            if (planned.diffuseMode === "colorized")
            {
                passes.push(await this._CreateColorizedPass(planned.topCandidate, targetSize, {
                    blend: false,
                    rgbOnly: true
                }));
            }
            const RenderTarget = RequireClass(tw2, "Tw2RenderTarget");
            target = new RenderTarget(
                `character-${staged.sex}-selected-top-drape-${targetIndex}`,
                targetSize[0],
                targetSize[1],
                false
            );
            if (!target.IsGood?.())
            {
                throw new Error(`Unable to create ${targetSize.join("x")} selected-top drape target`);
            }

            RenderPasses(tw2, target, passes);
            const attachedEffects = commitLegacyConfiguredConsumerBindings(
                planned.effects,
                target.texture,
                { neutralizeDiffuseColor: true }
            );
            const part = staged.configuredParts.find(value =>
                value.partIndex === planned.drapePartIndex);
            if (part)
            {
                part.materialStatus = "selected-top-drape-material-policy";
                part.compositionStatus = "selected-top-drape-material-attached";
            }
            staged.compositionTargets ??= [];
            staged.compositionTargets.push(target);

            return {
                ...WithoutEffects(planned),
                status: "applied",
                rule: "owner-qualified-selected-top-drape-material-v1",
                correctness: "retained-owner-and-material-policy",
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
        const foundationEffects = GetFoundationBodyEffects(staged.backend?.visualModel);
        const directCutMask = foundationEffects.length > 0
            && foundationEffects.every(effect =>
                typeof effect?.parameters?.CutMaskMap?.AttachTextureRes === "function");
        if (!directCutMask && !staged.composedBodyDiffuseTexture)
        {
            return {
                ...planned,
                status: "deferred",
                reason: "foundation-body-diffuse-unavailable"
            };
        }
        const passes = directCutMask
            ? [ await this._CreateSolidCopyPass(SOLID_WHITE, targetSize) ]
            : [ await this._CreateSharedConsumerRgbaPass(
                staged.composedBodyDiffuseTexture,
                targetSize
            ) ];
        for (const mask of masks)
        {
            passes.push(directCutMask
                ? await this._CreateFoundationCutMaskPass(
                    mask.maskPath,
                    mask.placement,
                    targetSize
                )
                : await this._CreateConsumerCutMaskPass(mask.maskPath, targetSize));
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
            const bindings = directCutMask
                ? commitLegacyFoundationCutMaskBindings(
                    staged.backend?.visualModel,
                    target.texture
                )
                : commitLegacyFoundationAlphaCutBindings(
                    staged.backend?.visualModel,
                    target.texture
                );
            staged.compositionTargets ??= [];
            staged.compositionTargets.push(target);
            return {
                ...planned,
                status: "applied",
                rule: directCutMask
                    ? "legacy-opengl-female-foundation-cut-mask-v2"
                    : "legacy-opengl-female-foundation-alpha-cut-v1",
                correctness: "experimental-live-proof-pending",
                bindingMode: directCutMask ? "cut-mask-sampler" : "diffuse-alpha-test",
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
                    target.texture,
                    { alphaTest: true }
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
                        alphaSource: { ...consumer.alphaSource },
                        cutMaskPaths: [ ...group.cutMaskPaths ],
                        previousSampleBounds: consumer.previousSampleBounds,
                        sampleBounds: [ 0, 0, 1, 1 ],
                        alphaPolicy: "authored-owner-alpha-test",
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

    /**
     * Creates one placed RGBA copy pass for an authored configured consumer.
     *
     * @param {String} path Authored texture path.
     * @param {Array<Number>} targetSize Output width and height.
     * @param {Object} [options] Copy options.
     * @param {Number} [options.alphaMultiplier=1] Source-alpha multiplier.
     * @param {Boolean} [options.blend=false] Whether to blend over the target.
     * @param {Boolean} [options.allowFullNormalizedStretch=false] Allows a
     * full-placement control map to scale independently of pixel aspect.
     * @returns {Promise<Object>} Prepared pass and diagnostic projection.
     */
    async _CreateAuthoredConsumerCopyPass(
        path,
        targetSize,
        {
            alphaMultiplier = 1,
            blend = false,
            allowFullNormalizedStretch = false
        } = {}
    )
    {
        if (!Number.isFinite(alphaMultiplier) || alphaMultiplier < 0
            || typeof blend !== "boolean"
            || typeof allowFullNormalizedStretch !== "boolean")
        {
            throw new TypeError(
                "Configured authored consumer copy options are invalid"
            );
        }
        const metadata = await this._ReadMetadata(path);
        const placement = Placement(metadata);
        const sourceTargetSize = ResolveTargetSize(metadata);
        const fullNormalizedStretch = allowFullNormalizedStretch
            && BoundsEqual(placement, [ 0, 0, 1, 1 ]);
        if (!fullNormalizedStretch)
        {
            RequireCompatibleTargetAspect(path, sourceTargetSize, targetSize);
        }
        const Effect = RequireClass(tw2, "Tw2Effect");
        const effect = Effect.from({
            effectFilePath: COPY_BLIT_SHADER,
            autoParameter: true,
            parameters: {
                SourceUVs: Bounds(placement),
                TextureReverseUV: placement,
                AlphaMultiplier: [ alphaMultiplier, 0, 0, 0 ]
            },
            textures: { Texture: path }
        });

        await PrepareEffect(tw2, effect, COPY_BLIT_SHADER);
        if (blend) ApplyRenderStates(this._d3d, effect, true);
        else ApplyConfiguredConsumerRenderStates(
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
                alphaMultiplier,
                blend,
                sourceTargetSize,
                placement,
                samplingContract: fullNormalizedStretch
                    ? "full-normalized-stretch"
                    : "authored-atlas-placement",
                uv: DescribeUvDecision(metadata, targetSize, placement)
            }
        };
    }

    /**
     * Creates one authored body-channel overlay, optionally masked by the
     * owning diffuse contribution's coverage.
     *
     * @param {String} path Authored texture path.
     * @param {Array<Number>} targetSize Output width and height.
     * @param {Object} operation Planned channel operation and owner evidence.
     * @param {Object} [options] Overlay options.
     * @param {Boolean} [options.rgbOnly=false] Preserves destination alpha.
     * @returns {Promise<Object>} Prepared pass and diagnostic projection.
     */
    async _CreateAuthoredOverlayPass(
        path,
        targetSize,
        operation,
        { rgbOnly = false } = {}
    )
    {
        if (typeof rgbOnly !== "boolean")
        {
            throw new TypeError("Configured authored overlay rgbOnly must be boolean");
        }
        const metadata = await this._ReadMetadata(path);
        const placement = Placement(metadata);
        let coverageMetadata = null;
        let coveragePlacement = null;
        let destinationPlacement = placement;
        if (operation?.coveragePath)
        {
            coverageMetadata = await this._ReadMetadata(operation.coveragePath);
            coveragePlacement = Placement(coverageMetadata);
            RequireCompatibleTargetAspect(
                operation.coveragePath,
                ResolveTargetSize(coverageMetadata),
                targetSize
            );
            destinationPlacement = IntersectPlacement(placement, coveragePlacement);
            if (!destinationPlacement)
            {
                throw new Error(
                    `Body material channel and owner coverage do not overlap: ${path}`
                );
            }
        }
        const ownerMasked = coveragePlacement !== null;
        const ownerReplace = ownerMasked && operation?.op === "specular-replace";
        const fullNormalized = BoundsEqual(placement, [ 0, 0, 1, 1 ]);
        if (!fullNormalized)
        {
            RequireCompatibleTargetAspect(path, ResolveTargetSize(metadata), targetSize);
        }
        const Effect = RequireClass(tw2, "Tw2Effect");
        const weight = Number.isFinite(operation?.weight) ? operation.weight : 1;
        const effect = Effect.from({
            effectFilePath: ownerMasked ? SIMPLE_BLIT_SHADER : COPY_BLIT_SHADER,
            autoParameter: true,
            parameters: ownerMasked ? {
                SourceUVs: Bounds(destinationPlacement),
                TextureReverseUV: placement,
                MaskReverseUV: coveragePlacement,
                Strength: [ weight, 0, 0, 0 ],
                // A direct garment specular source owns the channel wherever
                // its diffuse layer owns the surface. Its source alpha is
                // material data, not permission for older skin overlays to
                // remain visible through the garment.
                MultAlpha: [ ownerReplace ? 0 : 1, 0, 0, 0 ]
            } : {
                SourceUVs: Bounds(placement),
                TextureReverseUV: placement,
                AlphaMultiplier: [ weight, 0, 0, 0 ]
            },
            textures: {
                Texture: path,
                ...(ownerMasked ? { MaskMap: operation.coveragePath } : {})
            }
        });

        const shader = ownerMasked ? SIMPLE_BLIT_SHADER : COPY_BLIT_SHADER;
        await PrepareEffect(tw2, effect, shader);
        ApplyRenderStates(
            this._d3d,
            effect,
            true,
            rgbOnly ? { colorWrite: COLOR_WRITE_RGB } : {}
        );
        return {
            effect,
            viewport: Viewport(targetSize, destinationPlacement),
            report: {
                mode: operation?.projectionDefinitionPath
                    ? "configured-head-authored-tattoo-atlas"
                    : ownerReplace
                        ? `configured-${operation?.target ?? "head"}-owner-masked-replace`
                        : ownerMasked
                            ? `configured-${operation?.target ?? "head"}-owner-masked-source-alpha-overlay`
                            : `configured-${operation?.target ?? "head"}-source-alpha-overlay`,
                shader,
                path,
                coveragePath: operation?.coveragePath ?? null,
                coverageRole: operation?.coverageRole ?? null,
                groupID: operation.groupID,
                layerIndex: operation.layerIndex,
                role: operation.role,
                materialControls: operation.materialControls ?? null,
                weight,
                alphaOperation: rgbOnly
                    ? "source-alpha-rgb-preserve-foundation-alpha"
                    : ownerReplace
                        ? "owner-mask-rgba-replace"
                        : "source-alpha-rgba",
                placement,
                samplingContract: fullNormalized
                    ? "full-normalized-stretch"
                    : "authored-atlas-placement",
                projectionDefinitionPath: operation?.projectionDefinitionPath ?? null,
                authoredColorSelection: operation?.colors?.map(value => [ ...value ]) ?? null,
                colorSelectionApplication: operation?.projectionDefinitionPath
                    ? "retained-not-applied"
                    : null,
                coveragePlacement,
                destinationPlacement,
                uv: DescribeUvDecision(metadata, targetSize, destinationPlacement),
                coverageUv: coverageMetadata
                    ? DescribeUvDecision(
                        coverageMetadata,
                        targetSize,
                        destinationPlacement
                    )
                    : null
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
        let coverageMetadata = null;
        let coveragePlacement = null;
        let destinationPlacement = placement;
        if (!additive && operation?.coveragePath)
        {
            coverageMetadata = await this._ReadMetadata(operation.coveragePath);
            coveragePlacement = Placement(coverageMetadata);
            RequireCompatibleTargetAspect(
                operation.coveragePath,
                ResolveTargetSize(coverageMetadata),
                targetSize
            );
            destinationPlacement = IntersectPlacement(placement, coveragePlacement);
            if (!destinationPlacement)
            {
                throw new Error(
                    `Body normal and owner coverage do not overlap: ${path}`
                );
            }
        }
        const ownerMasked = coveragePlacement !== null;
        const shader = additive
            ? TWIST_NORMAL_BLIT_SHADER
            : ownerMasked ? SIMPLE_BLIT_SHADER : MASKED_NORMAL_BLIT_SHADER;
        const strength = Number.isFinite(operation?.weight) ? operation.weight : 1;
        const Effect = RequireClass(tw2, "Tw2Effect");
        const effect = Effect.from({
            effectFilePath: shader,
            autoParameter: true,
            parameters: {
                SourceUVs: Bounds(destinationPlacement),
                TextureReverseUV: placement,
                ...(ownerMasked ? {
                    MaskReverseUV: coveragePlacement,
                    MultAlpha: [ 1, 0, 0, 0 ]
                } : {}),
                Strength: [ strength, 0, 0, 0 ]
            },
            textures: {
                Texture: path,
                ...(ownerMasked ? { MaskMap: operation.coveragePath } : {})
            }
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
            viewport: Viewport(targetSize, destinationPlacement),
            report: {
                mode: ownerMasked
                    ? `configured-${operation?.target ?? "head"}-normal-owner-masked-replace`
                    : `configured-${operation?.target ?? "head"}-normal-${
                        additive ? "add" : "replace"
                    }`,
                shader,
                path,
                coveragePath: operation?.coveragePath ?? null,
                coverageRole: operation?.coverageRole ?? null,
                groupID: operation.groupID,
                layerIndex: operation.layerIndex,
                role: operation.role,
                materialControls: operation.materialControls ?? null,
                strength,
                placement,
                coveragePlacement,
                destinationPlacement,
                uv: DescribeUvDecision(metadata, targetSize, destinationPlacement),
                coverageUv: coverageMetadata
                    ? DescribeUvDecision(
                        coverageMetadata,
                        targetSize,
                        destinationPlacement
                    )
                    : null
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
        if (IsVersionAuthoredBodyOverlay(contribution, detail))
        {
            return {
                status: "ready",
                operation: "alpha-overlay",
                texture: detail,
                evidenceRule: "exact-version-authored-rgba-overlay-v1"
            };
        }
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

/**
 * Resolves a configured garment's private diffuse input.
 *
 * Configured materials may either colorize an authored L/Z pair or provide one
 * exact baked D map. The baked form deliberately remains separate from shared
 * body-atlas planning: it is admitted only by the configured private-surface
 * composer, which derives surface ownership from the decoded Black material.
 */
export function resolveLegacyConfiguredGarmentDiffuseContribution(contribution)
{
    const colorized = resolveLegacyBodyDiffuseContribution(contribution);
    if (colorized.status === "ready" && colorized.candidate)
    {
        return {
            ...colorized,
            candidate: {
                ...colorized.candidate,
                mode: "colorized"
            }
        };
    }
    if (colorized.status === "ready"
        && colorized.operation === "alpha-overlay"
        && colorized.texture)
    {
        return {
            status: "ready",
            candidate: {
                mode: "baked-direct",
                evidenceRule: colorized.evidenceRule,
                contribution,
                detail: colorized.texture,
                zones: null,
                colors: null
            }
        };
    }

    const baked = (contribution?.selectedTextures ?? []).filter(value =>
        value?.target === "body"
        && [ "diffuse-source", "diffuse-overlay" ].includes(value?.role));
    if (baked.length !== 1)
    {
        return baked.length
            ? { status: "deferred", reason: "garment-baked-diffuse-ambiguous" }
            : colorized;
    }

    return {
        status: "ready",
        candidate: {
            mode: "baked-direct",
            contribution,
            detail: baked[0],
            zones: null,
            colors: null
        }
    };
}

/**
 * Resolves one configured accessory from either a complete single-target
 * L/Z/N/S tuple or one exact baked D/N/S tuple. The retained texture roles,
 * rather than an asset name, decide whether the private target represents
 * head or accessory texture space. Cut masks remain named retained inputs;
 * they do not become private-material samplers without an authored consumer.
 */
export function resolveLegacyConfiguredAccessoryMaterial(contribution)
{
    if (!String(contribution?.groupID ?? "").startsWith("accessories/"))
    {
        return { status: "deferred", reason: "configured-accessory-group-unavailable" };
    }

    const selected = contribution?.selectedTextures ?? [];
    const diffuseTargets = Unique(selected
        .filter(value => [
            "colorize-layer", "colorize-zones", "diffuse-source", "diffuse-overlay"
        ].includes(value?.role)
            && [ "head", "acc" ].includes(value?.target))
        .map(value => value.target));
    if (diffuseTargets.length !== 1)
    {
        return {
            status: "deferred",
            reason: diffuseTargets.length
                ? "configured-accessory-target-ambiguous"
                : "configured-accessory-target-unresolved"
        };
    }

    const target = diffuseTargets[0];
    const details = selected.filter(value =>
        value?.target === target && value?.role === "colorize-layer");
    const zones = selected.filter(value =>
        value?.target === target && value?.role === "colorize-zones");
    const baked = selected.filter(value => value?.target === target
        && [ "diffuse-source", "diffuse-overlay" ].includes(value?.role));
    const normals = selected.filter(value => value?.target === target
        && [ "normal-source", "normal-overlay" ].includes(value?.role));
    const specular = selected.filter(value => value?.target === target
        && [ "specular-source", "specular-overlay" ].includes(value?.role));
    for (const [ values, channel ] of [
        [ normals, "normal-map" ],
        [ specular, "specular-map" ]
    ])
    {
        if (values.length !== 1)
        {
            return {
                status: "deferred",
                reason: `configured-accessory-${channel}-${values.length ? "ambiguous" : "unresolved"}`
            };
        }
    }

    let candidate;
    if (baked.length === 1 && !details.length && !zones.length)
    {
        candidate = {
            mode: "baked-direct",
            contribution,
            detail: baked[0],
            zones: null,
            colors: null
        };
    }
    else if (!baked.length && details.length === 1 && zones.length === 1)
    {
        const colors = NormalizeColors(contribution?.materialValues?.colors);
        if (!colors)
        {
            return { status: "deferred", reason: "configured-accessory-colors-unresolved" };
        }
        const pattern = ResolvePattern(contribution.materialValues);
        if (pattern?.status === "deferred") return pattern;
        candidate = {
            mode: "colorized",
            contribution,
            detail: details[0],
            zones: zones[0],
            colors,
            ...(pattern ? { pattern } : {})
        };
    }
    else
    {
        return {
            status: "deferred",
            reason: baked.length || details.length || zones.length
                ? "configured-accessory-diffuse-contract-ambiguous"
                : "configured-accessory-diffuse-contract-unresolved"
        };
    }

    return {
        status: "ready",
        rule: "configured-retained-accessory-material-v2",
        correctness: "retained-source-policy",
        target,
        candidate,
        materialChannels: {
            status: "ready",
            rule: "configured-retained-accessory-lighting-v1",
            correctness: "retained-source-policy",
            normalPath: normals[0].path,
            specularPath: specular[0].path
        },
        retainedCutMasks: selected.filter(value => value?.target === target
            && value?.role === "cut-mask").map(value => value.path)
    };
}

/**
 * Partitions visible configured-accessory consumers by their decoded material
 * contract. A retained GlassShader is eligible only on an authored transparent
 * area with empty private D/N/S samplers and the complete glass parameter set;
 * an effect or accessory family name is not sufficient evidence.
 */
export function resolveLegacyConfiguredAccessoryConsumers(meshes)
{
    const materialEffects = [];
    const glassEffects = [];
    const hybridEffects = [];
    const retainedEffects = [];
    const deferredConsumers = [];
    const seenEffects = new Set();
    const fields = [
        "opaqueAreas", "transparentAreas", "additiveAreas", "decalAreas",
        "depthAreas", "depthNormalAreas", "distortionAreas", "pickableAreas"
    ];

    for (const mesh of meshes ?? [])
    {
        for (const field of fields)
        {
            for (const area of mesh?.[field] ?? [])
            {
                const effect = area?.effect;
                if (!effect || area.display === false || seenEffects.has(effect)) continue;
                seenEffects.add(effect);

                if (effect._characterGarmentMaterialFallback === true)
                {
                    materialEffects.push(effect);
                    continue;
                }
                if (effect._characterGarmentBodyFallback === true
                    && !effect._characterFoundationReplacementRole)
                {
                    hybridEffects.push(effect);
                    continue;
                }

                const effectPath = String(
                    effect._characterAuthoredEffectFilePath
                    || effect.effectFilePath
                    || ""
                ).replaceAll("\\", "/");
                const authoredTexturePaths = effect._characterAuthoredTexturePaths ?? {};
                const hasAuthoredTextureSnapshot = effect._characterAuthoredTexturePaths
                    !== undefined;
                const hasPrivateSamplers = [ "DiffuseMap", "NormalMap", "SpecularMap" ]
                    .every(name => typeof effect?.parameters?.[name]?.AttachTextureRes === "function");
                const hasAuthoredPrivateTexture = [ "DiffuseMap", "NormalMap", "SpecularMap" ]
                    .some(name => /^res:\//iu.test(String(hasAuthoredTextureSnapshot
                        ? authoredTexturePaths[name] ?? ""
                        : ReadTexturePath(effect?.parameters?.[name]))));
                const glassParameters = [
                    "GlassOptions",
                    "GlassTransparencyColor",
                    "GlassTransparencyOptions",
                    "GlassOptions2"
                ];
                const retainedGlass = field === "transparentAreas"
                    && /\/glassshader\.(?:fx|sm_[a-z0-9_]+)$/iu.test(effectPath)
                    && effect.IsGood?.() === true
                    && hasPrivateSamplers
                    && !hasAuthoredPrivateTexture
                    && glassParameters.every(name => HasEffectParameter(effect, name));
                if (retainedGlass)
                {
                    glassEffects.push(effect);
                    continue;
                }

                const retainedDiffusePath = ReadTexturePath(effect?.parameters?.DiffuseMap);
                if (effect.IsGood?.() === true && /^res:\//iu.test(retainedDiffusePath))
                {
                    retainedEffects.push(effect);
                    continue;
                }

                deferredConsumers.push({
                    areaField: field,
                    effectName: String(effect?.name ?? ""),
                    effectPath: effectPath || null,
                    reason: /\/glassshader\./iu.test(effectPath)
                        ? "configured-accessory-glass-contract-unresolved"
                        : "configured-accessory-consumer-unresolved"
                });
            }
        }
    }

    return {
        materialEffects,
        glassEffects,
        hybridEffects,
        retainedEffects,
        deferredConsumers
    };
}

/**
 * Resolves an accessory whose decoded Black owns a private linear-BRDF
 * material but no texture or colour inventory. The original effect supplies
 * only parameters shared by the proof shader; unset colour declarations are
 * deliberately excluded so diagnostic magenta can be neutralized safely.
 */
export function resolveLegacyConfiguredMaterialOnlyAccessory(effects, contribution)
{
    if (!String(contribution?.groupID ?? "").startsWith("accessories/"))
    {
        return { status: "deferred", reason: "material-only-accessory-group-unavailable" };
    }
    if ((contribution?.selectedTextures?.length ?? 0) !== 0
        || contribution?.materialValues
        || contribution?.source?.materialDefinitionPath)
    {
        return {
            status: "deferred",
            reason: "material-only-accessory-texture-or-colour-inventory-present"
        };
    }

    effects = Unique(effects);
    if (!effects.length)
    {
        return { status: "deferred", reason: "material-only-accessory-consumer-unavailable" };
    }

    const contracts = [];
    for (const effect of effects)
    {
        const authored = effect?._characterAuthoredEffect;
        const effectPath = String(
            effect?._characterAuthoredEffectFilePath
            || authored?.effectFilePath
            || ""
        );
        if (effect?._characterGarmentMaterialFallback !== true
            || !authored
            || !/skinnedavatarbrdflinear/iu.test(effectPath)
            || /doublelinear/iu.test(effectPath))
        {
            return {
                status: "deferred",
                reason: "material-only-accessory-linear-brdf-consumer-unavailable"
            };
        }
        if (![ "DiffuseMap", "NormalMap", "SpecularMap" ].every(name =>
            HasEffectParameter(authored, name)
            && !ReadTexturePath(authored?.parameters?.[name])))
        {
            return {
                status: "deferred",
                reason: "material-only-accessory-authored-texture-contract-present"
            };
        }

        const material2LibraryID = ReadEffectVectorParameter(
            authored,
            "Material2LibraryID",
            4
        );
        if (material2LibraryID?.some(value => value !== 0))
        {
            return {
                status: "deferred",
                reason: "material-only-accessory-secondary-material-unqualified"
            };
        }

        const transformUV0 = ReadTransformUV0(authored)
            ?? effect?._characterAuthoredTransformUV0;
        if (!Array.isArray(transformUV0) || transformUV0.length !== 4)
        {
            return {
                status: "deferred",
                reason: "material-only-accessory-transform-unresolved"
            };
        }
        const parameters = {};
        for (const [ name, length ] of Object.entries(
            MATERIAL_ONLY_ACCESSORY_VECTOR_LENGTHS
        ))
        {
            const value = ReadEffectVectorParameter(authored, name, length);
            if (!value)
            {
                return {
                    status: "deferred",
                    reason: `material-only-accessory-${name}-unresolved`
                };
            }
            parameters[name] = value;
        }
        if (parameters.MaterialLibraryID[0] === 0)
        {
            return {
                status: "deferred",
                reason: "material-only-accessory-library-unresolved"
            };
        }
        const colorNdotLPath = ReadTexturePath(
            authored?.parameters?.ColorNdotLLookupMap
        );
        if (!/^res:\//iu.test(colorNdotLPath)
            || !HasEffectParameter(authored, "ColorNdotLLookupMap"))
        {
            return {
                status: "deferred",
                reason: "material-only-accessory-ndotl-lookup-unresolved"
            };
        }

        contracts.push({
            effect,
            authoredEffect: authored,
            authoredEffectPath: effectPath,
            transformUV0: [ ...transformUV0 ],
            parameters,
            colorNdotLPath
        });
    }

    return {
        status: "ready",
        rule: "configured-retained-material-only-accessory-v1",
        correctness: "retained-source-policy",
        contracts
    };
}

/** Resolves one exact retained L/Z/color tuple for configured hair cards. */
export function resolveLegacyConfiguredHairDiffuseContribution(contribution)
{
    const selected = contribution?.selectedTextures ?? [];
    const details = selected.filter(value =>
        value?.target === "hair" && value?.role === "colorize-layer");
    const zones = selected.filter(value =>
        value?.target === "hair" && value?.role === "colorize-zones");
    const colors = NormalizeColors(contribution?.materialValues?.colors);
    if (details.length !== 1)
    {
        return {
            status: "deferred",
            reason: details.length
                ? "hair-colorize-layer-ambiguous"
                : "hair-colorize-layer-unresolved"
        };
    }
    if (zones.length !== 1)
    {
        return {
            status: "deferred",
            reason: zones.length
                ? "hair-colorize-zones-ambiguous"
                : "hair-colorize-zones-unresolved"
        };
    }
    if (!colors)
    {
        return { status: "deferred", reason: "hair-material-colors-unresolved" };
    }
    return {
        status: "ready",
        candidate: {
            contribution,
            detail: details[0],
            zones: zones[0],
            colors
        }
    };
}

/** Resolves exact retained normal/specular inputs for configured hair cards. */
export function resolveLegacyHairMaterialChannels(contribution)
{
    const selected = contribution?.selectedTextures ?? [];
    const normals = selected.filter(value =>
        value?.target === "hair"
        && [ "normal-source", "normal-overlay" ].includes(value?.role));
    const specular = selected.filter(value =>
        value?.target === "hair"
        && [ "specular-source", "specular-overlay" ].includes(value?.role));
    if (normals.length !== 1 || specular.length !== 1)
    {
        return {
            status: "deferred",
            reason: normals.length !== 1
                ? normals.length
                    ? "hair-normal-map-ambiguous"
                    : "hair-normal-map-unresolved"
                : specular.length
                    ? "hair-specular-map-ambiguous"
                    : "hair-specular-map-unresolved"
        };
    }
    return {
        status: "ready",
        rule: "configured-retained-hair-lighting-v1",
        correctness: "retained-source-policy",
        normalPath: normals[0].path,
        specularPath: specular[0].path
    };
}

/** Resolves the selected palette parameters consumed by the detailed-hair shader. */
export function resolveLegacyHairShaderMaterial(contribution)
{
    const colors = NormalizeColors(contribution?.materialValues?.colors);
    const specularColors = NormalizeColors(contribution?.materialValues?.specularColors);
    if (!colors || !specularColors)
    {
        return {
            status: "deferred",
            reason: !colors
                ? "hair-diffuse-colors-unresolved"
                : "hair-specular-colors-unresolved"
        };
    }
    return {
        status: "ready",
        rule: "configured-retained-hair-shader-material-v1",
        correctness: "retained-source-policy",
        parameters: {
            MaterialDiffuseColor: [ ...colors[0] ],
            HairSpecularColor1: [ ...specularColors[0] ],
            HairSpecularColor2: [ ...specularColors[1] ]
        },
        retainedHairDarkness: Number.isFinite(contribution?.colorSelection?.hairDarkness)
            ? contribution.colorSelection.hairDarkness
            : null
    };
}

/** Resolves one retained unzoned private headwear material. */
export function resolveLegacyConfiguredHeadwearMaterial(contribution)
{
    const selected = contribution?.selectedTextures ?? [];
    const colorizeDetails = selected.filter(value =>
        value?.target === "hair" && value?.role === "colorize-layer");
    const directDetails = selected.filter(value =>
        value?.target === "hair"
        && [ "diffuse-source", "diffuse-overlay" ].includes(value?.role));
    const zones = selected.filter(value =>
        value?.target === "hair" && value?.role === "colorize-zones");
    const normals = selected.filter(value =>
        value?.target === "hair"
        && [ "normal-source", "normal-overlay" ].includes(value?.role));
    const specular = selected.filter(value =>
        value?.target === "hair"
        && [ "specular-source", "specular-overlay" ].includes(value?.role));
    const specularColors = NormalizeColors(contribution?.materialValues?.specularColors);

    const details = [ ...colorizeDetails, ...directDetails ];
    const channels = [
        [ details, "headwear-diffuse" ],
        [ normals, "headwear-normal" ],
        [ specular, "headwear-specular" ]
    ];
    const invalid = channels.find(([ values ]) => values.length !== 1);
    if (invalid)
    {
        const [ values, name ] = invalid;
        return {
            status: "deferred",
            reason: `${name}-${values.length ? "ambiguous" : "unresolved"}`
        };
    }
    if (zones.length)
    {
        return { status: "deferred", reason: "headwear-zoned-material-not-private-single-colour" };
    }
    const materialMode = colorizeDetails.length === 1
        ? "authored-rgba-unzoned"
        : "authored-direct-diffuse";
    if (materialMode === "authored-rgba-unzoned" && !specularColors)
    {
        return {
            status: "deferred",
            reason: "headwear-specular-colors-unresolved"
        };
    }

    return {
        status: "ready",
        rule: "configured-retained-private-headwear-material-v2",
        correctness: "retained-source-policy",
        detailPath: details[0].path,
        normalPath: normals[0].path,
        specularPath: specular[0].path,
        materialMode,
        ...(materialMode === "authored-direct-diffuse"
            && /^res:\//iu.test(String(contribution?.source?.directDiffuseUnderlayPath ?? ""))
            ? { underlayPath: contribution.source.directDiffuseUnderlayPath }
            : {}),
        materialParameters: materialMode === "authored-rgba-unzoned" ? {
            // An unzoned private RGBA input already owns its authored cloth
            // shading and design colours. Tinting it as a one-colour mask
            // destroys those details; only its specular control is selected.
            MaterialDiffuseColor: [ 1, 1, 1, 1 ],
            MaterialSpecularColor: [ ...specularColors[0] ]
        } : null
    };
}

/**
 * Partitions detailed-hair effects by their authored shared-atlas region.
 * Private reconstructed hair targets replace that region with identity sampling,
 * while head-shell and other consumers retain their independent material contract.
 */
export function resolveLegacyConfiguredHairConsumers(binding, regions)
{
    const hairRegion = regions?.hair;
    const headRegion = regions?.head;
    if (![ hairRegion, headRegion ].every(region =>
        Array.isArray(region)
        && region.length === 4
        && region.every(value => Number.isFinite(value))))
    {
        return {
            status: "deferred",
            reason: "character-hair-atlas-region-unavailable",
            effects: [],
            consumers: [],
            excludedConsumers: [],
            headShellAreas: [],
            headShellConsumers: []
        };
    }

    const effects = [];
    const consumers = [];
    const excludedConsumers = [];
    const inactiveConsumers = [];
    const deferredAreas = [];
    const headShellAreas = [];
    const headShellConsumers = [];
    const rigidEffects = [];
    const glassEffects = [];
    const rigidConsumers = [];
    const standaloneRigidCandidates = [];
    for (const resolved of binding?.resolvedMeshBindings ?? [])
    {
        for (const field of [
            "opaqueAreas", "transparentAreas", "additiveAreas", "decalAreas",
            "depthAreas", "depthNormalAreas", "distortionAreas", "pickableAreas"
        ])
        {
            for (const area of resolved?.mesh?.[field] ?? [])
            {
                const effect = area?.effect;
                if (!effect) continue;
                const effectPath = String(
                    effect?._characterAuthoredEffectFilePath
                    || effect?.effectFilePath
                    || ""
                );
                const detailedHair = /\/skinnedavatarhair_detailed\.sm_[a-z0-9_]+$/iu
                    .test(effectPath);
                const authoredRegion = Array.isArray(effect?._characterAuthoredTransformUV0)
                    ? [ ...effect._characterAuthoredTransformUV0 ]
                    : ReadTransformUV0(effect);
                const consumer = {
                    meshName: String(resolved?.meshName ?? resolved?.mesh?.name ?? ""),
                    areaField: field,
                    areaName: String(area?.name ?? ""),
                    display: area?.display !== false,
                    effectName: String(effect?.name ?? ""),
                    effectPath,
                    authoredRegion
                };
                const authoredNames = effect?._characterAuthoredParameterNames ?? [];
                const ownsHeadArt = authoredNames.includes("PortraitShaderArtDiffuseColor")
                    || authoredNames.some(name => /spotlight/iu.test(name));
                const ownsHairDetail = authoredNames.includes("HairNoiseParameters");
                const hasPrivateSamplers = [ "DiffuseMap", "NormalMap", "SpecularMap" ]
                    .every(name => typeof effect?.parameters?.[name]?.AttachTextureRes === "function");
                const authoredTexturePaths = effect?._characterAuthoredTexturePaths ?? {};
                const hasAuthoredPrivateTexture = [ "DiffuseMap", "NormalMap", "SpecularMap" ]
                    .some(name => /^res:\//iu.test(String(authoredTexturePaths[name] ?? "")));
                if (!detailedHair)
                {
                    const supportedRigidSibling =
                        /\/(?:glassshader|skinnedavatarbrdflinear)\.(?:fx|sm_[a-z0-9_]+)$/iu
                            .test(effectPath);
                    const supportedStandaloneRigid =
                        /\/skinnedavatarbrdfdoublelinear\.(?:fx|sm_[a-z0-9_]+)$/iu.test(effectPath);
                    if (area?.display !== false && hasPrivateSamplers
                        && !hasAuthoredPrivateTexture && supportedRigidSibling
                    )
                    {
                        if (!rigidEffects.includes(effect)) rigidEffects.push(effect);
                        if (/\/glassshader\./iu.test(effectPath)
                            && !glassEffects.includes(effect))
                        {
                            glassEffects.push(effect);
                        }
                        rigidConsumers.push({
                            ...consumer,
                            targetRole: /\/glassshader\./iu.test(effectPath)
                                ? "hair-glass-sibling"
                                : "hair-rigid-sibling",
                            authoredParameterEvidence: {
                                headArt: ownsHeadArt,
                                hairDetail: ownsHairDetail
                            }
                        });
                    }
                    else if (area?.display !== false && hasPrivateSamplers
                        && !hasAuthoredPrivateTexture
                        && supportedStandaloneRigid)
                    {
                        standaloneRigidCandidates.push({
                            area,
                            effect,
                            consumer: {
                                ...consumer,
                                targetRole: "hair-rigid-standalone",
                                authoredParameterEvidence: {
                                    headArt: ownsHeadArt,
                                    hairDetail: ownsHairDetail
                                }
                            }
                        });
                    }
                    else if (area?.display !== false)
                    {
                        deferredAreas.push(area);
                        excludedConsumers.push({
                            ...consumer,
                            targetRole: ownsHeadArt
                                ? "head"
                                : null,
                            reason: ownsHeadArt
                                ? "authored-material-target-is-head"
                                : !hasPrivateSamplers
                                    ? "private-hair-sibling-samplers-unavailable"
                                    : hasAuthoredPrivateTexture
                                        ? "private-hair-sibling-owns-authored-textures"
                                        : !supportedRigidSibling
                                            ? "private-hair-sibling-shader-contract-unresolved"
                                            : "private-hair-sibling-target-unresolved"
                        });
                    }
                    continue;
                }
                const targetRole = ownsHeadArt || BoundsEqual(authoredRegion, headRegion)
                    ? "head"
                    : BoundsEqual(authoredRegion, hairRegion) || ownsHairDetail
                        ? "hair"
                        : null;
                consumer.targetRole = targetRole;
                consumer.authoredParameterEvidence = {
                    headArt: ownsHeadArt,
                    hairDetail: ownsHairDetail
                };
                if (area?.display === false)
                {
                    inactiveConsumers.push({
                        ...consumer,
                        reason: "authored-reversed-consumer-collapsed"
                    });
                    continue;
                }
                if (targetRole === "hair")
                {
                    if (!effects.includes(effect)) effects.push(effect);
                    consumers.push(consumer);
                }
                else
                {
                    if (targetRole === "head" && area?.display !== false)
                    {
                        headShellAreas.push(area);
                        headShellConsumers.push({
                            ...consumer,
                            reason: "head-shell-hidden-pending-material-contract"
                        });
                    }
                    excludedConsumers.push({
                        ...consumer,
                        reason: targetRole === "head"
                            ? "authored-material-target-is-head"
                            : "authored-material-target-unresolved"
                    });
                }
            }
        }
    }
    const standaloneRigid = effects.length === 0
        && rigidEffects.length === 0
        && standaloneRigidCandidates.length > 0;
    if (standaloneRigid)
    {
        for (const candidate of standaloneRigidCandidates)
        {
            if (!rigidEffects.includes(candidate.effect)) rigidEffects.push(candidate.effect);
            rigidConsumers.push(candidate.consumer);
        }
    }
    else
    {
        for (const candidate of standaloneRigidCandidates)
        {
            deferredAreas.push(candidate.area);
            excludedConsumers.push({
                ...candidate.consumer,
                reason: "standalone-private-hair-consumer-conflicts-with-other-consumers"
            });
        }
    }

    const ready = effects.length + rigidEffects.length > 0;
    return {
        status: ready ? "ready" : "deferred",
        reason: ready
            ? null
            : "detailed-hair-region-consumer-unavailable",
        effects,
        rigidEffects,
        glassEffects,
        consumers,
        rigidConsumers,
        excludedConsumers,
        inactiveConsumers,
        deferredAreas,
        headShellAreas,
        headShellConsumers
    };
}

/** Keeps authored head shells hidden until a separate material contract is ready. */
export function hideLegacyConfiguredHairHeadShells(consumers)
{
    const areas = Array.isArray(consumers?.headShellAreas)
        ? consumers.headShellAreas
        : [];
    for (const area of areas) area.display = false;
    return areas.length;
}

/**
 * Identifies an authored body overlay selected by the exact part version.
 *
 * Some modifiers bake their final RGB and alpha into the version-specific L
 * texture instead of pairing L with a Z selector and a .color definition.
 * Do not generalize a lone L texture: require exact type/version provenance,
 * no competing material source, no retained Z candidate, and a path whose
 * authored version segment agrees with the selected version.
 */
function IsVersionAuthoredBodyOverlay(contribution, detail)
{
    const source = contribution?.source ?? {};
    const versionIndex = source.versionIndex;
    if (!Number.isInteger(versionIndex) || versionIndex <= 0
        || !String(source.typeDefinitionPath ?? "").toLowerCase().endsWith(".type")
        || source.materialDefinitionPath
        || (source.materialCandidatePaths?.length ?? 0) > 0
        || contribution?.materialValues
        || contribution?.colorSelection)
    {
        return false;
    }

    const path = String(detail?.path ?? "").replaceAll("\\", "/").toLowerCase();
    if (!path.includes(`/v${versionIndex}/`)) return false;

    return !(contribution?.textureCandidates ?? []).some(value =>
        value?.recognized
        && value?.target === "body"
        && value?.role === "colorize-zones");
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

/** Withholds scalp channels when their visible configured hairstyle is unresolved. */
export function resolveLegacyReadyHeadContributions(
    contributions,
    deferredContributions = []
)
{
    if (!Array.isArray(contributions) || !Array.isArray(deferredContributions))
    {
        throw new TypeError("Legacy head contribution availability requires arrays");
    }

    const result = { contributions: [], deferred: [] };
    for (const contribution of contributions)
    {
        if (contribution?.groupID !== "hair")
        {
            result.contributions.push(contribution);
            continue;
        }

        const deferredVisual = deferredContributions.find(value =>
            value?.layerIndex === contribution.layerIndex
            && value?.partIndex === contribution.partIndex
            && (value?.configuredVisualCandidateInventory?.configurationCount > 0
                || value?.configuredVisualCandidateInventory?.geometryCount > 0));
        if (!deferredVisual)
        {
            result.contributions.push(contribution);
            continue;
        }

        result.deferred.push({
            groupID: contribution.groupID,
            layerIndex: contribution.layerIndex,
            partSourceRecordID: contribution.source?.partSourceRecordID ?? null,
            configuredVisualCandidateInventory: {
                ...deferredVisual.configuredVisualCandidateInventory
            },
            reason: "configured-hair-geometry-unready"
        });
    }
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
            const rankA = BODY_COMPOSITION_GROUP_ORDER.get(a.contribution?.groupID);
            const rankB = BODY_COMPOSITION_GROUP_ORDER.get(b.contribution?.groupID);
            return (rankA ?? Number.MAX_SAFE_INTEGER)
                - (rankB ?? Number.MAX_SAFE_INTEGER)
                || a.sourceIndex - b.sourceIndex;
        });

    for (const { contribution } of ordered)
    {
        const currentProof = PROVED_BODY_SKIN_MAKEUP_GROUPS.has(contribution?.groupID);
        const coverage = (contribution?.selectedTextures ?? []).find(value =>
            value?.target === "body" && value?.role === "colorize-layer")
            ?? (contribution?.selectedTextures ?? []).find(value =>
                value?.target === "body" && value?.role === "diffuse-overlay")
            ?? null;
        const textures = (contribution?.selectedTextures ?? []).filter(value =>
            value?.target === "body"
            && [
                "normal-source",
                "normal-overlay",
                "twist-normal",
                "specular-source",
                "specular-overlay"
            ].includes(value?.role));
        if (Array.isArray(contribution?.occludedBy) && contribution.occludedBy.length)
        {
            for (const texture of textures)
            {
                result.deferred.push({
                    path: texture.path,
                    role: texture.role,
                    target: texture.target,
                    groupID: contribution.groupID,
                    layerIndex: contribution.layerIndex,
                    partSourceRecordID: contribution.source?.partSourceRecordID ?? null,
                    reason: "authored-modifier-occluded"
                });
            }
            continue;
        }
        for (const texture of textures)
        {
            const operation = {
                path: texture.path,
                candidatePaths: ResolveFamilyCandidatePaths(contribution, texture),
                role: texture.role,
                target: texture.target,
                groupID: contribution.groupID,
                materialControls: DescribeRetainedMaterialControls(contribution),
                layerOrder: BODY_COMPOSITION_GROUP_ORDER.get(contribution.groupID) ?? null,
                layerIndex: contribution.layerIndex,
                weight: Number.isFinite(contribution?.weight) ? contribution.weight : 1,
                partSourceRecordID: contribution.source?.partSourceRecordID ?? null,
                coveragePath: coverage?.path ?? null,
                coverageCandidatePaths: coverage
                    ? ResolveFamilyCandidatePaths(contribution, coverage)
                    : [],
                coverageRole: coverage?.role ?? null
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
            else if ([ "normal-source", "normal-overlay" ].includes(texture.role))
            {
                result.normal.push({ ...operation, op: "normal-replace" });
            }
            else if (texture.role === "specular-source")
            {
                if (!coverage)
                {
                    result.deferred.push({
                        ...operation,
                        reason: "body-specular-source-owner-unresolved"
                    });
                }
                else
                {
                    result.specular.push({ ...operation, op: "specular-replace" });
                }
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

/** Resolves the exact retained family base colour as a shared solid texture. */
function ResolveSkinBaseColorPath(staged)
{
    const colors = (staged?.configuredFoundations ?? [])
        .filter(value => value?.role === "head")
        .map(value => value?.skinTextureBindings?.baseColor)
        .filter(value => Array.isArray(value)
            && value.length === 4
            && value.every(Number.isFinite));
    if (colors.length !== 1) return null;
    return `dynamic:/color/${colors[0].map(Number).join(",")}`;
}

/** Binds full-atlas eyes and one retained colorized lash atlas to exact face carriers. */
export function applyLegacyConfiguredFaceTextures(
    binding,
    contributions,
    {
        headTextures = null,
        headDiffuseTexture = null,
        eyelashTexture = null,
        eyelashSourcePath = null,
        eyelashDirectTransform = null,
        tearductsEnabled = true,
        tearductLightingMode = "authored",
        tearductUvMode = "authored",
        tearductDiffuseMode = "composed",
        tearductBaseDiffusePath = null,
        tearductFoundationTextures = null,
        tearductFoundationEvidence = null,
        tearductSolidDiffusePath = null,
        eyeWetSupportTextures = null,
        eyeWetEnabled = true,
        eyeWetMaterialMode = "retained",
        eyeballsEnabled = true,
        eyelashCarrierMode = "all",
        eyelashUvMode = "carrier-specific",
        eyelashDepthMode = "authored",
        eyeShadowDiffuseMode = "lash",
        eyeShadowLightingMode = "authored"
    } = {}
)
{
    if (typeof tearductsEnabled !== "boolean"
        || typeof eyeWetEnabled !== "boolean"
        || typeof eyeballsEnabled !== "boolean")
    {
        throw new TypeError("Configured face tearductsEnabled must be boolean");
    }
    if (![ "authored", "neutral" ].includes(tearductLightingMode))
    {
        throw new TypeError("Configured face tearductLightingMode must be authored or neutral");
    }
    if (![ "authored", "identity" ].includes(tearductUvMode))
    {
        throw new TypeError("Configured face tearductUvMode must be authored or identity");
    }
    if (![ "composed", "base", "dark" ].includes(tearductDiffuseMode))
    {
        throw new TypeError(
            "Configured face tearductDiffuseMode must be composed, base, or dark"
        );
    }
    if (![ "retained", "composed" ].includes(eyeWetMaterialMode))
    {
        throw new TypeError(
            "Configured face eyeWetMaterialMode must be retained or composed"
        );
    }
    if (tearductDiffuseMode === "base"
        && !tearductFoundationTextures?.DiffuseMap
        && !tearductBaseDiffusePath)
    {
        throw new TypeError("Configured face base tear-duct diffuse requires a path");
    }
    if (tearductDiffuseMode === "dark" && !tearductSolidDiffusePath)
    {
        throw new TypeError("Configured face dark tear-duct diffuse requires a path");
    }
    if (![ "all", "off", "eyelashes-off", "eyeshadow-off" ].includes(eyelashCarrierMode))
    {
        throw new TypeError(
            "Configured face eyelashCarrierMode must be all, off, eyelashes-off, or eyeshadow-off"
        );
    }
    if (![ "carrier-specific", "identity", "raw-direct" ].includes(eyelashUvMode))
    {
        throw new TypeError(
            "Configured face eyelashUvMode must be carrier-specific, identity, or raw-direct"
        );
    }
    if (![ "authored", "test-no-write", "off" ].includes(eyelashDepthMode))
    {
        throw new TypeError(
            "Configured face eyelashDepthMode must be authored, test-no-write, or off"
        );
    }
    if (eyelashUvMode === "raw-direct"
        && (!Array.isArray(eyelashDirectTransform)
            || eyelashDirectTransform.length !== 4
            || eyelashDirectTransform.some(value => !Number.isFinite(value))))
    {
        throw new TypeError(
            "Configured face raw-direct eyelashes require a retained crop transform"
        );
    }
    if (![ "lash", "transparent" ].includes(eyeShadowDiffuseMode))
    {
        throw new TypeError(
            "Configured face eyeShadowDiffuseMode must be lash or transparent"
        );
    }
    if (![ "authored", "neutral" ].includes(eyeShadowLightingMode))
    {
        throw new TypeError(
            "Configured face eyeShadowLightingMode must be authored or neutral"
        );
    }
    const result = {
        status: "deferred",
        rule: "legacy-opengl-configured-face-textures-v1",
        correctness: "retained-source-policy",
        eyes: { status: "deferred", reason: "eye-texture-unresolved" },
        eyeWetness: { status: "retained" },
        eyelashes: { status: "deferred", reason: "eyelash-texture-unresolved" },
        tearducts: { status: "deferred", reason: "tearduct-material-unresolved" }
    };
    headTextures = headTextures ?? (headDiffuseTexture
        ? { DiffuseMap: headDiffuseTexture }
        : null);
    headDiffuseTexture = headTextures?.DiffuseMap ?? null;
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
            if (!eyeWetEnabled
                && /^EyeWet_GeoShape$/iu.test(meshName)
                && /eyewet/iu.test(effectName))
            {
                value.mesh.display = false;
                result.eyeWetness = {
                    status: "disabled",
                    correctness: "comparison-control",
                    carrier: DescribeConfiguredFaceCarrier(value.mesh, effect, meshName)
                };
                continue;
            }
            if (eyeWetEnabled
                && eyeWetMaterialMode === "composed"
                && (eyeWetSupportTextures?.DiffuseMap || headDiffuseTexture)
                && /^EyeWet_GeoShape$/iu.test(meshName)
                && /eyewet/iu.test(effectName))
            {
                const eyeWetDiffuse = eyeWetSupportTextures?.DiffuseMap
                    ?? headDiffuseTexture;
                const attachedChannels = SetConfiguredFaceMaterial(effect, {
                    DiffuseMap: eyeWetDiffuse
                }, { transform: [ 0, 0, 1, 1 ] });
                SetConfiguredFaceTexturePath(effect, "NormalMap", NEUTRAL_NORMAL);
                SetConfiguredFaceTexturePath(effect, "SpecularMap", NEUTRAL_SPECULAR);
                attachedChannels.push("NormalMap", "SpecularMap");
                value.mesh.display = true;
                result.eyeWetness = {
                    status: "applied",
                    correctness: eyeWetSupportTextures?.DiffuseMap
                        ? "retained-source-policy"
                        : "reference-parity",
                    rule: eyeWetSupportTextures?.DiffuseMap
                        ? "configured-generic-head-eyewet-material-v1"
                        : "legacy-opengl-composed-eyewet-material-v1",
                    binding: eyeWetSupportTextures?.DiffuseMap
                        ? "generic-head-support-diffuse-neutral-lighting"
                        : "composed-head-diffuse-neutral-lighting",
                    supportDiffuseTarget: Boolean(
                        eyeWetSupportTextures?.DiffuseMap
                    ),
                    materialMode: eyeWetMaterialMode,
                    attachedChannels,
                    carrier: DescribeConfiguredFaceCarrier(value.mesh, effect, meshName)
                };
                appliedEffects++;
                continue;
            }
            if (eyeWetEnabled
                && eyeWetMaterialMode === "retained"
                && /^EyeWet_GeoShape$/iu.test(meshName)
                && /eyewet/iu.test(effectName))
            {
                value.mesh.display = true;
                result.eyeWetness = {
                    status: "retained",
                    correctness: "comparison-control",
                    rule: "configured-eyewet-retained-material-control-v1",
                    materialMode: eyeWetMaterialMode,
                    carrier: DescribeConfiguredFaceCarrier(value.mesh, effect, meshName)
                };
                appliedEffects++;
                continue;
            }
            if (eyePath && headDiffuseTexture
                && /^Eyeball_(?:Right|Left)_GeoShape$/iu.test(meshName)
                && /^C_Eyes$/iu.test(effectName))
            {
                if (!eyeballsEnabled)
                {
                    value.mesh.display = false;
                    const hiddenCarriers = result.eyes.hiddenCarriers ?? [];
                    hiddenCarriers.push({
                        meshName,
                        correctness: "comparison-control"
                    });
                    result.eyes = {
                        ...result.eyes,
                        status: "disabled",
                        hiddenCarriers
                    };
                    continue;
                }
                // Keep the eye shader's authored flat normal and Fresnel
                // controls, but bind the selected eye's composed specular
                // contribution with its diffuse atlas. Leaving the authored
                // constant specular map in place made a reselected iris look
                // uniformly matte even though an exact eye S input had been
                // retained and composed.
                const attachedChannels = SetConfiguredFaceMaterial(effect, {
                    DiffuseMap: headDiffuseTexture,
                    SpecularMap: headTextures?.SpecularMap ?? null
                }, {
                    transform: [ 0, 0, 1, 1 ]
                });
                const carriers = result.eyes.carriers ?? [];
                carriers.push(DescribeConfiguredFaceCarrier(
                    value.mesh,
                    effect,
                    meshName
                ));
                result.eyes = {
                    status: "applied",
                    sourcePath: eyePath,
                    binding: attachedChannels.includes("SpecularMap")
                        ? "composed-head-diffuse-specular"
                        : "composed-head-diffuse",
                    attachedChannels,
                    carriers
                };
                appliedEffects++;
            }
            else if (headDiffuseTexture
                && /^Tearducts_GeoShape$/iu.test(meshName)
                && /^C_SkinShiny_TearDucts$/iu.test(effectName))
            {
                if (!tearductsEnabled)
                {
                    value.mesh.display = false;
                    result.tearducts = {
                        status: "disabled",
                        rule: "configured-tearduct-comparison-control-v1",
                        correctness: "comparison-control",
                        carrier: DescribeConfiguredFaceCarrier(
                            value.mesh,
                            effect,
                            meshName
                        )
                    };
                    continue;
                }
                const attachedChannels = tearductLightingMode === "neutral"
                    ? SetConfiguredFaceMaterial(effect, {
                        DiffuseMap: headDiffuseTexture
                    }, tearductUvMode === "identity"
                        ? { transform: [ 0, 0, 1, 1 ] }
                        : { preserveTransform: true })
                    : SetConfiguredFaceMaterial(effect, headTextures, {
                        preserveTransform: tearductUvMode === "authored",
                        transform: tearductUvMode === "identity"
                            ? [ 0, 0, 1, 1 ]
                            : null
                    });
                if (tearductLightingMode === "neutral")
                {
                    SetConfiguredFaceTexturePath(effect, "NormalMap", NEUTRAL_NORMAL);
                    SetConfiguredFaceTexturePath(effect, "SpecularMap", NEUTRAL_SPECULAR);
                    attachedChannels.push("NormalMap", "SpecularMap");
                }
                if (tearductDiffuseMode !== "composed")
                {
                    if (tearductDiffuseMode === "base"
                        && tearductFoundationTextures?.DiffuseMap)
                    {
                        const supportBindings = tearductLightingMode === "authored"
                            ? tearductFoundationTextures
                            : { DiffuseMap: tearductFoundationTextures.DiffuseMap };
                        SetConfiguredFaceMaterial(
                            effect,
                            supportBindings,
                            { preserveTransform: true }
                        );
                    }
                    else
                    {
                        SetConfiguredFaceTexturePath(
                            effect,
                            "DiffuseMap",
                            tearductDiffuseMode === "base"
                                ? tearductBaseDiffusePath
                                : tearductSolidDiffusePath
                        );
                    }
                }
                // The authored tear-duct material gives CutMaskInfluence almost
                // full control of fragment alpha while leaving CutMaskMap empty
                // for runtime composition.  A transparent missing-sampler
                // fallback therefore writes an almost-zero canvas alpha even
                // though this is an opaque geometry area.  The exact generic
                // head inventory supplies a uniform-white mask and the legacy
                // adapter used the same white compatibility value.  Bind that
                // contract explicitly until the prepared library exposes the
                // sibling mask as a typed texture role.
                if (effect?.parameters?.CutMaskMap)
                {
                    SetConfiguredFaceTexturePath(
                        effect,
                        "CutMaskMap",
                        SOLID_WHITE
                    );
                    attachedChannels.push("CutMaskMap");
                }
                value.mesh.display = true;
                result.tearducts = {
                    status: "applied",
                    correctness: tearductDiffuseMode === "base"
                        ? "experimental-policy"
                        : "comparison-control",
                    rule: tearductDiffuseMode === "base"
                        ? "exact-head-generic-support-material-v1"
                        : "configured-tearduct-comparison-control-v1",
                    binding: tearductDiffuseMode !== "composed"
                        ? tearductLightingMode === "neutral"
                            ? `${tearductDiffuseMode}-head-diffuse-neutral-lighting`
                            : `${tearductDiffuseMode}-head-diffuse-composed-lighting`
                        : tearductLightingMode === "neutral"
                            ? "composed-head-diffuse-neutral-lighting"
                            : "composed-head-material",
                    uvMode: tearductUvMode,
                    diffuseMode: tearductDiffuseMode,
                    baseDiffusePath: tearductDiffuseMode === "base"
                        ? tearductBaseDiffusePath
                        : null,
                    foundationDiffuseTarget: tearductDiffuseMode === "base"
                        && Boolean(tearductFoundationTextures?.DiffuseMap),
                    foundationChannels: tearductDiffuseMode === "base"
                        ? Object.keys(tearductFoundationTextures ?? {})
                        : [],
                    foundationEvidence: tearductDiffuseMode === "base"
                        ? tearductFoundationEvidence
                        : null,
                    solidDiffusePath: tearductDiffuseMode === "dark"
                        ? tearductSolidDiffusePath
                        : null,
                    attachedChannels,
                    carrier: DescribeConfiguredFaceCarrier(
                        value.mesh,
                        effect,
                        meshName
                    )
                };
                appliedEffects++;
            }
            else if (eyelashPath && eyelashTexture
                && /^(?:Eyelashes|EyeShadow)_GeoShape$/iu.test(meshName)
                && /eyelashes/iu.test(effectName))
            {
                const isEyeShadow = /^EyeShadow_GeoShape$/iu.test(meshName);
                if (eyelashCarrierMode === "off"
                    || (isEyeShadow && eyelashCarrierMode === "eyeshadow-off")
                    || (!isEyeShadow && eyelashCarrierMode === "eyelashes-off"))
                {
                    value.mesh.display = false;
                    const hiddenCarriers = result.eyelashes.hiddenCarriers ?? [];
                    hiddenCarriers.push({
                        meshName,
                        mode: eyelashCarrierMode,
                        correctness: "comparison-control"
                    });
                    result.eyelashes = {
                        ...result.eyelashes,
                        hiddenCarriers
                    };
                    continue;
                }
                if (isEyeShadow && eyelashUvMode === "raw-direct")
                {
                    SetConfiguredFaceDiffuse(effect, eyelashPath, {
                        transform: eyelashDirectTransform
                    });
                }
                else
                {
                    SetConfiguredFaceDiffuse(effect, eyelashTexture, isEyeShadow
                        ? eyelashUvMode === "identity"
                            ? { transform: [ 0, 0, 1, 1 ] }
                            : { preserveTransform: true }
                        : { transform: [ 0, 0, 1, 1 ] });
                }
                if (isEyeShadow && eyeShadowDiffuseMode === "transparent")
                {
                    SetConfiguredFaceDiffuse(effect, TRANSPARENT, {
                        preserveTransform: true
                    });
                }
                if (eyelashSpecularPath)
                {
                    SetConfiguredFaceTexturePath(
                        effect,
                        "SpecularMap",
                        eyelashSpecularPath
                    );
                }
                if (isEyeShadow && eyeShadowLightingMode === "neutral")
                {
                    SetConfiguredFaceTexturePath(effect, "NormalMap", NEUTRAL_NORMAL);
                    SetConfiguredFaceTexturePath(effect, "SpecularMap", SOLID_BLACK);
                    effect?.SetParameters?.({
                        MaterialSpecularColor: [ 0, 0, 0, 0 ],
                        MaterialSpecularFactors: [ 0, 0, 0, 0 ]
                    });
                }
                ApplyLegacyCoverageAlphaBlend(tw2.const, effect);
                if (eyelashDepthMode !== "authored")
                {
                    ApplyLegacyConsumerDepthTest(
                        tw2.const,
                        effect,
                        eyelashDepthMode === "test-no-write"
                    );
                }
                value.mesh.display = true;
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
                    binding: isEyeShadow && eyelashUvMode === "raw-direct"
                        ? "authored-cropped-lash-detail"
                        : "colorized-transparent-head-atlas",
                    transform: eyelashUvMode,
                    eyeShadowDiffuseMode,
                    eyeShadowLightingMode,
                    framebufferAlpha: "source-over-coverage",
                    depthMode: eyelashDepthMode,
                    hiddenCarriers: result.eyelashes.hiddenCarriers ?? [],
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

function SetConfiguredFaceMaterial(
    effect,
    textures,
    {
        transform = [ 0, 0, 1, 1 ],
        preserveTransform = false
    } = {}
)
{
    const attachedChannels = [];
    for (const name of [ "DiffuseMap", "NormalMap", "SpecularMap" ])
    {
        const texture = textures?.[name];
        if (!texture) continue;
        const parameter = effect?.parameters?.[name];
        if (typeof parameter?.AttachTextureRes !== "function")
        {
            throw new Error(`Configured face carrier does not accept ${name}`);
        }
        parameter.AttachTextureRes(texture);
        attachedChannels.push(name);
    }
    if (!attachedChannels.includes("DiffuseMap"))
    {
        throw new Error("Configured face carrier requires DiffuseMap");
    }
    if (!preserveTransform && !SetTransformUV0(effect, transform))
    {
        throw new Error("Configured face carrier does not accept TransformUV0");
    }
    return attachedChannels;
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
    const geometryMesh = mesh?.geometryResource?.meshes?.[mesh?.meshIndex] ?? null;
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
        authoredEffectFilePath: String(
            effect?._characterAuthoredEffectFilePath ?? effect?.effectFilePath ?? ""
        ),
        authoredTexturePaths: { ...(effect?._characterAuthoredTexturePaths ?? {}) },
        authoredTransformUV0: Array.isArray(effect?._characterAuthoredTransformUV0)
            ? [ ...effect._characterAuthoredTransformUV0 ]
            : null,
        materialDiffuseColor: ReadEffectVectorParameter(
            effect,
            "MaterialDiffuseColor",
            4
        ),
        materialSpecularColor: ReadEffectVectorParameter(
            effect,
            "MaterialSpecularColor",
            4
        ),
        materialSpecularCurve: ReadEffectVectorParameter(
            effect,
            "MaterialSpecularCurve",
            4
        ),
        materialSpecularFactors: ReadEffectVectorParameter(
            effect,
            "MaterialSpecularFactors",
            4
        ),
        transformUV0: ReadTransformUV0(effect),
        geometryBounds: ReadGeometryBounds(geometryMesh),
        geometryUv0Bounds: ReadGeometryUvBounds(geometryMesh, 0),
        textureSlots: DescribeAuthoredTextureSlots(effect),
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
        .map((contribution, sourceIndex) => ({
            contribution,
            sourceIndex,
            resolved: resolveLegacyBodyDiffuseContribution(contribution),
            overlays: (contribution?.selectedTextures ?? []).filter(value =>
                value?.target === "body" && value?.role === "diffuse-overlay"),
            masks: (contribution?.selectedTextures ?? []).filter(value =>
                value?.target === "body" && value?.role === "cut-mask")
        }))
        .sort((a, b) =>
        {
            const rankA = BODY_COMPOSITION_GROUP_ORDER.get(a.contribution?.groupID);
            const rankB = BODY_COMPOSITION_GROUP_ORDER.get(b.contribution?.groupID);
            return (rankA ?? Number.MAX_SAFE_INTEGER)
                - (rankB ?? Number.MAX_SAFE_INTEGER)
                || a.sourceIndex - b.sourceIndex;
        });
    const masksByOwner = new Map();

    for (const entry of entries)
    {
        const owner = entry.contribution?.ownerSelectionIndex;
        if (!entry.masks.length || !Number.isInteger(owner) || owner < 0) continue;
        if (!masksByOwner.has(owner)) masksByOwner.set(owner, []);
        for (const mask of entry.masks) masksByOwner.get(owner).push({ entry, mask });
    }

    const operations = [];
    const notApplicable = [];
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

            operations.push(entry.resolved.operation === "alpha-overlay"
                ? {
                    operation: "alpha-overlay",
                    contribution: entry.contribution,
                    texture: entry.resolved.texture,
                    evidenceRule: entry.resolved.evidenceRule
                }
                : {
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
        const hasBodyDiffuseInput = hasColorizeInput
            || entry.masks.length > 0
            || entry.overlays.length > 0;
        if (entry.resolved.status !== "ready" && hasColorizeInput)
        {
            deferred.push(DeferredContribution(entry.contribution, entry.resolved.reason));
        }
        else if (!hasBodyDiffuseInput)
        {
            notApplicable.push(DeferredContribution(
                entry.contribution,
                "body-diffuse-channel-not-authored"
            ));
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

    return { operations, deferred, notApplicable };
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
        const owner = FindExactContribution(
            contributions,
            boot,
            FEMALE_BOOT_PART
        );
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

/** Keeps configured support geometry invisible until its material owner is usable. */
function SetConfiguredPartCompositionDisplay(staged, partIndex, display, status)
{
    const part = (staged?.configuredParts ?? []).find(value =>
        value?.partIndex === partIndex);
    if (part) part.displayStatus = status;

    for (const mesh of staged?.backend?.visualModel?.meshes ?? [])
    {
        if (mesh?._characterPartIndex === partIndex) mesh.display = Boolean(display);
    }
}

/**
 * A ready bottom-owned tuck replaces the selected top's standard drape
 * continuation. The retained modifier path identifies that support role; the
 * selected top owner and decoded body-consumer effect prevent a category-wide
 * garment hide.
 */
function SuppressReadyCompetingTopDrape(staged, planned)
{
    const candidates = (staged?.textureContributions ?? []).filter(contribution =>
        contribution?.ownerSelectionIndex === planned?.topOwnerSelectionIndex
        && contribution?.groupID === "topmiddle"
        && contribution?.source?.partPath === STANDARD_DRAPE_PART_PATH
        && Number.isInteger(contribution?.partIndex));
    if (!candidates.length) return { status: "not-present", partIndices: [] };
    if (candidates.length !== 1)
    {
        return { status: "deferred", reason: "selected-top-drape-ambiguous", partIndices: [] };
    }

    const partIndex = candidates[0].partIndex;
    const part = (staged?.configuredParts ?? []).find(value =>
        value?.partIndex === partIndex);
    const meshes = (staged?.backend?.visualModel?.meshes ?? []).filter(mesh =>
        mesh?._characterPartIndex === partIndex);
    const effects = Unique(GetEffects(meshes));
    if (part?.renderStatus !== "ready"
        || !meshes.length
        || !effects.length
        || effects.some(effect => effect?._characterAuthoredBodyAtlasConsumer !== true))
    {
        return {
            status: "deferred",
            reason: "selected-top-drape-contract-unresolved",
            partIndices: [ partIndex ]
        };
    }

    SetConfiguredPartCompositionDisplay(
        staged,
        partIndex,
        false,
        "hidden-by-ready-bottom-tuck"
    );
    return {
        status: "suppressed",
        rule: "selected-top-standard-drape-replaced-by-ready-bottom-tuck-v1",
        partIndices: [ partIndex ],
        partSourceRecordIDs: [ candidates[0]?.source?.partSourceRecordID ?? null ]
    };
}

/**
 * Qualifies one female bottom-owned decal support. The support and cut mask
 * must share an owner; one independently selected, resolvable top-middle
 * layer is the derived visible-material contributor. Geometry, area, owner,
 * and texture-role evidence select the tuple without naming an outfit.
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

    const supportCandidates = configuredParts.flatMap(part =>
    {
        if (part?.renderStatus !== "ready") return [];
        const supportContributions = contributions.filter(contribution =>
            contribution?.partIndex === part.partIndex
            && contribution?.groupID === "bottomouter"
            && Number.isInteger(contribution?.ownerSelectionIndex)
            && contribution.ownerSelectionIndex >= 0
            && !(contribution?.selectedTextures ?? []).length);
        if (supportContributions.length !== 1) return [];

        const meshes = (visualModel?.meshes ?? []).filter(mesh =>
            mesh?._characterPartIndex === part.partIndex);
        if (meshes.length !== 1) return [];
        const effects = Unique(GetEffects(meshes).filter(effect =>
            effect?._characterProofFallback === true
            && effect?._characterAuthoredBodyAtlasConsumer === true
            && typeof effect?.parameters?.DiffuseMap?.AttachTextureRes === "function"
            && typeof effect?.SetParameters === "function"
            && ReadTransformUV0(effect)));
        if (effects.length !== 1) return [];
        const geometryBindings = DescribeConfiguredGarmentBindings(meshes, effects);
        if (geometryBindings.length !== 1
            || geometryBindings[0].areaContract !== "decal-only")
        {
            return [];
        }
        return [ {
            part,
            support: supportContributions[0],
            meshes,
            effects,
            geometryBindings
        } ];
    });
    if (supportCandidates.length !== 1)
    {
        return { status: "deferred", reason: "female-tuck-support-unresolved" };
    }
    const {
        part: tuckPart,
        support,
        meshes,
        effects,
        geometryBindings
    } = supportCandidates[0];
    const defer = reason => ({
        status: "deferred",
        reason,
        tuckPartIndex: tuckPart.partIndex,
        tuckPartSourceRecordID: tuckPart.partSourceRecordID
    });
    const bottomCandidates = contributions.flatMap(contribution =>
    {
        if (contribution?.ownerSelectionIndex !== support.ownerSelectionIndex
            || contribution?.groupID !== "bottomouter"
            || contribution?.partIndex === tuckPart.partIndex)
        {
            return [];
        }
        const resolved = resolveLegacyBodyDiffuseContribution(contribution);
        return resolved.status === "ready" && resolved.candidate?.detail?.path
            ? [ { contribution, resolved } ]
            : [];
    });
    if (bottomCandidates.length !== 1)
    {
        return defer("female-tuck-bottom-material-unresolved");
    }
    const bottomContribution = bottomCandidates[0].contribution;
    const bottomResolved = bottomCandidates[0].resolved;

    const masks = contributions.flatMap(contribution =>
    {
        if (contribution?.ownerSelectionIndex !== support.ownerSelectionIndex)
        {
            return [];
        }
        return (contribution.selectedTextures ?? [])
            .filter(texture => texture?.target === "body"
                && texture?.role === "cut-mask"
                && typeof texture?.path === "string"
                && texture.path.length)
            .map(texture => ({ contribution, texture }));
    });
    if (masks.length !== 1)
    {
        return defer("female-tuck-mask-unresolved");
    }

    const topCandidates = contributions.flatMap(contribution =>
    {
        if (contribution?.groupID !== "topmiddle"
            || !Number.isInteger(contribution?.ownerSelectionIndex)
            || contribution.ownerSelectionIndex < 0
            || contribution.ownerSelectionIndex === support.ownerSelectionIndex)
        {
            return [];
        }
        const resolved = resolveLegacyBodyDiffuseContribution(contribution);
        return resolved.status === "ready" && resolved.candidate?.detail?.path
            ? [ { contribution, resolved } ]
            : [];
    });
    if (topCandidates.length !== 1)
    {
        return defer("female-tuck-top-material-unresolved");
    }
    const topContribution = topCandidates[0].contribution;
    const topResolved = topCandidates[0].resolved;

    if ((visualModel?.meshes ?? []).some(mesh =>
        !meshes.includes(mesh) && GetEffects([ mesh ]).includes(effects[0])))
    {
        return defer("female-tuck-effect-shared");
    }

    return {
        status: "ready",
        tuckPartIndex: tuckPart.partIndex,
        tuckPartSourceRecordID: tuckPart.partSourceRecordID,
        supportOwnerSelectionIndex: support.ownerSelectionIndex,
        topOwnerSelectionIndex: topContribution.ownerSelectionIndex,
        alphaLayerIndex: topContribution.layerIndex,
        alphaPartSourceRecordID: topContribution.source.partSourceRecordID,
        alphaPath: topResolved.candidate.detail.path,
        topDetailPath: topResolved.candidate.detail.path,
        topZonePath: topResolved.candidate.zones.path,
        topMaterialDefinitionPath: topContribution.source.materialDefinitionPath,
        topCandidate: topResolved.candidate,
        pantsLayerIndex: bottomContribution.layerIndex,
        pantsPartSourceRecordID: bottomContribution.source.partSourceRecordID,
        pantsDetailPath: bottomResolved.candidate.detail.path,
        pantsZonePath: bottomResolved.candidate.zones.path,
        pantsMaterialDefinitionPath: bottomContribution.source.materialDefinitionPath,
        pantsCandidate: bottomResolved.candidate,
        maskLayerIndex: masks[0].contribution.layerIndex,
        maskPartSourceRecordID: masks[0].contribution.source.partSourceRecordID,
        maskPath: masks[0].texture.path,
        previousSampleBounds: ReadTransformUV0(effects[0]),
        authoredSampleBounds: Array.isArray(effects[0]._characterAuthoredTransformUV0)
            ? [ ...effects[0]._characterAuthoredTransformUV0 ]
            : null,
        geometryBindings,
        effects
    };
}

/** Qualifies a standard drape and selected top that share one retained owner. */
export function planLegacySelectedTopDrapeSupport(
    sex,
    visualModel,
    configuredParts,
    contributions
)
{
    if (sex !== "female" && sex !== "male")
    {
        return { status: "deferred", reason: "selected-top-drape-sex-unresolved" };
    }
    if (!Array.isArray(configuredParts) || !Array.isArray(contributions))
    {
        throw new TypeError("Selected-top drape planning requires configured parts and contributions");
    }

    const drapeContributions = contributions.filter(contribution =>
        (contribution?.groupID === "topmiddle" || contribution?.groupID === "topouter")
        && contribution?.source?.partPath === STANDARD_DRAPE_PART_PATH
        && Number.isInteger(contribution?.ownerSelectionIndex)
        && contribution.ownerSelectionIndex >= 0
        && Number.isInteger(contribution?.partIndex));
    if (drapeContributions.length !== 1)
    {
        return { status: "deferred", reason: "selected-top-drape-owner-unresolved" };
    }
    const drape = drapeContributions[0];
    const drapePart = configuredParts.find(part => part?.partIndex === drape.partIndex);
    if (drapePart?.renderStatus !== "ready")
    {
        return { status: "deferred", reason: "selected-top-drape-not-render-ready" };
    }

    const topCandidates = contributions.flatMap(contribution =>
    {
        if (contribution?.ownerSelectionIndex !== drape.ownerSelectionIndex
            || contribution?.groupID !== drape.groupID
            || contribution?.partIndex === drape.partIndex
            || contribution?.source?.partPath === STANDARD_DRAPE_PART_PATH)
        {
            return [];
        }
        const resolved = resolveLegacyConfiguredGarmentDiffuseContribution(contribution);
        return resolved.status === "ready" && resolved.candidate?.detail?.path
            ? [ { contribution, resolved } ]
            : [];
    });
    if (topCandidates.length !== 1)
    {
        return { status: "deferred", reason: "selected-top-drape-material-unresolved" };
    }
    const topContribution = topCandidates[0].contribution;
    const topResolved = topCandidates[0].resolved;

    const meshes = (visualModel?.meshes ?? []).filter(mesh =>
        mesh?._characterPartIndex === drape.partIndex);
    if (!meshes.length)
    {
        return { status: "deferred", reason: "selected-top-drape-mesh-unresolved" };
    }
    const effects = Unique(GetEffects(meshes).filter(effect =>
        effect?._characterProofFallback === true
        && effect?._characterAuthoredBodyAtlasConsumer === true
        && typeof effect?.parameters?.DiffuseMap?.AttachTextureRes === "function"
        && typeof effect?.SetParameters === "function"
        && ReadTransformUV0(effect)));
    if (!effects.length)
    {
        return { status: "deferred", reason: "selected-top-drape-effect-unresolved" };
    }
    if ((visualModel?.meshes ?? []).some(mesh =>
        !meshes.includes(mesh) && GetEffects([ mesh ]).some(effect => effects.includes(effect))))
    {
        return { status: "deferred", reason: "selected-top-drape-effect-shared" };
    }

    return {
        status: "ready",
        drapePartIndex: drape.partIndex,
        drapePartSourceRecordID: drape.source.partSourceRecordID,
        ownerSelectionIndex: drape.ownerSelectionIndex,
        topLayerIndex: topContribution.layerIndex,
        topPartSourceRecordID: topContribution.source.partSourceRecordID,
        alphaPath: topResolved.candidate.detail.path,
        topDetailPath: topResolved.candidate.detail.path,
        topZonePath: topResolved.candidate.zones?.path ?? null,
        topMaterialDefinitionPath: topContribution.source.materialDefinitionPath,
        topCandidate: topResolved.candidate,
        diffuseMode: topResolved.candidate.mode,
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

/** Samples RGBA target alpha at one carrier geometry's transformed UV centroids. */
export function summarizeLegacyCarrierAlpha(
    pixels,
    width,
    height,
    geometryMesh,
    transform = [ 0, 0, 1, 1 ]
)
{
    const expected = Number(width) * Number(height) * 4;
    if (!(pixels instanceof Uint8Array)
        || !Number.isSafeInteger(width) || width <= 0
        || !Number.isSafeInteger(height) || height <= 0
        || pixels.length < expected)
    {
        throw new TypeError("Carrier alpha evidence requires a complete Uint8 RGBA buffer");
    }
    if (!Array.isArray(transform)
        || transform.length !== 4
        || transform.some(value => !Number.isFinite(Number(value))))
    {
        throw new TypeError("Carrier alpha evidence requires four finite UV bounds");
    }
    const indices = geometryMesh?.indexData;
    if (!indices?.length || indices.length % 3 !== 0
        || typeof geometryMesh?.GetVertexElement !== "function")
    {
        return { status: "unavailable", reason: "carrier-geometry-uv-unavailable" };
    }

    const alpha = [];
    const rawBounds = [ Infinity, Infinity, -Infinity, -Infinity ];
    const transformedBounds = [ Infinity, Infinity, -Infinity, -Infinity ];
    const uv0 = [];
    const uv1 = [];
    const uv2 = [];
    for (let index = 0; index < indices.length; index += 3)
    {
        geometryMesh.GetVertexElement(uv0, indices[index], 5, 0);
        geometryMesh.GetVertexElement(uv1, indices[index + 1], 5, 0);
        geometryMesh.GetVertexElement(uv2, indices[index + 2], 5, 0);
        if (![ uv0, uv1, uv2 ].every(uv =>
            uv.length >= 2 && Number.isFinite(uv[0]) && Number.isFinite(uv[1])))
        {
            continue;
        }
        const u = (uv0[0] + uv1[0] + uv2[0]) / 3;
        const v = (uv0[1] + uv1[1] + uv2[1]) / 3;
        rawBounds[0] = Math.min(rawBounds[0], u);
        rawBounds[1] = Math.min(rawBounds[1], v);
        rawBounds[2] = Math.max(rawBounds[2], u);
        rawBounds[3] = Math.max(rawBounds[3], v);
        const transformedU = u * (transform[2] - transform[0]) + transform[0];
        const transformedV = v * (transform[3] - transform[1]) + transform[1];
        transformedBounds[0] = Math.min(transformedBounds[0], transformedU);
        transformedBounds[1] = Math.min(transformedBounds[1], transformedV);
        transformedBounds[2] = Math.max(transformedBounds[2], transformedU);
        transformedBounds[3] = Math.max(transformedBounds[3], transformedV);
        const x = Math.round(Clamp01(transformedU) * (width - 1));
        const y = Math.round(Clamp01(transformedV) * (height - 1));
        alpha.push(pixels[(y * width + x) * 4 + 3]);
    }

    if (!alpha.length)
    {
        return { status: "unavailable", reason: "carrier-triangle-uv-unavailable" };
    }
    const alphaSum = alpha.reduce((sum, value) => sum + value, 0);
    const nonzeroSamples = alpha.filter(Boolean).length;
    return {
        status: "sampled-triangle-centroids",
        sampleCount: alpha.length,
        nonzeroSamples,
        nonzeroRatio: nonzeroSamples / alpha.length,
        alphaSum,
        meanAlpha: alphaSum / alpha.length,
        maximumAlpha: Math.max(...alpha),
        rawUvBounds: rawBounds,
        transformedUvBounds: transformedBounds,
        transform: transform.map(Number)
    };
}

/** Atomically attaches one CutMaskMap only to foundation body effects. */
export function commitLegacyFoundationCutMaskBindings(visualModel, texture)
{
    const effects = GetFoundationBodyEffects(visualModel);
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

/**
 * Applies a composed cut through diffuse alpha when the foundation shader has
 * no cut-mask sampler. The same retained mask target drives both paths.
 */
export function commitLegacyFoundationAlphaCutBindings(visualModel, texture)
{
    const effects = GetFoundationBodyEffects(visualModel).filter(effect =>
        typeof effect?.parameters?.DiffuseMap?.AttachTextureRes === "function");
    if (!effects.length)
    {
        throw new Error("No foundation body effect accepts diffuse alpha coverage");
    }
    const bindings = effects.map(effect => ({
        consumer: CaptureConsumerBinding(effect),
        states: CaptureTechniquePassStates(effect)
    }));

    try
    {
        for (const effect of effects)
        {
            effect.parameters.DiffuseMap.AttachTextureRes(texture);
            ApplyLegacyConsumerAlphaTest(tw2.const, effect, true);
        }
        return bindings.map(binding => ({
            role: "body",
            effectFilePath: binding.consumer.effect.effectFilePath ?? null,
            previousResourcePath: binding.consumer.resourcePath || null,
            coveragePolicy: "composed-diffuse-alpha-test"
        }));
    }
    catch (cause)
    {
        const rollbackFailures = [];
        for (const binding of [ ...bindings ].reverse())
        {
            rollbackFailures.push(...RestoreTechniquePassStates([ binding.states ]));
            rollbackFailures.push(...RestoreConsumerBindings([ binding.consumer ]));
        }
        const error = new Error(cause.message, { cause });
        error.rollbackFailures = rollbackFailures;
        throw error;
    }
}

function GetFoundationBodyEffects(visualModel)
{
    return Unique((visualModel?.meshes ?? [])
        .filter(mesh => mesh?._characterFoundationRole === "body")
        .flatMap(mesh => GetEffects([ mesh ])));
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
        if (contribution.groupID === "hair") continue;
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
            if (effect?._characterGarmentBodyFallback === true) continue;
            if (effect?._characterAuthoredBodyAtlasConsumer !== true
                && !isLegacyConfiguredBodyConsumerEffect(effect)) continue;
            // A configured foundation replacement is already bounded by its
            // own geometry. It must sample the shared body atlas directly;
            // applying the garment owner's alpha would remove exposed skin.
            if (effect?._characterFoundationReplacementRole) continue;
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
            let authoredDiffusePath = String(
                preservedAuthoredDiffusePath
                || ReadTexturePath(parameter)
            ).trim();
            let alphaSource = {
                type: "authored-effect-diffuse",
                ownerSelectionIndex,
                layerIndex: contribution.layerIndex ?? null,
                partIndex,
                partSourceRecordID: contribution.source?.partSourceRecordID ?? null
            };
            if (effect?._characterProofFallback === true && !preservedAuthoredDiffusePath)
            {
                const ownerAlphaCandidates = UniqueByPath(contributions
                    .filter(value =>
                        value?.ownerSelectionIndex === ownerSelectionIndex)
                    .map(value => ({
                        contribution: value,
                        resolved: resolveLegacyBodyDiffuseContribution(value)
                    }))
                    .map(value => ({
                        contribution: value.contribution,
                        path: value.resolved?.candidate?.detail?.path
                            ?? value.resolved?.texture?.path
                            ?? null
                    }))
                    .filter(value => /^res:\//iu.test(String(value.path ?? ""))));
                if (ownerAlphaCandidates.length !== 1)
                {
                    deferred.push({
                        partIndex,
                        groupID: contribution.groupID,
                        ownerSelectionIndex,
                        ownerAlphaPaths: ownerAlphaCandidates.map(value => value.path),
                        reason: ownerAlphaCandidates.length
                            ? "configured-consumer-owner-alpha-ambiguous"
                            : "configured-consumer-owner-alpha-unresolved"
                    });
                    continue;
                }
                const ownerAlpha = ownerAlphaCandidates[0];
                authoredDiffusePath = ownerAlpha.path;
                alphaSource = {
                    type: "owner-selection-diffuse-alpha",
                    ownerSelectionIndex,
                    layerIndex: ownerAlpha.contribution.layerIndex ?? null,
                    partIndex: ownerAlpha.contribution.partIndex ?? null,
                    partSourceRecordID:
                        ownerAlpha.contribution.source?.partSourceRecordID ?? null
                };
            }
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
                alphaSource.type,
                alphaSource.ownerSelectionIndex ?? "",
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
                        alphaSource,
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
                    alphaSource,
                    cutMaskPaths,
                    consumers: []
                });
            }
            groups.get(signature).consumers.push({
                effect,
                partIndex,
                groupID: contribution.groupID,
                ownerSelectionIndex,
                alphaSource,
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
        coverageAlpha = false,
        transformUV0 = null,
        textureBindings = {}
    } = {}
)
{
    if (typeof neutralizeDiffuseColor !== "boolean"
        || typeof alphaTest !== "boolean"
        || typeof depthTest !== "boolean"
        || typeof preserveAlphaBlend !== "boolean"
        || typeof coverageAlpha !== "boolean")
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
    const lightingEntries = Object.entries(textureBindings)
        .filter(([ , texture ]) => Boolean(texture));
    if (lightingEntries.some(([ name ]) =>
        ![ "NormalMap", "SpecularMap" ].includes(name)))
    {
        throw new TypeError("Configured consumer lighting bindings require NormalMap/SpecularMap");
    }
    const snapshots = effects.map(effect => ({
        consumer: CaptureConsumerBinding(effect),
        textures: lightingEntries.map(([ name ]) => CaptureTextureBinding(effect, name))
    }));
    const stateSnapshots = alphaTest || !depthTest || coverageAlpha
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
            for (const [ name, lightingTexture ] of lightingEntries)
            {
                effect.parameters[name].AttachTextureRes(lightingTexture);
            }
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
        if (coverageAlpha)
        {
            for (const effect of effects)
            {
                ApplyLegacyCoverageAlphaBlend(tw2.const, effect);
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
        const rollbackFailures = [ ...RestoreTechniquePassStates(stateSnapshots) ];
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
 * Atomically attaches one composed garment diffuse plus exact retained
 * normal/specular paths to the currently visible GLES proof material. This is
 * intentionally not authored-effect promotion: promotion remains gated on the
 * authored shader's complete lookup/environment contract.
 */
export async function commitLegacyConfiguredGarmentBindings(
    effects,
    texture,
    textureBindings = {},
    { alphaTest = false } = {}
)
{
    if (typeof alphaTest !== "boolean")
    {
        throw new TypeError("Configured garment alphaTest option must be boolean");
    }
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
    const stateSnapshots = alphaTest ? effects.map(CaptureTechniquePassStates) : [];

    try
    {
        for (const effect of effects)
        {
            if (!SetIdentityTransformUV0(effect))
            {
                throw new Error("Configured garment does not accept TransformUV0");
            }
            effect.parameters.DiffuseMap.AttachTextureRes(texture);
            const diffuseColor = effect.parameters?.MaterialDiffuseColor;
            if (typeof diffuseColor?.SetValue === "function")
            {
                diffuseColor.SetValue([ 1, 1, 1, 1 ]);
            }
            else if (diffuseColor && typeof effect.SetParameters === "function")
            {
                // Tw2Effect reports whether a value changed, not whether the
                // parameter exists. An already-white material is a successful
                // binding and must not roll back an otherwise complete surface.
                effect.SetParameters({ MaterialDiffuseColor: [ 1, 1, 1, 1 ] });
            }
            else if (diffuseColor)
            {
                throw new Error("Configured garment cannot set MaterialDiffuseColor");
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
            if (alphaTest) ApplyLegacyConsumerAlphaTest(tw2.const, effect, true);
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
            alphaPolicy: alphaTest ? "authored-owner-alpha-test" : "authored-area-state",
            authoredPromotion: "deferred-incomplete-shader-contract"
        };
    }
    catch (cause)
    {
        const rollbackFailures = [ ...RestoreTechniquePassStates(stateSnapshots) ];
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

/**
 * Atomically binds one reconstructed accessory tuple to its private BRDF
 * consumers and to independently authored transparent GlassShader consumers.
 * Both partitions sample the private target directly; the transparent shader
 * retains its authored parameters and render-state contract.
 */
export async function commitLegacyConfiguredAccessoryBindings(
    materialEffects,
    glassEffects,
    texture,
    textureBindings = {}
)
{
    materialEffects = Unique(materialEffects);
    glassEffects = Unique(glassEffects);
    const allEffects = Unique([ ...materialEffects, ...glassEffects ]);
    const entries = Object.entries(textureBindings);
    if (!materialEffects.length || !glassEffects.length || !texture
        || materialEffects.some(effect => glassEffects.includes(effect)))
    {
        throw new TypeError(
            "Configured accessory bindings require distinct private-material and glass consumers"
        );
    }
    for (const [ name, binding ] of entries)
    {
        if (![ "NormalMap", "SpecularMap" ].includes(name)
            || !binding?.textureRes
            || !/^res:\//iu.test(String(binding?.sourcePath ?? "")))
        {
            throw new TypeError(
                "Configured accessory lighting bindings require retained NormalMap/SpecularMap sources"
            );
        }
    }

    const snapshots = allEffects.map(effect => ({
        consumer: CaptureConsumerBinding(effect),
        textures: entries.map(([ name ]) => CaptureTextureBinding(effect, name))
    }));

    try
    {
        for (const effect of allEffects)
        {
            if (!SetIdentityTransformUV0(effect))
            {
                throw new Error("Configured accessory consumer does not accept TransformUV0");
            }
            effect.parameters.DiffuseMap.AttachTextureRes(texture);
            const diffuseColor = effect.parameters?.MaterialDiffuseColor;
            if (typeof diffuseColor?.SetValue === "function")
            {
                diffuseColor.SetValue([ 1, 1, 1, 1 ]);
            }
            else if (diffuseColor && typeof effect.SetParameters === "function")
            {
                effect.SetParameters({ MaterialDiffuseColor: [ 1, 1, 1, 1 ] });
            }
            else if (diffuseColor)
            {
                throw new Error("Configured accessory cannot set MaterialDiffuseColor");
            }
            for (const [ name, binding ] of entries)
            {
                const parameter = effect?.parameters?.[name];
                if (typeof parameter?.AttachTextureRes !== "function")
                {
                    throw new Error(`Configured accessory does not accept ${name}`);
                }
                parameter.AttachTextureRes(binding.textureRes);
            }
        }

        for (const effect of allEffects)
        {
            await tw2.resMan?.Watch?.(effect);
            if (effect?.IsGood?.() === false)
            {
                throw new Error("Configured accessory effect failed to prepare");
            }
            for (const [ name ] of entries)
            {
                if (effect.parameters[name]?.IsGood?.() === false)
                {
                    throw new Error(`Configured accessory ${name} failed to prepare`);
                }
            }
        }

        return {
            status: "applied",
            rule: "configured-accessory-private-and-glass-consumers-v1",
            correctness: "retained-source-policy-live-proof",
            attachedEffects: allEffects.length,
            materialEffects: materialEffects.length,
            glassEffects: glassEffects.length,
            texturePaths: Object.fromEntries(entries.map(([ name, binding ]) => [
                name,
                binding.sourcePath
            ])),
            alphaPolicy: "authored-area-and-glass-shader-state",
            glass: glassEffects.map(effect => DescribeConfiguredGlassEffect(effect, null))
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

/**
 * Atomically realizes one decoded, textureless accessory material on the
 * compatible linear-BRDF proof shader. Neutral proof D/N/S samplers remain in
 * place; the decoded material library, lighting controls, UV bounds, and exact
 * N·L lookup are restored without promoting the unrenderable authored effect.
 */
export async function commitLegacyConfiguredMaterialOnlyAccessoryBindings(
    effects,
    contracts,
    meshes = []
)
{
    effects = Unique(effects);
    contracts = Array.isArray(contracts) ? contracts : [];
    if (!effects.length
        || effects.length !== contracts.length
        || contracts.some(contract => !effects.includes(contract?.effect)))
    {
        throw new TypeError(
            "Material-only accessory bindings require one exact contract per effect"
        );
    }

    const parameterNames = [
        "MaterialDiffuseColor",
        ...Object.keys(MATERIAL_ONLY_ACCESSORY_VECTOR_LENGTHS)
    ];
    const proofTransferSupported = contracts.every(contract =>
        parameterNames.every(name => HasEffectParameter(contract.effect, name))
        && HasEffectParameter(contract.effect, "ColorNdotLLookupMap"));
    if (!proofTransferSupported)
    {
        return CommitLegacyMaterialOnlyAccessoryAuthoredEffects(
            effects,
            contracts,
            meshes
        );
    }
    const snapshots = contracts.map(contract =>
    {
        const values = Object.fromEntries(parameterNames.map(name =>
        {
            const length = name === "MaterialDiffuseColor"
                ? 4
                : MATERIAL_ONLY_ACCESSORY_VECTOR_LENGTHS[name];
            const value = ReadEffectVectorParameter(contract.effect, name, length);
            if (!value)
            {
                throw new Error(`Material-only accessory cannot capture ${name}`);
            }
            return [ name, value ];
        }));
        const transformUV0 = ReadTransformUV0(contract.effect);
        if (!transformUV0)
        {
            throw new Error("Material-only accessory cannot capture TransformUV0");
        }
        return {
            effect: contract.effect,
            transformUV0,
            parameters: values,
            colorNdotL: CaptureTextureBinding(contract.effect, "ColorNdotLLookupMap")
        };
    });

    try
    {
        for (const contract of contracts)
        {
            const { effect } = contract;
            if (!SetTransformUV0(effect, contract.transformUV0))
            {
                throw new Error("Material-only accessory cannot retain TransformUV0");
            }
            const parameters = {
                MaterialDiffuseColor: [ 1, 1, 1, 1 ],
                ...contract.parameters
            };
            if (typeof effect?.SetParameters !== "function")
            {
                throw new Error("Material-only accessory cannot apply material controls");
            }
            effect.SetParameters(parameters);
            for (const [ name, value ] of Object.entries(parameters))
            {
                if (!BoundsEqual(
                    ReadEffectVectorParameter(effect, name, value.length),
                    value
                ))
                {
                    throw new Error(`Material-only accessory could not apply ${name}`);
                }
            }

            const lookup = effect?.parameters?.ColorNdotLLookupMap;
            if (typeof lookup?.SetValue !== "function")
            {
                throw new Error("Material-only accessory cannot apply ColorNdotLLookupMap");
            }
            lookup.SetValue(contract.colorNdotLPath);
            if (ReadTexturePath(lookup).toLowerCase()
                    !== contract.colorNdotLPath.toLowerCase())
            {
                throw new Error("Material-only accessory cannot apply ColorNdotLLookupMap");
            }
        }

        for (const effect of effects)
        {
            await tw2.resMan?.Watch?.(effect);
            if (effect?.IsGood?.() === false
                || effect?.parameters?.ColorNdotLLookupMap?.IsGood?.() === false)
            {
                throw new Error("Material-only accessory effect failed to prepare");
            }
        }

        const report = {
            status: "applied",
            rule: "legacy-opengl-material-only-accessory-v1",
            correctness: "retained-source-policy",
            attachedEffects: effects.length,
            bindingMode: "compatible-proof-control-transfer",
            authoredPromotion: "deferred-incomplete-authored-shader-contract",
            samplerPolicy: "neutral-proof-dns-with-retained-ndotl",
            effectiveEffects: contracts.map(contract => ({
                effectName: String(contract.effect?.name ?? ""),
                authoredEffectPath: contract.authoredEffectPath,
                transformUV0: ReadTransformUV0(contract.effect),
                parameters: Object.fromEntries(parameterNames.map(name => [
                    name,
                    ReadEffectVectorParameter(contract.effect, name, 4)
                ])),
                colorNdotLPath: ReadTexturePath(
                    contract.effect?.parameters?.ColorNdotLLookupMap
                )
            }))
        };
        Object.defineProperty(report, "activeEffects", {
            value: effects,
            enumerable: false
        });
        return report;
    }
    catch (cause)
    {
        const rollbackFailures = [];
        for (const snapshot of [ ...snapshots ].reverse())
        {
            try
            {
                snapshot.effect.SetParameters({
                    TransformUV0: snapshot.transformUV0,
                    ...snapshot.parameters
                });
            }
            catch (error)
            {
                rollbackFailures.push(error);
            }
            rollbackFailures.push(...RestoreTextureBindings([ snapshot.colorNdotL ]));
        }
        const error = new Error(cause.message, { cause });
        error.rollbackFailures = rollbackFailures;
        throw error;
    }
}

async function CommitLegacyMaterialOnlyAccessoryAuthoredEffects(
    effects,
    contracts,
    meshes
)
{
    if (!Array.isArray(meshes) || !meshes.length)
    {
        throw new Error(
            "Material-only accessory authored promotion requires configured consumers"
        );
    }
    const fields = [
        "opaqueAreas", "transparentAreas", "additiveAreas", "decalAreas",
        "depthAreas", "depthNormalAreas", "distortionAreas", "pickableAreas"
    ];
    const consumers = contracts.map(contract =>
    {
        const areas = [];
        for (const mesh of meshes)
        {
            for (const field of fields)
            {
                for (const area of mesh?.[field] ?? [])
                {
                    if (area?.effect === contract.effect) areas.push(area);
                }
            }
        }
        if (!areas.length || areas.some(area => area?.reversed === true))
        {
            throw new Error(
                "Material-only accessory authored promotion requires non-reversed exact consumers"
            );
        }
        return { ...contract, areas };
    });
    const samplerNames = [
        "DiffuseMap",
        "NormalMap",
        "SpecularMap",
        "ReflectionMap",
        "ShadowCubeMap0",
        "CutMaskMap",
        "FresnelLookupMap"
    ];
    const snapshots = consumers.map(contract =>
    {
        const authored = contract.authoredEffect;
        const materialDiffuseColor = ReadEffectVectorParameter(
            authored,
            "MaterialDiffuseColor",
            4
        );
        if (!materialDiffuseColor || typeof authored?.SetParameters !== "function")
        {
            throw new Error(
                "Material-only accessory authored effect lacks a diffuse material control"
            );
        }
        return {
            authored,
            materialDiffuseColor,
            textures: samplerNames
                .filter(name => typeof authored?.parameters?.[name]?.AttachTextureRes
                    === "function")
                .map(name => CaptureTextureBinding(authored, name)),
            areas: contract.areas.map(area => ({ area, effect: area.effect }))
        };
    });

    try
    {
        for (const contract of consumers)
        {
            const { effect, authoredEffect: authored } = contract;
            for (const name of samplerNames)
            {
                const target = authored?.parameters?.[name];
                if (!target) continue;
                if (typeof target.AttachTextureRes !== "function"
                    && typeof target.SetValue !== "function") continue;
                const targetPath = ReadTexturePath(target);
                if (/^res:\//iu.test(targetPath) || target?.textureRes) continue;
                const proof = effect?.parameters?.[name];
                if (proof?.textureRes && typeof target.AttachTextureRes === "function")
                {
                    target.AttachTextureRes(proof.textureRes);
                }
                else
                {
                    const proofPath = ReadTexturePath(proof);
                    if (!/^res:\//iu.test(proofPath)
                        || typeof target.SetValue !== "function")
                    {
                        throw new Error(
                            `Material-only accessory lacks a neutral ${name} sampler`
                        );
                    }
                    target.SetValue(proofPath);
                }
            }
            authored.SetParameters({ MaterialDiffuseColor: [ 1, 1, 1, 1 ] });
            if (!BoundsEqual(
                ReadEffectVectorParameter(authored, "MaterialDiffuseColor", 4),
                [ 1, 1, 1, 1 ]
            ))
            {
                throw new Error(
                    "Material-only accessory authored effect rejected MaterialDiffuseColor"
                );
            }
            await tw2.resMan?.Watch?.(authored);
            if (authored?.IsGood?.() === false
                || authored?.parameters?.ColorNdotLLookupMap?.IsGood?.() === false)
            {
                throw new Error("Material-only accessory authored effect failed to prepare");
            }
        }

        for (const contract of consumers)
        {
            for (const area of contract.areas) area.effect = contract.authoredEffect;
        }

        const activeEffects = consumers.map(contract => contract.authoredEffect);
        const report = {
            status: "applied",
            rule: "legacy-opengl-material-only-accessory-v1",
            correctness: "retained-source-policy",
            attachedEffects: activeEffects.length,
            bindingMode: "retained-linear-brdf-neutral-sampler-completion",
            authoredPromotion: "bounded-compatible-linear-brdf",
            samplerPolicy: "neutral-missing-samplers-with-retained-ndotl",
            effectiveEffects: consumers.map(contract => ({
                effectName: String(contract.authoredEffect?.name ?? ""),
                authoredEffectPath: contract.authoredEffectPath,
                transformUV0: ReadTransformUV0(contract.authoredEffect),
                parameters: {
                    MaterialDiffuseColor: ReadEffectVectorParameter(
                        contract.authoredEffect,
                        "MaterialDiffuseColor",
                        4
                    ),
                    ...Object.fromEntries(Object.entries(
                        MATERIAL_ONLY_ACCESSORY_VECTOR_LENGTHS
                    ).map(([ name, length ]) => [
                        name,
                        ReadEffectVectorParameter(contract.authoredEffect, name, length)
                    ]))
                },
                colorNdotLPath: ReadTexturePath(
                    contract.authoredEffect?.parameters?.ColorNdotLLookupMap
                )
            }))
        };
        Object.defineProperty(report, "activeEffects", {
            value: activeEffects,
            enumerable: false
        });
        return report;
    }
    catch (cause)
    {
        const rollbackFailures = [];
        for (const snapshot of [ ...snapshots ].reverse())
        {
            try
            {
                snapshot.authored.SetParameters({
                    MaterialDiffuseColor: snapshot.materialDiffuseColor
                });
                for (const { area, effect } of snapshot.areas) area.effect = effect;
            }
            catch (error)
            {
                rollbackFailures.push(error);
            }
            rollbackFailures.push(...RestoreTextureBindings(snapshot.textures));
        }
        const error = new Error(cause.message, { cause });
        error.rollbackFailures = rollbackFailures;
        throw error;
    }
}

/** Atomically installs reconstructed detailed-hair textures and selected palette controls. */
export async function commitLegacyConfiguredHairBindings(
    effects,
    texture,
    textureBindings = {},
    materialParameters = null,
    rigidEffects = [],
    {
        rigidTexture = null,
        glassEffects = [],
        glassTexture = null,
        glassLightingMode = "transmission"
    } = {}
)
{
    effects = Unique(effects);
    rigidEffects = Unique(rigidEffects).filter(effect => !effects.includes(effect));
    rigidTexture ??= texture;
    glassEffects = Unique(glassEffects).filter(effect =>
        !effects.includes(effect) && !rigidEffects.includes(effect));
    const entries = Object.entries(textureBindings);
    const materialEntries = Object.entries(materialParameters ?? {});
    const requiredMaterialNames = [
        "MaterialDiffuseColor",
        "HairSpecularColor1",
        "HairSpecularColor2"
    ];
    if (effects.length + rigidEffects.length + glassEffects.length === 0 || !texture
        || rigidEffects.length > 0 && !rigidTexture
        || glassEffects.length > 0 && !glassTexture
        || ![ "transmission", "authored", "legacy" ].includes(glassLightingMode)
        || materialParameters !== null && (
            materialEntries.length !== requiredMaterialNames.length
            || requiredMaterialNames.some(name => !Object.hasOwn(materialParameters, name))
        ))
    {
        throw new TypeError(
            "Configured hair bindings require effects, a diffuse target, and selected hair colors"
        );
    }
    for (const [ name, value ] of materialEntries)
    {
        if (!requiredMaterialNames.includes(name)
            || !Array.isArray(value)
            || value.length !== 4
            || value.some(component => !Number.isFinite(component)))
        {
            throw new TypeError("Configured hair material parameters must be finite colors");
        }
    }
    for (const [ name, binding ] of entries)
    {
        if (![ "NormalMap", "SpecularMap" ].includes(name)
            || !binding?.textureRes
            || !/^res:\//iu.test(String(binding?.sourcePath ?? "")))
        {
            throw new TypeError(
                "Configured hair lighting bindings require retained NormalMap/SpecularMap sources"
            );
        }
    }

    const snapshots = effects.map(effect => ({
        consumer: CaptureConsumerBinding(effect),
        textures: entries.map(([ name ]) => CaptureTextureBinding(effect, name)),
        states: CaptureTechniquePassStates(effect),
        material: Object.fromEntries(requiredMaterialNames
            .map(name => [ name, ReadEffectVectorParameter(effect, name, 4) ]))
    }));
    const rigidSnapshots = rigidEffects.map(effect => ({
        consumer: CaptureConsumerBinding(effect),
        textures: [ "NormalMap", "SpecularMap" ]
            .map(name => CaptureTextureBinding(effect, name)),
        states: CaptureTechniquePassStates(effect),
        materialDiffuseColor: ReadEffectVectorParameter(effect, "MaterialDiffuseColor", 4)
    }));
    const glassSnapshots = glassEffects.map(effect => ({
        consumer: CaptureConsumerBinding(effect, false),
        textures: [ "NormalMap", "SpecularMap", "IrradianceMap" ]
            .filter(name => effect?.parameters?.[name])
            .map(name => CaptureTextureBinding(effect, name)),
        states: CaptureTechniquePassStates(effect),
        materialDiffuseColor: ReadEffectVectorParameter(effect, "MaterialDiffuseColor", 4),
        glassTransparencyColor: ReadEffectVectorParameter(
            effect,
            "GlassTransparencyColor",
            4
        )
    }));

    try
    {
        for (const effect of effects)
        {
            if (!SetIdentityTransformUV0(effect))
            {
                throw new Error("Configured hair does not accept TransformUV0");
            }
            if (typeof effect?.parameters?.DiffuseMap?.AttachTextureRes !== "function")
            {
                throw new Error("Configured hair does not accept DiffuseMap");
            }
            effect.parameters.DiffuseMap.AttachTextureRes(texture);
            for (const name of materialParameters === null ? [] : requiredMaterialNames)
            {
                if (!HasEffectParameter(effect, name))
                {
                    throw new Error(`Configured hair does not accept ${name}`);
                }
            }
            if (materialParameters !== null) effect.SetParameters(materialParameters);
            for (const [ name, value ] of materialEntries)
            {
                if (!BoundsEqual(ReadEffectVectorParameter(effect, name, 4), value))
                {
                    throw new Error(`Configured hair could not apply ${name}`);
                }
            }
            for (const [ name, binding ] of entries)
            {
                const parameter = effect?.parameters?.[name];
                if (typeof parameter?.AttachTextureRes !== "function")
                {
                    throw new Error(`Configured hair does not accept ${name}`);
                }
                parameter.AttachTextureRes(binding.textureRes);
            }
            // Detailed hair retains its authored two-pass RGB, depth, and cut
            // states. Only the framebuffer coverage equation is independent:
            // soft fringe pixels must accumulate alpha instead of replacing it.
            ApplyLegacyCoverageAlphaBlend(tw2.const, effect);
        }

        for (const [ effect, diffuseTexture, requiresTransform ] of [
            ...rigidEffects.map(effect => [ effect, rigidTexture, true ]),
            ...glassEffects.map(effect => [ effect, glassTexture, false ])
        ])
        {
            const transform = ReadTransformUV0(effect);
            if ((requiresTransform || transform) && !SetIdentityTransformUV0(effect)
                || typeof effect?.parameters?.DiffuseMap?.AttachTextureRes !== "function")
            {
                throw new Error("Configured hair sibling does not accept private diffuse");
            }
            effect.parameters.DiffuseMap.AttachTextureRes(diffuseTexture);
            if (HasEffectParameter(effect, "MaterialDiffuseColor"))
            {
                effect.SetParameters({ MaterialDiffuseColor: [ 1, 1, 1, 1 ] });
            }
            if (glassEffects.includes(effect)
                && glassLightingMode === "transmission"
                && HasEffectParameter(effect, "GlassTransparencyColor"))
            {
                const retained = ReadEffectVectorParameter(
                    effect,
                    "GlassTransparencyColor",
                    4
                );
                effect.SetParameters({
                    GlassTransparencyColor: [ ...retained.slice(0, 3), 0 ]
                });
            }
            if (glassEffects.includes(effect) && glassLightingMode === "legacy")
            {
                const irradiance = effect?.parameters?.IrradianceMap;
                if (typeof irradiance?.SetValue === "function")
                {
                    irradiance.SetValue(LEGACY_GLASS_IRRADIANCE);
                }
                else if (typeof effect?.SetTextures === "function")
                {
                    effect.SetTextures({ IrradianceMap: LEGACY_GLASS_IRRADIANCE });
                }
            }
            for (const [ name, binding ] of entries)
            {
                const parameter = effect?.parameters?.[name];
                if (typeof parameter?.AttachTextureRes !== "function")
                {
                    throw new Error(`Configured hair sibling does not accept ${name}`);
                }
                parameter.AttachTextureRes(binding.textureRes);
            }
        }

        for (const effect of [ ...effects, ...rigidEffects, ...glassEffects ])
        {
            await tw2.resMan?.Watch?.(effect);
            if (effect?.IsGood?.() === false)
            {
                throw new Error("Configured hair effect failed to prepare");
            }
        }
        if (glassLightingMode === "transmission")
        {
            const d3d = RequireD3DConstants(tw2.const);
            for (const effect of glassEffects)
            {
                if ((effect?.GetPassCount?.("Main") ?? 0) <= 1) continue;
                effect.SetTechniquePassStateOverride(
                    "Main",
                    1,
                    d3d.RS_COLORWRITEENABLE,
                    0
                );
                effect.SetTechniquePassStateOverride(
                    "Main",
                    1,
                    d3d.RS_ZWRITEENABLE,
                    0
                );
            }
        }
        const effectiveEffects = effects.map(effect => ({
            effectName: String(effect?.name ?? ""),
            effectPath: String(
                effect?._characterAuthoredEffectFilePath
                || effect?.effectFilePath
                || ""
            ),
            parameters: Object.fromEntries(requiredMaterialNames.map(name => [
                name,
                ReadEffectVectorParameter(effect, name, 4)
            ]))
        }));
        const sharedEffectiveParameters = effectiveEffects.length > 0
            && effectiveEffects.every(item =>
                requiredMaterialNames.every(name => BoundsEqual(
                    item.parameters[name],
                    effectiveEffects[0].parameters[name]
                )))
            ? effectiveEffects[0].parameters
            : null;
        return {
            status: "applied",
            rule: "legacy-opengl-detailed-hair-material-v1",
            correctness: "retained-source-policy",
            attachedEffects: effects.length,
            attachedRigidEffects: rigidEffects.length,
            attachedGlassEffects: glassEffects.length,
            texturePaths: Object.fromEntries(entries.map(([ name, binding ]) => [
                name,
                binding.sourcePath
            ])),
            materialParameters: Object.fromEntries(materialEntries.map(([ name, value ]) => [
                name,
                [ ...value ]
            ])),
            effectiveMaterialParameters: sharedEffectiveParameters,
            effectiveEffects,
            glassLightingMode,
            glassEffectContracts: glassEffects.map((effect, index) =>
                DescribeConfiguredGlassEffect(
                    effect,
                    glassSnapshots[index]?.states ?? null
                )),
            framebufferAlpha: "source-over-coverage"
        };
    }
    catch (cause)
    {
        const rollbackFailures = [];
        for (const snapshot of [ ...glassSnapshots ].reverse())
        {
            rollbackFailures.push(...RestoreTechniquePassStates([ snapshot.states ]));
            if (snapshot.materialDiffuseColor)
            {
                try
                {
                    snapshot.consumer.effect.SetParameters({
                        MaterialDiffuseColor: snapshot.materialDiffuseColor
                    });
                }
                catch (error)
                {
                    rollbackFailures.push(error);
                }
            }
            if (snapshot.glassTransparencyColor)
            {
                try
                {
                    snapshot.consumer.effect.SetParameters({
                        GlassTransparencyColor: snapshot.glassTransparencyColor
                    });
                }
                catch (error)
                {
                    rollbackFailures.push(error);
                }
            }
            rollbackFailures.push(...RestoreTextureBindings(snapshot.textures));
            rollbackFailures.push(...RestoreConsumerBindings([ snapshot.consumer ]));
        }
        for (const snapshot of [ ...rigidSnapshots ].reverse())
        {
            rollbackFailures.push(...RestoreTechniquePassStates([ snapshot.states ]));
            if (snapshot.materialDiffuseColor)
            {
                try
                {
                    snapshot.consumer.effect.SetParameters({
                        MaterialDiffuseColor: snapshot.materialDiffuseColor
                    });
                }
                catch (error)
                {
                    rollbackFailures.push(error);
                }
            }
            rollbackFailures.push(...RestoreTextureBindings(snapshot.textures));
            rollbackFailures.push(...RestoreConsumerBindings([ snapshot.consumer ]));
        }
        for (const snapshot of [ ...snapshots ].reverse())
        {
            rollbackFailures.push(...RestoreTechniquePassStates([ snapshot.states ]));
            try
            {
                snapshot.consumer.effect.SetParameters(snapshot.material);
            }
            catch (error)
            {
                rollbackFailures.push(error);
            }
            rollbackFailures.push(...RestoreTextureBindings(snapshot.textures));
            rollbackFailures.push(...RestoreConsumerBindings([ snapshot.consumer ]));
        }
        const error = new Error(cause.message, { cause });
        error.rollbackFailures = rollbackFailures;
        throw error;
    }
}

function DescribeConfiguredGlassEffect(effect, stateSnapshot)
{
    const parameterNames = [
        "GlassOptions",
        "GlassTransparencyColor",
        "GlassTransparencyOptions",
        "GlassOptions2",
        "MaterialDiffuseColor",
        "MaterialSpecularColor",
        "MaterialCubeReflection",
        "MaterialCubeReflectionControl",
        "MaterialCubeReflectionColor"
    ];
    const shaderTechniques = Object.fromEntries(Object.entries(
        effect?.shader?.techniques ?? {}
    ).map(([ name, technique ]) => [ name, (technique?.passes ?? []).map(pass => ({
        states: (pass?.states ?? []).map(value => ({
            state: value.state,
            value: value.value
        }))
    })) ]));
    return {
        effectName: String(effect?.name ?? ""),
        effectPath: String(
            effect?._characterAuthoredEffectFilePath
            || effect?.effectFilePath
            || ""
        ),
        parameters: Object.fromEntries(parameterNames
            .map(name => [ name, ReadEffectVectorParameter(effect, name, 4) ])
            .filter(([ , value ]) => value !== null)),
        shaderTechniques,
        passOverrides: stateSnapshot?.passes?.map(pass => ({
            technique: pass.technique,
            pass: pass.pass,
            states: pass.state
        })) ?? []
    };
}

/** Atomically installs reconstructed private headwear channels and selected material colours. */
export async function commitLegacyConfiguredHeadwearBindings(
    effects,
    texture,
    textureBindings = {},
    materialParameters = null,
    materialMode = null
)
{
    effects = Unique(effects);
    const entries = Object.entries(textureBindings);
    const requiredMaterialNames = [ "MaterialDiffuseColor", "MaterialSpecularColor" ];
    const appliesSelectedMaterial = materialParameters !== null;
    materialMode ??= appliesSelectedMaterial
        ? "authored-rgba-unzoned"
        : "authored-direct-diffuse";
    if (!effects.length || !texture
        || ![ "authored-rgba-unzoned", "authored-direct-diffuse" ].includes(materialMode)
        || (appliesSelectedMaterial
            && requiredMaterialNames.some(name => !Object.hasOwn(materialParameters, name))))
    {
        throw new TypeError(
            "Configured headwear bindings require effects, a diffuse target, and selected material colours"
        );
    }
    for (const name of appliesSelectedMaterial ? requiredMaterialNames : [])
    {
        const value = materialParameters[name];
        if (!Array.isArray(value) || value.length !== 4
            || value.some(component => !Number.isFinite(component)))
        {
            throw new TypeError("Configured headwear material parameters must be finite colours");
        }
    }
    for (const [ name, binding ] of entries)
    {
        if (![ "NormalMap", "SpecularMap" ].includes(name)
            || !binding?.textureRes
            || !/^res:\//iu.test(String(binding?.sourcePath ?? "")))
        {
            throw new TypeError(
                "Configured headwear lighting bindings require retained NormalMap/SpecularMap sources"
            );
        }
    }

    const snapshots = effects.map(effect => ({
        consumer: CaptureConsumerBinding(effect),
        textures: entries.map(([ name ]) => CaptureTextureBinding(effect, name)),
        material: Object.fromEntries(requiredMaterialNames
            .map(name => [ name, ReadEffectVectorParameter(effect, name, 4) ]))
    }));

    try
    {
        for (const effect of effects)
        {
            if (!SetIdentityTransformUV0(effect))
            {
                throw new Error("Configured headwear does not accept TransformUV0");
            }
            if (typeof effect?.parameters?.DiffuseMap?.AttachTextureRes !== "function")
            {
                throw new Error("Configured headwear does not accept DiffuseMap");
            }
            effect.parameters.DiffuseMap.AttachTextureRes(texture);
            const effectiveMaterialParameters = appliesSelectedMaterial
                ? materialParameters
                : {
                    // A finished diffuse target already owns its RGB. Remove
                    // the diagnostic fallback tint while retaining the
                    // independently selected/current specular control.
                    MaterialDiffuseColor: [ 1, 1, 1, 1 ],
                    MaterialSpecularColor: ReadEffectVectorParameter(
                        effect,
                        "MaterialSpecularColor",
                        4
                    )
                };
            if (!appliesSelectedMaterial
                && !Array.isArray(effectiveMaterialParameters.MaterialSpecularColor))
            {
                throw new Error("Configured direct headwear lacks a specular material control");
            }
            for (const name of requiredMaterialNames)
            {
                if (!HasEffectParameter(effect, name))
                {
                    throw new Error(`Configured headwear does not accept ${name}`);
                }
            }
            effect.SetParameters(effectiveMaterialParameters);
            for (const name of requiredMaterialNames)
            {
                if (!BoundsEqual(
                    ReadEffectVectorParameter(effect, name, 4),
                    effectiveMaterialParameters[name]
                ))
                {
                    throw new Error(`Configured headwear could not apply ${name}`);
                }
            }
            for (const [ name, binding ] of entries)
            {
                const parameter = effect?.parameters?.[name];
                if (typeof parameter?.AttachTextureRes !== "function")
                {
                    throw new Error(`Configured headwear does not accept ${name}`);
                }
                parameter.AttachTextureRes(binding.textureRes);
            }
        }

        for (const effect of effects)
        {
            await tw2.resMan?.Watch?.(effect);
            if (effect?.IsGood?.() === false)
            {
                throw new Error("Configured headwear effect failed to prepare");
            }
        }
        return {
            status: "applied",
            rule: "legacy-opengl-private-headwear-material-v1",
            correctness: "retained-source-policy",
            attachedEffects: effects.length,
            texturePaths: Object.fromEntries(entries.map(([ name, binding ]) => [
                name,
                binding.sourcePath
            ])),
            materialMode,
            materialParameters: appliesSelectedMaterial
                ? Object.fromEntries(requiredMaterialNames.map(name => [
                    name,
                    [ ...materialParameters[name] ]
                ]))
                : effects.map(effect => Object.fromEntries(requiredMaterialNames.map(name => [
                    name,
                    ReadEffectVectorParameter(effect, name, 4)
                ]))),
            effectiveMaterialParameters: effects.map(effect => ({
                effectName: String(effect?.name ?? ""),
                effectPath: String(effect?.effectFilePath ?? ""),
                textureParameters: Object.keys(effect?.parameters ?? {})
                    .filter(name => /(?:map|texture)$/iu.test(name))
                    .sort()
                    .map(name => ({
                        name,
                        path: ReadTexturePath(effect?.parameters?.[name]) || null,
                        attached: effect?.parameters?.[name]?.isAttached === true
                            || Boolean(effect?.parameters?.[name]?.textureRes)
                    })),
                parameters: Object.fromEntries(requiredMaterialNames.map(name => [
                    name,
                    ReadEffectVectorParameter(effect, name, 4)
                ])),
                shaderConstants: Object.fromEntries(requiredMaterialNames.map(name => [
                    name,
                    ReadEffectShaderVectorParameter(effect, name, 4)
                ])),
                shaderMaterialConstants: ReadEffectShaderMaterialConstants(effect),
                shaderTextureBindings: ReadEffectShaderTextureBindings(effect)
            }))
        };
    }
    catch (cause)
    {
        const rollbackFailures = [];
        for (const snapshot of [ ...snapshots ].reverse())
        {
            try
            {
                snapshot.consumer.effect.SetParameters(snapshot.material);
            }
            catch (error)
            {
                rollbackFailures.push(error);
            }
            rollbackFailures.push(...RestoreTextureBindings(snapshot.textures));
            rollbackFailures.push(...RestoreConsumerBindings([ snapshot.consumer ]));
        }
        const error = new Error(cause.message, { cause });
        error.rollbackFailures = rollbackFailures;
        throw error;
    }
}

/** Atomically installs independently composed head lighting atlases. */
export async function commitLegacyConfiguredHeadBindings(
    effects,
    textureBindings,
    { materialMode = "authored" } = {}
)
{
    if (![ "authored", "body-default" ].includes(materialMode))
    {
        throw new TypeError("Configured head materialMode must be authored or body-default");
    }
    effects = Unique(effects);
    const entries = Object.entries(textureBindings ?? {});
    if (!effects.length || !entries.length
        || entries.some(([ name, texture ]) =>
            ![ "DiffuseMap", "NormalMap", "SpecularMap" ].includes(name) || !texture))
    {
        throw new TypeError("Configured head bindings require effects and D/N/S atlas textures");
    }

    const snapshots = effects.map(effect => ({
        contract: CaptureEffectContract(effect),
        consumer: CaptureConsumerBinding(effect),
        textures: entries.map(([ name ]) => CaptureTextureBinding(effect, name))
    }));
    try
    {
        for (const effect of effects)
        {
            if (materialMode === "body-default")
            {
                ApplyBodyDefaultHeadMaterial(effect);
            }
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
            materialMode,
            attachedEffects: effects.length,
            sampleBounds: [ 0, 0, 1, 1 ],
            effectBindings: effects.map(SummarizeFoundationEffect)
        };
    }
    catch (cause)
    {
        const error = new Error(cause.message, { cause });
        const rollbackFailures = [];
        for (const snapshot of [ ...snapshots ].reverse())
        {
            rollbackFailures.push(...RestoreEffectContract(snapshot.contract));
            rollbackFailures.push(...RestoreTextureBindings(snapshot.textures));
            rollbackFailures.push(...RestoreConsumerBindings([ snapshot.consumer ]));
        }
        error.rollbackFailures = rollbackFailures;
        throw error;
    }
}

/**
 * Applies a demo-only comparison against the observed generic-body material
 * controls. This is a diagnostic seam, not a character recipe or Carbon rule.
 */
function ApplyBodyDefaultHeadMaterial(effect)
{
    if (typeof effect?.CleanEffect !== "function")
    {
        throw new Error("Configured head skin cannot clean its generic material contract");
    }
    effect.CleanEffect();

    const values = {
        MaterialDiffuseColor: [ 1, 1, 1, 1 ],
        MaterialSpecularCurve: [ 0, 50, 0, 0 ]
    };
    const applicable = Object.fromEntries(Object.entries(values).filter(([ name ]) =>
        HasEffectParameter(effect, name)));
    if (Object.keys(applicable).length
        && (typeof effect?.SetParameters !== "function"
            || effect.SetParameters(applicable) === false))
    {
        throw new Error("Configured head skin does not accept body-default material controls");
    }
}

function CaptureEffectContract(effect)
{
    return {
        effect,
        autoParameter: effect?.autoParameter,
        options: { ...(effect?.options ?? {}) },
        parameters: { ...(effect?.parameters ?? {}) },
        shader: effect?.shader ?? null
    };
}

function RestoreEffectContract(snapshot)
{
    const failures = [];
    try
    {
        snapshot.effect.autoParameter = snapshot.autoParameter;
        snapshot.effect.options = { ...snapshot.options };
        snapshot.effect.parameters = { ...snapshot.parameters };
        snapshot.effect.shader = snapshot.shader;
    }
    catch (error)
    {
        failures.push(error);
    }
    return failures;
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
            if (configuredProof)
            {
                const diffuseColor = effect.parameters?.MaterialDiffuseColor;
                if (typeof diffuseColor?.SetValue === "function")
                {
                    diffuseColor.SetValue([ 1, 1, 1, 1 ]);
                }
                else if (diffuseColor
                    && effect.SetParameters?.({
                        MaterialDiffuseColor: [ 1, 1, 1, 1 ]
                    }) === false)
                {
                    throw new Error(
                        "Configured body-atlas consumer does not accept MaterialDiffuseColor"
                    );
                }
            }
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
                    source: "shared-body-diffuse-target",
                    diffuseColorPolicy: "neutral-body-atlas-sample"
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
                    source: "shared-body-diffuse-target",
                    effectBinding: SummarizeFoundationEffect(effect)
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
        const foundation = BODY_ROLES.has(mesh?._characterFoundationRole);
        for (const effect of GetEffects([ mesh ]))
        {
            const replacement = Boolean(effect?._characterFoundationReplacementRole);
            if (!foundation && !replacement) continue;
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
        const foundation = BODY_ROLES.has(mesh?._characterFoundationRole);
        for (const effect of GetEffects([ mesh ]))
        {
            const replacement = Boolean(effect?._characterFoundationReplacementRole);
            if (!foundation && !replacement) continue;
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

function ReadEffectShaderVectorParameter(effect, name, length)
{
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
    return values.every(value => BoundsEqual(value, first)) ? first : null;
}

function ReadEffectShaderMaterialConstants(effect)
{
    const result = {};
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
                if (!runtimeStage?.constantBuffer) continue;
                for (const constant of shaderStage?.constants ?? [])
                {
                    const name = String(constant?.name ?? "");
                    if (!/(?:material|fresnel|cut|color|specular)/iu.test(name)
                        || !Number.isInteger(constant?.offset)
                        || !Number.isInteger(constant?.size)
                        || constant.size < 1) continue;
                    const value = Array.from(runtimeStage.constantBuffer)
                        .slice(constant.offset, constant.offset + Math.min(constant.size, 4))
                        .map(Number);
                    if (!value.length || !value.every(Number.isFinite)) continue;
                    const key = `${techniqueName}/${passIndex}/${stageIndex}/${name}`;
                    result[key] = value;
                }
            }
        }
    }
    return result;
}

function ReadEffectShaderTextureBindings(effect)
{
    const result = [];
    for (const [ techniqueName, technique ] of Object.entries(effect?.techniques ?? {}))
    {
        for (let passIndex = 0; passIndex < (technique?.length ?? 0); passIndex++)
        {
            for (let stageIndex = 0; stageIndex < (technique[passIndex]?.stages?.length ?? 0);
                stageIndex++)
            {
                for (const texture of technique[passIndex].stages[stageIndex]?.textures ?? [])
                {
                    const parameterName = String(texture?.parameter?.name ?? "");
                    const publicParameter = effect?.parameters?.[parameterName] ?? null;
                    const textureRes = texture?.parameter?.textureRes ?? null;
                    result.push({
                        technique: techniqueName,
                        pass: passIndex,
                        stage: stageIndex,
                        slot: texture?.slot ?? null,
                        parameterName,
                        usesPublicParameter: texture?.parameter === publicParameter,
                        attached: texture?.parameter?.isAttached === true,
                        resourceType: String(textureRes?.constructor?.name ?? ""),
                        resourceName: String(textureRes?.name ?? ""),
                        resourcePath: String(textureRes?.path ?? "")
                    });
                }
            }
        }
    }
    return result;
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

function CaptureConsumerBinding(effect, requireTransform = true)
{
    const parameter = effect?.parameters?.DiffuseMap;
    const transform = ReadTransformUV0(effect);
    if ((requireTransform && !transform)
        || typeof parameter?.AttachTextureRes !== "function")
    {
        throw new Error("Configured consumer binding cannot be captured");
    }
    return {
        effect,
        transform,
        materialControls: CaptureFoundationMaterialControls(effect),
        textureRes: parameter.textureRes ?? null,
        resourcePath: String(parameter.resourcePath ?? ""),
        isAttached: parameter.isAttached === true
    };
}

function CaptureFoundationMaterialControls(effect)
{
    const lengths = {
        MaterialDiffuseColor: 4,
        MaterialSpecularColor: 4,
        MaterialSpecularCurve: 4,
        MaterialLibraryID: 1,
        Material2LibraryID: 1
    };
    return Object.fromEntries(Object.entries(lengths)
        .filter(([ name ]) => HasEffectParameter(effect, name))
        .map(([ name, length ]) => [
            name,
            ReadEffectVectorParameter(effect, name, length)
        ])
        .filter(([ , value ]) => value !== null));
}

/** Retains the exact material controls used by one foundation skin effect. */
function SummarizeFoundationEffect(effect)
{
    return {
        effectFilePath: String(effect?.effectFilePath ?? ""),
        effectResourcePath: String(effect?.effectRes?.path ?? ""),
        authoredEffectFilePath: String(effect?._characterAuthoredEffectFilePath ?? ""),
        options: { ...(effect?.options ?? {}) },
        parameterNames: Object.keys(effect?.parameters ?? {}).sort(),
        transformUV0: ReadEffectVectorParameter(effect, "TransformUV0", 4),
        materialDiffuseColor: ReadEffectVectorParameter(
            effect,
            "MaterialDiffuseColor",
            4
        ),
        materialSpecularColor: ReadEffectVectorParameter(
            effect,
            "MaterialSpecularColor",
            4
        ),
        materialSpecularCurve: ReadEffectVectorParameter(
            effect,
            "MaterialSpecularCurve",
            4
        ),
        wrinkleParams: ReadEffectVectorParameter(effect, "WrinkleParams", 4),
        colorCorrectionSource: ReadEffectVectorParameter(
            effect,
            "ColorCorrectionSource",
            4
        ),
        materialLibraryID: ReadEffectVectorParameter(effect, "MaterialLibraryID", 1),
        material2LibraryID: ReadEffectVectorParameter(effect, "Material2LibraryID", 1)
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

/** Preserves RGB source-alpha blending while accumulating framebuffer coverage. */
function ApplyLegacyCoverageAlphaBlend(d3d, effect)
{
    const required = [
        "RS_SEPARATEALPHABLENDENABLE",
        "RS_SRCBLENDALPHA",
        "RS_DESTBLENDALPHA",
        "BLEND_ONE",
        "BLEND_INVSRCALPHA"
    ];
    if (!d3d || required.some(name => !Number.isFinite(d3d[name])))
    {
        throw new Error("Configured coverage alpha requires ccpwgl D3D constants");
    }
    for (const technique of Object.keys(effect.techniques ?? {}))
    {
        const passCount = effect.GetPassCount(technique);
        for (let pass = 0; pass < passCount; pass++)
        {
            effect.SetTechniquePassStateOverride(
                technique,
                pass,
                d3d.RS_SEPARATEALPHABLENDENABLE,
                1
            );
            effect.SetTechniquePassStateOverride(
                technique,
                pass,
                d3d.RS_SRCBLENDALPHA,
                d3d.BLEND_ONE
            );
            effect.SetTechniquePassStateOverride(
                technique,
                pass,
                d3d.RS_DESTBLENDALPHA,
                d3d.BLEND_INVSRCALPHA
            );
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
            if (snapshot.transform)
            {
                snapshot.effect.SetParameters({ TransformUV0: snapshot.transform });
            }
            if (Object.keys(snapshot.materialControls ?? {}).length)
            {
                snapshot.effect.SetParameters(snapshot.materialControls);
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
            authoredCutMaskInfluence: effect?._characterAuthoredCutMaskInfluence
                ? [ ...effect._characterAuthoredCutMaskInfluence ]
                : ReadEffectVectorParameter(
                    effect?._characterAuthoredEffect ?? effect,
                    "CutMaskInfluence",
                    4
                ),
            authoredCutMaskInfluenceSource: effect?._characterAuthoredCutMaskInfluenceSource
                ?? null,
            authoredCutMaskBinding: effect?._characterAuthoredCutMaskBinding
                ? { ...effect._characterAuthoredCutMaskBinding }
                : DescribeAuthoredCutMaskBinding(effect?._characterAuthoredEffect ?? effect),
            appliedCutMaskInfluence: effect?._characterAppliedCutMaskInfluence
                ? [ ...effect._characterAppliedCutMaskInfluence ]
                : ReadEffectVectorParameter(effect, "CutMaskInfluence", 4),
            appliedCutMaskPolicy: effect?._characterAppliedCutMaskPolicy ?? null,
            appliedCutMaskBinding: DescribeAuthoredCutMaskBinding(effect),
            authoredSampleBounds: effect?._characterAuthoredTransformUV0
                ? [ ...effect._characterAuthoredTransformUV0 ]
                : ReadTransformUV0(effect?._characterAuthoredEffect ?? effect),
            sampleBounds: ReadTransformUV0(effect),
            areaFields: Unique(consumers.map(value => value.areaField)),
            areaContract: ClassifyConfiguredGarmentAreaContract(consumers),
            consumers
        };
    });
}

function DescribeAuthoredCutMaskBinding(effect)
{
    const parameter = effect?.parameters?.CutMaskMap;
    if (!parameter) return { declared: false, resourcePath: null, attached: false };
    return {
        declared: true,
        resourcePath: ReadTexturePath(parameter) || null,
        attached: parameter?.isAttached === true || Boolean(parameter?.textureRes)
    };
}

function ClassifyConfiguredGarmentAreaContract(consumers)
{
    const fields = Unique((consumers ?? []).map(value => value?.areaField).filter(Boolean));
    if (fields.length !== 1) return fields.length ? "mixed-area-fields" : "unresolved";
    switch (fields[0])
    {
        case "opaqueAreas": return "opaque-only";
        case "transparentAreas": return "transparent-only";
        case "additiveAreas": return "additive-only";
        case "decalAreas": return "decal-only";
        default: return "specialized-only";
    }
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


function UniqueByPath(values)
{
    const result = [];
    const paths = new Set();
    for (const value of values)
    {
        const path = String(value?.path ?? "").toLowerCase();
        if (!path || paths.has(path)) continue;
        paths.add(path);
        result.push(value);
    }
    return result;
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
    const rgbSum = [ 0, 0, 0 ];
    const coveredRgbSum = [ 0, 0, 0 ];
    let coveredPixels = 0;
    for (const value of pixels)
    {
        hash ^= value;
        hash = Math.imul(hash, 16777619);
    }
    for (let index = 0; index < pixels.length; index += 4)
    {
        for (let channel = 0; channel < 3; channel++)
        {
            rgbSum[channel] += pixels[index + channel];
            if (pixels[index + 3]) coveredRgbSum[channel] += pixels[index + channel];
        }
        if (pixels[index + 3]) coveredPixels++;
    }
    const pixelCount = target.width * target.height;
    return {
        status: "readback",
        rgbaFnv1a: (hash >>> 0).toString(16).padStart(8, "0"),
        meanRgb: rgbSum.map(value => value / pixelCount),
        coveredMeanRgb: coveredPixels
            ? coveredRgbSum.map(value => value / coveredPixels)
            : [ 0, 0, 0 ],
        ...summarizeLegacyTextureAlpha(pixels, target.width, target.height)
    };
}

function ReadConfiguredFaceCarrierAlphaEvidence(target, binding)
{
    if (typeof target?.ReadPixels !== "function")
    {
        return [ {
            status: "unavailable",
            reason: "render-target-readback-unavailable"
        } ];
    }
    const pixels = new Uint8Array(target.width * target.height * 4);
    target.ReadPixels(pixels, 0, 0, target.width, target.height);
    const result = [];
    for (const value of binding?.resolvedMeshBindings ?? [])
    {
        const meshName = String(value?.meshName ?? "");
        if (!/^(?:Eyelashes|EyeShadow)_GeoShape$/iu.test(meshName)) continue;
        const effect = GetEffects([ value.mesh ]).find(candidate =>
            /eyelashes/iu.test(String(candidate?.name ?? "")));
        const transform = ReadTransformUV0(effect) ?? [ 0, 0, 1, 1 ];
        result.push({
            meshName,
            geometryMeshName: String(value?.geometryMeshName ?? ""),
            display: value?.mesh?.display !== false,
            ...summarizeLegacyCarrierAlpha(
                pixels,
                target.width,
                target.height,
                value?.geometry?.meshes?.[value.meshIndex],
                transform
            )
        });
    }
    return result;
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

function IntersectPlacement(left, right)
{
    const x = Math.max(left[0], right[0]);
    const y = Math.max(left[1], right[1]);
    const maxX = Math.min(left[0] + left[2], right[0] + right[2]);
    const maxY = Math.min(left[1] + left[3], right[1] + right[3]);
    return maxX > x && maxY > y ? [ x, y, maxX - x, maxY - y ] : null;
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
