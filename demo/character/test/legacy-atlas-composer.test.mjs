import assert from "node:assert/strict";
import test from "node:test";

import {
    SetTestTw2,
    applyLegacyConfiguredFaceTextures,
    attachLegacyBodyDiffuse,
    attachLegacyBodyNormal,
    attachLegacyBodySpecular,
    TnyGlesAtlasComposer,
    commitLegacyConfiguredConsumerBindings,
    commitLegacyConfiguredHairBindings,
    commitLegacyConfiguredHeadwearBindings,
    commitLegacyConfiguredHeadBindings,
    commitLegacyFoundationAlphaCutBindings,
    commitLegacyFoundationCutMaskBindings,
    composeLegacyConfiguredConsumerPixel,
    composeLegacyFoundationCutMaskPixel,
    decodeLegacyBc3AlphaMask,
    getLegacyConfiguredConsumerPassContract,
    hideLegacyConfiguredHairHeadShells,
    isLegacyConfiguredBodyConsumerEffect,
    parsePngAtlasMetadata,
    ReadLibraryAtlasMetadata,
    planLegacyConfiguredBodyConsumers,
    planLegacyBodyDiffuseOperations,
    planLegacyExactFemaleLowerSleeve,
    planLegacyExactFemaleUpperSleeve,
    planLegacyExactFemaleTuckSupport,
    planLegacySelectedTopDrapeSupport,
    planLegacyFemaleFoundationCutMask,
    resolveLegacyBodyDiffuseContribution,
    resolveLegacyConfiguredAccessoryMaterial,
    resolveLegacyConfiguredGarmentDiffuseContribution,
    resolveLegacyConfiguredHairDiffuseContribution,
    resolveLegacyConfiguredHairConsumers,
    resolveLegacyConfiguredHeadwearMaterial,
    resolveLegacyHairShaderMaterial,
    resolveLegacyBodyMaterialChannels,
    resolveLegacyDefaultBrowCandidate,
    resolveLegacyDefaultEyelashCandidate,
    resolveLegacyBodyFoundationPath,
    resolveLegacyBodyFoundationSpecularPath,
    resolveLegacyCroppedTextureTransform,
    resolveLegacyHeadMaterialChannels,
    resolveLegacyReadyHeadContributions,
    resolveLegacyHairMaterialChannels,
    summarizeLegacyTextureAlpha,
    summarizeLegacyCarrierAlpha
} from "./runtime-character-modules.mjs";

SetTestTw2({});

test("configured accessories resolve exact head and accessory target tuples", () =>
{
    const createContribution = target => ({
        groupID: "accessories/glasses",
        materialValues: {
            colors: [
                [ 0.2, 0.4, 0.7, 1 ],
                [ 0.1, 0.2, 0.3, 1 ],
                [ 0.7, 0.8, 0.9, 1 ]
            ]
        },
        selectedTextures: [
            { path: `res:/${target}_l.png`, role: "colorize-layer", target },
            { path: `res:/${target}_z.png`, role: "colorize-zones", target },
            { path: `res:/${target}_n.png`, role: "normal-source", target },
            { path: `res:/${target}_s.png`, role: "specular-source", target }
        ]
    });

    for (const target of [ "head", "acc" ])
    {
        const contribution = createContribution(target);
        assert.deepEqual(resolveLegacyConfiguredAccessoryMaterial(contribution), {
            status: "ready",
            rule: "configured-retained-accessory-material-v1",
            correctness: "retained-source-policy",
            target,
            candidate: {
                mode: "colorized",
                contribution,
                detail: contribution.selectedTextures[0],
                zones: contribution.selectedTextures[1],
                colors: contribution.materialValues.colors
            },
            materialChannels: {
                status: "ready",
                rule: "configured-retained-accessory-lighting-v1",
                correctness: "retained-source-policy",
                normalPath: `res:/${target}_n.png`,
                specularPath: `res:/${target}_s.png`
            }
        });
    }
});

test("configured accessories defer mixed targets and non-accessory owners", () =>
{
    const contribution = {
        groupID: "accessories/glasses",
        materialValues: {
            colors: [ [ 1, 1, 1, 1 ], [ 1, 1, 1, 1 ], [ 1, 1, 1, 1 ] ]
        },
        selectedTextures: [
            { path: "res:/head_l.png", role: "colorize-layer", target: "head" },
            { path: "res:/acc_z.png", role: "colorize-zones", target: "acc" }
        ]
    };

    assert.deepEqual(resolveLegacyConfiguredAccessoryMaterial(contribution), {
        status: "deferred",
        reason: "configured-accessory-target-ambiguous"
    });
    assert.deepEqual(resolveLegacyConfiguredAccessoryMaterial({
        ...contribution,
        groupID: "outer"
    }), {
        status: "deferred",
        reason: "configured-accessory-group-unavailable"
    });
});

test("configured hair resolves one exact retained L/Z/N/S material", () =>
{
    const contribution = {
        materialValues: {
            colors: [
                [ 0.3, 0.2, 0.1, 1 ],
                [ 0.2, 0.1, 0.05, 1 ],
                [ 0.1, 0.05, 0.02, 1 ]
            ]
        },
        selectedTextures: [
            { path: "res:/hair_l.png", role: "colorize-layer", target: "hair" },
            { path: "res:/hair_z.png", role: "colorize-zones", target: "hair" },
            { path: "res:/hair_n.png", role: "normal-overlay", target: "hair" },
            { path: "res:/hair_s.png", role: "specular-overlay", target: "hair" },
            { path: "res:/head_l.png", role: "colorize-layer", target: "head" }
        ]
    };

    const diffuse = resolveLegacyConfiguredHairDiffuseContribution(contribution);
    assert.equal(diffuse.status, "ready");
    assert.equal(diffuse.candidate.detail.path, "res:/hair_l.png");
    assert.equal(diffuse.candidate.zones.path, "res:/hair_z.png");
    assert.deepEqual(resolveLegacyHairMaterialChannels(contribution), {
        status: "ready",
        rule: "configured-retained-hair-lighting-v1",
        correctness: "retained-source-policy",
        normalPath: "res:/hair_n.png",
        specularPath: "res:/hair_s.png"
    });
});

test("configured hair binds only consumers that own the authored hair atlas region", () =>
{
    const hairEffect = {
        name: "hair cards",
        effectFilePath: "res:/graphics/effect.gles2/managed/interior/avatar/skinnedavatarhair_detailed.sm_hi",
        _characterAuthoredTransformUV0: [ 0.5, 0.5, 0.75, 1 ],
        _characterAuthoredParameterNames: [ "HairNoiseParameters" ]
    };
    const headEffect = {
        name: "head shell",
        effectFilePath: "res:/graphics/effect.gles2/managed/interior/avatar/skinnedavatarhair_detailed.sm_hi",
        _characterAuthoredTransformUV0: [ 0.5, 0, 1, 0.5 ],
        _characterAuthoredParameterNames: [ "PortraitShaderArtDiffuseColor" ]
    };
    const headArea = { effect: headEffect };
    const binding = {
        resolvedMeshBindings: [
            {
                meshName: "strand carrier",
                mesh: { transparentAreas: [ { effect: hairEffect } ] }
            },
            {
                meshName: "head carrier",
                mesh: { transparentAreas: [ headArea ] }
            }
        ]
    };

    const result = resolveLegacyConfiguredHairConsumers(binding, {
        hair: [ 0.5, 0.5, 0.75, 1 ],
        head: [ 0.5, 0, 1, 0.5 ]
    });
    assert.equal(result.status, "ready");
    assert.deepEqual(result.effects, [ hairEffect ]);
    assert.equal(result.consumers[0].targetRole, "hair");
    assert.equal(result.excludedConsumers[0].targetRole, "head");
    assert.equal(
        result.excludedConsumers[0].reason,
        "authored-material-target-is-head"
    );
    assert.deepEqual(result.deferredAreas, []);
    assert.deepEqual(result.headShellAreas, [ headArea ]);
    assert.equal(result.headShellConsumers.length, 1);
    assert.equal(
        result.headShellConsumers[0].reason,
        "head-shell-hidden-pending-material-contract"
    );
    assert.equal(hideLegacyConfiguredHairHeadShells(result), 1);
    assert.equal(headArea.display, false);
});

test("configured hair admits an empty-sampler rigid sibling into the private target", () =>
{
    const hairEffect = AtomicEffectFixture({
        texture: { name: "old-hair" },
        transform: [ 0.5, 0.5, 0.75, 1 ]
    });
    hairEffect.effectFilePath =
        "res:/graphics/effect.gles2/managed/interior/avatar/skinnedavatarhair_detailed.sm_hi";
    hairEffect._characterAuthoredTransformUV0 = [ 0.5, 0.5, 0.75, 1 ];
    hairEffect._characterAuthoredParameterNames = [ "HairNoiseParameters" ];
    const sibling = AtomicEffectFixture({
        texture: { name: "proof-diffuse" },
        transform: [ 0, 0, 0.5, 1 ],
        materialDiffuseColor: [ 0.25, 0.25, 0.25, 1 ]
    });
    sibling.effectFilePath =
        "res:/graphics/effect.gles2/managed/interior/avatar/skinnedavatarbrdflinear.sm_hi";
    sibling._characterAuthoredTransformUV0 = [ 0, 0, 0.5, 1 ];
    sibling._characterAuthoredParameterNames = [ "MaterialDiffuseColor" ];
    sibling._characterAuthoredTexturePaths = {};

    const result = resolveLegacyConfiguredHairConsumers({
        resolvedMeshBindings: [ {
            meshName: "mixed hair",
            mesh: { transparentAreas: [ { effect: hairEffect }, { effect: sibling } ] }
        } ]
    }, {
        hair: [ 0.5, 0.5, 0.75, 1 ],
        head: [ 0.5, 0, 1, 0.5 ]
    });

    assert.deepEqual(result.effects, [ hairEffect ]);
    assert.deepEqual(result.rigidEffects, [ sibling ]);
    assert.equal(result.rigidConsumers[0].targetRole, "hair-rigid-sibling");
});

test("configured hair admits one standalone double-linear private consumer", () =>
{
    const rigid = AtomicEffectFixture({
        texture: { name: "proof-body" },
        transform: [ 0, 0, 0.5, 1 ],
        materialDiffuseColor: [ 0.25, 0.25, 0.25, 1 ]
    });
    rigid.effectFilePath =
        "res:/graphics/effect/managed/interior/avatar/skinnedavatarbrdfdoublelinear.fx";
    rigid._characterAuthoredTransformUV0 = [ 0, 0, 0.5, 1 ];
    rigid._characterAuthoredParameterNames = [
        "MaterialDiffuseColor",
        "PortraitShaderArtDiffuseColor"
    ];
    rigid._characterAuthoredTexturePaths = {};

    const result = resolveLegacyConfiguredHairConsumers({
        resolvedMeshBindings: [ {
            meshName: "private rigid hair surface",
            mesh: { opaqueAreas: [ { effect: rigid } ] }
        } ]
    }, {
        hair: [ 0.5, 0.5, 0.75, 1 ],
        head: [ 0.5, 0, 1, 0.5 ]
    });

    assert.equal(result.status, "ready");
    assert.deepEqual(result.effects, []);
    assert.deepEqual(result.rigidEffects, [ rigid ]);
    assert.equal(result.rigidConsumers[0].targetRole, "hair-rigid-standalone");
});

test("configured hair does not absorb a double-linear surface beside detailed cards", () =>
{
    const hair = AtomicEffectFixture({
        texture: { name: "old-hair" },
        transform: [ 0.5, 0.5, 0.75, 1 ]
    });
    hair.effectFilePath =
        "res:/graphics/effect.gles2/managed/interior/avatar/skinnedavatarhair_detailed.sm_hi";
    hair._characterAuthoredTransformUV0 = [ 0.5, 0.5, 0.75, 1 ];
    hair._characterAuthoredParameterNames = [ "HairNoiseParameters" ];
    const rigid = AtomicEffectFixture({
        texture: { name: "proof-body" },
        transform: [ 0, 0, 0.5, 1 ]
    });
    rigid.effectFilePath =
        "res:/graphics/effect.gles2/managed/interior/avatar/skinnedavatarbrdfdoublelinear.sm_hi";
    rigid._characterAuthoredTexturePaths = {};
    const rigidArea = { effect: rigid };

    const result = resolveLegacyConfiguredHairConsumers({
        resolvedMeshBindings: [ {
            meshName: "mixed consumers",
            mesh: { opaqueAreas: [ { effect: hair }, rigidArea ] }
        } ]
    }, {
        hair: [ 0.5, 0.5, 0.75, 1 ],
        head: [ 0.5, 0, 1, 0.5 ]
    });

    assert.deepEqual(result.effects, [ hair ]);
    assert.deepEqual(result.rigidEffects, []);
    assert.deepEqual(result.deferredAreas, [ rigidArea ]);
    assert.equal(
        result.excludedConsumers[0].reason,
        "standalone-private-hair-consumer-conflicts-with-other-consumers"
    );
});

test("configured hair retains a prepared glass sibling for private hair targets", () =>
{
    const hairEffect = AtomicEffectFixture({
        texture: { name: "old-hair" },
        transform: [ 0.5, 0.5, 0.75, 1 ]
    });
    hairEffect.effectFilePath =
        "res:/graphics/effect.gles2/managed/interior/avatar/skinnedavatarhair_detailed.sm_hi";
    hairEffect._characterAuthoredTransformUV0 = [ 0.5, 0.5, 0.75, 1 ];
    hairEffect._characterAuthoredParameterNames = [ "HairNoiseParameters" ];
    const glass = AtomicEffectFixture({
        texture: { name: "proof-glass" },
        transform: [ 0, 0, 0.5, 1 ]
    });
    glass.effectFilePath =
        "res:/graphics/effect.gles2/managed/interior/avatar/glassshader.sm_hi";
    glass._characterAuthoredTexturePaths = {};
    const glassArea = { effect: glass };

    const result = resolveLegacyConfiguredHairConsumers({
        resolvedMeshBindings: [ {
            meshName: "mixed hair",
            mesh: { transparentAreas: [ { effect: hairEffect }, glassArea ] }
        } ]
    }, {
        hair: [ 0.5, 0.5, 0.75, 1 ],
        head: [ 0.5, 0, 1, 0.5 ]
    });

    assert.deepEqual(result.rigidEffects, [ glass ]);
    assert.deepEqual(result.deferredAreas, []);
    assert.equal(result.rigidConsumers[0].targetRole, "hair-glass-sibling");
});

test("configured hair excludes collapsed reverse areas from active material consumers", () =>
{
    const forwardEffect = {
        name: "forward hair cards",
        effectFilePath: "res:/graphics/effect.gles2/managed/interior/avatar/skinnedavatarhair_detailed.sm_hi",
        _characterAuthoredTransformUV0: [ 0.5, 0.5, 0.75, 1 ],
        _characterAuthoredParameterNames: [ "HairNoiseParameters" ]
    };
    const reverseEffect = {
        ...forwardEffect,
        name: "collapsed reverse hair cards"
    };
    const result = resolveLegacyConfiguredHairConsumers({
        resolvedMeshBindings: [ {
            meshName: "strand carrier",
            mesh: {
                transparentAreas: [
                    { name: "cards", effect: forwardEffect },
                    { name: "cards", effect: reverseEffect, reversed: true, display: false }
                ]
            }
        } ]
    }, {
        hair: [ 0.5, 0.5, 0.75, 1 ],
        head: [ 0.5, 0, 1, 0.5 ]
    });

    assert.deepEqual(result.effects, [ forwardEffect ]);
    assert.equal(result.consumers.length, 1);
    assert.equal(result.inactiveConsumers.length, 1);
    assert.equal(
        result.inactiveConsumers[0].reason,
        "authored-reversed-consumer-collapsed"
    );
});

test("configured hair applies the retained palette without replacing authored factors", async () =>
{
    const material = resolveLegacyHairShaderMaterial({
        materialValues: {
            colors: [
                [ 0.3, 0.2, 0.1, 1 ],
                [ 0.2, 0.1, 0.05, 1 ],
                [ 0.1, 0.05, 0.02, 1 ]
            ],
            specularColors: [
                [ 0.32, 0.3, 0.25, 1 ],
                [ 0.28, 0.27, 0.24, 1 ],
                [ 0.2, 0.19, 0.17, 1 ]
            ]
        },
        colorSelection: { hairDarkness: 0.10712 }
    });
    assert.equal(material.status, "ready");
    const effect = AtomicEffectFixture({
        texture: { name: "old-diffuse" },
        transform: [ 0.5, 0.5, 0.75, 1 ],
        materialDiffuseColor: [ 1, 1, 1, 1 ],
        hairSpecularColor1: [ 0.8, 0.8, 0.8, 1 ],
        hairSpecularColor2: [ 0.9, 0.9, 0.9, 1 ]
    });
    const hairFactors = [ 0.2, 0, 70, 3 ];
    effect.parameters.HairSpecularFactors = {
        GetValue(out)
        {
            out.push(...hairFactors);
            return out;
        }
    };
    const target = { name: "hair-diffuse" };
    const normal = { name: "hair-normal" };
    const specular = { name: "hair-specular" };

    const committed = await commitLegacyConfiguredHairBindings(
        [ effect ],
        target,
        {
            NormalMap: { textureRes: normal, sourcePath: "res:/hair_n.png" },
            SpecularMap: { textureRes: specular, sourcePath: "res:/hair_s.png" }
        },
        material.parameters
    );
    assert.equal(committed.status, "applied");
    assert.deepEqual(effect.transform, [ 0, 0, 1, 1 ]);
    assert.equal(effect.parameters.DiffuseMap.textureRes, target);
    assert.equal(effect.parameters.NormalMap.textureRes, normal);
    assert.equal(effect.parameters.SpecularMap.textureRes, specular);
    assert.deepEqual(effect.materialDiffuseColor, [ 0.3, 0.2, 0.1, 1 ]);
    assert.deepEqual(effect.hairSpecularColor1, [ 0.32, 0.3, 0.25, 1 ]);
    assert.deepEqual(effect.hairSpecularColor2, [ 0.28, 0.27, 0.24, 1 ]);
    assert.deepEqual(effect.parameters.HairSpecularFactors.GetValue([]), hairFactors);
    assert.equal(material.retainedHairDarkness, 0.10712);
    assert.deepEqual(committed.effectiveMaterialParameters, material.parameters);
    assert.equal(committed.framebufferAlpha, "source-over-coverage");
    assert.deepEqual(effect.stateOverrides.slice(-3), [
        [ "Main", 0, 206, 1 ],
        [ "Main", 0, 207, 2 ],
        [ "Main", 0, 208, 6 ]
    ]);
});

test("configured hair can preserve authored material controls while replacing textures", async () =>
{
    const authoredDiffuse = [ 1, 1, 1, 1 ];
    const authoredSpecular1 = [ 0.8, 0.8, 0.8, 1 ];
    const authoredSpecular2 = [ 0.9, 0.9, 0.9, 1 ];
    const effect = AtomicEffectFixture({
        texture: { name: "old-diffuse" },
        transform: [ 0.5, 0.5, 0.75, 1 ],
        materialDiffuseColor: authoredDiffuse,
        hairSpecularColor1: authoredSpecular1,
        hairSpecularColor2: authoredSpecular2
    });
    const target = { name: "hair-diffuse" };
    const normal = { name: "neutral-normal" };
    const specular = { name: "neutral-specular" };

    await commitLegacyConfiguredHairBindings(
        [ effect ],
        target,
        {
            NormalMap: { textureRes: normal, sourcePath: "res:/neutral_n.dds" },
            SpecularMap: { textureRes: specular, sourcePath: "res:/neutral_s.dds" }
        },
        null
    );

    assert.equal(effect.parameters.DiffuseMap.textureRes, target);
    assert.equal(effect.parameters.NormalMap.textureRes, normal);
    assert.equal(effect.parameters.SpecularMap.textureRes, specular);
    assert.deepEqual(effect.materialDiffuseColor, authoredDiffuse);
    assert.deepEqual(effect.hairSpecularColor1, authoredSpecular1);
    assert.deepEqual(effect.hairSpecularColor2, authoredSpecular2);
});

test("configured hair keeps authored rigid RGB separate from hair colourization", async () =>
{
    const hairEffect = AtomicEffectFixture({
        texture: { name: "old-hair" },
        transform: [ 0.5, 0.5, 0.75, 1 ],
        materialDiffuseColor: [ 1, 1, 1, 1 ],
        hairSpecularColor1: [ 0.8, 0.8, 0.8, 1 ],
        hairSpecularColor2: [ 0.9, 0.9, 0.9, 1 ]
    });
    const sibling = AtomicEffectFixture({
        texture: { name: "old-sibling" },
        transform: [ 0, 0, 0.5, 1 ],
        materialDiffuseColor: [ 0.2, 0.1, 0.05, 1 ]
    });
    const diffuse = { name: "hair-diffuse" };
    const rigidDiffuse = { name: "authored-rigid-diffuse" };
    const normal = { name: "hair-normal" };
    const specular = { name: "hair-specular" };

    const committed = await commitLegacyConfiguredHairBindings(
        [ hairEffect ],
        diffuse,
        {
            NormalMap: { textureRes: normal, sourcePath: "res:/hair_n.png" },
            SpecularMap: { textureRes: specular, sourcePath: "res:/hair_s.png" }
        },
        null,
        [ sibling ],
        { rigidTexture: rigidDiffuse }
    );

    assert.equal(committed.attachedEffects, 1);
    assert.equal(committed.attachedRigidEffects, 1);
    assert.deepEqual(sibling.transform, [ 0, 0, 1, 1 ]);
    assert.equal(sibling.parameters.DiffuseMap.textureRes, rigidDiffuse);
    assert.equal(sibling.parameters.NormalMap.textureRes, normal);
    assert.equal(sibling.parameters.SpecularMap.textureRes, specular);
    assert.deepEqual(sibling.materialDiffuseColor, [ 1, 1, 1, 1 ]);
});

test("configured hair keeps authored glass RGB separate from hair colourization", async () =>
{
    const hairEffect = AtomicEffectFixture({
        texture: { name: "old-hair" },
        transform: [ 0.5, 0.5, 0.75, 1 ]
    });
    const glassEffect = AtomicEffectFixture({
        texture: { name: "old-glass" },
        transform: [ 0.75, 0.5, 0.875, 0.75 ],
        materialDiffuseColor: [ 0.2, 0.1, 0.05, 1 ],
        glassTransparencyColor: [ 1, 1, 1, 1 ]
    });
    glassEffect.GetPassCount = technique => technique === "Main" ? 2 : 0;
    delete glassEffect.parameters.TransformUV0;
    const colorizedHair = { name: "colorized-hair" };
    const authoredGlass = { name: "authored-glass" };
    const normal = { name: "hair-normal" };
    const specular = { name: "hair-specular" };

    const committed = await commitLegacyConfiguredHairBindings(
        [ hairEffect ],
        colorizedHair,
        {
            NormalMap: { textureRes: normal, sourcePath: "res:/hair_n.png" },
            SpecularMap: { textureRes: specular, sourcePath: "res:/hair_s.png" }
        },
        null,
        [],
        { glassEffects: [ glassEffect ], glassTexture: authoredGlass }
    );

    assert.equal(committed.attachedEffects, 1);
    assert.equal(committed.attachedRigidEffects, 0);
    assert.equal(committed.attachedGlassEffects, 1);
    assert.equal(hairEffect.parameters.DiffuseMap.textureRes, colorizedHair);
    assert.equal(glassEffect.parameters.DiffuseMap.textureRes, authoredGlass);
    assert.equal(glassEffect.parameters.NormalMap.textureRes, normal);
    assert.equal(glassEffect.parameters.SpecularMap.textureRes, specular);
    assert.deepEqual(glassEffect.transform, [ 0.75, 0.5, 0.875, 0.75 ]);
    assert.deepEqual(glassEffect.materialDiffuseColor, [ 1, 1, 1, 1 ]);
    assert.deepEqual(glassEffect.glassTransparencyColor, [ 1, 1, 1, 0 ]);
    assert.equal(committed.glassLightingMode, "transmission");
    assert.deepEqual(
        glassEffect.stateOverrides.filter(([ technique, pass ]) =>
            technique === "Main" && pass === 1),
        [
            [ "Main", 1, 168, 0 ],
            [ "Main", 1, 14, 0 ]
        ]
    );
});

test("configured hair can reproduce the retained legacy glass reflection inputs", async () =>
{
    const hairEffect = AtomicEffectFixture({
        texture: { name: "old-hair" },
        transform: [ 0.5, 0.5, 0.75, 1 ]
    });
    const glassEffect = AtomicEffectFixture({
        texture: { name: "old-glass" },
        transform: [ 0.75, 0.5, 0.875, 0.75 ]
    });
    glassEffect.GetPassCount = technique => technique === "Main" ? 2 : 0;
    delete glassEffect.parameters.TransformUV0;
    glassEffect.parameters.IrradianceMap = TextureParameterFixture("");

    const committed = await commitLegacyConfiguredHairBindings(
        [ hairEffect ],
        { name: "colorized-hair" },
        {
            NormalMap: {
                textureRes: { name: "hair-normal" },
                sourcePath: "res:/hair_n.png"
            },
            SpecularMap: {
                textureRes: { name: "hair-specular" },
                sourcePath: "res:/hair_s.png"
            }
        },
        null,
        [],
        {
            glassEffects: [ glassEffect ],
            glassTexture: { name: "authored-glass" },
            glassLightingMode: "legacy"
        }
    );

    assert.equal(committed.glassLightingMode, "legacy");
    assert.equal(
        glassEffect.parameters.IrradianceMap.resourcePath,
        "res:/graphics/shared_texture/global/white_cube.dds"
    );
    assert.equal(
        glassEffect.stateOverrides.some(([ technique, pass, state ]) =>
            technique === "Main" && pass === 1 && [ 14, 168 ].includes(state)),
        false
    );
});

test("configured hair atomically binds a standalone rigid private target", async () =>
{
    const rigid = AtomicEffectFixture({
        texture: { name: "old-body" },
        transform: [ 0, 0, 0.5, 1 ],
        materialDiffuseColor: [ 0.2, 0.1, 0.05, 1 ]
    });
    const diffuse = { name: "hair-diffuse" };
    const normal = { name: "hair-normal" };
    const specular = { name: "hair-specular" };

    const committed = await commitLegacyConfiguredHairBindings(
        [],
        diffuse,
        {
            NormalMap: { textureRes: normal, sourcePath: "res:/hair_n.png" },
            SpecularMap: { textureRes: specular, sourcePath: "res:/hair_s.png" }
        },
        null,
        [ rigid ]
    );

    assert.equal(committed.attachedEffects, 0);
    assert.equal(committed.attachedRigidEffects, 1);
    assert.deepEqual(rigid.transform, [ 0, 0, 1, 1 ]);
    assert.equal(rigid.parameters.DiffuseMap.textureRes, diffuse);
    assert.equal(rigid.parameters.NormalMap.textureRes, normal);
    assert.equal(rigid.parameters.SpecularMap.textureRes, specular);
    assert.deepEqual(rigid.materialDiffuseColor, [ 1, 1, 1, 1 ]);
    assert.equal(committed.effectiveMaterialParameters, null);
});

test("configured hair reports distinct retained material controls per active effect", async () =>
{
    const first = AtomicEffectFixture({
        texture: { name: "old-diffuse-a" },
        transform: [ 0.5, 0.5, 0.75, 1 ],
        materialDiffuseColor: [ 0.2, 0.1, 0.05, 1 ],
        hairSpecularColor1: [ 0.3, 0.2, 0.1, 1 ],
        hairSpecularColor2: [ 0.4, 0.3, 0.2, 1 ]
    });
    first.name = "first";
    const second = AtomicEffectFixture({
        texture: { name: "old-diffuse-b" },
        transform: [ 0.5, 0.5, 0.75, 1 ],
        materialDiffuseColor: [ 0.6, 0.5, 0.4, 1 ],
        hairSpecularColor1: [ 0.7, 0.6, 0.5, 1 ],
        hairSpecularColor2: [ 0.8, 0.7, 0.6, 1 ]
    });
    second.name = "second";

    const committed = await commitLegacyConfiguredHairBindings(
        [ first, second ],
        { name: "hair-diffuse" },
        {
            NormalMap: {
                textureRes: { name: "neutral-normal" },
                sourcePath: "res:/neutral_n.dds"
            },
            SpecularMap: {
                textureRes: { name: "neutral-specular" },
                sourcePath: "res:/neutral_s.dds"
            }
        },
        null
    );

    assert.equal(committed.effectiveMaterialParameters, null);
    assert.equal(committed.effectiveEffects.length, 2);
    assert.deepEqual(
        committed.effectiveEffects.map(item => item.parameters.MaterialDiffuseColor),
        [ [ 0.2, 0.1, 0.05, 1 ], [ 0.6, 0.5, 0.4, 1 ] ]
    );
});

test("configured hair restores authored pass states when preparation fails", async () =>
{
    const oldDiffuse = { name: "old-diffuse" };
    const effect = AtomicEffectFixture({
        texture: oldDiffuse,
        transform: [ 0.5, 0.5, 0.75, 1 ],
        hairSpecularColor1: [ 0.8, 0.8, 0.8, 1 ],
        hairSpecularColor2: [ 0.9, 0.9, 0.9, 1 ]
    });
    effect.techniques.Main[0] = {
        state: [ { state: 206, value: 0 } ]
    };
    effect.IsGood = () => false;

    await assert.rejects(
        commitLegacyConfiguredHairBindings(
            [ effect ],
            { name: "hair-diffuse" },
            {
                NormalMap: {
                    textureRes: { name: "hair-normal" },
                    sourcePath: "res:/hair_n.png"
                },
                SpecularMap: {
                    textureRes: { name: "hair-specular" },
                    sourcePath: "res:/hair_s.png"
                }
            },
            null
        ),
        /failed to prepare/u
    );
    assert.equal(effect.parameters.DiffuseMap.textureRes, oldDiffuse);
    assert.deepEqual(effect.techniques.Main[0].state, [ { state: 206, value: 0 } ]);
});

test("configured headwear preserves one retained unzoned private RGBA material", () =>
{
    const resolved = resolveLegacyConfiguredHeadwearMaterial({
        materialValues: {
            colors: [
                [ 0.055, 0.047, 0.039, 1 ],
                [ 0.04, 0.03, 0.02, 1 ],
                [ 0.03, 0.02, 0.01, 1 ]
            ],
            specularColors: [
                [ 0.176, 0.157, 0.149, 1 ],
                [ 0.15, 0.14, 0.13, 1 ],
                [ 0.12, 0.11, 0.1, 1 ]
            ]
        },
        selectedTextures: [
            { path: "res:/headwear_l.png", role: "colorize-layer", target: "hair" },
            { path: "res:/headwear_n.png", role: "normal-source", target: "hair" },
            { path: "res:/headwear_s.png", role: "specular-overlay", target: "hair" },
            { path: "res:/scalp_l.png", role: "colorize-layer", target: "head" }
        ]
    });

    assert.equal(resolved.status, "ready");
    assert.equal(resolved.detailPath, "res:/headwear_l.png");
    assert.equal(resolved.normalPath, "res:/headwear_n.png");
    assert.equal(resolved.specularPath, "res:/headwear_s.png");
    assert.equal(resolved.materialMode, "authored-rgba-unzoned");
    assert.deepEqual(resolved.materialParameters.MaterialDiffuseColor,
        [ 1, 1, 1, 1 ]);
    assert.deepEqual(resolved.materialParameters.MaterialSpecularColor,
        [ 0.176, 0.157, 0.149, 1 ]);

    const direct = resolveLegacyConfiguredHeadwearMaterial({
        source: { directDiffuseUnderlayPath: "res:/cap_base_d.png" },
        selectedTextures: [
            { path: "res:/cap_d.png", role: "diffuse-source", target: "hair" },
            { path: "res:/cap_n.png", role: "normal-source", target: "hair" },
            { path: "res:/cap_s.png", role: "specular-source", target: "hair" }
        ]
    });
    assert.equal(direct.status, "ready");
    assert.equal(direct.materialMode, "authored-direct-diffuse");
    assert.equal(direct.underlayPath, "res:/cap_base_d.png");
    assert.equal(direct.detailPath, "res:/cap_d.png");
    assert.equal(direct.materialParameters, null);

    assert.equal(resolveLegacyConfiguredHeadwearMaterial({
        ...resolved,
        materialValues: {
            colors: Array(3).fill([ 1, 1, 1, 1 ]),
            specularColors: Array(3).fill([ 1, 1, 1, 1 ])
        },
        selectedTextures: [
            { path: "res:/hair_l.png", role: "colorize-layer", target: "hair" },
            { path: "res:/hair_z.png", role: "colorize-zones", target: "hair" },
            { path: "res:/hair_n.png", role: "normal-source", target: "hair" },
            { path: "res:/hair_s.png", role: "specular-source", target: "hair" }
        ]
    }).reason, "headwear-zoned-material-not-private-single-colour");
});

test("configured unzoned headwear preserves authored RGBA and applies retained specular control", async () =>
{
    const effect = AtomicEffectFixture({
        texture: { name: "old-headwear-diffuse" },
        transform: [ 0, 0, 0.5, 1 ],
        materialDiffuseColor: [ 1, 1, 1, 1 ],
        materialSpecularColor: [ 1, 1, 1, 1 ],
        materialSpecularCurve: [ 400, 100, 0.5, 0 ]
    });
    const curve = [ ...effect.materialSpecularCurve ];
    const target = { name: "headwear-diffuse" };
    const normal = { name: "headwear-normal" };
    const specular = { name: "headwear-specular" };
    const material = {
        MaterialDiffuseColor: [ 1, 1, 1, 1 ],
        MaterialSpecularColor: [ 0.176, 0.157, 0.149, 1 ]
    };

    const committed = await commitLegacyConfiguredHeadwearBindings(
        [ effect ],
        target,
        {
            NormalMap: { textureRes: normal, sourcePath: "res:/headwear_n.png" },
            SpecularMap: { textureRes: specular, sourcePath: "res:/headwear_s.png" }
        },
        material,
        "authored-rgba-unzoned"
    );
    assert.equal(committed.status, "applied");
    assert.equal(committed.materialMode, "authored-rgba-unzoned");
    assert.deepEqual(effect.transform, [ 0, 0, 1, 1 ]);
    assert.equal(effect.parameters.DiffuseMap.textureRes, target);
    assert.equal(effect.parameters.NormalMap.textureRes, normal);
    assert.equal(effect.parameters.SpecularMap.textureRes, specular);
    assert.deepEqual(effect.materialDiffuseColor, material.MaterialDiffuseColor);
    assert.deepEqual(effect.materialSpecularColor, material.MaterialSpecularColor);
    assert.deepEqual(effect.materialSpecularCurve, curve);
});

test("configured direct-diffuse headwear removes proof tint and retains specular control", async () =>
{
    const diagnosticDiffuse = [ 1, 0, 1, 1 ];
    const diagnosticSpecular = [ 1, 0, 1, 1 ];
    const selectedSpecular = [ 0.4, 0.3, 0.2, 1 ];
    const effect = AtomicEffectFixture({
        texture: { name: "old-headwear-diffuse" },
        transform: [ 0, 0, 0.5, 1 ],
        materialDiffuseColor: diagnosticDiffuse,
        materialSpecularColor: selectedSpecular
    });
    const target = { name: "cap-diffuse" };
    const committed = await commitLegacyConfiguredHeadwearBindings(
        [ effect ],
        target,
        {
            NormalMap: { textureRes: { name: "cap-normal" }, sourcePath: "res:/cap_n.png" },
            SpecularMap: { textureRes: { name: "cap-specular" }, sourcePath: "res:/cap_s.png" }
        },
        null
    );
    assert.equal(committed.materialMode, "authored-direct-diffuse");
    assert.deepEqual(committed.materialParameters, [ {
        MaterialDiffuseColor: [ 1, 1, 1, 1 ],
        MaterialSpecularColor: selectedSpecular
    } ]);
    assert.deepEqual(effect.materialDiffuseColor, [ 1, 1, 1, 1 ]);
    assert.deepEqual(effect.materialSpecularColor, selectedSpecular);
    assert.equal(effect.parameters.DiffuseMap.textureRes, target);
});

test("body foundation follows the exact selected archetype evidence", () =>
{
    const bodyDiffusePath = "res:/graphics/character/female/paperdoll/archetypes/cdshape/cd_female_body_d_4k.png";
    assert.equal(resolveLegacyBodyFoundationPath({
        sex: "female",
        construction: {
            operations: [ {
                operation: "configured-foundation",
                role: "head",
                skinEvidence: {
                    rule: "exact-skintone-prs-archetype-foundation-v1",
                    bodyDiffusePath
                }
            } ]
        }
    }), bodyDiffusePath);
    assert.equal(resolveLegacyBodyFoundationPath({ sex: "male" }),
        "res:/graphics/character/male/paperdoll/archetypes/ccshape/cd_male_body_d_4k.png");
});

test("body specular foundation requires one exact retained archetype source", () =>
{
    const bodySpecularPath = "res:/graphics/character/female/paperdoll/archetypes/cdshape/cd_female_body_s_4k.png";
    const operation = {
        operation: "configured-foundation",
        role: "head",
        skinEvidence: {
            rule: "exact-skintone-prs-archetype-foundation-v1",
            bodySpecularPath
        }
    };
    assert.equal(resolveLegacyBodyFoundationSpecularPath({
        construction: { operations: [ operation ] }
    }), bodySpecularPath);
    assert.equal(resolveLegacyBodyFoundationSpecularPath({
        construction: { operations: [ operation, { ...operation } ] }
    }), null);
    assert.equal(resolveLegacyBodyFoundationSpecularPath({ sex: "female" }), null);

    const selectedSkin = [ {
        groupID: "skintype",
        selectedTextures: [ {
            path: "res:/graphics/character/male/paperdoll/skintype/cc/cd_male_body_s_4k.png",
            target: "body",
            role: "specular-source"
        } ]
    } ];
    assert.equal(resolveLegacyBodyFoundationSpecularPath(
        { sex: "male" },
        selectedSkin
    ), selectedSkin[0].selectedTextures[0].path);
    selectedSkin[0].occludedBy = [ { ownerSelectionIndex: 4 } ];
    assert.equal(resolveLegacyBodyFoundationSpecularPath(
        { sex: "male" },
        selectedSkin
    ), null);
});

test("body lighting planner retains augmentation normals without inventing freckle normals", () =>
{
    const plan = resolveLegacyBodyMaterialChannels([ {
        layerIndex: 4,
        groupID: "makeup/freckles",
        selectedTextures: [
            { path: "res:/freckles-body-d.png", role: "diffuse-overlay", target: "body" }
        ]
    }, {
        layerIndex: 5,
        groupID: "makeup/augmentations",
        weight: 0.75,
        source: { partSourceRecordID: "female/makeup/augmentations/face_01" },
        selectedTextures: [
            { path: "res:/augmentation-body-d.png", role: "diffuse-overlay", target: "body" },
            { path: "res:/augmentation-body-tn.png", role: "twist-normal", target: "body" }
        ]
    } ]);

    assert.deepEqual(plan.normal.map(value => ({
        path: value.path,
        op: value.op,
        weight: value.weight,
        order: value.layerOrder
    })), [ {
        path: "res:/augmentation-body-tn.png",
        op: "normal-add",
        weight: 0.75,
        order: 50
    } ]);
    assert.equal(plan.specular.length, 0);
    assert.equal(plan.deferred.length, 0);
});

test("body lighting planner admits proved skin and texture-only underwear specular", () =>
{
    const plan = resolveLegacyBodyMaterialChannels([ {
        layerIndex: 6,
        groupID: "makeup/implants",
        weight: 0.6,
        source: { partSourceRecordID: "female/makeup/implants/implant_01" },
        selectedTextures: [
            { path: "res:/implant-body-s.png", role: "specular-overlay", target: "body" }
        ]
    }, {
        layerIndex: 7,
        groupID: "bottominner",
        source: { partSourceRecordID: "female/bottominner/underwear_01" },
        selectedTextures: [
            { path: "res:/underwear-body-l.png", role: "colorize-layer", target: "body" },
            { path: "res:/underwear-body-s.png", role: "specular-overlay", target: "body" }
        ]
    } ]);

    assert.deepEqual(plan.specular.map(value => ({
        path: value.path,
        op: value.op,
        weight: value.weight,
        order: value.layerOrder,
        coveragePath: value.coveragePath
    })), [ {
        path: "res:/implant-body-s.png",
        op: "alpha-overlay",
        weight: 0.6,
        order: 110,
        coveragePath: null
    }, {
        path: "res:/underwear-body-s.png",
        op: "alpha-overlay",
        weight: 1,
        order: 200,
        coveragePath: "res:/underwear-body-l.png"
    } ]);
    assert.deepEqual(plan.deferred, []);
});

test("body lighting planner masks underwear normals with the same owner's diffuse layer", () =>
{
    const plan = resolveLegacyBodyMaterialChannels([ {
        layerIndex: 7,
        groupID: "bottomunderwear",
        source: { partSourceRecordID: "male/bottomunderwear/boxersam01" },
        selectedTextures: [
            { path: "res:/boxers-body-l.png", role: "colorize-layer", target: "body" },
            { path: "res:/boxers-body-n.png", role: "normal-overlay", target: "body" }
        ]
    } ]);

    assert.deepEqual(plan.normal.map(value => ({
        path: value.path,
        op: value.op,
        coveragePath: value.coveragePath,
        coverageRole: value.coverageRole
    })), [ {
        path: "res:/boxers-body-n.png",
        op: "normal-replace",
        coveragePath: "res:/boxers-body-l.png",
        coverageRole: "colorize-layer"
    } ]);
    assert.deepEqual(plan.deferred, []);
});

test("body lighting planner applies texture-only tops after skin-drawn augmentation", () =>
{
    const plan = resolveLegacyBodyMaterialChannels([ {
        layerIndex: 8,
        groupID: "makeup/bodyaugmentations",
        source: {
            partSourceRecordID: "female/makeup/bodyaugmentations/bodyaugmentation_f01"
        },
        selectedTextures: [
            { path: "res:/augmentation-body-l.png", role: "colorize-layer", target: "body" },
            { path: "res:/augmentation-body-n.png", role: "normal-overlay", target: "body" }
        ]
    }, {
        layerIndex: 18,
        groupID: "topmiddle",
        source: { partSourceRecordID: "female/topmiddle/tanktopf01" },
        selectedTextures: [
            { path: "res:/tanktop-body-l.png", role: "colorize-layer", target: "body" },
            { path: "res:/tanktop-body-n.png", role: "normal-source", target: "body" },
            { path: "res:/tanktop-body-s.png", role: "specular-source", target: "body" }
        ]
    } ]);

    assert.deepEqual(plan.normal.map(value => ({
        groupID: value.groupID,
        path: value.path,
        op: value.op,
        coveragePath: value.coveragePath
    })), [ {
        groupID: "makeup/bodyaugmentations",
        path: "res:/augmentation-body-n.png",
        op: "normal-replace",
        coveragePath: "res:/augmentation-body-l.png"
    }, {
        groupID: "topmiddle",
        path: "res:/tanktop-body-n.png",
        op: "normal-replace",
        coveragePath: "res:/tanktop-body-l.png"
    } ]);
    assert.deepEqual(plan.specular.map(value => ({
        groupID: value.groupID,
        path: value.path,
        op: value.op,
        coveragePath: value.coveragePath
    })), [ {
        groupID: "topmiddle",
        path: "res:/tanktop-body-s.png",
        op: "specular-replace",
        coveragePath: "res:/tanktop-body-l.png"
    } ]);
    assert.deepEqual(plan.deferred, []);
});

test("body channel order does not depend on incoming garment inventory order", () =>
{
    const top = ColorizedContribution(18, 18, "topinner");
    top.source = { partSourceRecordID: "female/topinner/bikinitopcf01" };
    top.selectedTextures.push({
        path: "res:/top-body-n.png",
        role: "normal-overlay",
        target: "body"
    });
    const augmentation = ColorizedContribution(8, 8, "makeup/bodyaugmentations");
    augmentation.source = {
        partSourceRecordID: "female/makeup/bodyaugmentations/bodyaugmentation_f01"
    };
    augmentation.selectedTextures.push({
        path: "res:/augmentation-body-n.png",
        role: "normal-overlay",
        target: "body"
    });

    const lighting = resolveLegacyBodyMaterialChannels([ top, augmentation ]);
    assert.deepEqual(lighting.normal.map(value => value.groupID), [
        "makeup/bodyaugmentations",
        "topinner"
    ]);
    assert.deepEqual(lighting.normal.map(value => value.layerOrder), [ 150, 200 ]);

    const diffuse = planLegacyBodyDiffuseOperations([ top, augmentation ]);
    assert.deepEqual(diffuse.operations.map(value => value.contribution.groupID), [
        "makeup/bodyaugmentations",
        "topinner"
    ]);
});

test("skin-drawn arm augmentations remain below shirts in every body channel", () =>
{
    for (const groupID of [ "makeup/armleft", "makeup/armright" ])
    {
        const shirt = ColorizedContribution(18, 18, "topmiddle");
        shirt.source = { partSourceRecordID: "female/topmiddle/shirtcf01" };
        shirt.selectedTextures.push(
            { path: "res:/shirt-body-n.png", role: "normal-overlay", target: "body" },
            { path: "res:/shirt-body-s.png", role: "specular-overlay", target: "body" }
        );
        const augmentation = ColorizedContribution(8, 8, groupID);
        augmentation.source = {
            partSourceRecordID: `female/${groupID}/cyborgarmf01`
        };
        augmentation.selectedTextures.push(
            { path: "res:/arm-body-n.png", role: "normal-overlay", target: "body" },
            { path: "res:/arm-body-s.png", role: "specular-overlay", target: "body" }
        );

        const diffuse = planLegacyBodyDiffuseOperations([ shirt, augmentation ]);
        assert.deepEqual(diffuse.operations.map(value => value.contribution.groupID), [
            groupID,
            "topmiddle"
        ]);

        const lighting = resolveLegacyBodyMaterialChannels([ shirt, augmentation ]);
        assert.deepEqual(lighting.normal.map(value => value.groupID), [
            groupID,
            "topmiddle"
        ]);
        assert.deepEqual(lighting.specular.map(value => value.groupID), [
            groupID,
            "topmiddle"
        ]);
        assert.deepEqual(lighting.deferred, []);
    }
});

test("body normal replacement clips its pass to the same owner's diffuse coverage", async () =>
{
    const normalPath = "res:/boxers-body-n.png";
    const coveragePath = "res:/boxers-body-l.png";
    const normalPlacement = [ 20 / 2048, 1057 / 2048, 755 / 2048, 180 / 2048 ];
    const coveragePlacement = [ 40 / 2048, 1065 / 2048, 700 / 2048, 140 / 2048 ];
    const fixture = AtlasComposerFixture();
    fixture.composer.SetTextureMetadataSource({
        Get(documentName, recordID)
        {
            if (documentName !== "characterTextureMetadata") return null;
            const placement = recordID === normalPath.replace(/\.png$/u, "")
                ? normalPlacement
                : recordID === coveragePath.replace(/\.png$/u, "")
                    ? coveragePlacement
                    : null;
            if (!placement) return null;
            return {
                recordID,
                sourcePath: `${recordID}.png`,
                width: Math.round(placement[2] * 2048),
                height: Math.round(placement[3] * 2048),
                hasOffsetMetadata: true,
                hasPlacementMetadata: true,
                offsetX: placement[0],
                offsetY: placement[1],
                extentX: placement[2],
                extentY: placement[3]
            };
        }
    });

    const pass = await fixture.composer._CreateAuthoredNormalPass(
        normalPath,
        [ 2048, 2048 ],
        {
            op: "normal-replace",
            target: "body",
            groupID: "bottomunderwear",
            layerIndex: 7,
            weight: 1,
            coveragePath,
            coverageRole: "colorize-layer"
        }
    );

    assert.equal(
        pass.report.mode,
        "configured-body-normal-owner-masked-replace"
    );
    assert.equal(
        pass.report.shader,
        "res:/graphics/effect.gles2/utility/compositing/simpleblit.sm_hi"
    );
    assert.equal(pass.effect.textures.Texture, normalPath);
    assert.equal(pass.effect.textures.MaskMap, coveragePath);
    assert.deepEqual(pass.viewport, [ 40, 1065, 700, 140 ]);
    assert.deepEqual(pass.report.destinationPlacement, coveragePlacement);
});

test("body specular overlay clips its pass to the same owner's diffuse coverage", async () =>
{
    const specularPath = "res:/augmentation-body-s.png";
    const coveragePath = "res:/augmentation-body-l.png";
    const fixture = AtlasComposerFixture();
    fixture.composer.SetTextureMetadataSource({
        Get(documentName, recordID)
        {
            if (documentName !== "characterTextureMetadata") return null;
            const isSpecular = recordID === specularPath.replace(/\.png$/u, "");
            const isCoverage = recordID === coveragePath.replace(/\.png$/u, "");
            if (!isSpecular && !isCoverage) return null;
            return {
                recordID,
                sourcePath: `${recordID}.png`,
                width: isSpecular ? 2048 : 2028,
                height: 2048,
                hasOffsetMetadata: true,
                hasPlacementMetadata: true,
                offsetX: 0,
                offsetY: 0,
                extentX: isSpecular ? 1 : 2028 / 2048,
                extentY: 1
            };
        }
    });

    const pass = await fixture.composer._CreateAuthoredOverlayPass(
        specularPath,
        [ 2048, 2048 ],
        {
            op: "alpha-overlay",
            target: "body",
            groupID: "makeup/bodyaugmentations",
            layerIndex: 8,
            weight: 1,
            coveragePath,
            coverageRole: "colorize-layer"
        }
    );

    assert.equal(
        pass.report.mode,
        "configured-body-owner-masked-source-alpha-overlay"
    );
    assert.equal(
        pass.report.shader,
        "res:/graphics/effect.gles2/utility/compositing/simpleblit.sm_hi"
    );
    assert.equal(pass.effect.textures.Texture, specularPath);
    assert.equal(pass.effect.textures.MaskMap, coveragePath);
    assert.deepEqual(pass.viewport, [ 0, 0, 2028, 2048 ]);
});

test("body garment specular source replaces older overlays through its diffuse owner", async () =>
{
    const specularPath = "res:/tanktop-body-s.png";
    const coveragePath = "res:/tanktop-body-l.png";
    const fixture = AtlasComposerFixture();
    fixture.composer.SetTextureMetadataSource({
        Get(documentName, recordID)
        {
            if (documentName !== "characterTextureMetadata") return null;
            if (![ specularPath, coveragePath ]
                .map(value => value.replace(/\.png$/u, ""))
                .includes(recordID)) return null;
            return {
                recordID,
                sourcePath: `${recordID}.png`,
                width: 2048,
                height: 2048,
                hasOffsetMetadata: true,
                hasPlacementMetadata: true,
                offsetX: 0,
                offsetY: 0,
                extentX: 1,
                extentY: 1
            };
        }
    });

    const pass = await fixture.composer._CreateAuthoredOverlayPass(
        specularPath,
        [ 2048, 2048 ],
        {
            op: "specular-replace",
            target: "body",
            groupID: "topmiddle",
            layerIndex: 18,
            weight: 1,
            coveragePath,
            coverageRole: "colorize-layer"
        }
    );

    assert.equal(pass.report.mode, "configured-body-owner-masked-replace");
    assert.equal(pass.report.alphaOperation, "owner-mask-rgba-replace");
    assert.deepEqual(pass.effect.parameters.MultAlpha, [ 0, 0, 0, 0 ]);
    assert.equal(pass.effect.textures.Texture, specularPath);
    assert.equal(pass.effect.textures.MaskMap, coveragePath);
});

test("body lighting planner retains authored-occluded underwear without composing it", () =>
{
    const plan = resolveLegacyBodyMaterialChannels([ {
        layerIndex: 7,
        groupID: "topunderwear",
        occludedBy: [ { ownerSelectionIndex: 2 } ],
        source: { partSourceRecordID: "female/topunderwear/underwear_01" },
        selectedTextures: [
            { path: "res:/underwear-body-n.png", role: "normal-overlay", target: "body" },
            { path: "res:/underwear-body-s.png", role: "specular-overlay", target: "body" }
        ]
    } ]);

    assert.deepEqual(plan.normal, []);
    assert.deepEqual(plan.specular, []);
    assert.deepEqual(plan.deferred.map(value => ({
        path: value.path,
        reason: value.reason
    })), [
        { path: "res:/underwear-body-n.png", reason: "authored-modifier-occluded" },
        { path: "res:/underwear-body-s.png", reason: "authored-modifier-occluded" }
    ]);
});

test("body augmentation applies plain normal and specular through its diffuse owner", () =>
{
    const plan = resolveLegacyBodyMaterialChannels([ {
        layerIndex: 8,
        groupID: "makeup/bodyaugmentations",
        source: {
            partSourceRecordID: "female/makeup/bodyaugmentations/bodyaugmentation_f01"
        },
        selectedTextures: [
            { path: "res:/body-augmentation-l.png", role: "colorize-layer", target: "body" },
            { path: "res:/body-augmentation-n.png", role: "normal-overlay", target: "body" },
            { path: "res:/body-augmentation-s.png", role: "specular-overlay", target: "body" }
        ]
    } ]);

    assert.deepEqual(plan.normal.map(value => ({
        path: value.path,
        op: value.op,
        coveragePath: value.coveragePath
    })), [ {
        path: "res:/body-augmentation-n.png",
        op: "normal-replace",
        coveragePath: "res:/body-augmentation-l.png"
    } ]);
    assert.deepEqual(plan.specular.map(value => ({
        path: value.path,
        op: value.op,
        coveragePath: value.coveragePath
    })), [ {
        path: "res:/body-augmentation-s.png",
        op: "alpha-overlay",
        coveragePath: "res:/body-augmentation-l.png"
    } ]);
    assert.deepEqual(plan.deferred, []);
});

test("body normal attachment includes split standard sleeve carriers only once", () =>
{
    const attached = [];
    const sharedEffect = {
        parameters: {
            NormalMap: { AttachTextureRes: texture => attached.push(texture) }
        }
    };
    const ignored = {
        parameters: {
            NormalMap: { AttachTextureRes: () => assert.fail("garment normal changed") }
        }
    };
    const texture = { id: "body-normal" };
    const count = attachLegacyBodyNormal({
        meshes: [
            { _characterFoundationRole: "torso", opaqueAreas: [ { effect: sharedEffect } ] },
            { _characterFoundationRole: "sleevesUpper", opaqueAreas: [ { effect: sharedEffect } ] },
            { _characterFoundationRole: "sleevesLower", opaqueAreas: [ { effect: {
                parameters: {
                    NormalMap: { AttachTextureRes: value => attached.push(value) }
                }
            } } ] },
            { _characterPartIndex: 2, opaqueAreas: [ { effect: ignored } ] }
        ]
    }, texture);

    assert.equal(count, 2);
    assert.deepEqual(attached, [ texture, texture ]);
});

test("body specular attachment includes only explicit foundation carriers once", () =>
{
    const attached = [];
    const sharedEffect = {
        parameters: {
            SpecularMap: { AttachTextureRes: texture => attached.push(texture) }
        }
    };
    const ignored = {
        parameters: {
            SpecularMap: { AttachTextureRes: () => assert.fail("garment specular changed") }
        }
    };
    const texture = { id: "body-specular" };
    const count = attachLegacyBodySpecular({
        meshes: [
            { _characterFoundationRole: "torso", opaqueAreas: [ { effect: sharedEffect } ] },
            { _characterFoundationRole: "sleevesUpper", opaqueAreas: [ { effect: sharedEffect } ] },
            { _characterFoundationRole: "hands", opaqueAreas: [ { effect: {
                parameters: {
                    SpecularMap: { AttachTextureRes: value => attached.push(value) }
                }
            } } ] },
            { _characterPartIndex: 2, opaqueAreas: [ { effect: ignored } ] }
        ]
    }, texture);

    assert.equal(count, 2);
    assert.deepEqual(attached, [ texture, texture ]);
});

test("head lighting planner preserves ordered known makeup channels and defers unresolved colors", () =>
{
    const plan = resolveLegacyHeadMaterialChannels([ {
        layerIndex: 2,
        groupID: "makeup/eyes",
        source: { partSourceRecordID: "female/makeup/eyes/eyes_06" },
        selectedTextures: [
            { path: "res:/eyes-l.png", role: "colorize-layer", target: "head" },
            { path: "res:/eyes-n.png", role: "normal-overlay", target: "head" },
            { path: "res:/eyes-s.png", role: "specular-overlay", target: "head" }
        ]
    }, {
        layerIndex: 8,
        groupID: "makeup/eyebrows",
        source: { partSourceRecordID: "female/makeup/eyebrows/eyebrows_03" },
        textureCandidates: [
            { path: "res:/brows-n.png", family: "comp_head_n", role: "normal-overlay", target: "head", recognized: true, selected: true },
            { path: "res:/brows-n-512.png", family: "comp_head_n", role: "normal-overlay", target: "head", recognized: true, selected: false },
            { path: "res:/brows-s.png", family: "comp_head_s", role: "specular-overlay", target: "head", recognized: true, selected: true },
            { path: "res:/brows-s-512.png", family: "comp_head_s", role: "specular-overlay", target: "head", recognized: true, selected: false }
        ],
        selectedTextures: [
            { path: "res:/brows-n.png", role: "normal-overlay", target: "head" },
            { path: "res:/brows-s.png", role: "specular-overlay", target: "head" }
        ]
    } ]);

    assert.deepEqual(plan.normal.map(value => value.path), [
        "res:/eyes-n.png",
        "res:/brows-n.png"
    ]);
    assert.deepEqual(plan.specular.map(value => value.path), [
        "res:/eyes-s.png",
        "res:/brows-s.png"
    ]);
    assert.deepEqual(plan.normal.map(value => value.op), [
        "normal-replace",
        "normal-replace"
    ]);
    assert.deepEqual(plan.specular.map(value => value.compositionIndex), [ 0, 1 ]);
    assert.equal(plan.order.status, "experimental-policy");
    assert.equal(plan.order.rule, "experimental-head-composition-order-v1");
    assert.deepEqual(plan.order.layers.slice(0, 3), [
        { groupID: "base-skin-colours", order: 0 },
        { groupID: "skintype", order: 1 },
        { groupID: "makeup/aging", order: 10 }
    ]);
    assert.deepEqual(plan.targets.map(value => value.output), [
        "diffuse",
        "normal",
        "specular"
    ]);
    assert.deepEqual(plan.normal[1].candidatePaths, [
        "res:/brows-n.png",
        "res:/brows-n-512.png"
    ]);
    assert.deepEqual(plan.specular[1].candidatePaths, [
        "res:/brows-s.png",
        "res:/brows-s-512.png"
    ]);
    assert.equal(plan.deferred.length, 1);
    assert.equal(plan.deferred[0].reason, "head-color-selection-unresolved");
});

test("head planner applies the selected skintype before additive skin layers", () =>
{
    const plan = resolveLegacyHeadMaterialChannels([ {
        layerIndex: 16,
        groupID: "skintype",
        source: {
            partSourceRecordID: "female/skintype/gi",
            materialDefinitionPath: "res:/graphics/character/female/paperdoll/skintype/gi/c4.color"
        },
        materialValues: {
            colors: [
                [ 0.533333, 0.588235, 0.607843, 1 ],
                [ 0.517647, 0.572549, 0.592157, 1 ],
                [ 0.5, 0.5, 0.5, 1 ]
            ]
        },
        selectedTextures: [
            {
                path: "res:/graphics/character/female/paperdoll/skintype/gi/colorize_head_l_4k.png",
                role: "colorize-layer",
                target: "head"
            },
            {
                path: "res:/graphics/character/female/paperdoll/skintype/gi/colorize_head_z_4k.png",
                role: "colorize-zones",
                target: "head"
            }
        ]
    }, {
        layerIndex: 2,
        groupID: "makeup/aging",
        source: { partSourceRecordID: "female/makeup/aging/aging_03" },
        selectedTextures: [ {
            path: "res:/graphics/character/female/paperdoll/makeup/aging/aging_03/comp_head_s.png",
            role: "specular-overlay",
            target: "head"
        } ]
    } ]);

    assert.deepEqual(plan.diffuse.map(value => [
        value.groupID,
        value.op,
        value.layerOrder
    ]), [ [ "skintype", "colorize", 1 ] ]);
    assert.deepEqual(plan.specular.map(value => [
        value.groupID,
        value.layerOrder
    ]), [ [ "makeup/aging", 10 ] ]);
    assert.equal(plan.deferred.length, 0);
});

test("head lighting planner admits known freckles, blush, and scarring in the experimental order", () =>
{
    const plan = resolveLegacyHeadMaterialChannels([ {
        layerIndex: 5,
        groupID: "makeup/freckles",
        source: { partSourceRecordID: "female/makeup/freckles/freckles_02" },
        selectedTextures: [
            { path: "res:/freckles-d.png", role: "diffuse-overlay", target: "head" }
        ]
    }, {
        layerIndex: 4,
        groupID: "makeup/blush",
        weight: 1,
        source: {
            partSourceRecordID: "female/makeup/blush/blush_02",
            materialDefinitionPath: "res:/blush/purple.color"
        },
        materialValues: {
            colors: [
                [ 0.5, 0.1, 0.5, 1 ],
                [ 0.5, 0.5, 0.5, 1 ],
                [ 0.5, 0.5, 0.5, 1 ]
            ]
        },
        selectedTextures: [
            { path: "res:/blush-l.png", role: "colorize-layer", target: "head" },
            { path: "res:/blush-z.png", role: "colorize-zones", target: "head" }
        ]
    }, {
        layerIndex: 13,
        groupID: "makeup/scarring",
        source: { partSourceRecordID: "female/makeup/scarring/scarring_03" },
        selectedTextures: [
            { path: "res:/scar-s.png", role: "specular-overlay", target: "head" },
            { path: "res:/scar-tn.png", role: "twist-normal", target: "head" }
        ]
    }, {
        layerIndex: 3,
        groupID: "makeup/lipstick",
        source: { partSourceRecordID: "female/makeup/lipstick/lipstick_04" },
        selectedTextures: [
            { path: "res:/lip-l.png", role: "colorize-layer", target: "head" },
            { path: "res:/lip-z.png", role: "colorize-zones", target: "head" }
        ]
    }, {
        layerIndex: 14,
        groupID: "scars/head",
        source: { partSourceRecordID: "female/scars/head/scar_03" },
        selectedTextures: [
            { path: "res:/scar-category-d.png", role: "diffuse-overlay", target: "head" }
        ]
    } ]);

    assert.deepEqual(plan.diffuse.map(value => value.path), [
        "res:/scar-category-d.png",
        "res:/freckles-d.png",
        "res:/blush-l.png"
    ]);
    assert.deepEqual(plan.diffuse.map(value => value.op), [
        "alpha-overlay",
        "alpha-overlay",
        "colorize"
    ]);
    assert.deepEqual(plan.specular.map(value => value.path), [ "res:/scar-s.png" ]);
    assert.deepEqual(plan.normal.map(value => [ value.path, value.op ]), [
        [ "res:/scar-tn.png", "normal-add" ]
    ]);
    assert.deepEqual(plan.deferred.map(value => value.reason), [
        "head-color-selection-unresolved"
    ]);
});

test("head planner applies the complete experimental cosmetic order while retaining tattoo projection", () =>
{
    const groups = [
        "makeup/lipstick",
        "makeup/implants",
        "makeup/aging",
        "makeup/eyebrows",
        "tattoo/head",
        "makeup/scarring",
        "makeup/blush",
        "makeup/augmentations",
        "makeup/eyes",
        "makeup/blemish",
        "makeup/eyeliner",
        "makeup/freckles",
        "makeup/eyeshadow",
        "makeup/eyebrowbase"
    ];
    const plan = resolveLegacyHeadMaterialChannels(groups.map((groupID, layerIndex) => ({
        layerIndex,
        groupID,
        source: { partSourceRecordID: `female/${groupID}/proof` },
        selectedTextures: [ {
            path: `res:/${groupID}.png`,
            role: "diffuse-overlay",
            target: "head"
        } ]
    })));

    assert.deepEqual(plan.diffuse.map(value => value.groupID), [
        "makeup/aging",
        "makeup/blemish",
        "makeup/scarring",
        "makeup/freckles",
        "makeup/augmentations",
        "makeup/eyes",
        "makeup/eyeshadow",
        "makeup/eyebrowbase",
        "makeup/eyebrows",
        "makeup/implants",
        "makeup/blush",
        "makeup/eyeliner",
        "makeup/lipstick"
    ]);
    assert.deepEqual(plan.diffuse.map(value => value.layerOrder), [
        10, 20, 30, 40, 50, 70, 80, 90, 100, 110, 120, 130, 140
    ]);
    assert.deepEqual(plan.deferred.map(value => [ value.groupID, value.reason ]), [
        [ "tattoo/head", "head-tattoo-projection-unresolved" ]
    ]);
});

test("head planner schedules an exact mode-1 facial tattoo as an authored atlas", () =>
{
    const definitionPath = "res:/graphics/character/female/paperdoll/tattoo/head/tattoofacem07/projection.proj";
    const texturePath = "res:/graphics/character/decals/tattoos/face/tattoofacem07/tattoofacem07_d.dds";
    const plan = resolveLegacyHeadMaterialChannels([ {
        layerIndex: 7,
        weight: 1,
        groupID: "tattoo/head",
        source: { partSourceRecordID: "female/tattoo/head/tattoofacem07" },
        materialValues: {
            colors: [
                [ 0.07, 0.16, 0.25, 1 ],
                [ 0.18, 0.22, 0.29, 1 ],
                [ 0.18, 0.22, 0.29, 1 ]
            ]
        },
        selectedTextures: []
    } ], {
        Get(documentName, recordID)
        {
            assert.equal(documentName, "characterDefinitions");
            assert.equal(recordID, definitionPath);
            return {
                values: {
                    headEnabled: true,
                    bodyEnabled: false,
                    mode: 1,
                    flipx: true,
                    flipy: true,
                    texturePath
                }
            };
        }
    });

    assert.deepEqual(plan.diffuse.map(value => [
        value.groupID,
        value.op,
        value.layerOrder,
        value.path,
        value.projectionDefinitionPath,
        value.colors[0]
    ]), [ [
        "tattoo/head",
        "authored-head-tattoo-atlas",
        60,
        texturePath,
        definitionPath,
        [ 0.07, 0.16, 0.25, 1 ]
    ] ]);
    assert.deepEqual(plan.deferred, []);
});

test("configured head composites a shipped facial tattoo as one authored atlas", async () =>
{
    const definitionPath = "res:/graphics/character/female/paperdoll/tattoo/head/tattoofacem07/projection.proj";
    const texturePath = "res:/graphics/character/decals/tattoos/face/tattoofacem07/tattoofacem07_d.dds";
    const maskPath = "res:/graphics/character/global/tattoomask/tattoomask.dds";
    const fixture = AtlasComposerFixture({
        headNormalMode: "detail",
        tattooTextureOffsetY: 0.25,
        tearductDiffuseMode: "base"
    });
    fixture.composer.SetTextureMetadataSource({
        Get(documentName, recordID)
        {
            if (documentName === "characterDefinitions" && recordID === definitionPath)
            {
                return {
                    values: {
                        headEnabled: true,
                        bodyEnabled: false,
                        mode: 1,
                        posx: 0,
                        posy: 1.642,
                        posz: 0.031,
                        radius: 0.12,
                        height: 0.22956,
                        aspectRatio: 1,
                        flipx: true,
                        flipy: true,
                        maskPathEnabled: true,
                        maskPath,
                        texturePath
                    }
                };
            }
            return null;
        }
    });
    const skin = AtomicEffectFixture({
        texture: { path: "#skin-diffuse" },
        transform: [ 0.5, 0, 1, 0.5 ]
    });
    skin.name = "C_Skin_blinn1";
    const geometryRenders = [];
    const geometry = {
        RenderAreas(...args)
        {
            geometryRenders.push(args);
            return true;
        }
    };
    const mesh = MeshFixture(skin);
    mesh.meshIndex = 0;
    mesh.geometryResource = geometry;
    Object.assign(mesh.opaqueAreas[0], {
        name: "C_Skin_blinn1",
        meshIndex: 0,
        index: 0,
        count: 1
    });
    const report = await fixture.composer.ComposeConfiguredHeadMaterials({
        sex: "female",
        configuredFoundations: [ {
            role: "head",
            skinTextureBindings: {
                textures: {
                    DiffuseMap: "res:/head_d.png",
                    NormalMap: "res:/head_n.png",
                    SpecularMap: "res:/head_s.png"
                },
                supportTextures: {
                    DiffuseMap: "res:/head_generic_d.png",
                    NormalMap: "res:/head_generic_n.png",
                    SpecularMap: "res:/head_generic_s.png"
                }
            }
        } ],
        configuredFoundationBindings: [ {
            role: "head",
            resolvedMeshBindings: [ {
                mesh,
                geometry,
                meshIndex: 0,
                meshName: "meshShape",
                geometryMeshName: "meshShape"
            } ]
        } ],
        backend: {
            GetPerMeshObjectData()
            {
                return { name: "head-pod" };
            }
        },
        textureContributions: [ {
            layerIndex: 7,
            weight: 1,
            groupID: "tattoo/head",
            source: { partSourceRecordID: "female/tattoo/head/tattoofacem07" },
            materialValues: {
                colors: [
                    [ 0.07, 0.16, 0.25, 1 ],
                    [ 0.18, 0.22, 0.29, 1 ],
                    [ 0.18, 0.22, 0.29, 1 ]
                ]
            },
            selectedTextures: []
        } ],
        compositionTargets: []
    });
    const diffuse = report.channels.find(value => value.name === "DiffuseMap");
    const tattoo = diffuse.passes.find(value =>
        value.mode === "configured-head-authored-tattoo-atlas");
    const bake = fixture.effects.find(value =>
        value.effectFilePath.includes("skinnedavatartattoobaking"));
    const authoredAtlas = fixture.effects.find(value =>
        value.effectFilePath.includes("simpleblit")
        && value.textures?.Texture === "dynamic:/color/0.07,0.16,0.25,1");

    assert.equal(report.status, "applied");
    assert.equal(tattoo.path, texturePath);
    assert.equal(tattoo.projectionDefinitionPath, definitionPath);
    assert.deepEqual(tattoo.authoredColorSelection[0], [ 0.07, 0.16, 0.25, 1 ]);
    assert.equal(tattoo.colorSelectionApplication, "retained-ink-over-authored-alpha");
    assert.equal(tattoo.alphaOperation, "source-alpha-rgb-preserve-foundation-alpha");
    assert.match(tattoo.shader, /simpleblit/u);
    assert.deepEqual(tattoo.placement, [ 0, 0, 1, 1 ]);
    assert.equal(bake, undefined);
    assert.ok(authoredAtlas);
    assert.deepEqual(authoredAtlas.parameters.TextureReverseUV, [ 0, 0, 1, 1 ]);
    assert.deepEqual(authoredAtlas.parameters.MaskReverseUV, [ 0, 0, 1, 1 ]);
    assert.equal(authoredAtlas.textures.Texture, "dynamic:/color/0.07,0.16,0.25,1");
    assert.ok(authoredAtlas.parameters.MaskMap.textureRes);
    assert.equal(tattoo.alphaRealization.sourceFormat, "BC3/DXT5");
    assert.deepEqual(
        fixture.targets.map(value => [ value.width, value.height ]),
        [
            [ 2048, 2048 ],
            [ 2048, 2048 ],
            [ 2048, 2048 ],
            [ 2048, 2048 ],
            [ 2048, 2048 ],
            [ 2048, 2048 ],
            [ 2048, 2048 ]
        ]
    );
    assert.equal(geometryRenders.length, 0);
});

test("BC3 tattoo alpha decoding preserves authored sparse alpha", () =>
{
    const dds = CreateBc3Dds(4, 4, 255, 0, 1);
    const decoded = decodeLegacyBc3AlphaMask(
        dds.buffer.slice(dds.byteOffset, dds.byteOffset + dds.byteLength)
    );
    assert.deepEqual([ decoded.width, decoded.height ], [ 4, 4 ]);
    assert.deepEqual([ ...decoded.rgba.slice(0, 4) ], [ 255, 255, 255, 0 ]);
});

test("head planner retains an eyeliner-owned eyelash dependency for the separate face-card path", () =>
{
    const plan = resolveLegacyHeadMaterialChannels([ {
        layerIndex: 8,
        groupID: "makeup/eyeliner",
        source: {
            partSourceRecordID: "female/makeup/eyelashes/eyelashes_02"
        },
        selectedTextures: [
            { path: "res:/lashes-l.png", role: "colorize-layer", target: "head" },
            { path: "res:/lashes-s.png", role: "specular-overlay", target: "head" }
        ]
    } ]);

    assert.deepEqual(plan.diffuse, []);
    assert.deepEqual(plan.specular, []);
    assert.deepEqual(plan.deferred.map(value => value.reason), [
        "head-separate-face-card-contribution",
        "head-separate-face-card-contribution"
    ]);
});

test("head planner withholds scalp channels until a configured hairstyle is ready", () =>
{
    const meshHair = {
        layerIndex: 3,
        partIndex: 4,
        groupID: "hair",
        source: { partSourceRecordID: "female/hair/mesh-style" },
        selectedTextures: [
            { path: "res:/mesh-head-l.png", role: "colorize-layer", target: "head" }
        ]
    };
    const textureOnlyHair = {
        layerIndex: 5,
        partIndex: 6,
        groupID: "hair",
        source: { partSourceRecordID: "female/hair/scalp-only" },
        selectedTextures: [
            { path: "res:/scalp-head-l.png", role: "colorize-layer", target: "head" }
        ]
    };
    const result = resolveLegacyReadyHeadContributions(
        [ meshHair, textureOnlyHair ],
        [ {
            layerIndex: 3,
            partIndex: 4,
            configuredVisualCandidateInventory: {
                configurationCount: 2,
                geometryCount: 2
            }
        }, {
            layerIndex: 5,
            partIndex: 6
        } ]
    );

    assert.deepEqual(result.contributions, [ textureOnlyHair ]);
    assert.deepEqual(result.deferred, [ {
        groupID: "hair",
        layerIndex: 3,
        partSourceRecordID: "female/hair/mesh-style",
        configuredVisualCandidateInventory: {
            configurationCount: 2,
            geometryCount: 2
        },
        reason: "configured-hair-geometry-unready"
    } ]);
});

test("configured head uses distinct masked-replace and additive twist-normal shaders", async () =>
{
    const fixture = AtlasComposerFixture({ headNormalMode: "authored" });
    const skin = AtomicEffectFixture({
        texture: { path: "#skin-diffuse" },
        transform: [ 0.5, 0, 1, 0.5 ]
    });
    skin.name = "C_Skin_blinn1";
    const staged = {
        sex: "female",
        configuredFoundations: [ {
            role: "head",
            skinTextureBindings: {
                textures: {
                    DiffuseMap: "res:/head_d.png",
                    NormalMap: "res:/head_n.png",
                    SpecularMap: "res:/head_s.png"
                }
            }
        } ],
        configuredFoundationBindings: [ {
            role: "head",
            resolvedMeshBindings: [ {
                mesh: MeshFixture(skin),
                meshIndex: 0,
                meshName: "meshShape",
                geometryMeshName: "meshShape"
            } ]
        } ],
        textureContributions: [ {
            layerIndex: 4,
            weight: 0.75,
            groupID: "makeup/eyebrows",
            source: { partSourceRecordID: "female/makeup/eyebrows/eyebrows_03" },
            selectedTextures: [
                { path: "res:/brows-n.png", role: "normal-overlay", target: "head" }
            ]
        }, {
            layerIndex: 6,
            weight: 0.5,
            groupID: "makeup/scarring",
            source: { partSourceRecordID: "female/makeup/scarring/scarring_03" },
            selectedTextures: [
                { path: "res:/scar-tn.png", role: "twist-normal", target: "head" }
            ]
        } ],
        compositionTargets: []
    };

    const report = await fixture.composer.ComposeConfiguredHeadMaterials(staged);
    const normal = report.channels.find(value => value.name === "NormalMap");

    assert.equal(report.status, "applied");
    assert.deepEqual(normal.passes.slice(1).map(value => [
        value.mode,
        value.shader,
        value.strength
    ]), [
        [
            "configured-head-normal-add",
            "res:/graphics/effect.gles2/utility/compositing/twistnormalblit.sm_hi",
            0.5
        ],
        [
            "configured-head-normal-replace",
            "res:/graphics/effect.gles2/utility/compositing/maskednormalblit.sm_hi",
            0.75
        ]
    ]);
});

test("configured head detail mode keeps additive aging while withholding replacement normals", async () =>
{
    const fixture = AtlasComposerFixture({ headNormalMode: "detail" });
    fixture.composer.SetTextureMetadataSource({
        Get(documentName, recordID)
        {
            if (documentName !== "characterTextureMetadata"
                || !recordID.includes("/skintone/")) return null;
            return {
                recordID,
                sourcePath: `${recordID}.png`,
                width: 1024,
                height: 1024,
                hasOffsetMetadata: false,
                hasPlacementMetadata: false,
                offsetX: 0,
                offsetY: 0,
                extentX: 1,
                extentY: 1
            };
        }
    });
    const skin = AtomicEffectFixture({
        texture: { path: "#skin-diffuse" },
        transform: [ 0.5, 0, 1, 0.5 ]
    });
    skin.name = "C_Skin_blinn1";
    const staged = {
        sex: "female",
        configuredFoundations: [ {
            role: "head",
            skinTextureBindings: {
                textures: {
                    DiffuseMap: "res:/head_d.png",
                    NormalMap: "res:/head_n.png",
                    SpecularMap: "res:/head_s.png"
                },
                colorization: {
                    materialDefinitionPath: "res:/skintone/deteis_dark.color",
                    colors: [
                        [ 0.3, 0.12, 0.01, 1 ],
                        [ 0.1, 0.15, 0.14, 1 ],
                        [ 0.21, 0.21, 0.21, 1 ]
                    ],
                    headDetailPath: "res:/skintone/colorize_head_l.png",
                    headZonePath: "res:/skintone/colorize_head_z.png",
                    bodyDetailPath: "res:/skintone/colorize_body_l.png",
                    bodyZonePath: "res:/skintone/colorize_body_z.png"
                }
            }
        } ],
        configuredFoundationBindings: [ {
            role: "head",
            resolvedMeshBindings: [ {
                mesh: MeshFixture(skin),
                meshIndex: 0,
                meshName: "meshShape",
                geometryMeshName: "meshShape"
            } ]
        } ],
        textureContributions: [ {
            layerIndex: 4,
            weight: 0.75,
            groupID: "makeup/eyebrows",
            source: { partSourceRecordID: "female/makeup/eyebrows/eyebrows_03" },
            selectedTextures: [
                { path: "res:/brows-n.png", role: "normal-overlay", target: "head" }
            ]
        }, {
            layerIndex: 6,
            weight: 0.5,
            groupID: "makeup/aging",
            source: { partSourceRecordID: "female/makeup/aging/aging_03" },
            selectedTextures: [
                { path: "res:/aging-tn.png", role: "twist-normal", target: "head" }
            ]
        } ],
        compositionTargets: []
    };

    const report = await fixture.composer.ComposeConfiguredHeadMaterials(staged);
    const diffuse = report.channels.find(value => value.name === "DiffuseMap");
    const normal = report.channels.find(value => value.name === "NormalMap");

    assert.deepEqual(diffuse.passes.slice(1).map(value => [
        value.mode,
        value.groupID,
        value.detailPath,
        value.zonePath
    ]), [ [
        "colorized-rgb",
        "base-skin-colours",
        "res:/skintone/colorize_head_l.png",
        "res:/skintone/colorize_head_z.png"
    ] ]);
    assert.equal(diffuse.passes[1].detailMask, "disabled");
    assert.equal(normal.diagnosticMode, "authored-additive-detail-normal");
    assert.deepEqual(normal.passes.slice(1).map(value => [
        value.mode,
        value.path,
        value.strength
    ]), [ [ "configured-head-normal-add", "res:/aging-tn.png", 0.5 ] ]);
    assert.deepEqual(normal.policySuppressed, [ {
        path: "res:/brows-n.png",
        groupID: "makeup/eyebrows",
        layerIndex: 4,
        role: "normal-overlay",
        reason: "detail-mode-withholds-replacement-normal"
    } ]);
    assert.equal(report.policySuppressed.length, 1);
    assert.equal(
        report.policySuppressed[0].reason,
        "detail-mode-withholds-replacement-normal"
    );
});

test("eyebrow fallback resolves only the exact retained sibling default color", () =>
{
    const contribution = {
        layerIndex: 8,
        groupID: "makeup/eyebrows",
        source: { partSourceRecordID: "female/makeup/eyebrows/eyebrows_03" },
        selectedTextures: [ {
            path: "res:/brows/colorize_head_l_4k.png",
            role: "colorize-layer",
            target: "head"
        }, {
            path: "res:/brows/colorize_head_z.png",
            role: "colorize-zones",
            target: "head"
        } ],
        textureCandidates: [ {
            path: "res:/brows/colorize_head_z.png",
            role: "colorize-zones",
            target: "head",
            recognized: true
        }, {
            path: "res:/brows/colorize_head_z_512.png",
            role: "colorize-zones",
            target: "head",
            recognized: true
        } ]
    };
    const expectedPath = "res:/graphics/character/female/paperdoll/makeup/eyebrows/eyebrows_03/default.color";
    const resolved = resolveLegacyDefaultBrowCandidate([ contribution ], {
        Get(documentName, recordID)
        {
            if (documentName === "characterTextureMetadata")
            {
                return recordID.endsWith("_512")
                    ? { width: 40, height: 21 }
                    : { width: 16, height: 16 };
            }
            assert.equal(documentName, "characterDefinitions");
            assert.equal(recordID, expectedPath);
            return {
                values: {
                    colors: [
                        [ 0.12, 0.12, 0.12, 1 ],
                        [ 0.5, 0.5, 0.5, 1 ],
                        [ 0.5, 0.5, 0.5, 1 ]
                    ]
                }
            };
        }
    });

    assert.equal(resolved.status, "ready");
    assert.equal(resolved.correctness, "authored-presentation-fallback");
    assert.equal(resolved.materialDefinitionPath, expectedPath);
    assert.equal(
        resolved.operation.candidate.zones.path,
        "res:/brows/colorize_head_z_512.png"
    );
    assert.deepEqual(resolved.operation.candidate.colors[0], [ 0.12, 0.12, 0.12, 1 ]);
    assert.equal(
        resolved.operation.candidate.contribution.source.materialDefinitionPath,
        expectedPath
    );
});

test("configured head restores eyebrow fallback at its ordered position", async () =>
{
    const fixture = AtlasComposerFixture({ headNormalMode: "detail" });
    const browRoot = "res:/graphics/character/female/paperdoll/"
        + "makeup/eyebrows/eyebrows_03/";
    fixture.composer.SetTextureMetadataSource({
        Get(documentName, recordID)
        {
            if (documentName === "characterTextureMetadata")
            {
                return {
                    recordID,
                    sourcePath: `${recordID}.png`,
                    width: 1024,
                    height: 1024,
                    hasOffsetMetadata: false,
                    hasPlacementMetadata: false,
                    offsetX: 0,
                    offsetY: 0,
                    extentX: 1,
                    extentY: 1
                };
            }
            if (documentName === "characterDefinitions"
                && recordID === `${browRoot}default.color`)
            {
                return { values: { colors: Array.from({ length: 3 }, () => [ 0, 0, 0, 1 ]) } };
            }
            return null;
        }
    });
    const skin = AtomicEffectFixture({
        texture: { path: "#skin-diffuse" },
        transform: [ 0.5, 0, 1, 0.5 ]
    });
    const browCarrier = AtomicEffectFixture({
        texture: { path: "#brow-authored" },
        transform: [ 0, 0, 0.5, 1 ],
        materialDiffuseColor: [ 0.73, 0.64, 0.58, 1 ]
    });
    skin.name = "C_Skin_blinn1";
    browCarrier.name = "C_SkinShiny_BrowBase";
    const staged = {
        sex: "female",
        configuredFoundations: [ {
            role: "head",
            skinTextureBindings: {
                textures: {
                    DiffuseMap: "res:/head-d.png",
                    NormalMap: "res:/head-n.png",
                    SpecularMap: "res:/head-s.png"
                }
            }
        } ],
        configuredFoundationBindings: [ {
            role: "head",
            resolvedMeshBindings: [ {
                mesh: MeshFixture(skin),
                meshIndex: 0,
                meshName: "meshShape",
                geometryMeshName: "meshShape"
            } ]
        } ],
        configuredFoundationSupports: [ {
            role: "eyebrowbase",
            partSourceRecordID: "female/accessories/browbase/cd"
        } ],
        configuredFoundationSupportBindings: [ {
            role: "eyebrowbase",
            configuredMeshes: [ MeshFixture(browCarrier) ]
        } ],
        textureContributions: [ {
            layerIndex: 1,
            groupID: "makeup/lipstick",
            source: { partSourceRecordID: "female/makeup/lipstick/lipstick_04" },
            colorSelection: { weight: 0.3258, gloss: 0.36 },
            materialValues: {
                colors: Array.from({ length: 3 }, () => [ 0.4, 0.1, 0.1, 1 ]),
                specularColors: Array.from({ length: 3 }, () => [ 0.8, 0.8, 0.8, 1.3 ])
            },
            selectedTextures: [
                { path: "res:/lip-l.png", role: "colorize-layer", target: "head" },
                { path: "res:/lip-z.png", role: "colorize-zones", target: "head" }
            ]
        }, {
            layerIndex: 2,
            groupID: "makeup/eyebrows",
            source: { partSourceRecordID: "female/makeup/eyebrows/eyebrows_03" },
            textureCandidates: [
                {
                    path: `${browRoot}colorize_head_l_4k.png`,
                    role: "colorize-layer",
                    target: "head",
                    recognized: true
                },
                {
                    path: `${browRoot}colorize_head_z.png`,
                    role: "colorize-zones",
                    target: "head",
                    recognized: true
                }
            ],
            selectedTextures: [
                { path: `${browRoot}colorize_head_l_4k.png`, role: "colorize-layer", target: "head" },
                { path: `${browRoot}colorize_head_z.png`, role: "colorize-zones", target: "head" }
            ]
        } ],
        compositionTargets: []
    };

    const report = await fixture.composer.ComposeConfiguredHeadMaterials(staged);
    const diffuse = report.channels.find(value => value.name === "DiffuseMap");
    assert.deepEqual(diffuse.passes.slice(1).map(value => value.groupID), [
        "makeup/eyebrows",
        "makeup/lipstick"
    ]);
    assert.equal(report.browSupport.status, "applied", JSON.stringify(report));
    assert.equal(report.browSupport.partSourceRecordID, "female/accessories/browbase/cd");
    assert.equal(report.browSupport.attachedEffects, 1);
    assert.strictEqual(
        browCarrier.parameters.DiffuseMap.textureRes,
        staged.compositionTargets.at(-1).texture
    );
    assert.strictEqual(
        browCarrier.parameters.NormalMap.textureRes,
        staged.compositionTargets.find(value => value.name.endsWith("head-normalmap")).texture
    );
    assert.strictEqual(
        browCarrier.parameters.SpecularMap.textureRes,
        staged.compositionTargets.find(value => value.name.endsWith("head-specularmap")).texture
    );
    assert.deepEqual(browCarrier.transform, [ 0, 0, 1, 1 ]);
    assert.deepEqual(browCarrier.materialDiffuseColor, [ 0.73, 0.64, 0.58, 1 ]);
    assert.deepEqual(report.browSupport.lightingBindings, [ "NormalMap", "SpecularMap" ]);
    assert.equal(report.browSupport.framebufferAlpha, "source-over-coverage");
    assert.equal(browCarrier.stateOverrides.length, 6);
    assert.deepEqual(browCarrier.stateOverrides.slice(-3), [
        [ "Main", 0, 206, 1 ],
        [ "Main", 0, 207, 2 ],
        [ "Main", 0, 208, 6 ]
    ]);
    assert.deepEqual(diffuse.passes.at(-1).materialControls, {
        layerWeight: 1,
        colorSelectionWeight: 0.3258,
        gloss: 0.36,
        specularColors: Array.from({ length: 3 }, () => [ 0.8, 0.8, 0.8, 1.3 ]),
        applied: [ "layerWeight" ],
        retainedNotApplied: [ "colorSelectionWeight", "gloss", "specularColors" ]
    });
});

test("configured eyebrow support can be hidden only as a comparison control", async () =>
{
    const fixture = AtlasComposerFixture({ browSupportEnabled: false });
    const browCarrier = AtomicEffectFixture({
        texture: { path: "#brow-authored" },
        transform: [ 0, 0, 0.5, 1 ]
    });
    const browMesh = MeshFixture(browCarrier);
    const staged = {
        configuredFoundationSupports: [ {
            role: "eyebrowbase",
            partSourceRecordID: "female/accessories/browbase/cd"
        } ],
        configuredFoundationSupportBindings: [ {
            role: "eyebrowbase",
            configuredMeshes: [ browMesh ]
        } ]
    };

    const report = await fixture.composer._ComposeConfiguredBrowSupport(
        staged,
        null,
        null,
        [ 2048, 1024 ],
        []
    );

    assert.equal(report.status, "disabled");
    assert.equal(report.correctness, "comparison-control");
    assert.equal(report.partSourceRecordID, "female/accessories/browbase/cd");
    assert.equal(browMesh.display, false);
});

test("configured eyebrow support can retain diffuse alpha with neutral material controls", async () =>
{
    const fixture = AtlasComposerFixture({
        browLightingMode: "neutral",
        browDiffuseColorMode: "neutral"
    });
    fixture.composer.SetTextureMetadataSource({
        Get()
        {
            return {
                width: 365,
                height: 177,
                hasPlacementMetadata: true,
                offsetX: 0.70166,
                offsetY: 0.801758,
                extentX: 0.178223,
                extentY: 0.172852
            };
        }
    });
    const browCarrier = AtomicEffectFixture({
        texture: { path: "#brow-authored" },
        transform: [ 0, 0, 0.5, 1 ],
        materialDiffuseColor: [ 0.73, 0.64, 0.58, 1 ]
    });
    const browMesh = MeshFixture(browCarrier);
    const staged = {
        sex: "female",
        configuredFoundationSupports: [ {
            role: "eyebrowbase",
            partSourceRecordID: "female/accessories/browbase/cd"
        } ],
        configuredFoundationSupportBindings: [ {
            role: "eyebrowbase",
            configuredMeshes: [ browMesh ]
        } ]
    };
    const targets = [];

    const report = await fixture.composer._ComposeConfiguredBrowSupport(
        staged,
        {
            status: "ready",
            operation: { candidate: { detail: { path: "res:/brow-alpha.png" } } }
        },
        {
            DiffuseMap: { path: "#head-diffuse" },
            NormalMap: { path: "#head-normal" },
            SpecularMap: { path: "#head-specular" }
        },
        [ 2048, 1024 ],
        targets
    );

    assert.equal(report.status, "applied", JSON.stringify(report));
    assert.equal(report.correctness, "comparison-control");
    assert.equal(
        report.rule,
        "configured-brow-support-neutral-diffuse-multiplier-comparison-v1"
    );
    assert.deepEqual(browCarrier.materialDiffuseColor, [ 1, 1, 1, 1 ]);
    assert.equal(
        browCarrier.parameters.NormalMap.resourcePath,
        "res:/graphics/shared_texture/global/normal_flat.dds"
    );
    assert.equal(
        browCarrier.parameters.SpecularMap.resourcePath,
        "res:/dx9/model/decal/shared/bw_000_000_015.dds"
    );
    assert.deepEqual(report.lightingBindings, [ "NormalMap", "SpecularMap" ]);
});

test("full-normalized control overlays may stretch independently of pixel aspect", async () =>
{
    const fixture = AtlasComposerFixture({ headNormalMode: "detail" });
    fixture.composer.SetTextureMetadataSource({
        Get(documentName, recordID)
        {
            assert.equal(documentName, "characterTextureMetadata");
            return {
                recordID,
                sourcePath: `${recordID}.png`,
                width: 16,
                height: 16,
                hasOffsetMetadata: true,
                hasPlacementMetadata: true,
                offsetX: 0,
                offsetY: 0,
                extentX: 1,
                extentY: 1
            };
        }
    });

    const pass = await fixture.composer._CreateAuthoredOverlayPass(
        "res:/scar/comp_head_s.png",
        [ 2048, 1024 ],
        {
            target: "head",
            groupID: "scars/head",
            layerIndex: 3,
            role: "specular-overlay",
            weight: 1
        }
    );

    assert.deepEqual(pass.viewport, [ 0, 0, 2048, 1024 ]);
    assert.equal(pass.report.samplingContract, "full-normalized-stretch");
});

test("private lighting copies allow only explicitly qualified full-normalized stretch", async () =>
{
    const fixture = AtlasComposerFixture();
    fixture.composer.SetTextureMetadataSource({
        Get(documentName, recordID)
        {
            assert.equal(documentName, "characterTextureMetadata");
            return {
                recordID,
                sourcePath: `${recordID}.png`,
                width: 16,
                height: 16,
                hasOffsetMetadata: true,
                hasPlacementMetadata: true,
                offsetX: 0,
                offsetY: 0,
                extentX: 1,
                extentY: 1
            };
        }
    });

    await assert.rejects(
        fixture.composer._CreateAuthoredConsumerCopyPass(
            "res:/eyeimp/comp_head_n.png",
            [ 2048, 1024 ]
        ),
        /aspect mismatch/u
    );
    const pass = await fixture.composer._CreateAuthoredConsumerCopyPass(
        "res:/eyeimp/comp_head_n.png",
        [ 2048, 1024 ],
        { allowFullNormalizedStretch: true }
    );

    assert.deepEqual(pass.viewport, [ 0, 0, 2048, 1024 ]);
    assert.equal(pass.report.samplingContract, "full-normalized-stretch");
});

test("eyebrow colour follows the selected family preset before the sibling fallback", () =>
{
    const contribution = {
        layerIndex: 8,
        groupID: "makeup/eyebrows",
        source: { partSourceRecordID: "female/makeup/eyebrows/eyebrows_03" },
        selectedTextures: [ {
            path: "res:/brows/colorize_head_l_4k.png",
            role: "colorize-layer",
            target: "head"
        } ],
        textureCandidates: [ {
            path: "res:/brows/colorize_head_z.png",
            role: "colorize-zones",
            target: "head",
            recognized: true
        } ]
    };
    const presetPath = "res:/graphics/character/dnafiles/characterselect/deteisfemaleclothing.prs";
    const resolved = resolveLegacyDefaultBrowCandidate([ contribution ], {
        Get(documentName, recordID)
        {
            if (documentName === "characterTextureMetadata")
            {
                return { width: 16, height: 16 };
            }
            assert.equal(documentName, "characterDefinitions");
            assert.equal(recordID, presetPath);
            return {
                values: [ "female", {
                    category: "makeup",
                    path: "makeup/eyebrows/eyebrows_01",
                    colors: "[(0.384314, 0.345098, 0.317647, 1), (0.5, 0.5, 0.5, 1), (0.5, 0.5, 0.5, 1)]",
                    weight: 1
                } ]
            };
        }
    }, presetPath);

    assert.equal(resolved.status, "ready");
    assert.equal(resolved.correctness, "retained-preset");
    assert.equal(resolved.rule, "legacy-opengl-selected-preset-eyebrow-color-v1");
    assert.equal(resolved.materialDefinitionPath, presetPath);
    assert.deepEqual(
        resolved.operation.candidate.colors[0],
        [ 0.384314, 0.345098, 0.317647, 1 ]
    );
    assert.equal(
        resolved.operation.candidate.contribution.source.partSourceRecordID,
        "female/makeup/eyebrows/eyebrows_03"
    );
});

test("eyelash fallback resolves its retained placement and black sibling color", () =>
{
    const contribution = {
        layerIndex: 9,
        groupID: "makeup/eyeliner",
        source: { partSourceRecordID: "female/makeup/eyelashes/eyelashes_02" },
        selectedTextures: [ {
            path: "res:/lashes/colorize_head_l_4k.png",
            role: "colorize-layer",
            target: "head"
        }, {
            path: "res:/lashes/colorize_head_z.png",
            role: "colorize-zones",
            target: "head"
        } ],
        textureCandidates: [ {
            path: "res:/lashes/colorize_head_z.png",
            role: "colorize-zones",
            target: "head",
            recognized: true
        }, {
            path: "res:/lashes/colorize_head_z_512.png",
            role: "colorize-zones",
            target: "head",
            recognized: true
        } ]
    };
    const expectedPath = "res:/graphics/character/female/paperdoll/makeup/eyelashes/eyelashes_02/default.color";
    const resolved = resolveLegacyDefaultEyelashCandidate([ contribution ], {
        Get(documentName, recordID)
        {
            if (documentName === "characterTextureMetadata")
            {
                return recordID.endsWith("_512")
                    ? { width: 95, height: 128 }
                    : { width: 372, height: 512 };
            }
            assert.equal(documentName, "characterDefinitions");
            assert.equal(recordID, expectedPath);
            return {
                values: {
                    colors: [
                        [ 0, 0, 0, 1 ],
                        [ 0, 0, 0, 1 ],
                        [ 0, 0, 0, 1 ]
                    ]
                }
            };
        }
    });

    assert.equal(resolved.status, "ready");
    assert.equal(resolved.correctness, "authored-presentation-fallback");
    assert.equal(resolved.materialDefinitionPath, expectedPath);
    assert.equal(
        resolved.operation.candidate.zones.path,
        "res:/lashes/colorize_head_z.png"
    );
    assert.deepEqual(resolved.operation.candidate.colors[0], [ 0, 0, 0, 1 ]);
});

test("eyelash fallback uses the retained sex default when no selectable lash exists", () =>
{
    const sourceID = "female/makeup/eyelashes/eyelashes_01";
    const root = "res:/graphics/character/female/paperdoll/"
        + "makeup/eyelashes/eyelashes_01/";
    const detailPath = `${root}colorize_head_l_4k.png`;
    const zonePath = `${root}colorize_head_z.png`;
    const materialPath = `${root}default.color`;
    const resolved = resolveLegacyDefaultEyelashCandidate([], {
        Get(documentName, recordID)
        {
            if (documentName === "characterPartSources" && recordID === sourceID)
            {
                return {
                    versions: [ {
                        textureCandidates: [
                            `${root}colorize_head_l_512.png`,
                            detailPath,
                            zonePath
                        ]
                    } ]
                };
            }
            if (documentName === "characterTextureMetadata")
            {
                return { width: 512, height: 512 };
            }
            if (documentName === "characterDefinitions" && recordID === materialPath)
            {
                return {
                    values: {
                        colors: [
                            [ 0, 0, 0, 1 ],
                            [ 0, 0, 0, 1 ],
                            [ 0, 0, 0, 1 ]
                        ]
                    }
                };
            }
            return null;
        }
    }, "female");

    assert.equal(resolved.status, "ready");
    assert.equal(resolved.rule, "legacy-opengl-sex-default-eyelash-01-v1");
    assert.equal(resolved.correctness, "reference-fallback");
    assert.equal(resolved.operation.candidate.detail.path, detailPath);
    assert.equal(resolved.operation.candidate.zones.path, zonePath);
});

test("eyelash cards bind their retained colorized transparent target", async () =>
{
    const fixture = AtlasComposerFixture({ headNormalMode: "base" });
    const skin = AtomicEffectFixture({
        texture: { path: "#skin-diffuse" },
        transform: [ 0.5, 0, 1, 0.5 ]
    });
    const lashes = AtomicEffectFixture({
        texture: { path: "#lash-neutral" },
        transform: [ 0, 0, 0.5, 1 ]
    });
    skin.name = "C_Skin_blinn1";
    lashes.name = "C_SkinShiny_EyeLashes";
    const detailPath = "res:/lashes/colorize_head_l_4k.png";
    const zonePath = "res:/lashes/colorize_head_z.png";
    const materialPath = "res:/graphics/character/female/paperdoll/makeup/eyelashes/eyelashes_02/default.color";
    fixture.composer.SetTextureMetadataSource({
        Get(documentName, recordID)
        {
            if (documentName === "characterTextureMetadata")
            {
                if (!recordID.includes("/lashes/")) return null;
                const detail = recordID.includes("colorize_head_l");
                return {
                    recordID,
                    sourcePath: `${recordID}.png`,
                    width: detail ? 741 : 16,
                    height: detail ? 1024 : 16,
                    hasOffsetMetadata: true,
                    hasPlacementMetadata: true,
                    offsetX: detail ? 0.279297 : 0,
                    offsetY: 0,
                    extentX: detail ? 0.361816 : 1,
                    extentY: 1
                };
            }
            if (documentName === "characterDefinitions" && recordID === materialPath)
            {
                return {
                    values: {
                        colors: [
                            [ 0, 0, 0, 1 ],
                            [ 0, 0, 0, 1 ],
                            [ 0, 0, 0, 1 ]
                        ]
                    }
                };
            }
            return null;
        }
    });
    const staged = {
        sex: "female",
        configuredFoundations: [ {
            role: "head",
            skinTextureBindings: {
                textures: {
                    DiffuseMap: "res:/head_d.png",
                    NormalMap: "res:/head_n.png",
                    SpecularMap: "res:/head_s.png"
                }
            }
        } ],
        configuredFoundationBindings: [ {
            role: "head",
            resolvedMeshBindings: [ {
                mesh: MeshFixture(skin),
                meshIndex: 0,
                meshName: "meshShape",
                geometryMeshName: "meshShape"
            }, {
                mesh: MeshFixture(lashes),
                meshIndex: 1,
                meshName: "Eyelashes_GeoShape",
                geometryMeshName: "Eyelashes_GeoShape"
            } ]
        } ],
        textureContributions: [ {
            layerIndex: 8,
            weight: 0.4,
            groupID: "makeup/eyeliner",
            source: {
                partSourceRecordID: "female/makeup/eyelashes/eyelashes_02"
            },
            selectedTextures: [
                { path: detailPath, role: "colorize-layer", target: "head" },
                { path: zonePath, role: "colorize-zones", target: "head" }
            ],
            textureCandidates: [ {
                path: zonePath,
                role: "colorize-zones",
                target: "head",
                recognized: true
            } ]
        } ],
        compositionTargets: []
    };

    const report = await fixture.composer.ComposeConfiguredHeadMaterials(staged);
    assert.ok(report.eyelashFallback, JSON.stringify(report));
    assert.equal(report.status, "applied", JSON.stringify(report));

    assert.equal(report.faceTextures.eyelashes.status, "applied");
    assert.equal(report.eyelashFallback.binding, "colorized-transparent-head-atlas");
    assert.deepEqual(report.eyelashFallback.targetSize, [ 2048, 1024 ]);
    assert.deepEqual(report.eyelashFallback.passes.map(value => value.mode), [
        "configured-authored-rgba",
        "colorized-rgb"
    ]);
    assert.equal(report.eyelashFallback.alphaMode, "source");
    assert.equal(report.eyelashFallback.retainedDependencyWeight, 0.4);
    assert.equal(report.eyelashFallback.passes[0].alphaMultiplier, 1);
    assert.strictEqual(
        lashes.parameters.DiffuseMap.textureRes,
        staged.compositionTargets.at(-1).texture
    );
    assert.deepEqual(lashes.transform, [ 0, 0, 1, 1 ]);
});

test("eyelash alpha evidence retains sparse bounds without retaining pixels", () =>
{
    const pixels = new Uint8Array([
        0, 0, 0, 0,
        0, 0, 0, 30,
        0, 0, 0, 70,
        0, 0, 0, 0
    ]);

    assert.deepEqual(summarizeLegacyTextureAlpha(pixels, 2, 2), {
        nonzeroPixels: 2,
        alphaSum: 100,
        maximumAlpha: 70,
        bounds: [ 0, 0, 1, 1 ]
    });
});

test("eyelash carrier alpha evidence samples the effective UV transform", () =>
{
    const pixels = new Uint8Array([
        0, 0, 0, 64,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 255
    ]);
    const vertices = [ [ 0, 0 ], [ 1, 0 ], [ 0, 1 ] ];
    const geometry = {
        indexData: new Uint16Array([ 0, 1, 2 ]),
        GetVertexElement(out, index, usage, usageIndex)
        {
            assert.equal(usage, 5);
            assert.equal(usageIndex, 0);
            out.length = 0;
            out.push(...vertices[index]);
        }
    };

    const authored = summarizeLegacyCarrierAlpha(
        pixels,
        2,
        2,
        geometry,
        [ 0, 0, 1, 1 ]
    );
    const shifted = summarizeLegacyCarrierAlpha(
        pixels,
        2,
        2,
        geometry,
        [ 0.5, 0.5, 1, 1 ]
    );

    assert.equal(authored.status, "sampled-triangle-centroids");
    assert.equal(authored.meanAlpha, 64);
    assert.equal(shifted.meanAlpha, 255);
    assert.deepEqual(authored.rawUvBounds, [ 1 / 3, 1 / 3, 1 / 3, 1 / 3 ]);
    assert.deepEqual(shifted.transformedUvBounds, [
        2 / 3,
        2 / 3,
        2 / 3,
        2 / 3
    ]);
});

test("configured head lighting binds independent targets atomically", async () =>
{
    AtlasComposerFixture();
    const effect = AtomicEffectFixture({
        texture: { path: "#head-diffuse" },
        transform: [ 0, 0, 0.5, 1 ]
    });
    const normal = { path: "#head-normal", IsGood: () => true };
    const specular = { path: "#head-specular", IsGood: () => true };

    const result = await commitLegacyConfiguredHeadBindings([ effect ], {
        NormalMap: normal,
        SpecularMap: specular
    });

    assert.equal(result.status, "applied");
    assert.strictEqual(effect.parameters.NormalMap.textureRes, normal);
    assert.strictEqual(effect.parameters.SpecularMap.textureRes, specular);
    assert.strictEqual(effect.parameters.DiffuseMap.textureRes.path, "#head-diffuse");
    assert.deepEqual(effect.transform, [ 0, 0, 1, 1 ]);
    assert.equal(result.materialMode, "authored");
    assert.deepEqual(result.effectBindings, [ {
        effectFilePath: "",
        effectResourcePath: "",
        authoredEffectFilePath: "",
        options: {},
        parameterNames: [
            "DiffuseMap",
            "MaterialDiffuseColor",
            "NormalMap",
            "SpecularMap",
            "TransformUV0"
        ],
        transformUV0: [ 0, 0, 1, 1 ],
        materialDiffuseColor: [ 1, 1, 1, 1 ],
        materialSpecularColor: null,
        materialSpecularCurve: null,
        wrinkleParams: null,
        colorCorrectionSource: null,
        materialLibraryID: null,
        material2LibraryID: null
    } ]);
});

test("configured head body-default comparison cleans the generic shader contract", async () =>
{
    const effect = AtomicEffectFixture({
        texture: { path: "#head-authored" },
        transform: [ 0.25, 0.5, 0.5, 0.5 ],
        materialDiffuseColor: [ 0.4, 0.5, 0.6, 1 ],
        materialSpecularCurve: [ 0, 20, 0, 10 ],
        materialLibraryID: [ 7 ],
        material2LibraryID: [ 10 ],
        staleParameters: [ "ColorCorrectionSource", "WrinkleParams" ]
    });
    const diffuse = { path: "#head-diffuse", IsGood: () => true };
    const normal = { path: "#head-normal", IsGood: () => true };
    const specular = { path: "#head-specular", IsGood: () => true };

    const result = await commitLegacyConfiguredHeadBindings([ effect ], {
        DiffuseMap: diffuse,
        NormalMap: normal,
        SpecularMap: specular
    }, { materialMode: "body-default" });

    assert.equal(result.materialMode, "body-default");
    assert.deepEqual(effect.materialDiffuseColor, [ 1, 1, 1, 1 ]);
    assert.deepEqual(effect.materialSpecularCurve, [ 0, 50, 0, 0 ]);
    assert.equal(effect.cleanEffectCalls, 1);
    assert.equal(effect.parameters.MaterialLibraryID, undefined);
    assert.equal(effect.parameters.Material2LibraryID, undefined);
    assert.equal(effect.parameters.ColorCorrectionSource, undefined);
    assert.equal(effect.parameters.WrinkleParams, undefined);
    assert.strictEqual(effect.parameters.DiffuseMap.textureRes, diffuse);
    assert.strictEqual(effect.parameters.NormalMap.textureRes, normal);
    assert.strictEqual(effect.parameters.SpecularMap.textureRes, specular);
});

test("cropped lash transform inverts retained atlas placement", () =>
{
    const transform = resolveLegacyCroppedTextureTransform({
        width: 741,
        height: 1024,
        offset: [ 0.279297, 0 ],
        extent: [ 0.361816, 1 ],
        hasPlacementMetadata: true
    });

    assert.ok(Math.abs(transform[0] - -0.7719309) < 1e-6);
    assert.equal(transform[1], 0);
    assert.ok(Math.abs(transform[2] - 1.9919047) < 1e-6);
    assert.equal(transform[3], 1);
});

test("configured face textures bind only exact eye and eyelash carriers", () =>
{
    const eye = AtomicEffectFixture({
        texture: { path: "#eye-neutral" },
        transform: [ 0.5, 0, 1, 0.5 ]
    });
    const lashes = AtomicEffectFixture({
        texture: { path: "#lash-neutral" },
        transform: [ 0, 0, 0.5, 1 ],
        materialDiffuseColor: [ 1, 1, 1, 1 ]
    });
    const eyeShadow = AtomicEffectFixture({
        texture: { path: "#eye-shadow-neutral" },
        transform: [ 0, 0, 0.5, 1 ],
        materialDiffuseColor: [ 1, 1, 1, 1 ]
    });
    const skin = AtomicEffectFixture({
        texture: { path: "#skin" },
        transform: [ 0.5, 0, 1, 0.5 ]
    });
    const tearduct = AtomicEffectFixture({
        texture: { path: "#tearduct-white" },
        transform: [ 0.5, 0, 1, 0.5 ],
        materialDiffuseColor: [ 0.8, 0.7, 0.6, 1 ],
        cutMask: "#transparent-cut-mask"
    });
    eye.name = "C_Eyes";
    lashes.name = "C_SkinShiny_EyeLashes";
    eyeShadow.name = "C_SkinShiny_EyeLashes";
    skin.name = "C_Skin_blinn1";
    tearduct.name = "C_SkinShiny_TearDucts";
    const composedEye = { path: "#composed-eye", IsGood: () => true };
    const composedNormal = { path: "#composed-head-normal", IsGood: () => true };
    const composedSpecular = { path: "#composed-head-specular", IsGood: () => true };
    const composedLashes = { path: "#composed-lashes", IsGood: () => true };
    const report = applyLegacyConfiguredFaceTextures({
        resolvedMeshBindings: [ {
            meshName: "Eyeball_Right_GeoShape",
            mesh: MeshFixture(eye)
        }, {
            meshName: "Eyelashes_GeoShape",
            mesh: MeshFixture(lashes)
        }, {
            meshName: "EyeShadow_GeoShape",
            mesh: MeshFixture(eyeShadow)
        }, {
            meshName: "Tearducts_GeoShape",
            mesh: MeshFixture(tearduct)
        }, {
            meshName: "meshShape",
            mesh: MeshFixture(skin)
        } ]
    }, [ {
        groupID: "makeup/eyes",
        source: { partSourceRecordID: "female/makeup/eyes/eyes_06" },
        selectedTextures: [ {
            path: "res:/eyes/colorize_head_l_4k.png",
            role: "colorize-layer",
            target: "head"
        } ]
    }, {
        groupID: "makeup/eyeliner",
        source: { partSourceRecordID: "female/makeup/eyelashes/eyelashes_02" },
        selectedTextures: [ {
            path: "res:/lashes/colorize_head_l_4k.png",
            role: "colorize-layer",
            target: "head"
        }, {
            path: "res:/lashes/comp_head_s.png",
            role: "specular-overlay",
            target: "head"
        } ]
    } ], {
        headTextures: {
            DiffuseMap: composedEye,
            NormalMap: composedNormal,
            SpecularMap: composedSpecular
        },
        eyelashTexture: composedLashes,
        eyelashDepthMode: "test-no-write"
    });

    assert.equal(report.status, "applied");
    assert.equal(report.appliedEffects, 4);
    assert.strictEqual(eye.parameters.DiffuseMap.textureRes, composedEye);
    assert.strictEqual(eye.parameters.SpecularMap.textureRes, composedSpecular);
    assert.equal(eye.parameters.NormalMap.textureRes.path, "res:/neutral-normal.dds");
    assert.strictEqual(lashes.parameters.DiffuseMap.textureRes, composedLashes);
    assert.strictEqual(eyeShadow.parameters.DiffuseMap.textureRes, composedLashes);
    assert.strictEqual(tearduct.parameters.DiffuseMap.textureRes, composedEye);
    assert.strictEqual(tearduct.parameters.NormalMap.textureRes, composedNormal);
    assert.strictEqual(tearduct.parameters.SpecularMap.textureRes, composedSpecular);
    assert.equal(lashes.parameters.SpecularMap.resourcePath, "res:/lashes/comp_head_s.png");
    assert.equal(eyeShadow.parameters.SpecularMap.resourcePath, "res:/lashes/comp_head_s.png");
    assert.equal(report.eyelashes.binding, "colorized-transparent-head-atlas");
    assert.equal(report.eyelashes.specularPath, "res:/lashes/comp_head_s.png");
    assert.equal(report.eyelashes.transform, "carrier-specific");
    assert.equal(report.tearducts.status, "applied");
    assert.equal(report.eyes.binding, "composed-head-diffuse-specular");
    assert.deepEqual(report.eyes.attachedChannels, [ "DiffuseMap", "SpecularMap" ]);
    assert.equal(report.tearducts.binding, "composed-head-material");
    assert.deepEqual(report.tearducts.attachedChannels, [
        "DiffuseMap", "NormalMap", "SpecularMap", "CutMaskMap"
    ]);
    assert.equal(report.tearducts.carrier.meshName, "Tearducts_GeoShape");
    assert.deepEqual(report.tearducts.carrier.transformUV0, [ 0.5, 0, 1, 0.5 ]);
    assert.deepEqual(report.eyelashes.carriers.map(value => value.meshName), [
        "Eyelashes_GeoShape",
        "EyeShadow_GeoShape"
    ]);
    assert.equal(report.eyelashes.framebufferAlpha, "source-over-coverage");
    assert.equal(report.eyelashes.depthMode, "test-no-write");
    assert.deepEqual(lashes.stateOverrides.slice(-5), [
        [ "Main", 0, 206, 1 ],
        [ "Main", 0, 207, 2 ],
        [ "Main", 0, 208, 6 ],
        [ "Main", 0, 7, 1 ],
        [ "Main", 0, 14, 0 ]
    ]);
    assert.deepEqual(eyeShadow.stateOverrides.slice(-5), [
        [ "Main", 0, 206, 1 ],
        [ "Main", 0, 207, 2 ],
        [ "Main", 0, 208, 6 ],
        [ "Main", 0, 7, 1 ],
        [ "Main", 0, 14, 0 ]
    ]);
    assert.equal(skin.parameters.DiffuseMap.resourcePath, "");
    assert.deepEqual(eye.transform, [ 0, 0, 1, 1 ]);
    assert.deepEqual(lashes.transform, [ 0, 0, 1, 1 ]);
    assert.deepEqual(eyeShadow.transform, [ 0, 0, 0.5, 1 ]);
    assert.deepEqual(tearduct.transform, [ 0.5, 0, 1, 0.5 ]);
    assert.deepEqual(tearduct.materialDiffuseColor, [ 0.8, 0.7, 0.6, 1 ]);
    assert.equal(
        tearduct.parameters.CutMaskMap.resourcePath,
        "dynamic:/color/1,1,1,1"
    );
    assert.ok(report.tearducts.attachedChannels.includes("CutMaskMap"));
    assert.deepEqual(lashes.materialDiffuseColor, [ 1, 1, 1, 1 ]);
    assert.deepEqual(eyeShadow.materialDiffuseColor, [ 1, 1, 1, 1 ]);
    assert.deepEqual(skin.transform, [ 0.5, 0, 1, 0.5 ]);
});

test("configured tear ducts can be hidden without changing other face bindings", () =>
{
    const eye = AtomicEffectFixture({
        texture: { path: "#eye-neutral" },
        transform: [ 0.5, 0, 1, 0.5 ]
    });
    const tearduct = AtomicEffectFixture({
        texture: { path: "#tearduct-white" },
        transform: [ 0, 0, 0.5, 1 ]
    });
    eye.name = "C_Eyes";
    tearduct.name = "C_SkinShiny_TearDucts";
    const eyeMesh = MeshFixture(eye);
    const tearductMesh = MeshFixture(tearduct);
    const composedEye = { path: "#composed-eye", IsGood: () => true };
    const report = applyLegacyConfiguredFaceTextures({
        resolvedMeshBindings: [ {
            meshName: "Eyeball_Right_GeoShape",
            mesh: eyeMesh
        }, {
            meshName: "Tearducts_GeoShape",
            mesh: tearductMesh
        } ]
    }, [ {
        groupID: "makeup/eyes",
        source: { partSourceRecordID: "female/makeup/eyes/eyes_06" },
        selectedTextures: [ {
            path: "res:/eyes/colorize_head_l_4k.png",
            role: "colorize-layer",
            target: "head"
        } ]
    } ], {
        headTextures: { DiffuseMap: composedEye },
        tearductsEnabled: false
    });

    assert.equal(report.eyes.status, "applied");
    assert.equal(report.tearducts.status, "disabled");
    assert.equal(report.tearducts.correctness, "comparison-control");
    assert.equal(tearductMesh.display, false);
    assert.equal(tearduct.parameters.DiffuseMap.textureRes.path, "#tearduct-white");
});

test("configured tear ducts can isolate diffuse from authored lighting maps", () =>
{
    const tearduct = AtomicEffectFixture({
        texture: { path: "#tearduct-white" },
        transform: [ 0, 0, 0.5, 1 ]
    });
    tearduct.name = "C_SkinShiny_TearDucts";
    const composedDiffuse = { path: "#composed-head-diffuse", IsGood: () => true };
    const foundationDiffuse = { path: "#foundation-head-diffuse", IsGood: () => true };
    const foundationNormal = { path: "#foundation-head-normal", IsGood: () => true };
    const foundationSpecular = { path: "#foundation-head-specular", IsGood: () => true };
    const report = applyLegacyConfiguredFaceTextures({
        resolvedMeshBindings: [ {
            meshName: "Tearducts_GeoShape",
            mesh: MeshFixture(tearduct)
        } ]
    }, [], {
        headTextures: {
            DiffuseMap: composedDiffuse,
            NormalMap: { path: "#composed-head-normal" },
            SpecularMap: { path: "#composed-head-specular" }
        },
        tearductLightingMode: "neutral",
        tearductUvMode: "identity",
        tearductDiffuseMode: "base",
        tearductBaseDiffusePath: "res:/head-base.png",
        tearductFoundationTextures: {
            DiffuseMap: foundationDiffuse,
            NormalMap: foundationNormal,
            SpecularMap: foundationSpecular
        },
        tearductFoundationEvidence: {
            status: "retained",
            rule: "exact-head-generic-texture-inventory-v1"
        }
    });

    assert.equal(
        report.tearducts.binding,
        "base-head-diffuse-neutral-lighting"
    );
    assert.equal(
        tearduct.parameters.NormalMap.resourcePath,
        "res:/graphics/shared_texture/global/normal_flat.dds"
    );
    assert.equal(
        tearduct.parameters.SpecularMap.resourcePath,
        "res:/dx9/model/decal/shared/bw_000_000_015.dds"
    );
    assert.equal(report.tearducts.uvMode, "identity");
    assert.equal(report.tearducts.diffuseMode, "base");
    assert.equal(report.tearducts.foundationDiffuseTarget, true);
    assert.deepEqual(report.tearducts.foundationChannels, [
        "DiffuseMap",
        "NormalMap",
        "SpecularMap"
    ]);
    assert.equal(tearduct.parameters.DiffuseMap.textureRes, foundationDiffuse);
    assert.deepEqual(tearduct.transform, [ 0, 0, 1, 1 ]);

    const authoredTearduct = AtomicEffectFixture({
        texture: { path: "#tearduct-white" },
        transform: [ 0, 0, 0.5, 1 ]
    });
    authoredTearduct.name = "C_SkinShiny_TearDucts";
    applyLegacyConfiguredFaceTextures({
        resolvedMeshBindings: [ {
            meshName: "Tearducts_GeoShape",
            mesh: MeshFixture(authoredTearduct)
        } ]
    }, [], {
        headTextures: { DiffuseMap: composedDiffuse },
        tearductLightingMode: "authored",
        tearductDiffuseMode: "base",
        tearductFoundationTextures: {
            DiffuseMap: foundationDiffuse,
            NormalMap: foundationNormal,
            SpecularMap: foundationSpecular
        }
    });
    assert.equal(authoredTearduct.parameters.DiffuseMap.textureRes, foundationDiffuse);
    assert.equal(authoredTearduct.parameters.NormalMap.textureRes, foundationNormal);
    assert.equal(authoredTearduct.parameters.SpecularMap.textureRes, foundationSpecular);
    assert.deepEqual(authoredTearduct.transform, [ 0, 0, 0.5, 1 ]);
});

test("configured face textures bind a retained fallback without a selected lash contribution", () =>
{
    const lashes = AtomicEffectFixture({
        texture: { path: "#lash-neutral" },
        transform: [ 0, 0, 0.5, 1 ],
        materialDiffuseColor: [ 1, 1, 1, 1 ]
    });
    const eyeShadow = AtomicEffectFixture({
        texture: { path: "#eye-shadow-neutral" },
        transform: [ 0, 0, 0.5, 1 ],
        materialDiffuseColor: [ 1, 1, 1, 1 ]
    });
    lashes.name = "C_SkinShiny_EyeLashes";
    eyeShadow.name = "C_SkinShiny_EyeLashes";
    const composedLashes = { path: "#composed-fallback-lashes", IsGood: () => true };
    const fallbackPath = "res:/graphics/character/female/makeup/eyelashes/eyelashes_01/colorize_head_l_4k.png";
    const report = applyLegacyConfiguredFaceTextures({
        resolvedMeshBindings: [ {
            meshName: "Eyelashes_GeoShape",
            mesh: MeshFixture(lashes)
        }, {
            meshName: "EyeShadow_GeoShape",
            mesh: MeshFixture(eyeShadow)
        } ]
    }, [], {
        eyelashTexture: composedLashes,
        eyelashSourcePath: fallbackPath
    });

    assert.equal(report.status, "applied");
    assert.equal(report.appliedEffects, 2);
    assert.equal(report.eyelashes.status, "applied");
    assert.equal(report.eyelashes.sourcePath, fallbackPath);
    assert.strictEqual(lashes.parameters.DiffuseMap.textureRes, composedLashes);
    assert.strictEqual(eyeShadow.parameters.DiffuseMap.textureRes, composedLashes);
    assert.deepEqual(lashes.transform, [ 0, 0, 1, 1 ]);
    assert.deepEqual(eyeShadow.transform, [ 0, 0, 0.5, 1 ]);
});

test("configured eye-shadow carrier can reproduce the retained direct lash crop", () =>
{
    const lashes = AtomicEffectFixture({
        texture: { path: "#lash-neutral" },
        transform: [ 0, 0, 0.5, 1 ]
    });
    const eyeShadow = AtomicEffectFixture({
        texture: { path: "#eye-shadow-neutral" },
        transform: [ 0, 0, 0.5, 1 ]
    });
    lashes.name = "C_SkinShiny_EyeLashes";
    eyeShadow.name = "C_SkinShiny_EyeLashes";
    const composedLashes = { path: "#composed-lashes", IsGood: () => true };
    const sourcePath = "res:/lashes/colorize_head_l_4k.png";
    const directTransform = [ -0.75, 0, 2, 1 ];
    const report = applyLegacyConfiguredFaceTextures({
        resolvedMeshBindings: [ {
            meshName: "Eyelashes_GeoShape",
            mesh: MeshFixture(lashes)
        }, {
            meshName: "EyeShadow_GeoShape",
            mesh: MeshFixture(eyeShadow)
        } ]
    }, [ {
        groupID: "makeup/eyelashes",
        source: { partSourceRecordID: "female/makeup/eyelashes/eyelashes_01" },
        selectedTextures: [ {
            path: sourcePath,
            role: "colorize-layer",
            target: "head"
        } ]
    } ], {
        eyelashTexture: composedLashes,
        eyelashDirectTransform: directTransform,
        eyelashUvMode: "raw-direct"
    });

    assert.equal(report.eyelashes.status, "applied");
    assert.equal(report.eyelashes.transform, "raw-direct");
    assert.strictEqual(lashes.parameters.DiffuseMap.textureRes, composedLashes);
    assert.equal(eyeShadow.parameters.DiffuseMap.resourcePath, sourcePath);
    assert.deepEqual(lashes.transform, [ 0, 0, 1, 1 ]);
    assert.deepEqual(eyeShadow.transform, directTransform);
    assert.deepEqual(report.eyelashes.carriers.map(value => value.meshName), [
        "Eyelashes_GeoShape",
        "EyeShadow_GeoShape"
    ]);
});

test("configured face textures can hide only the eye-shadow lash carrier", () =>
{
    const lashes = AtomicEffectFixture({
        texture: { path: "#lash-neutral" },
        transform: [ 0, 0, 0.5, 1 ]
    });
    const eyeShadow = AtomicEffectFixture({
        texture: { path: "#eye-shadow-neutral" },
        transform: [ 0, 0, 0.5, 1 ]
    });
    lashes.name = "C_SkinShiny_EyeLashes";
    eyeShadow.name = "C_SkinShiny_EyeLashes";
    const lashMesh = MeshFixture(lashes);
    const eyeShadowMesh = MeshFixture(eyeShadow);
    const report = applyLegacyConfiguredFaceTextures({
        resolvedMeshBindings: [ {
            meshName: "Eyelashes_GeoShape",
            mesh: lashMesh
        }, {
            meshName: "EyeShadow_GeoShape",
            mesh: eyeShadowMesh
        } ]
    }, [], {
        eyelashTexture: { path: "#composed-lashes", IsGood: () => true },
        eyelashSourcePath: "res:/lashes/colorize_head_l_4k.png",
        eyelashCarrierMode: "eyeshadow-off"
    });

    assert.equal(report.eyelashes.status, "applied");
    assert.notEqual(lashMesh.display, false);
    assert.equal(eyeShadowMesh.display, false);
    assert.deepEqual(report.eyelashes.hiddenCarriers, [ {
        meshName: "EyeShadow_GeoShape",
        mode: "eyeshadow-off",
        correctness: "comparison-control"
    } ]);
});

test("configured face comparisons isolate wet-eye and eyeball carriers", () =>
{
    const eye = AtomicEffectFixture({
        texture: { path: "#eye" },
        transform: [ 0, 0, 1, 1 ]
    });
    const wet = AtomicEffectFixture({
        texture: { path: "#wet" },
        transform: [ 0, 0, 1, 1 ]
    });
    eye.name = "C_Eyes";
    wet.name = "C_eyewetness_eyes";
    const eyeMesh = MeshFixture(eye);
    const wetMesh = MeshFixture(wet);
    const report = applyLegacyConfiguredFaceTextures({
        resolvedMeshBindings: [ {
            meshName: "Eyeball_Right_GeoShape",
            mesh: eyeMesh
        }, {
            meshName: "EyeWet_GeoShape",
            mesh: wetMesh
        } ]
    }, [ {
        groupID: "makeup/eyes",
        source: { partSourceRecordID: "female/makeup/eyes/eyes_06" },
        selectedTextures: [ {
            path: "res:/eyes/colorize_head_l_4k.png",
            role: "colorize-layer",
            target: "head"
        } ]
    } ], {
        headTextures: { DiffuseMap: { path: "#composed-eye" } },
        eyeWetEnabled: false,
        eyeballsEnabled: false
    });

    assert.equal(wetMesh.display, false);
    assert.equal(eyeMesh.display, false);
    assert.equal(report.eyeWetness.status, "disabled");
    assert.equal(report.eyeWetness.carrier.meshName, "EyeWet_GeoShape");
    assert.equal(report.eyes.status, "disabled");
    assert.deepEqual(report.eyes.hiddenCarriers, [ {
        meshName: "Eyeball_Right_GeoShape",
        correctness: "comparison-control"
    } ]);
});

test("configured face binds retained generic-head diffuse to wet-eye material", () =>
{
    const wet = AtomicEffectFixture({
        texture: { path: "#authored-wet" },
        transform: [ 0, 0, 1, 1 ]
    });
    wet.name = "C_eyewetness_eyes";
    const report = applyLegacyConfiguredFaceTextures({
        resolvedMeshBindings: [ {
            meshName: "EyeWet_GeoShape",
            mesh: MeshFixture(wet)
        } ]
    }, [], {
        headTextures: {
            DiffuseMap: { path: "#head-diffuse" },
            NormalMap: { path: "#head-normal" },
            SpecularMap: { path: "#head-specular" }
        },
        eyeWetSupportTextures: {
            DiffuseMap: { path: "#generic-head-diffuse" }
        },
        eyeWetMaterialMode: "composed"
    });

    assert.equal(wet.parameters.DiffuseMap.textureRes.path, "#generic-head-diffuse");
    assert.equal(
        wet.parameters.NormalMap.resourcePath,
        "res:/graphics/shared_texture/global/normal_flat.dds"
    );
    assert.equal(report.eyeWetness.materialMode, "composed");
    assert.equal(report.eyeWetness.supportDiffuseTarget, true);
    assert.equal(
        report.eyeWetness.binding,
        "generic-head-support-diffuse-neutral-lighting"
    );
});

test("configured face comparisons isolate eye-shadow diffuse and lighting", () =>
{
    const eyeShadow = AtomicEffectFixture({
        texture: { path: "#eye-shadow" },
        transform: [ 0, 0, 0.5, 1 ],
        materialSpecularColor: [ 2, 2, 2, 1 ]
    });
    eyeShadow.name = "C_SkinShiny_EyeLashes";
    const report = applyLegacyConfiguredFaceTextures({
        resolvedMeshBindings: [ {
            meshName: "EyeShadow_GeoShape",
            mesh: MeshFixture(eyeShadow)
        } ]
    }, [], {
        eyelashTexture: { path: "#composed-lashes" },
        eyelashSourcePath: "res:/lashes/colorize_head_l_4k.png",
        eyeShadowDiffuseMode: "transparent",
        eyeShadowLightingMode: "neutral"
    });

    assert.equal(eyeShadow.parameters.DiffuseMap.resourcePath, "dynamic:/color/0,0,0,0");
    assert.equal(
        eyeShadow.parameters.NormalMap.resourcePath,
        "res:/graphics/shared_texture/global/normal_flat.dds"
    );
    assert.equal(eyeShadow.parameters.SpecularMap.resourcePath, "dynamic:/color/0,0,0,1");
    assert.equal(report.eyelashes.eyeShadowDiffuseMode, "transparent");
    assert.equal(report.eyelashes.eyeShadowLightingMode, "neutral");
});

test("configured head composition binds only the exact authored skin carrier", async () =>
{
    const fixture = AtlasComposerFixture({ headNormalMode: "base" });
    const skin = AtomicEffectFixture({
        texture: { path: "#skin-diffuse" },
        transform: [ 0.5, 0, 1, 0.5 ]
    });
    const eye = AtomicEffectFixture({
        texture: { path: "#eye-diffuse" },
        transform: [ 0.5, 0, 1, 0.5 ]
    });
    const tongue = AtomicEffectFixture({
        texture: { path: "#tongue-diffuse" },
        transform: [ 0.5, 0, 1, 0.5 ]
    });
    const teeth = AtomicEffectFixture({
        texture: { path: "#teeth-diffuse" },
        transform: [ 0.5, 0, 1, 0.5 ]
    });
    skin.name = "C_Skin_blinn1";
    eye.name = "EyeShader";
    tongue.name = "C_Skin_blinn1";
    teeth.name = "PortraitBasic";
    const original = [ eye, tongue, teeth ].map(effect => ({
        diffuse: effect.parameters.DiffuseMap.textureRes,
        normal: effect.parameters.NormalMap.textureRes,
        specular: effect.parameters.SpecularMap.textureRes,
        transform: [ ...effect.transform ]
    }));
    const staged = {
        sex: "female",
        configuredFoundations: [ {
            role: "head",
            skinTextureBindings: {
                textures: {
                    DiffuseMap: "res:/head_d.png",
                    NormalMap: "res:/head_n.png",
                    SpecularMap: "res:/head_s.png"
                }
            }
        } ],
        configuredFoundationBindings: [ {
            role: "head",
            resolvedMeshBindings: [ {
                mesh: MeshFixture(skin),
                meshIndex: 0,
                meshName: "meshShape",
                geometryMeshName: "meshShape"
            }, {
                mesh: MeshFixture(eye),
                meshIndex: 1,
                meshName: "eyeShape",
                geometryMeshName: "eyeShape"
            }, {
                mesh: MeshFixture(tongue),
                meshIndex: 2,
                meshName: "tongueShape",
                geometryMeshName: "tongueShape"
            }, {
                mesh: MeshFixture(teeth),
                meshIndex: 3,
                meshName: "teethShape",
                geometryMeshName: "teethShape"
            } ]
        } ],
        textureContributions: [ {
            layerIndex: 1,
            groupID: "makeup/eyes",
            selectedTextures: [ {
                path: "res:/eyes_n.png",
                role: "normal-overlay",
                target: "head"
            } ]
        } ],
        compositionTargets: []
    };

    const report = await fixture.composer.ComposeConfiguredHeadMaterials(staged);

    assert.equal(report.status, "applied");
    assert.equal(report.attachedEffects, 1);
    assert.equal(
        report.channels.find(value => value.name === "NormalMap").diagnosticMode,
        "authored-base-normal"
    );
    assert.equal(report.channels.find(value => value.name === "NormalMap").overlayCount, 0);
    assert.deepEqual(skin.transform, [ 0, 0, 1, 1 ]);
    for (let index = 0; index < original.length; index++)
    {
        const effect = [ eye, tongue, teeth ][index];
        assert.strictEqual(effect.parameters.DiffuseMap.textureRes, original[index].diffuse);
        assert.strictEqual(effect.parameters.NormalMap.textureRes, original[index].normal);
        assert.strictEqual(effect.parameters.SpecularMap.textureRes, original[index].specular);
        assert.deepEqual(effect.transform, original[index].transform);
    }
});

test("configured head falls back to composed tear-duct diffuse when support is absent", async () =>
{
    const fixture = AtlasComposerFixture({
        headNormalMode: "base",
        tearductDiffuseMode: "base"
    });
    const skin = AtomicEffectFixture({
        texture: { path: "#male-skin-diffuse" },
        transform: [ 0.5, 0, 1, 0.5 ]
    });
    skin.name = "C_Skin_blinn1";
    const staged = {
        sex: "male",
        configuredFoundations: [ {
            role: "head",
            skinTextureBindings: {
                textures: {
                    DiffuseMap: "res:/male_head_d.png",
                    NormalMap: "res:/male_head_n.png",
                    SpecularMap: "res:/male_head_s.png"
                },
                supportTextures: null
            }
        } ],
        configuredFoundationBindings: [ {
            role: "head",
            resolvedMeshBindings: [ {
                mesh: MeshFixture(skin),
                meshIndex: 0,
                meshName: "meshShape",
                geometryMeshName: "meshShape"
            } ]
        } ],
        textureContributions: [],
        compositionTargets: []
    };

    const report = await fixture.composer.ComposeConfiguredHeadMaterials(staged);

    assert.equal(report.status, "applied");
    assert.equal(report.attachedEffects, 1);
    assert.deepEqual(report.faceTextureFallbacks, [ {
        role: "tearducts",
        requested: "base",
        applied: "composed",
        reason: "generic-head-support-unavailable"
    } ]);
    assert.equal(report.deferred.some(value =>
        value.reason === "Configured face base tear-duct diffuse requires a path"), false);
    assert.equal(staged.compositionTargets.every(target => target.destroyed === false), true);
    assert.deepEqual(skin.transform, [ 0, 0, 1, 1 ]);
});

test("configured generic head separates opaque skin alpha from face support alpha", async () =>
{
    const fixture = AtlasComposerFixture({
        headNormalMode: "base",
        tearductDiffuseMode: "base"
    });
    const skin = AtomicEffectFixture({
        texture: { path: "#generic-head-diffuse" },
        transform: [ 0.5, 0, 1, 0.5 ]
    });
    skin.name = "C_Skin_blinn1";
    const staged = {
        sex: "male",
        configuredFoundations: [ {
            role: "head",
            skinTextureBindings: {
                rule: "exact-head-generic-texture-inventory-v1",
                textures: {
                    DiffuseMap: "res:/generic_male_head_d.png",
                    NormalMap: "res:/generic_male_head_n.png",
                    SpecularMap: "res:/generic_male_head_s.png"
                },
                supportTextures: null
            }
        } ],
        configuredFoundationBindings: [ {
            role: "head",
            resolvedMeshBindings: [ {
                mesh: MeshFixture(skin),
                meshIndex: 0,
                meshName: "meshShape",
                geometryMeshName: "meshShape"
            } ]
        } ],
        textureContributions: [],
        compositionTargets: []
    };

    const report = await fixture.composer.ComposeConfiguredHeadMaterials(staged);
    const diffuse = report.channels.find(value => value.name === "DiffuseMap");

    assert.equal(report.status, "applied");
    assert.equal(report.faceTextureFallbacks, undefined);
    assert.equal(diffuse.framebufferAlpha, "opaque-skin-surface");
    assert.equal(staged.compositionTargets.every(target => target.destroyed === false), true);
    assert.deepEqual(skin.transform, [ 0, 0, 1, 1 ]);
});

test("diffuse-only skin diagnostic neutralizes head normal and specular channels", async () =>
{
    const fixture = AtlasComposerFixture({ skinLightingMode: "diffuse" });
    const skin = AtomicEffectFixture({
        texture: { path: "#skin-diffuse" },
        transform: [ 0.5, 0, 1, 0.5 ]
    });
    skin.name = "C_Skin_blinn1";
    const staged = {
        sex: "female",
        configuredFoundations: [ {
            role: "head",
            skinTextureBindings: {
                textures: {
                    DiffuseMap: "res:/head_d.png",
                    NormalMap: "res:/head_n.png",
                    SpecularMap: "res:/head_s.png"
                }
            }
        } ],
        configuredFoundationBindings: [ {
            role: "head",
            resolvedMeshBindings: [ {
                mesh: MeshFixture(skin),
                meshIndex: 0,
                meshName: "meshShape",
                geometryMeshName: "meshShape"
            } ]
        } ],
        textureContributions: [],
        compositionTargets: []
    };

    const report = await fixture.composer.ComposeConfiguredHeadMaterials(staged);

    assert.equal(report.status, "applied");
    assert.equal(
        report.channels.find(value => value.name === "NormalMap").diagnosticMode,
        "neutral-normal"
    );
    assert.equal(
        report.channels.find(value => value.name === "SpecularMap").diagnosticMode,
        "black-specular"
    );
});

test("solid skin diagnostic replaces only the configured head diffuse recipe", async () =>
{
    const fixture = AtlasComposerFixture({ skinDiffuseMode: "solid" });
    const skin = AtomicEffectFixture({
        texture: { path: "#skin-diffuse" },
        transform: [ 0.5, 0, 1, 0.5 ]
    });
    skin.name = "C_Skin_blinn1";
    const staged = {
        sex: "female",
        configuredFoundations: [ {
            role: "head",
            skinTextureBindings: {
                textures: {
                    DiffuseMap: "res:/head_d.png",
                    NormalMap: "res:/head_n.png",
                    SpecularMap: "res:/head_s.png"
                }
            }
        } ],
        configuredFoundationBindings: [ {
            role: "head",
            resolvedMeshBindings: [ {
                mesh: MeshFixture(skin),
                meshIndex: 0,
                meshName: "meshShape",
                geometryMeshName: "meshShape"
            } ]
        } ],
        textureContributions: [],
        compositionTargets: []
    };

    const report = await fixture.composer.ComposeConfiguredHeadMaterials(staged);
    const diffuse = report.channels.find(value => value.name === "DiffuseMap");
    assert.equal(diffuse.diagnosticMode, "solid-diffuse");
    assert.equal(diffuse.overlayCount, 0);
    assert.equal(diffuse.passes[0].mode, "foundation-cut-white");
});

test("retained skin base colour can seed the same head colourization recipe", async () =>
{
    const fixture = AtlasComposerFixture({ skinDiffuseMode: "basecolor" });
    const skin = AtomicEffectFixture({
        texture: { path: "#skin-diffuse" },
        transform: [ 0.5, 0, 1, 0.5 ]
    });
    skin.name = "C_Skin_blinn1";
    const staged = {
        sex: "female",
        configuredFoundations: [ {
            role: "head",
            skinTextureBindings: {
                baseColor: [ 0.760784, 0.6, 0.513725, 1 ],
                textures: {
                    DiffuseMap: "res:/head_d.png",
                    NormalMap: "res:/head_n.png",
                    SpecularMap: "res:/head_s.png"
                },
                colorization: {
                    materialDefinitionPath: "res:/deteis_dark.color",
                    colors: [
                        [ 0.3, 0.1, 0.01, 1 ],
                        [ 0.1, 0.15, 0.14, 1 ],
                        [ 0.21, 0.21, 0.21, 1 ]
                    ],
                    headDetailPath: "res:/colorize_head_l.png",
                    headZonePath: "res:/colorize_head_z.png",
                    bodyDetailPath: "res:/colorize_body_l.png",
                    bodyZonePath: "res:/colorize_body_z.png"
                }
            }
        } ],
        configuredFoundationBindings: [ {
            role: "head",
            resolvedMeshBindings: [ {
                mesh: MeshFixture(skin),
                meshIndex: 0,
                meshName: "meshShape",
                geometryMeshName: "meshShape"
            } ]
        } ],
        textureContributions: [],
        compositionTargets: []
    };

    const report = await fixture.composer.ComposeConfiguredHeadMaterials(staged);
    const diffuse = report.channels.find(value => value.name === "DiffuseMap");
    assert.equal(diffuse.diagnosticMode, "basecolor-diffuse");
    assert.equal(diffuse.overlayCount, 1);
    assert.deepEqual(diffuse.passes.slice(0, 2).map(value => value.mode), [
        "retained-skin-base-color",
        "colorized-rgb"
    ]);
    assert.equal(
        diffuse.passes[0].path,
        "dynamic:/color/0.760784,0.6,0.513725,1"
    );
});

test("configured garment fallback uses its own colorized target without touching skin", async () =>
{
    const fixture = AtlasComposerFixture();
    const garment = AtomicEffectFixture({
        texture: { path: "#neutral-proof" },
        transform: [ 0.2, 0.3, 0.4, 0.5 ],
        materialDiffuseColor: [ 1, 0, 1, 1 ]
    });
    const skin = AtomicEffectFixture({
        texture: { path: "#skin-proof" },
        transform: [ 0.1, 0.1, 0.8, 0.8 ]
    });
    const hybrid = AtomicEffectFixture({
        texture: { path: "#hybrid-proof" },
        transform: [ 0, 0, 1, 1 ],
        materialDiffuseColor: [ 1, 1, 1, 1 ]
    });
    const replacementSkin = AtomicEffectFixture({
        texture: { path: "#replacement-skin" },
        transform: [ 0, 0, 0.5, 1 ],
        materialDiffuseColor: [ 1, 1, 1, 1 ]
    });
    const setHybridParameters = hybrid.SetParameters.bind(hybrid);
    hybrid.SetParameters = values =>
    {
        const changed = !values.MaterialDiffuseColor
            || values.MaterialDiffuseColor.some((value, index) =>
                value !== hybrid.materialDiffuseColor[index]);
        setHybridParameters(values);
        return changed;
    };
    garment._characterGarmentMaterialFallback = true;
    garment._characterAuthoredEffect = {
        parameters: {
            DiffuseMap: { resourcePath: "" },
            NormalMap: {
                resourcePath: "res:/garment-normal.dds",
                textureRes: { path: "res:/garment-normal.dds", IsGood: () => true },
                isAttached: true
            },
            SpecularMap: { resourcePath: "res:/garment-specular.dds" }
        }
    };
    hybrid._characterGarmentBodyFallback = true;
    replacementSkin._characterGarmentBodyFallback = true;
    replacementSkin._characterFoundationReplacementRole = "feet";
    const part = {
        partIndex: 13,
        groupID: "bottomouter",
        partSourceRecordID: "female/bottomouter/pantscf01",
        materialStatus: "retained-linear-color-fallback",
        compositionStatus: "deferred"
    };
    const staged = {
        sex: "female",
        configuredParts: [ part ],
        configuredPartBindings: [ {
            configuredPart: part,
            configuredMeshes: [
                MeshFixture(garment),
                MeshFixture(hybrid),
                MeshFixture(replacementSkin),
                MeshFixture(skin)
            ]
        } ],
        textureContributions: [ {
            layerIndex: 13,
            partIndex: 13,
            groupID: "bottomouter",
            source: {
                partSourceRecordID: "female/bottomouter/pantscf01",
                materialDefinitionPath: "res:/pants.color"
            },
            materialValues: {
                colors: [
                    [ 0.1, 0.2, 0.3, 1 ],
                    [ 0.4, 0.5, 0.6, 1 ],
                    [ 0.7, 0.8, 0.9, 1 ]
                ],
                pattern: ""
            },
            selectedTextures: [
                { path: "res:/pants/colorize_body_l.png", role: "colorize-layer", target: "body" },
                { path: "res:/pants/colorize_body_z.png", role: "colorize-zones", target: "body" },
                { path: "res:/pants/pants_n.png", role: "normal-source", target: "body" },
                { path: "res:/pants/pants_s.png", role: "specular-source", target: "body" }
            ]
        } ],
        compositionTargets: [],
        composedBodyDiffuseTexture: { path: "#shared-body" }
    };
    const originalSkinTexture = skin.parameters.DiffuseMap.textureRes;
    const originalSkinTransform = [ ...skin.transform ];
    const originalReplacementTexture = replacementSkin.parameters.DiffuseMap.textureRes;
    const originalReplacementTransform = [ ...replacementSkin.transform ];

    const report = await fixture.composer.ComposeConfiguredGarmentMaterials(staged);

    assert.equal(report.status, "applied");
    assert.equal(report.applied.length, 1);
    assert.equal(report.applied[0].attachedEffects, 2);
    assert.deepEqual(report.applied[0].materialChannels, {
        status: "ready",
        rule: "legacy-opengl-retained-garment-lighting-v1",
        correctness: "retained-source-policy",
        normalPath: "res:/pants/pants_n.png",
        specularPath: "res:/pants/pants_s.png"
    });
    assert.deepEqual(report.applied[0].surfaces.map(value => value.surface), [
        "private-garment",
        "body-garment-hybrid"
    ]);
    assert.deepEqual(report.applied[0].surfaces[0].passes.map(value => value.mode), [
        "configured-garment-clear",
        "configured-authored-rgba",
        "colorized-rgb"
    ]);
    assert.deepEqual(report.applied[0].surfaces[0].passes[0].placement, [ 0, 0, 1, 1 ]);
    assert.equal(report.applied[0].surfaces[0].passes[2].detailMask, "disabled");
    assert.equal(report.applied[0].surfaces[0].passes[2].blend, "disabled");
    assert.deepEqual(report.applied[0].surfaces[1].passes.map(value => value.mode), [
        "configured-garment-clear",
        "configured-authored-rgba",
        "configured-shared-rgb",
        "colorized-rgb"
    ]);
    assert.equal(report.applied[0].surfaces[1].passes[3].detailMask, "enabled");
    assert.equal(report.applied[0].surfaces[1].passes[3].blend, "source-alpha");
    assert.deepEqual(report.applied[0].bindings[0].authoredTextureSlots, [
        {
            name: "DiffuseMap",
            resourcePath: null,
            attached: false,
            ready: null,
            status: "unbound"
        }, {
            name: "NormalMap",
            resourcePath: "res:/garment-normal.dds",
            attached: true,
            ready: true,
            status: "ready"
        }, {
            name: "SpecularMap",
            resourcePath: "res:/garment-specular.dds",
            attached: false,
            ready: null,
            status: "path-only"
        }
    ]);
    const colorizedEffect = fixture.effects.find(value =>
        /colorizedblit\.sm_hi$/u.test(value.effectFilePath));
    assert.deepEqual(colorizedEffect.parameters.UseMask, [ 0, 0, 0, 0 ]);
    assert.deepEqual(colorizedEffect.parameters.MaskReverseUV2, [ 0, 0, 1, 1 ]);
    assert.equal(colorizedEffect.textures.MaskMap, "dynamic:/color/0,0,0,0");
    assert.ok(colorizedEffect.stateOverrides.some(value =>
        value[2] === 27 && value[3] === 0));
    assert.strictEqual(garment.parameters.DiffuseMap.textureRes, staged.compositionTargets[0].texture);
    assert.deepEqual(garment.transform, [ 0, 0, 1, 1 ]);
    assert.deepEqual(garment.materialDiffuseColor, [ 1, 1, 1, 1 ]);
    assert.strictEqual(garment.parameters.NormalMap.textureRes, staged.compositionTargets[1].texture);
    assert.strictEqual(garment.parameters.SpecularMap.textureRes, staged.compositionTargets[2].texture);
    assert.strictEqual(hybrid.parameters.DiffuseMap.textureRes, staged.compositionTargets[3].texture);
    assert.strictEqual(hybrid.parameters.NormalMap.textureRes, staged.compositionTargets[4].texture);
    assert.strictEqual(hybrid.parameters.SpecularMap.textureRes, staged.compositionTargets[5].texture);
    assert.deepEqual(hybrid.materialDiffuseColor, [ 1, 1, 1, 1 ]);
    assert.deepEqual(hybrid.stateOverrides.slice(-4), [
        [ "Main", 0, 15, 1 ],
        [ "Main", 0, 24, 0 ],
        [ "Main", 0, 25, 5 ],
        [ "Main", 0, 27, 0 ]
    ]);
    assert.strictEqual(skin.parameters.DiffuseMap.textureRes, originalSkinTexture);
    assert.deepEqual(skin.transform, originalSkinTransform);
    assert.strictEqual(
        replacementSkin.parameters.DiffuseMap.textureRes,
        originalReplacementTexture
    );
    assert.deepEqual(replacementSkin.transform, originalReplacementTransform);
    assert.equal(part.materialStatus, "configured-garment-colorized-policy");
    assert.equal(part.compositionStatus, "configured-garment-colorized-attached");
    assert.equal(report.applied[0].realizationStatus, "complete");
    assert.equal(report.applied[0].completedSurfaceCount, 2);
    assert.equal(report.applied[0].partialSurfaceCount, 0);
    assert.equal(report.applied[0].deferredSurfaceCount, 0);
});

test("configured accessory binds one exact private target and stays out of garment composition", async () =>
{
    const fixture = AtlasComposerFixture();
    const effect = AtomicEffectFixture({
        texture: { path: "#accessory-proof" },
        transform: [ 0.5, 0, 1, 0.5 ],
        materialDiffuseColor: [ 1, 0, 1, 1 ]
    });
    effect._characterGarmentMaterialFallback = true;
    const part = {
        partIndex: 31,
        groupID: "accessories/glasses",
        partSourceRecordID: "female/accessories/glasses/eyeimp01",
        materialStatus: "retained-linear-color-fallback",
        compositionStatus: "deferred"
    };
    const contribution = {
        partIndex: 31,
        groupID: "accessories/glasses",
        source: {
            partSourceRecordID: part.partSourceRecordID,
            materialDefinitionPath: "res:/eyeimp01/ep.color"
        },
        materialValues: {
            colors: [
                [ 0.1, 0.3, 0.6, 1 ],
                [ 0.2, 0.5, 0.8, 1 ],
                [ 0.4, 0.7, 0.9, 1 ]
            ]
        },
        selectedTextures: [
            { path: "res:/eyeimp01/colorize_head_l.png", role: "colorize-layer", target: "head" },
            { path: "res:/eyeimp01/colorize_head_z.png", role: "colorize-zones", target: "head" },
            { path: "res:/eyeimp01/comp_head_n.png", role: "normal-overlay", target: "head" },
            { path: "res:/eyeimp01/comp_head_s.png", role: "specular-overlay", target: "head" }
        ]
    };
    const staged = {
        sex: "female",
        configuredParts: [ part ],
        configuredPartBindings: [ {
            configuredPart: part,
            configuredMeshes: [ MeshFixture(effect) ]
        } ],
        textureContributions: [ contribution ],
        compositionTargets: []
    };

    const report = await fixture.composer.ComposeConfiguredAccessoryMaterials(staged);

    assert.equal(report.status, "applied");
    assert.equal(report.applied.length, 1);
    assert.equal(report.applied[0].target, "head");
    assert.equal(report.applied[0].realizationStatus, "complete");
    assert.deepEqual(report.applied[0].surface.passes.map(value => value.mode), [
        "configured-garment-clear",
        "configured-authored-rgba",
        "colorized-rgb"
    ]);
    assert.strictEqual(effect.parameters.DiffuseMap.textureRes, staged.compositionTargets[0].texture);
    assert.strictEqual(effect.parameters.NormalMap.textureRes, staged.compositionTargets[1].texture);
    assert.strictEqual(effect.parameters.SpecularMap.textureRes, staged.compositionTargets[2].texture);
    assert.deepEqual(effect.transform, [ 0, 0, 1, 1 ]);
    assert.equal(part.materialStatus, "configured-accessory-colorized-policy");
    assert.equal(part.compositionStatus, "configured-accessory-colorized-attached");

    const garmentReport = await fixture.composer.ComposeConfiguredGarmentMaterials(staged);
    assert.deepEqual(garmentReport.applied, []);
    assert.deepEqual(garmentReport.deferred, []);
});

test("configured private garment accepts one exact baked D/N/S material", async () =>
{
    const fixture = AtlasComposerFixture();
    const garment = AtomicEffectFixture({
        texture: { path: "#neutral-proof" },
        transform: [ 0, 0, 0.5, 1 ],
        materialDiffuseColor: [ 1, 0, 1, 1 ]
    });
    garment._characterGarmentMaterialFallback = true;
    const contribution = {
        partIndex: 21,
        groupID: "outer",
        source: {
            partSourceRecordID: "female/outer/baked-suit",
            materialDefinitionPath: null
        },
        materialValues: null,
        selectedTextures: [
            { path: "res:/suit/comp_body_d.png", role: "diffuse-overlay", target: "body" },
            { path: "res:/suit/comp_body_n.png", role: "normal-overlay", target: "body" },
            { path: "res:/suit/comp_body_s.png", role: "specular-overlay", target: "body" }
        ]
    };
    assert.equal(
        resolveLegacyBodyDiffuseContribution(contribution).reason,
        "body-colorize-layer-unresolved"
    );
    assert.deepEqual(resolveLegacyConfiguredGarmentDiffuseContribution(contribution), {
        status: "ready",
        candidate: {
            mode: "baked-direct",
            contribution,
            detail: contribution.selectedTextures[0],
            zones: null,
            colors: null
        }
    });

    const part = {
        partIndex: 21,
        groupID: "outer",
        partSourceRecordID: "female/outer/baked-suit",
        materialStatus: "deferred",
        compositionStatus: "deferred"
    };
    const staged = {
        sex: "female",
        configuredParts: [ part ],
        configuredPartBindings: [ {
            configuredPart: part,
            configuredMeshes: [ MeshFixture(garment) ]
        } ],
        textureContributions: [ contribution ],
        compositionTargets: []
    };

    const report = await fixture.composer.ComposeConfiguredGarmentMaterials(staged);

    assert.equal(report.status, "applied");
    assert.equal(report.applied[0].diffuseMode, "baked-direct");
    assert.equal(report.applied[0].zonePath, null);
    assert.equal(report.applied[0].colors, null);
    assert.deepEqual(report.applied[0].surfaces[0].passes.map(value => value.mode), [
        "configured-garment-clear",
        "configured-authored-rgba"
    ]);
    assert.equal(staged.compositionTargets.length, 3);
    assert.strictEqual(garment.parameters.DiffuseMap.textureRes, staged.compositionTargets[0].texture);
    assert.strictEqual(garment.parameters.NormalMap.textureRes, staged.compositionTargets[1].texture);
    assert.strictEqual(garment.parameters.SpecularMap.textureRes, staged.compositionTargets[2].texture);
    assert.deepEqual(garment.transform, [ 0, 0, 1, 1 ]);
    assert.equal(part.materialStatus, "configured-garment-baked-policy");
    assert.equal(part.compositionStatus, "configured-garment-baked-attached");
    assert.equal(report.applied[0].realizationStatus, "complete");
});

test("configured private garment accepts one exact version-authored RGBA layer", async () =>
{
    const fixture = AtlasComposerFixture();
    const garment = AtomicEffectFixture({
        texture: { path: "#neutral-proof" },
        transform: [ 0, 0, 0.5, 1 ]
    });
    garment._characterGarmentMaterialFallback = true;
    const layer = {
        path: "res:/suit/v1/colorize_body_l.png",
        role: "colorize-layer",
        target: "body"
    };
    const contribution = {
        partIndex: 22,
        groupID: "outer",
        source: {
            partSourceRecordID: "male/outer/version-rgba-suit",
            versionIndex: 1,
            typeDefinitionPath: "res:/suit/types/version-rgba.type",
            materialDefinitionPath: null,
            materialCandidatePaths: []
        },
        materialValues: null,
        colorSelection: null,
        textureCandidates: [ layer ],
        selectedTextures: [ layer ]
    };
    assert.deepEqual(resolveLegacyConfiguredGarmentDiffuseContribution(contribution), {
        status: "ready",
        candidate: {
            mode: "baked-direct",
            evidenceRule: "exact-version-authored-rgba-overlay-v1",
            contribution,
            detail: layer,
            zones: null,
            colors: null
        }
    });
    const part = {
        partIndex: 22,
        groupID: "outer",
        partSourceRecordID: "male/outer/version-rgba-suit",
        materialStatus: "deferred",
        compositionStatus: "deferred"
    };
    const staged = {
        sex: "male",
        configuredParts: [ part ],
        configuredPartBindings: [ {
            configuredPart: part,
            configuredMeshes: [ MeshFixture(garment) ]
        } ],
        textureContributions: [ contribution ],
        compositionTargets: []
    };

    const report = await fixture.composer.ComposeConfiguredGarmentMaterials(staged);

    assert.equal(report.status, "applied");
    assert.equal(report.applied[0].diffuseMode, "baked-direct");
    assert.deepEqual(report.applied[0].surfaces[0].passes.map(value => value.mode), [
        "configured-garment-clear",
        "configured-authored-rgba"
    ]);
    assert.equal(staged.compositionTargets.length, 1);
    assert.strictEqual(garment.parameters.DiffuseMap.textureRes, staged.compositionTargets[0].texture);
    assert.equal(report.applied[0].realizationStatus, "partial");
    assert.equal(report.applied[0].completedSurfaceCount, 0);
    assert.equal(report.applied[0].partialSurfaceCount, 1);
    assert.equal(report.applied[0].surfaces[0].lightingStatus, "deferred");
    assert.equal(report.applied[0].surfaces[0].reason, "garment-normal-map-unresolved");
    assert.equal(part.materialStatus, "configured-garment-baked-partial");
    assert.equal(part.compositionStatus, "configured-garment-baked-partial");
});

test("configured outer garment uses its authored pattern while preserving private alpha", async () =>
{
    const fixture = AtlasComposerFixture();
    const garment = AtomicEffectFixture({
        texture: { path: "#neutral-proof" },
        transform: [ 0, 0, 1, 1 ],
        materialDiffuseColor: [ 1, 0, 1, 1 ]
    });
    garment._characterGarmentMaterialFallback = true;
    garment._characterAuthoredTransformUV0 = [ 0, 0, 0.5, 1 ];
    garment._characterAuthoredEffect = {
        parameters: {
            CutMaskInfluence: {
                GetValue(out)
                {
                    out.push(0.85, 0, 0, 0);
                    return out;
                }
            },
            CutMaskMap: TextureParameterFixture("res:/jacket/comp_body_m.png")
        }
    };
    const part = {
        partIndex: 5,
        groupID: "outer",
        partSourceRecordID: "female/outer/jacketaf01",
        materialStatus: "retained-linear-color-fallback",
        compositionStatus: "deferred"
    };
    const staged = {
        sex: "female",
        configuredParts: [ part ],
        configuredPartBindings: [ {
            configuredPart: part,
            configuredMeshes: [ MeshFixture(garment) ]
        } ],
        textureContributions: [ {
            layerIndex: 5,
            partIndex: 5,
            groupID: "outer",
            source: {
                partSourceRecordID: "female/outer/jacketaf01",
                materialDefinitionPath: "res:/jacket.color"
            },
            materialValues: {
                colors: [
                    [ 0.1, 0.2, 0.3, 1 ],
                    [ 0.4, 0.5, 0.6, 1 ],
                    [ 0.7, 0.8, 0.9, 1 ]
                ],
                pattern: "Amarr_B",
                patternColors: [
                    [ 0.2, 0.1, 0.2, 1 ],
                    [ 0.3, 0.2, 0.3, 1 ],
                    [ 0.4, 0.3, 0.4, 1 ],
                    [ 0, 0, 0, 1 ],
                    [ 0, 0, 0, 1 ],
                    [ 0, 0, 8, 8 ],
                    15
                ]
            },
            selectedTextures: [
                { path: "res:/jacket/colorize_body_l.png", role: "colorize-layer", target: "body" },
                { path: "res:/jacket/colorize_body_z.png", role: "colorize-zones", target: "body" }
            ]
        } ],
        compositionTargets: []
    };

    const report = await fixture.composer.ComposeConfiguredGarmentMaterials(staged);

    assert.equal(report.status, "applied");
    assert.deepEqual(report.applied[0].surfaces[0].passes.map(value => value.mode), [
        "configured-garment-clear",
        "configured-authored-rgba",
        "patterned-rgb"
    ]);
    const patternPass = report.applied[0].surfaces[0].passes[2];
    assert.equal(patternPass.pattern.name, "Amarr_B");
    assert.equal(patternPass.pattern.path, "res:/graphics/character/patterns/amarr_b_z.dds");
    assert.deepEqual(patternPass.pattern.transform, [ 0, 0, 8, 8 ]);
    assert.equal(patternPass.pattern.rotation, 15);
    assert.equal(patternPass.rgbOperation, "replace");
    assert.equal(patternPass.blend, "disabled");
    const patternEffect = fixture.effects.find(value =>
        /patternblit\.sm_hi$/u.test(value.effectFilePath));
    assert.equal(patternEffect.textures.PatternMap,
        "res:/graphics/character/patterns/amarr_b_z.dds");
    assert.deepEqual(patternEffect.parameters.PatternColor1, [ 0.2, 0.1, 0.2, 1 ]);
    assert.deepEqual(patternEffect.parameters.PatternTransform, [ 0, 0, 8, 8 ]);
    assert.equal(patternEffect.parameters.PatternRotation, 15);
    assert.strictEqual(garment.parameters.DiffuseMap.textureRes, staged.compositionTargets[0].texture);
    assert.deepEqual(garment.materialDiffuseColor, [ 1, 1, 1, 1 ]);
    assert.deepEqual(report.applied[0].surfaces[0].alphaEvidence, {
        status: "unavailable",
        reason: "render-target-readback-unavailable"
    });
    assert.deepEqual(report.applied[0].bindings[0].areaFields, [ "opaqueAreas" ]);
    assert.equal(report.applied[0].bindings[0].areaContract, "opaque-only");
    assert.deepEqual(report.applied[0].bindings[0].authoredSampleBounds, [ 0, 0, 0.5, 1 ]);
    assert.deepEqual(report.applied[0].bindings[0].sampleBounds, [ 0, 0, 1, 1 ]);
    assert.deepEqual(
        report.applied[0].bindings[0].authoredCutMaskInfluence,
        [ 0.85, 0, 0, 0 ]
    );
    assert.deepEqual(
        report.applied[0].bindings[0].authoredTextureSlots.map(value => value.name),
        [ "CutMaskMap" ]
    );
    assert.equal(report.applied[0].realizationStatus, "partial");
    assert.equal(part.materialStatus, "configured-garment-colorized-partial");
    assert.equal(part.compositionStatus, "configured-garment-colorized-partial");
});

test("selected top drape resolves material only from its retained owner", () =>
{
    const staged = SelectedTopDrapeStaged();
    const planned = planLegacySelectedTopDrapeSupport(
        staged.sex,
        staged.backend.visualModel,
        staged.configuredParts,
        staged.textureContributions
    );

    assert.equal(planned.status, "ready");
    assert.equal(planned.drapePartIndex, 4);
    assert.equal(planned.ownerSelectionIndex, 7);
    assert.equal(planned.topLayerIndex, 3);
    assert.equal(planned.alphaPath, "res:/top_l.png");
    assert.equal(planned.topZonePath, "res:/top_z.png");
    assert.deepEqual(planned.effects, [ staged.drapeEffect ]);

    staged.textureContributions[1].ownerSelectionIndex = 8;
    assert.equal(planLegacySelectedTopDrapeSupport(
        staged.sex,
        staged.backend.visualModel,
        staged.configuredParts,
        staged.textureContributions
    ).reason, "selected-top-drape-material-unresolved");
});

test("selected top drape atomically replaces shared-skin fallback with owner material", async () =>
{
    const fixture = AtlasComposerFixture();
    const staged = SelectedTopDrapeStaged();
    const originalTexture = staged.drapeEffect.parameters.DiffuseMap.textureRes;
    const report = await fixture.composer.ComposeSelectedTopDrapeSupport(staged);

    assert.equal(report.status, "applied");
    assert.equal(report.attachedEffects, 1);
    assert.deepEqual(report.passes.map(value => value.mode), [
        "configured-authored-rgba",
        "colorized-rgb"
    ]);
    assert.notStrictEqual(staged.drapeEffect.parameters.DiffuseMap.textureRes, originalTexture);
    assert.strictEqual(
        staged.drapeEffect.parameters.DiffuseMap.textureRes,
        staged.compositionTargets[0].texture
    );
    assert.deepEqual(staged.drapeEffect.transform, [ 0, 0, 1, 1 ]);
    assert.equal(staged.configuredParts[0].materialStatus,
        "selected-top-drape-material-policy");
    assert.equal(staged.configuredParts[0].compositionStatus,
        "selected-top-drape-material-attached");
});

test("selected top drape accepts one exact baked owner diffuse", async () =>
{
    const fixture = AtlasComposerFixture();
    const staged = SelectedTopDrapeStaged();
    staged.textureContributions[1].selectedTextures = [ {
        path: "res:/top_d.png",
        role: "diffuse-overlay",
        target: "body"
    } ];
    staged.textureContributions[1].materialValues = null;
    const report = await fixture.composer.ComposeSelectedTopDrapeSupport(staged);

    assert.equal(report.status, "applied");
    assert.equal(report.diffuseMode, "baked-direct");
    assert.equal(report.alphaPath, "res:/top_d.png");
    assert.deepEqual(report.passes.map(value => value.mode), [
        "configured-authored-rgba"
    ]);
});

test("selected top drape rejects effects shared by another carrier", () =>
{
    const staged = SelectedTopDrapeStaged();
    staged.backend.visualModel.meshes.push(
        MeshFixture(staged.drapeEffect, { _characterPartIndex: 99 })
    );

    assert.equal(planLegacySelectedTopDrapeSupport(
        staged.sex,
        staged.backend.visualModel,
        staged.configuredParts,
        staged.textureContributions
    ).reason, "selected-top-drape-effect-shared");
});

test("legacy exact upper sleeve uses the selected top from the same owner", () =>
{
    const effect = EffectFixture(true, [ 0.1, 0.2, 0.7, 0.6 ], "res:/shared-body.png");
    const configuredParts = [ {
        partIndex: 17,
        partSourceRecordID: "female/dependants/sleevesupper/creased_01",
        renderStatus: "ready"
    } ];
    const contributions = ExactFemaleUpperSleeveContributions();
    const planned = planLegacyExactFemaleUpperSleeve(
        "3000001",
        "female",
        { meshes: [ MeshFixture(effect, { _characterPartIndex: 17 }) ] },
        configuredParts,
        contributions
    );

    assert.equal(planned.status, "ready");
    assert.equal(planned.ownerSelectionIndex, 13);
    assert.equal(planned.alphaLayerIndex, 16);
    assert.equal(planned.sleevePartIndex, 17);
    assert.deepEqual(planned.previousSampleBounds, [ 0.1, 0.2, 0.7, 0.6 ]);
    assert.deepEqual(planned.effects, [ effect ]);

    assert.equal(planLegacyExactFemaleUpperSleeve(
        "3000002",
        "female",
        { meshes: [ MeshFixture(effect, { _characterPartIndex: 17 }) ] },
        configuredParts,
        contributions
    ).reason, "exact-upper-sleeve-not-applicable");

    contributions[1].ownerSelectionIndex = 14;
    assert.equal(planLegacyExactFemaleUpperSleeve(
        "3000001",
        "female",
        { meshes: [ MeshFixture(effect, { _characterPartIndex: 17 }) ] },
        configuredParts,
        contributions
    ).reason, "exact-upper-sleeve-alpha-unresolved");
});

test("legacy exact upper sleeve rejects authored, lower, and shared effects", () =>
{
    const contributions = ExactFemaleUpperSleeveContributions();
    const upper = [ {
        partIndex: 17,
        partSourceRecordID: "female/dependants/sleevesupper/creased_01",
        renderStatus: "ready"
    } ];
    const authored = EffectFixture(false, [ 0, 0, 1, 1 ], "res:/authored.png");
    assert.equal(planLegacyExactFemaleUpperSleeve(
        "3000001",
        "female",
        { meshes: [ MeshFixture(authored, { _characterPartIndex: 17 }) ] },
        upper,
        contributions
    ).reason, "exact-upper-sleeve-effect-unresolved");

    const proof = EffectFixture(true, [ 0, 0, 1, 1 ], "res:/proof.png");
    assert.equal(planLegacyExactFemaleUpperSleeve(
        "3000001",
        "female",
        { meshes: [ MeshFixture(proof, { _characterPartIndex: 18 }) ] },
        [ {
            partIndex: 18,
            partSourceRecordID: "female/dependants/sleeveslower/longcreased_01",
            renderStatus: "ready"
        } ],
        contributions
    ).reason, "exact-upper-sleeve-part-unresolved");

    assert.equal(planLegacyExactFemaleUpperSleeve(
        "3000001",
        "female",
        { meshes: [
            MeshFixture(proof, { _characterPartIndex: 17 }),
            MeshFixture(proof, { _characterPartIndex: 99 })
        ] },
        upper,
        contributions
    ).reason, "exact-upper-sleeve-effect-shared");
});

test("legacy exact upper sleeve comparison control preserves geometry and binding", async () =>
{
    const fixture = AtlasComposerFixture();
    const staged = ExactFemaleUpperSleeveStaged();
    const originalTexture = staged.upperEffect.parameters.DiffuseMap.textureRes;
    const originalTransform = [ ...staged.upperEffect.transform ];
    const report = await fixture.composer.ComposeExactFemaleUpperSleeve(staged, {
        attach: false
    });

    assert.equal(report.status, "prepared-disabled");
    assert.equal(report.correctness, "comparison-control");
    assert.equal(report.attachedEffects, 0);
    assert.deepEqual(report.passes.map(value => value.mode), [
        "configured-authored-rgba",
        "configured-shared-rgb"
    ]);
    assert.strictEqual(staged.upperEffect.parameters.DiffuseMap.textureRes, originalTexture);
    assert.deepEqual(staged.upperEffect.transform, originalTransform);
    assert.equal(staged.configuredParts[0].materialStatus, "body-diffuse-policy");
    assert.equal(staged.configuredParts[0].compositionStatus, "body-diffuse-attached");
    assert.equal(staged.compositionTargets.length, 1);
    assert.deepEqual(fixture.renderedModes, [
        "res:/graphics/effect.gles2/utility/compositing/copyblit.sm_hi",
        "res:/graphics/effect.gles2/utility/compositing/copyblit.sm_hi"
    ]);
});

test("legacy exact upper sleeve attaches only after both ordered passes", async () =>
{
    const fixture = AtlasComposerFixture();
    const staged = ExactFemaleUpperSleeveStaged();
    const report = await fixture.composer.ComposeExactFemaleUpperSleeve(staged);

    assert.equal(report.status, "applied");
    assert.equal(report.attachedEffects, 1);
    assert.strictEqual(
        staged.upperEffect.parameters.DiffuseMap.textureRes,
        staged.compositionTargets[0].texture
    );
    assert.deepEqual(staged.upperEffect.transform, [ 0, 0, 1, 1 ]);
    assert.equal(staged.configuredParts[0].materialStatus, "upper-sleeve-material-policy");
    assert.equal(staged.configuredParts[0].compositionStatus, "upper-sleeve-material-attached");
});

test("legacy exact upper sleeve destroys an ordinary failed target", async () =>
{
    const fixture = AtlasComposerFixture({ renderSucceeds: false });
    const staged = ExactFemaleUpperSleeveStaged();
    const report = await fixture.composer.ComposeExactFemaleUpperSleeve(staged);

    assert.equal(report.status, "deferred");
    assert.match(report.reason, /did not render/u);
    assert.deepEqual(staged.compositionTargets, []);
    assert.equal(fixture.targets.length, 1);
    assert.equal(fixture.targets[0].destroyed, true);
});

test("legacy exact lower sleeve uses only the same-owner selected top", () =>
{
    const effect = EffectFixture(true, [ 0.1, 0.2, 0.7, 0.6 ], "res:/shared-body.png");
    const configuredParts = [ {
        partIndex: 18,
        partSourceRecordID: "female/dependants/sleeveslower/longcreased_01",
        renderStatus: "ready"
    } ];
    const contributions = ExactFemaleLowerSleeveContributions();
    const planned = planLegacyExactFemaleLowerSleeve(
        "3000001",
        "female",
        { meshes: [ MeshFixture(effect, { _characterPartIndex: 18 }) ] },
        configuredParts,
        contributions
    );

    assert.equal(planned.status, "ready");
    assert.equal(planned.ownerSelectionIndex, 13);
    assert.equal(planned.alphaLayerIndex, 16);
    assert.equal(planned.sleevePartIndex, 18);
    assert.deepEqual(planned.effects, [ effect ]);

    contributions[1].ownerSelectionIndex = 14;
    assert.equal(planLegacyExactFemaleLowerSleeve(
        "3000001",
        "female",
        { meshes: [ MeshFixture(effect, { _characterPartIndex: 18 }) ] },
        configuredParts,
        contributions
    ).reason, "exact-lower-sleeve-alpha-unresolved");
});

test("legacy exact lower sleeve comparison control preserves its fallback binding", async () =>
{
    const fixture = AtlasComposerFixture();
    const staged = ExactFemaleLowerSleeveStaged();
    const originalTexture = staged.lowerEffect.parameters.DiffuseMap.textureRes;
    const originalTransform = [ ...staged.lowerEffect.transform ];
    const report = await fixture.composer.ComposeExactFemaleLowerSleeve(staged, {
        attach: false
    });

    assert.equal(report.status, "prepared-disabled");
    assert.equal(report.attachedEffects, 0);
    assert.deepEqual(report.passes.map(value => value.mode), [
        "configured-authored-rgba",
        "configured-shared-rgb"
    ]);
    assert.strictEqual(staged.lowerEffect.parameters.DiffuseMap.textureRes, originalTexture);
    assert.deepEqual(staged.lowerEffect.transform, originalTransform);
    assert.equal(staged.configuredParts[0].materialStatus, "body-diffuse-policy");
    assert.equal(staged.compositionTargets.length, 1);
});

test("legacy exact lower sleeve attaches its independent target", async () =>
{
    const fixture = AtlasComposerFixture();
    const staged = ExactFemaleLowerSleeveStaged();
    const report = await fixture.composer.ComposeExactFemaleLowerSleeve(staged);

    assert.equal(report.status, "applied");
    assert.equal(report.attachedEffects, 1);
    assert.strictEqual(
        staged.lowerEffect.parameters.DiffuseMap.textureRes,
        staged.compositionTargets[0].texture
    );
    assert.equal(staged.configuredParts[0].materialStatus, "lower-sleeve-material-policy");
    assert.equal(staged.configuredParts[0].compositionStatus, "lower-sleeve-material-attached");
});

test("legacy exact female tuck uses selected-top alpha and only its same-owner mask", () =>
{
    const effect = EffectFixture(true, [ 0.2, 0.1, 0.6, 0.8 ], "res:/shared-body.png");
    const configuredParts = [ {
        partIndex: 14,
        partSourceRecordID: "female/dependants/tuck/basic",
        renderStatus: "ready"
    } ];
    const contributions = [ {
        layerIndex: 13,
        partIndex: 13,
        ownerSelectionIndex: 12,
        groupID: "bottomouter",
        source: {
            partSourceRecordID: "female/bottomouter/pantscf01",
            materialDefinitionPath: "res:/graphics/character/female/paperdoll/bottomouter/pantscf01/generic02.color"
        },
        selectedTextures: [
            {
                path: "res:/graphics/character/female/paperdoll/bottomouter/pantscf01/colorize_body_l_4k.png",
                role: "colorize-layer",
                target: "body"
            },
            {
                path: "res:/graphics/character/female/paperdoll/bottomouter/pantscf01/colorize_body_z_4k.png",
                role: "colorize-zones",
                target: "body"
            }
        ],
        materialValues: {
            colors: [ [ 0.15, 0.17, 0.2 ], [ 0.06, 0.06, 0.07 ], [ 0.12, 0.14, 0.17 ] ],
            pattern: ""
        }
    }, {
        layerIndex: 14,
        partIndex: 14,
        ownerSelectionIndex: 12,
        groupID: "bottomouter",
        source: { partSourceRecordID: "female/dependants/tuck/basic" },
        selectedTextures: []
    }, {
        layerIndex: 15,
        partIndex: 15,
        ownerSelectionIndex: 12,
        groupID: "bottomouter",
        source: { partSourceRecordID: "female/dependants/masktuck/tuckmaskmid" },
        selectedTextures: [ {
            path: "res:/graphics/character/female/paperdoll/dependants/masktuck/tuckmaskmid/comp_body_m.png",
            role: "cut-mask",
            target: "body"
        } ]
    }, {
        layerIndex: 16,
        partIndex: 16,
        ownerSelectionIndex: 13,
        groupID: "topmiddle",
        source: {
            partSourceRecordID: "female/topmiddle/shirtcf01",
            materialDefinitionPath: "res:/graphics/character/female/paperdoll/topmiddle/shirtcf01/generic02.color"
        },
        selectedTextures: [ {
            path: "res:/graphics/character/female/paperdoll/topmiddle/shirtcf01/colorize_body_l_4k.png",
            role: "colorize-layer",
            target: "body"
        }, {
            path: "res:/graphics/character/female/paperdoll/topmiddle/shirtcf01/colorize_body_z_4k.png",
            role: "colorize-zones",
            target: "body"
        } ],
        materialValues: {
            colors: [ [ 0.04, 0.05, 0.05 ], [ 0.08, 0.09, 0.1 ], [ 0.12, 0.13, 0.14 ] ],
            pattern: ""
        }
    } ];
    const planned = planLegacyExactFemaleTuckSupport(
        "female",
        { meshes: [ TuckMeshFixture(effect, { _characterPartIndex: 14 }) ] },
        configuredParts,
        contributions
    );

    assert.equal(planned.status, "ready");
    assert.equal(planned.supportOwnerSelectionIndex, 12);
    assert.equal(planned.alphaLayerIndex, 16);
    assert.equal(planned.maskLayerIndex, 15);
    assert.equal(planned.pantsLayerIndex, 13);
    assert.equal(planned.pantsPartSourceRecordID, "female/bottomouter/pantscf01");
    assert.match(planned.pantsDetailPath, /pantscf01\/colorize_body_l_4k\.png$/u);
    assert.match(planned.pantsZonePath, /pantscf01\/colorize_body_z_4k\.png$/u);
    assert.deepEqual(planned.previousSampleBounds, [ 0.2, 0.1, 0.6, 0.8 ]);
    assert.deepEqual(planned.effects, [ effect ]);

    contributions[2].ownerSelectionIndex = 13;
    assert.equal(
        planLegacyExactFemaleTuckSupport(
            "female",
            { meshes: [ TuckMeshFixture(effect, { _characterPartIndex: 14 }) ] },
            configuredParts,
            contributions
        ).reason,
        "female-tuck-mask-unresolved"
    );

    contributions[2].ownerSelectionIndex = 12;
    contributions[3].groupID = "bottomouter";
    assert.equal(
        planLegacyExactFemaleTuckSupport(
            "female",
            { meshes: [ TuckMeshFixture(effect, { _characterPartIndex: 14 }) ] },
            configuredParts,
            contributions
        ).reason,
        "female-tuck-top-material-unresolved"
    );

    contributions[3].groupID = "topmiddle";
    contributions[3].ownerSelectionIndex = 12;
    assert.equal(
        planLegacyExactFemaleTuckSupport(
            "female",
            { meshes: [ TuckMeshFixture(effect, { _characterPartIndex: 14 }) ] },
            configuredParts,
            contributions
        ).reason,
        "female-tuck-top-material-unresolved"
    );
});

test("legacy female tuck follows the uniquely resolved selected top material", () =>
{
    const effect = EffectFixture(true, [ 0, 0, 1, 1 ], "res:/shared-body.png");
    const configuredParts = [ {
        partIndex: 14,
        partSourceRecordID: "female/dependants/tuck/basic",
        renderStatus: "ready"
    } ];
    const contributions = ExactFemaleTuckContributions();
    const selectedTop = contributions[3];
    selectedTop.source.partSourceRecordID = "female/topmiddle/tanktopf01";
    selectedTop.source.materialDefinitionPath = "res:/topmiddle/tanktopf01/generic01.color";
    selectedTop.selectedTextures[0].path = "res:/topmiddle/tanktopf01/colorize_body_l_4k.png";
    selectedTop.selectedTextures[1].path = "res:/topmiddle/tanktopf01/colorize_body_z_4k.png";

    const planned = planLegacyExactFemaleTuckSupport(
        "female",
        { meshes: [ TuckMeshFixture(effect, { _characterPartIndex: 14 }) ] },
        configuredParts,
        contributions
    );

    assert.equal(planned.status, "ready");
    assert.equal(planned.alphaPartSourceRecordID, "female/topmiddle/tanktopf01");
    assert.equal(planned.alphaPath, "res:/topmiddle/tanktopf01/colorize_body_l_4k.png");
    assert.equal(planned.topZonePath, "res:/topmiddle/tanktopf01/colorize_body_z_4k.png");

    contributions.push({
        ...selectedTop,
        layerIndex: 17,
        partIndex: 17,
        ownerSelectionIndex: 14,
        source: { ...selectedTop.source },
        selectedTextures: selectedTop.selectedTextures.map(texture => ({ ...texture }))
    });
    assert.equal(
        planLegacyExactFemaleTuckSupport(
            "female",
            { meshes: [ TuckMeshFixture(effect, { _characterPartIndex: 14 }) ] },
            configuredParts,
            contributions
        ).reason,
        "female-tuck-top-material-unresolved"
    );
});

test("legacy female tuck qualifies a different bottom owner and retained mask by contract", () =>
{
    const effect = EffectFixture(true, [ 0, 0, 1, 1 ], "res:/shared-body.png");
    const configuredParts = [ {
        partIndex: 14,
        partSourceRecordID: "female/dependants/waist-support/reviewed",
        renderStatus: "ready"
    } ];
    const contributions = ExactFemaleTuckContributions();
    contributions[0].source.partSourceRecordID = "female/bottomouter/reviewed";
    contributions[1].source.partSourceRecordID =
        "female/dependants/waist-support/reviewed";
    contributions[2].source.partSourceRecordID =
        "female/dependants/masktuck/reviewed";
    contributions[2].selectedTextures[0].path =
        "res:/graphics/character/female/paperdoll/dependants/masktuck/reviewed/comp_body_m.png";

    const planned = planLegacyExactFemaleTuckSupport(
        "female",
        { meshes: [ TuckMeshFixture(effect, { _characterPartIndex: 14 }) ] },
        configuredParts,
        contributions
    );

    assert.equal(planned.status, "ready");
    assert.equal(
        planned.tuckPartSourceRecordID,
        "female/dependants/waist-support/reviewed"
    );
    assert.equal(planned.pantsPartSourceRecordID, "female/bottomouter/reviewed");
    assert.equal(
        planned.maskPartSourceRecordID,
        "female/dependants/masktuck/reviewed"
    );
    assert.match(planned.maskPath, /masktuck\/reviewed\/comp_body_m\.png$/u);
});

test("legacy exact female tuck refuses authored and ambiguous fallback effects", () =>
{
    const configuredParts = [ {
        partIndex: 14,
        partSourceRecordID: "female/dependants/tuck/basic",
        renderStatus: "ready"
    } ];
    const contributions = ExactFemaleTuckContributions();
    const authored = EffectFixture(false, [ 0, 0, 1, 1 ], "res:/authored.png");
    const proofA = EffectFixture(true, [ 0, 0, 1, 1 ], "res:/proof-a.png");
    const proofB = EffectFixture(true, [ 0, 0, 1, 1 ], "res:/proof-b.png");

    assert.equal(planLegacyExactFemaleTuckSupport(
        "female",
        { meshes: [ TuckMeshFixture(authored, { _characterPartIndex: 14 }) ] },
        configuredParts,
        contributions
    ).reason, "female-tuck-support-unresolved");
    assert.equal(planLegacyExactFemaleTuckSupport(
        "female",
        { meshes: [
            TuckMeshFixture(proofA, { _characterPartIndex: 14 }),
            TuckMeshFixture(proofB, { _characterPartIndex: 14 })
        ] },
        configuredParts,
        contributions
    ).reason, "female-tuck-support-unresolved");

    const shared = EffectFixture(true, [ 0, 0, 1, 1 ], "res:/shared.png");
    assert.equal(planLegacyExactFemaleTuckSupport(
        "female",
        { meshes: [
            TuckMeshFixture(shared, { _characterPartIndex: 14 }),
            MeshFixture(shared, { _characterPartIndex: 99 })
        ] },
        configuredParts,
        contributions
    ).reason, "female-tuck-effect-shared");
});

test("legacy exact female stomach tuck uses the selected top RGB by default", async () =>
{
    const fixture = AtlasComposerFixture();
    const staged = ExactFemaleTuckStaged();
    const report = await fixture.composer.ComposeExactFemaleTuckSupport(staged);

    assert.equal(report.status, "applied");
    assert.equal(report.rgbSource, "selected-top-colorized");
    assert.equal(report.coordinatedDrape.status, "not-present");
    assert.equal(report.renderStateRule, "authored-decal-area-state-v1");
    assert.equal(report.pantsPartSourceRecordID, "female/bottomouter/pantscf01");
    assert.deepEqual(report.passes.map(value => value.mode), [
        "configured-authored-rgba",
        "configured-cut-alpha",
        "colorized-rgb"
    ]);
    assert.strictEqual(
        staged.tuckEffect.parameters.DiffuseMap.textureRes,
        staged.compositionTargets[0].texture
    );
    assert.equal(report.depthTest, "enabled-comparison");
    assert.deepEqual(staged.tuckEffect.materialDiffuseColor, [ 1, 1, 1, 1 ]);
    assert.deepEqual(staged.tuckEffect.stateOverrides, []);
});

test("legacy female tuck suppresses only its selected top owner's standard drape", async () =>
{
    const fixture = AtlasComposerFixture();
    const staged = ExactFemaleTuckStaged();
    const drapeEffect = EffectFixture(true, [ 0, 0, 1, 1 ], "res:/shared-body.png");
    drapeEffect._characterAuthoredBodyAtlasConsumer = true;
    const drapeMesh = MeshFixture(drapeEffect, { _characterPartIndex: 19 });
    const otherDrapeEffect = EffectFixture(true, [ 0, 0, 1, 1 ], "res:/shared-body.png");
    otherDrapeEffect._characterAuthoredBodyAtlasConsumer = true;
    const otherDrapeMesh = MeshFixture(otherDrapeEffect, { _characterPartIndex: 20 });
    drapeMesh.display = true;
    otherDrapeMesh.display = true;
    staged.backend.visualModel.meshes.push(drapeMesh, otherDrapeMesh);
    staged.configuredParts.push({
        partIndex: 19,
        partSourceRecordID: "female/dependants/drape/standard",
        renderStatus: "ready",
        displayStatus: "visible"
    }, {
        partIndex: 20,
        partSourceRecordID: "female/dependants/drape/standard",
        renderStatus: "ready",
        displayStatus: "visible"
    });
    staged.textureContributions.push({
        layerIndex: 19,
        partIndex: 19,
        ownerSelectionIndex: 13,
        groupID: "topmiddle",
        source: {
            partSourceRecordID: "female/dependants/drape/standard",
            partPath: "dependants/drape/standard"
        },
        selectedTextures: []
    }, {
        layerIndex: 20,
        partIndex: 20,
        ownerSelectionIndex: 99,
        groupID: "topmiddle",
        source: {
            partSourceRecordID: "female/dependants/drape/standard",
            partPath: "dependants/drape/standard"
        },
        selectedTextures: []
    });

    const report = await fixture.composer.ComposeExactFemaleTuckSupport(staged);

    assert.equal(report.status, "applied");
    assert.equal(report.coordinatedDrape.status, "suppressed");
    assert.deepEqual(report.coordinatedDrape.partIndices, [ 19 ]);
    assert.equal(drapeMesh.display, false);
    assert.equal(otherDrapeMesh.display, true);
    assert.equal(staged.configuredParts[1].displayStatus, "hidden-by-ready-bottom-tuck");
    assert.equal(staged.configuredParts[2].displayStatus, "visible");
});

test("legacy exact female stomach tuck stays hidden without a selected material owner", async () =>
{
    const fixture = AtlasComposerFixture();
    const staged = ExactFemaleTuckStaged();
    const tuckMesh = staged.backend.visualModel.meshes[0];
    staged.textureContributions = staged.textureContributions.filter(value =>
        value.groupID !== "topmiddle");

    const report = await fixture.composer.ComposeExactFemaleTuckSupport(staged);

    assert.equal(report.status, "deferred");
    assert.equal(report.reason, "female-tuck-top-material-unresolved");
    assert.equal(report.tuckPartIndex, 14);
    assert.equal(tuckMesh.display, false);
    assert.equal(
        staged.configuredParts[0].displayStatus,
        "hidden-without-material-owner"
    );
    assert.deepEqual(staged.compositionTargets, []);
});

test("legacy exact female stomach tuck retains the rejected depth-disabled comparison", async () =>
{
    const fixture = AtlasComposerFixture();
    const staged = ExactFemaleTuckStaged();
    const report = await fixture.composer.ComposeExactFemaleTuckSupport(staged, {
        depthTest: false
    });

    assert.equal(report.depthTest, "disabled-exact-decal-coverage-workaround");
    assert.deepEqual(staged.tuckEffect.stateOverrides, [
        [ "Main", 0, 7, 0 ],
        [ "Main", 0, 14, 0 ]
    ]);
});

test("legacy exact female stomach tuck can reproduce the committed shared-body RGB path", async () =>
{
    const fixture = AtlasComposerFixture();
    const staged = ExactFemaleTuckStaged();
    const report = await fixture.composer.ComposeExactFemaleTuckSupport(staged, {
        useSharedBodyRgb: true
    });

    assert.equal(report.status, "applied");
    assert.equal(report.rgbSource, "completed-body-diffuse");
    assert.equal(report.depthTest, "enabled-comparison");
    assert.deepEqual(report.passes.map(value => value.mode), [
        "configured-authored-rgba",
        "configured-cut-alpha",
        "configured-shared-rgb"
    ]);
    assert.deepEqual(staged.tuckEffect.stateOverrides, []);
});

test("legacy exact female stomach tuck pants-RGB experiment changes only its final RGB pass", async () =>
{
    const fixture = AtlasComposerFixture();
    const staged = ExactFemaleTuckStaged();
    const report = await fixture.composer.ComposeExactFemaleTuckSupport(staged, {
        usePantsRgb: true
    });

    assert.equal(report.status, "applied");
    assert.equal(report.rgbSource, "same-owner-pants-colorized");
    assert.deepEqual(report.passes.map(value => value.mode), [
        "configured-authored-rgba",
        "configured-cut-alpha",
        "colorized-rgb"
    ]);
    assert.equal(report.passes[2].rgbOperation, "replace");
});

test("legacy exact female stomach tuck mask comparison retains the mask without applying it", async () =>
{
    const fixture = AtlasComposerFixture();
    const staged = ExactFemaleTuckStaged();
    const report = await fixture.composer.ComposeExactFemaleTuckSupport(staged, {
        applyCutMask: false
    });

    assert.equal(report.status, "applied");
    assert.equal(report.maskApplication, "retained-not-applied-comparison");
    assert.match(report.maskPath, /masktuck\/tuckmaskmid\/comp_body_m\.png$/u);
    assert.deepEqual(report.passes.map(value => value.mode), [
        "configured-authored-rgba",
        "colorized-rgb"
    ]);
});

test("legacy exact female stomach tuck can compare RGB without the body detail mask", async () =>
{
    const fixture = AtlasComposerFixture();
    const staged = ExactFemaleTuckStaged();
    const report = await fixture.composer.ComposeExactFemaleTuckSupport(staged, {
        useDetailMask: false
    });

    assert.equal(report.status, "applied");
    assert.equal(report.detailMask, "disabled-comparison");
    assert.equal(report.passes.at(-1).detailMask, "disabled");
});

test("legacy exact female stomach tuck can compare an authored material RGB base", async () =>
{
    const fixture = AtlasComposerFixture();
    const staged = ExactFemaleTuckStaged();
    const report = await fixture.composer.ComposeExactFemaleTuckSupport(staged, {
        fillMaterialBase: true
    });

    assert.equal(report.status, "applied");
    assert.equal(report.baseRgbPolicy, "selected-top-material-color1-comparison");
    assert.deepEqual(report.passes.map(value => value.mode), [
        "configured-authored-rgba",
        "configured-material-base-rgb-comparison",
        "configured-cut-alpha",
        "colorized-rgb"
    ]);
});

test("legacy exact female stomach tuck can layer detail over its authored material RGB base", async () =>
{
    const fixture = AtlasComposerFixture();
    const staged = ExactFemaleTuckStaged();
    const report = await fixture.composer.ComposeExactFemaleTuckSupport(staged, {
        blendDetail: true,
        fillMaterialBase: true
    });

    assert.equal(report.status, "applied");
    assert.equal(report.detailRgbOperation, "source-alpha-blend");
    assert.equal(report.passes.at(-1).rgbOperation, "source-alpha-blend");
});

test("legacy exact female stomach tuck can isolate selected-top alpha", async () =>
{
    const fixture = AtlasComposerFixture();
    const staged = ExactFemaleTuckStaged();
    const report = await fixture.composer.ComposeExactFemaleTuckSupport(staged, {
        alphaMode: "opaque"
    });

    assert.equal(report.status, "applied");
    assert.equal(report.alphaPolicy, "opaque-comparison");
    assert.deepEqual(report.alphaEvidence, {
        status: "unavailable",
        reason: "render-target-readback-unavailable"
    });
    assert.deepEqual(report.passes.map(value => value.mode), [
        "configured-authored-rgba",
        "configured-cut-alpha",
        "colorized-rgb",
        "configured-opaque-alpha-comparison"
    ]);
});

test("legacy exact female stomach tuck can isolate inverse decal alpha", async () =>
{
    const fixture = AtlasComposerFixture();
    const staged = ExactFemaleTuckStaged();
    const report = await fixture.composer.ComposeExactFemaleTuckSupport(staged, {
        alphaMode: "transparent"
    });

    assert.equal(report.status, "applied");
    assert.equal(report.alphaPolicy, "transparent-comparison");
    assert.equal(report.passes.at(-1).mode, "configured-transparent-alpha-comparison");
});

test("legacy exact female stomach tuck can compare its authored transform", async () =>
{
    const fixture = AtlasComposerFixture();
    const staged = ExactFemaleTuckStaged();
    staged.tuckEffect._characterAuthoredTransformUV0 = [ 0, 0, 0.5, 1 ];
    const report = await fixture.composer.ComposeExactFemaleTuckSupport(staged, {
        useAuthoredTransform: true
    });

    assert.equal(report.status, "applied");
    assert.deepEqual(report.authoredSampleBounds, [ 0, 0, 0.5, 1 ]);
    assert.deepEqual(report.sampleBounds, [ 0, 0, 0.5, 1 ]);
    assert.deepEqual(staged.tuckEffect.transform, [ 0, 0, 0.5, 1 ]);
});

test("legacy female foundation cut selects only the exact ready boot-owned mask", () =>
{
    const configuredParts = [ {
        partIndex: 9,
        partSourceRecordID: "female/feet/bootscf01",
        renderStatus: "ready"
    } ];
    const contributions = [ {
        layerIndex: 9,
        partIndex: 9,
        ownerSelectionIndex: 7,
        source: {
            partSourceRecordID: "female/feet/bootscf01"
        },
        selectedTextures: []
    }, {
        layerIndex: 10,
        ownerSelectionIndex: 7,
        source: {
            partSourceRecordID: "female/dependants/bootmasks/bootmaskshin"
        },
        selectedTextures: [ {
            path: "res:/graphics/character/female/paperdoll/dependants/bootmasks/bootmaskshin/comp_body_m.png",
            role: "cut-mask",
            target: "body"
        } ]
    } ];

    assert.deepEqual(
        planLegacyFemaleFoundationCutMask("female", configuredParts, contributions),
        {
            status: "ready",
            masks: [ {
                owner: "female-bootscf01",
                ownerPartIndex: 9,
                ownerPartSourceRecordID: "female/feet/bootscf01",
                ownerSelectionIndex: 7,
                maskLayerIndex: 10,
                maskPartSourceRecordID: "female/dependants/bootmasks/bootmaskshin",
                maskPath: "res:/graphics/character/female/paperdoll/dependants/bootmasks/bootmaskshin/comp_body_m.png"
            } ]
        }
    );
    assert.equal(
        planLegacyFemaleFoundationCutMask("male", configuredParts, contributions).status,
        "deferred"
    );
    configuredParts[0].renderStatus = "deferred";
    assert.equal(
        planLegacyFemaleFoundationCutMask("female", configuredParts, contributions).reason,
        "exact-female-boot-not-render-ready"
    );
});

test("legacy female foundation cut does not reinterpret garment color alpha as leg coverage", () =>
{
    const configuredParts = [ {
        groupID: "bottomouter",
        partIndex: 15,
        partSourceRecordID: "female/bottomouter/trousersfixture",
        renderStatus: "ready"
    } ];
    const contributions = [ {
        layerIndex: 15,
        partIndex: 15,
        ownerSelectionIndex: 13,
        source: {
            partSourceRecordID: "female/bottomouter/trousersfixture",
            occludesModifiers: [ "tattoo/leftleg", "tattoo/rightleg" ]
        },
        selectedTextures: [ {
            path: "res:/graphics/character/female/paperdoll/bottomouter/trousersfixture/colorize_body_l_4k.png",
            role: "colorize-layer",
            target: "body"
        } ]
    } ];

    const planned = planLegacyFemaleFoundationCutMask(
        "female",
        configuredParts,
        contributions
    );
    assert.equal(planned.status, "deferred");
    assert.equal(planned.reason, "exact-female-foundation-mask-unresolved");

    contributions[0].source.occludesModifiers = [
        "dependants/boottucking",
        "dependants/pantstuck/medium"
    ];
    assert.equal(
        planLegacyFemaleFoundationCutMask("female", configuredParts, contributions).status,
        "deferred"
    );
});

test("legacy female foundation cut uses white-visible black-cut polarity and body effects only", () =>
{
    assert.equal(composeLegacyFoundationCutMaskPixel(0), 1);
    assert.equal(composeLegacyFoundationCutMaskPixel(0.25), 0.75);
    assert.equal(composeLegacyFoundationCutMaskPixel(1), 0);

    const attached = [];
    const foundation = {
        effectFilePath: "res:/avatar.sm_hi",
        parameters: {
            CutMaskMap: {
                resourcePath: "res:/white.dds",
                AttachTextureRes(value)
                {
                    this.textureRes = value;
                    this.isAttached = value !== null;
                    attached.push(value);
                }
            }
        }
    };
    const configured = {
        parameters: {
            CutMaskMap: { AttachTextureRes() { throw new Error("must not attach"); } }
        }
    };
    const texture = { name: "cut-target" };
    const bindings = commitLegacyFoundationCutMaskBindings({
        meshes: [
            { _characterFoundationRole: "body", opaqueAreas: [ { effect: foundation } ] },
            { _characterPartIndex: 9, opaqueAreas: [ { effect: configured } ] }
        ]
    }, texture);

    assert.deepEqual(attached, [ texture ]);
    assert.equal(bindings.length, 1);
    assert.equal(bindings[0].role, "body");
});

test("legacy female foundation cut falls back to diffuse alpha on body effects without a cut sampler", () =>
{
    const original = { name: "body-diffuse" };
    const replacement = { name: "body-diffuse-with-cut-alpha" };
    const foundation = AtomicEffectFixture({
        texture: original,
        transform: [ 0, 0, 1, 1 ]
    });
    const configured = AtomicEffectFixture({
        texture: { name: "configured-diffuse" },
        transform: [ 0, 0, 1, 1 ]
    });

    const bindings = commitLegacyFoundationAlphaCutBindings({
        meshes: [
            { _characterFoundationRole: "body", opaqueAreas: [ { effect: foundation } ] },
            { _characterPartIndex: 9, opaqueAreas: [ { effect: configured } ] }
        ]
    }, replacement);

    assert.equal(foundation.parameters.DiffuseMap.textureRes, replacement);
    assert.notEqual(configured.parameters.DiffuseMap.textureRes, replacement);
    assert.equal(bindings.length, 1);
    assert.equal(bindings[0].role, "body");
    assert.equal(bindings[0].coveragePolicy, "composed-diffuse-alpha-test");
    assert.deepEqual(foundation.stateOverrides.slice(-4), [
        [ "Main", 0, 15, 1 ],
        [ "Main", 0, 24, 0 ],
        [ "Main", 0, 25, 5 ],
        [ "Main", 0, 27, 0 ]
    ]);
});

test("legacy configured consumers preserve private alpha and share exact target signatures", () =>
{
    const authored = EffectFixture(false, [ 0.25, 0, 0.75, 1 ], "res:/private-shirt.png");
    const secondArea = EffectFixture(false, [ 0.25, 0, 0.75, 1 ], "res:/private-shirt.png");
    const proof = EffectFixture(true, null, "res:/proof.png");
    authored.effectFilePath = BodyConsumerShader();
    secondArea.effectFilePath = BodyConsumerShader();
    const planned = planLegacyConfiguredBodyConsumers({
        meshes: [
            MeshFixture(authored, { _characterPartIndex: 4, _characterGroupID: "topmiddle" }),
            MeshFixture(secondArea, { _characterPartIndex: 4, _characterGroupID: "topmiddle" }),
            MeshFixture(proof, { _characterPartIndex: 4, _characterGroupID: "topmiddle" })
        ]
    }, [ {
        partIndex: 4,
        ownerSelectionIndex: 2,
        groupID: "topmiddle",
        selectedTextures: []
    }, {
        partIndex: 8,
        ownerSelectionIndex: 2,
        groupID: "bottomouter",
        selectedTextures: [ {
            path: "res:/tuck-mask.png",
            target: "body",
            role: "cut-mask"
        } ]
    } ], { resolveCutMaskPaths: UseAllRetainedCutMasks });

    assert.equal(planned.groups.length, 1);
    assert.equal(planned.groups[0].authoredDiffusePath, "res:/private-shirt.png");
    assert.deepEqual(planned.groups[0].cutMaskPaths, [ "res:/tuck-mask.png" ]);
    assert.equal(planned.groups[0].consumers.length, 2);
    assert.deepEqual(planned.groups[0].consumers.map(value => value.previousSampleBounds), [
        [ 0.25, 0, 0.75, 1 ],
        [ 0.25, 0, 0.75, 1 ]
    ]);
    assert.deepEqual(planned.deferred, []);
});

test("legacy configured support consumers inherit alpha from their exact owner selection", () =>
{
    const support = EffectFixture(true, [ 0, 0, 0.5, 1 ], "res:/proof.png");
    support.effectFilePath = BodyConsumerShader();
    support._characterAuthoredBodyAtlasConsumer = true;
    support._characterAuthoredTexturePaths = {};
    const owner = {
        partIndex: 15,
        layerIndex: 15,
        ownerSelectionIndex: 13,
        groupID: "topmiddle",
        source: { partSourceRecordID: "female/topmiddle/example" },
        materialValues: {
            colors: [ [ 0.2, 0.2, 0.2, 1 ], [ 0.4, 0.4, 0.4, 1 ], [ 1, 1, 1, 1 ] ]
        },
        selectedTextures: [
            { path: "res:/top-alpha.png", target: "body", role: "colorize-layer" },
            { path: "res:/top-zones.png", target: "body", role: "colorize-zones" }
        ]
    };
    const dependency = {
        partIndex: 16,
        layerIndex: 16,
        ownerSelectionIndex: 13,
        groupID: "topmiddle",
        source: { partSourceRecordID: "female/dependants/example" },
        selectedTextures: []
    };
    const planned = planLegacyConfiguredBodyConsumers({
        meshes: [ MeshFixture(support, {
            _characterPartIndex: 16,
            _characterGroupID: "topmiddle"
        }) ]
    }, [ owner, dependency ]);

    assert.equal(planned.groups.length, 1);
    assert.equal(planned.groups[0].authoredDiffusePath, "res:/top-alpha.png");
    assert.deepEqual(planned.groups[0].alphaSource, {
        type: "owner-selection-diffuse-alpha",
        ownerSelectionIndex: 13,
        layerIndex: 15,
        partIndex: 15,
        partSourceRecordID: "female/topmiddle/example"
    });
    assert.deepEqual(planned.groups[0].consumers[0].alphaSource, planned.groups[0].alphaSource);
    assert.deepEqual(planned.deferred, []);
});

test("legacy configured body consumers retain their own unique alpha source", () =>
{
    const body = EffectFixture(true, [ 0, 0, 0.5, 1 ], "res:/proof.png");
    body.effectFilePath = BodyConsumerShader();
    body._characterAuthoredBodyAtlasConsumer = true;
    body._characterAuthoredTexturePaths = {};
    const contribution = {
        partIndex: 15,
        layerIndex: 15,
        ownerSelectionIndex: 13,
        groupID: "bottomouter",
        source: { partSourceRecordID: "female/bottomouter/example" },
        materialValues: {
            colors: [ [ 0.2, 0.2, 0.2, 1 ], [ 0.4, 0.4, 0.4, 1 ], [ 1, 1, 1, 1 ] ]
        },
        selectedTextures: [
            { path: "res:/bottom-alpha.png", target: "body", role: "colorize-layer" },
            { path: "res:/bottom-zones.png", target: "body", role: "colorize-zones" }
        ]
    };
    const planned = planLegacyConfiguredBodyConsumers({
        meshes: [ MeshFixture(body, {
            _characterPartIndex: 15,
            _characterGroupID: "bottomouter"
        }) ]
    }, [ contribution ]);

    assert.equal(planned.groups.length, 1);
    assert.equal(planned.groups[0].authoredDiffusePath, "res:/bottom-alpha.png");
    assert.deepEqual(planned.groups[0].alphaSource, {
        type: "owner-selection-diffuse-alpha",
        ownerSelectionIndex: 13,
        layerIndex: 15,
        partIndex: 15,
        partSourceRecordID: "female/bottomouter/example"
    });
    assert.deepEqual(planned.deferred, []);

});

test("configured foundation replacements bypass garment owner alpha", () =>
{
    const replacement = EffectFixture(true, [ 0, 0, 0.5, 1 ], "res:/proof.png");
    replacement.effectFilePath = BodyConsumerShader();
    replacement._characterAuthoredBodyAtlasConsumer = true;
    replacement._characterFoundationReplacementRole = "feet";
    replacement._characterAuthoredTexturePaths = {};
    const contribution = {
        partIndex: 15,
        layerIndex: 15,
        ownerSelectionIndex: 13,
        groupID: "feet",
        source: { partSourceRecordID: "female/feet/posed-footwear" },
        selectedTextures: [ {
            path: "res:/footwear-layer.png",
            target: "body",
            role: "colorize-layer"
        } ]
    };

    const planned = planLegacyConfiguredBodyConsumers({
        meshes: [ MeshFixture(replacement, {
            _characterPartIndex: 15,
            _characterGroupID: "feet"
        }) ]
    }, [ contribution ]);

    assert.deepEqual(planned.groups, []);
    assert.deepEqual(planned.deferred, []);
});

test("configured foundation replacements receive shared body lighting", () =>
{
    const foundation = AtomicEffectFixture({
        texture: { name: "foundation-diffuse" },
        transform: [ 0, 0, 1, 1 ]
    });
    const replacement = AtomicEffectFixture({
        texture: { name: "replacement-diffuse" },
        transform: [ 0, 0, 0.5, 1 ]
    });
    const ordinaryConfigured = AtomicEffectFixture({
        texture: { name: "garment-diffuse" },
        transform: [ 0, 0, 1, 1 ]
    });
    replacement._characterFoundationReplacementRole = "feet";
    const bodyNormal = { name: "composed-body-normal" };
    const bodySpecular = { name: "composed-body-specular" };
    const visualModel = { meshes: [
        { _characterFoundationRole: "body", opaqueAreas: [ { effect: foundation } ] },
        { _characterPartIndex: 4, opaqueAreas: [ { effect: replacement } ] },
        { _characterPartIndex: 5, opaqueAreas: [ { effect: ordinaryConfigured } ] }
    ] };

    assert.equal(attachLegacyBodyNormal(visualModel, bodyNormal), 2);
    assert.equal(attachLegacyBodySpecular(visualModel, bodySpecular), 2);
    assert.equal(foundation.parameters.NormalMap.textureRes, bodyNormal);
    assert.equal(replacement.parameters.NormalMap.textureRes, bodyNormal);
    assert.notEqual(ordinaryConfigured.parameters.NormalMap.textureRes, bodyNormal);
    assert.equal(foundation.parameters.SpecularMap.textureRes, bodySpecular);
    assert.equal(replacement.parameters.SpecularMap.textureRes, bodySpecular);
    assert.notEqual(ordinaryConfigured.parameters.SpecularMap.textureRes, bodySpecular);
});

test("legacy configured body consumers exclude a qualified garment hybrid", () =>
{
    const effect = AtomicEffectFixture({
        texture: { path: "#hybrid-proof" },
        transform: [ 0, 0, 1, 1 ]
    });
    effect._characterAuthoredBodyAtlasConsumer = true;
    effect._characterGarmentBodyFallback = true;
    const mesh = MeshFixture(effect);
    mesh._characterPartIndex = 31;
    mesh._characterGroupID = "bottomouter";
    const contribution = {
        layerIndex: 31,
        partIndex: 31,
        ownerSelectionIndex: 31,
        groupID: "bottomouter",
        source: { partSourceRecordID: "female/bottomouter/single-hybrid" },
        selectedTextures: [ {
            path: "res:/single-hybrid/colorize_body_l.png",
            role: "colorize-layer",
            target: "body"
        } ]
    };

    const planned = planLegacyConfiguredBodyConsumers(
        { meshes: [ mesh ] },
        [ contribution ]
    );

    assert.deepEqual(planned.groups, []);
    assert.deepEqual(planned.deferred, []);
});

test("legacy configured support consumers defer ambiguous owner alpha", () =>
{
    const support = EffectFixture(true, [ 0, 0, 0.5, 1 ], "res:/proof.png");
    support.effectFilePath = BodyConsumerShader();
    support._characterAuthoredBodyAtlasConsumer = true;
    support._characterAuthoredTexturePaths = {};
    const Owner = (partIndex, path) => ({
        partIndex,
        layerIndex: partIndex,
        ownerSelectionIndex: 13,
        groupID: "topmiddle",
        source: { partSourceRecordID: `female/topmiddle/example-${partIndex}` },
        materialValues: {
            colors: [ [ 0.2, 0.2, 0.2, 1 ], [ 0.4, 0.4, 0.4, 1 ], [ 1, 1, 1, 1 ] ]
        },
        selectedTextures: [
            { path, target: "body", role: "colorize-layer" },
            { path: `${path}-zones`, target: "body", role: "colorize-zones" }
        ]
    });
    const dependency = {
        partIndex: 16,
        layerIndex: 16,
        ownerSelectionIndex: 13,
        groupID: "topmiddle",
        selectedTextures: []
    };
    const planned = planLegacyConfiguredBodyConsumers({
        meshes: [ MeshFixture(support, {
            _characterPartIndex: 16,
            _characterGroupID: "topmiddle"
        }) ]
    }, [ Owner(14, "res:/top-a.png"), Owner(15, "res:/top-b.png"), dependency ]);

    assert.deepEqual(planned.groups, []);
    assert.deepEqual(planned.deferred, [ {
        partIndex: 16,
        groupID: "topmiddle",
        ownerSelectionIndex: 13,
        ownerAlphaPaths: [ "res:/top-a.png", "res:/top-b.png" ],
        reason: "configured-consumer-owner-alpha-ambiguous"
    } ]);
});

test("legacy configured consumers retain malformed contribution identities as deferred", () =>
{
    const planned = planLegacyConfiguredBodyConsumers({ meshes: [] }, [ {
        partIndex: null,
        groupID: "topmiddle",
        selectedTextures: []
    } ]);

    assert.deepEqual(planned, {
        groups: [],
        deferred: [ {
            partIndex: null,
            groupID: "topmiddle",
            reason: "configured-consumer-part-index-invalid"
        } ]
    });
});

test("legacy configured consumers do not infer a cut target from dependency ownership", () =>
{
    const authored = EffectFixture(false, [ 0, 0, 1, 1 ], "res:/private-shirt.png");
    authored.effectFilePath = BodyConsumerShader();
    const planned = planLegacyConfiguredBodyConsumers({
        meshes: [ MeshFixture(authored, { _characterPartIndex: 4, _characterGroupID: "topmiddle" }) ]
    }, [ {
        partIndex: 4,
        ownerSelectionIndex: 2,
        groupID: "topmiddle",
        selectedTextures: []
    }, {
        partIndex: 8,
        ownerSelectionIndex: 2,
        groupID: "bottomouter",
        selectedTextures: [ {
            path: "res:/owned-mask.png",
            target: "body",
            role: "cut-mask"
        } ]
    } ]);

    assert.equal(planned.groups.length, 1);
    assert.deepEqual(planned.groups[0].cutMaskPaths, []);
    assert.deepEqual(planned.deferred, [ {
        partIndex: 4,
        groupID: "topmiddle",
        ownerSelectionIndex: 2,
        cutMaskPaths: [ "res:/owned-mask.png" ],
        reason: "configured-consumer-cut-target-unresolved"
    } ]);
});

test("legacy configured consumer qualification excludes ordinary private garment effects", () =>
{
    const cloth = EffectFixture(false, [ 0, 0, 1, 1 ], "res:/private-shirt.png");
    cloth.effectFilePath = "res:/graphics/effect.gles2/managed/interior/avatar/clothavatar.sm_hi";
    const planned = planLegacyConfiguredBodyConsumers({
        meshes: [ MeshFixture(cloth, { _characterPartIndex: 4, _characterGroupID: "topmiddle" }) ]
    }, [ {
        partIndex: 4,
        ownerSelectionIndex: 2,
        groupID: "topmiddle",
        selectedTextures: []
    } ]);

    assert.deepEqual(planned, { groups: [], deferred: [] });
});

test("legacy configured consumer qualification retains both reviewed shader contracts", () =>
{
    const doubleLinear = EffectFixture(false);
    doubleLinear.effectFilePath = BodyConsumerShader();
    assert.equal(isLegacyConfiguredBodyConsumerEffect(doubleLinear), true);

    const incompleteLinear = EffectFixture(false);
    incompleteLinear.effectFilePath = BodyConsumerShader("skinnedavatarbrdflinear");
    assert.equal(isLegacyConfiguredBodyConsumerEffect(incompleteLinear), false);

    for (const name of [
        "TransformUV0", "WrinkleParams", "Material2LibraryID", "ColorCorrectionSource"
    ]) incompleteLinear.parameters[name] ??= {};
    assert.equal(isLegacyConfiguredBodyConsumerEffect(incompleteLinear), true);
});

test("legacy configured consumers retain every owner when one effect shares one signature", () =>
{
    const shared = EffectFixture(false, [ 0, 0, 1, 1 ], "res:/shared-private.png");
    shared.effectFilePath = BodyConsumerShader();
    const planned = planLegacyConfiguredBodyConsumers({
        meshes: [
            MeshFixture(shared, { _characterPartIndex: 4, _characterGroupID: "topmiddle" }),
            MeshFixture(shared, { _characterPartIndex: 5, _characterGroupID: "topouter" })
        ]
    }, [
        { partIndex: 4, ownerSelectionIndex: 1, groupID: "topmiddle", selectedTextures: [] },
        { partIndex: 5, ownerSelectionIndex: 1, groupID: "topouter", selectedTextures: [] }
    ], { resolveCutMaskPaths: UseAllRetainedCutMasks });

    assert.equal(planned.groups.length, 1);
    assert.deepEqual(planned.groups[0].consumers.map(value => value.partIndex), [ 4, 5 ]);
    assert.deepEqual(planned.deferred, []);
});

test("legacy configured consumers defer a shared effect with divergent signatures", () =>
{
    const shared = EffectFixture(false, [ 0, 0, 1, 1 ], "res:/shared-private.png");
    shared.effectFilePath = BodyConsumerShader();
    const planned = planLegacyConfiguredBodyConsumers({
        meshes: [
            MeshFixture(shared, { _characterPartIndex: 4, _characterGroupID: "topmiddle" }),
            MeshFixture(shared, { _characterPartIndex: 5, _characterGroupID: "topouter" })
        ]
    }, [
        { partIndex: 4, ownerSelectionIndex: 1, groupID: "topmiddle", selectedTextures: [] },
        {
            partIndex: 5,
            ownerSelectionIndex: 2,
            groupID: "topouter",
            selectedTextures: [ {
                path: "res:/outer-mask.png",
                target: "body",
                role: "cut-mask"
            } ]
        }
    ], { resolveCutMaskPaths: UseAllRetainedCutMasks });

    assert.deepEqual(planned.groups, []);
    assert.deepEqual(planned.deferred, [ {
        partIndices: [ 4, 5 ],
        groupIDs: [ "topmiddle", "topouter" ],
        effectFilePath: BodyConsumerShader(),
        authoredDiffusePath: "res:/shared-private.png",
        reason: "configured-consumer-shared-effect-ambiguous"
    } ]);
});

test("legacy configured consumer pass states preserve authored alpha and replace only RGB", () =>
{
    assert.deepEqual(getLegacyConfiguredConsumerPassContract(), {
        authored: { blend: false, colorWrite: 0xf },
        cut: {
            blend: true,
            colorWrite: 0x8,
            sourceBlend: 1,
            destinationBlend: 6,
            sourceBlendAlpha: 1,
            destinationBlendAlpha: 6
        },
        shared: { blend: false, colorWrite: 0x7 }
    });
});

test("legacy configured consumer attachment rolls every effect back on partial failure", () =>
{
    const replacement = { path: "#configured-consumer" };
    const first = AtomicEffectFixture({
        texture: { path: "#shared-body" },
        transform: [ 0.1, 0.2, 0.3, 0.4 ],
        materialDiffuseColor: [ 0.1, 0.2, 0.3, 1 ]
    });
    const second = AtomicEffectFixture({
        texture: { path: "#shared-body-2" },
        transform: [ 0.2, 0.1, 0.4, 0.3 ],
        rejectTexture: replacement,
        materialDiffuseColor: [ 0.4, 0.5, 0.6, 1 ]
    });
    const firstTexture = first.parameters.DiffuseMap.textureRes;
    const secondTexture = second.parameters.DiffuseMap.textureRes;

    let failure = null;
    try
    {
        commitLegacyConfiguredConsumerBindings(
            [ first, second ],
            replacement,
            { neutralizeDiffuseColor: true }
        );
    }
    catch (error)
    {
        failure = error;
    }

    assert.match(failure?.message ?? "", /fixture texture rejection/u);
    assert.deepEqual(failure.rollbackFailures, []);
    assert.strictEqual(first.parameters.DiffuseMap.textureRes, firstTexture);
    assert.strictEqual(second.parameters.DiffuseMap.textureRes, secondTexture);
    assert.deepEqual(first.transform, [ 0.1, 0.2, 0.3, 0.4 ]);
    assert.deepEqual(second.transform, [ 0.2, 0.1, 0.4, 0.3 ]);
    assert.deepEqual(first.materialDiffuseColor, [ 0.1, 0.2, 0.3, 1 ]);
    assert.deepEqual(second.materialDiffuseColor, [ 0.4, 0.5, 0.6, 1 ]);
});

test("legacy configured consumer accepts a shader with no diffuse tint control", () =>
{
    const replacement = { path: "#configured-consumer" };
    const effect = AtomicEffectFixture({
        texture: { path: "#authored-consumer" },
        transform: [ 0, 0, 0.5, 1 ]
    });
    delete effect.parameters.MaterialDiffuseColor;
    effect.SetParameters = values =>
    {
        if (values.TransformUV0)
        {
            effect.transform = [ ...values.TransformUV0 ];
            return true;
        }
        return false;
    };

    const attached = commitLegacyConfiguredConsumerBindings(
        [ effect ],
        replacement,
        { neutralizeDiffuseColor: true }
    );

    assert.equal(attached, 1);
    assert.strictEqual(effect.parameters.DiffuseMap.textureRes, replacement);
    assert.deepEqual(effect.transform, [ 0, 0, 1, 1 ]);
});

test("legacy configured consumer pixel contract cuts alpha before replacing RGB", () =>
{
    const result = composeLegacyConfiguredConsumerPixel(
        [ 0.9, 0.8, 0.7, 0.8 ],
        [ 0.25, 0.5 ],
        [ 0.1, 0.2, 0.3, 0.1 ]
    );

    assert.deepEqual(result.slice(0, 3), [ 0.1, 0.2, 0.3 ]);
    assert.ok(Math.abs(result[3] - 0.3) < 1e-12);

});

test("legacy configured consumer accumulates source-over framebuffer coverage", () =>
{
    const replacement = { path: "#configured-consumer" };
    const effect = AtomicEffectFixture({
        texture: { path: "#authored-consumer" },
        transform: [ 0, 0, 0.5, 1 ]
    });

    commitLegacyConfiguredConsumerBindings(
        [ effect ],
        replacement,
        { coverageAlpha: true }
    );

    assert.deepEqual(effect.stateOverrides.slice(-3), [
        [ "Main", 0, 206, 1 ],
        [ "Main", 0, 207, 2 ],
        [ "Main", 0, 208, 6 ]
    ]);
});

test("legacy configured consumer rejects transparent owner texels", () =>
{
    const replacement = { path: "#configured-consumer" };
    const effect = AtomicEffectFixture({
        texture: { path: "#authored-consumer" },
        transform: [ 0, 0, 0.5, 1 ]
    });

    commitLegacyConfiguredConsumerBindings(
        [ effect ],
        replacement,
        { alphaTest: true }
    );

    assert.deepEqual(effect.stateOverrides.slice(-4), [
        [ "Main", 0, 15, 1 ],
        [ "Main", 0, 24, 0 ],
        [ "Main", 0, 25, 5 ],
        [ "Main", 0, 27, 0 ]
    ]);
});

test("legacy body atlas updates only proof fallbacks with a proven authored body-atlas contract", () =>
{
    const texture = { path: "#composed-body" };
    const foundation = EffectFixture(false, [ 0, 0, 0.5, 1 ]);
    const configuredProof = EffectFixture(true, [ 0.2, 0.1, 0.6, 0.8 ]);
    configuredProof._characterAuthoredBodyAtlasConsumer = true;
    configuredProof.parameters.MaterialDiffuseColor = {
        value: [ 0.2, 0, 0.2, 1 ],
        SetValue(value) { this.value = [ ...value ]; }
    };
    const ordinaryGarmentProof = EffectFixture(true);
    const configuredAuthored = EffectFixture(false);
    const configuredBodyCarrier = EffectFixture(false);
    configuredBodyCarrier._characterAuthoredBodyAtlasConsumer = true;
    const result = attachLegacyBodyDiffuse({
        meshes: [
            MeshFixture(foundation, { _characterFoundationRole: "body" }),
            MeshFixture(configuredProof, {
                _characterPartIndex: 4,
                _characterPartSourceRecordID: "female/dependants/tuck/basic"
            }),
            MeshFixture(ordinaryGarmentProof, { _characterPartIndex: 6 }),
            MeshFixture(configuredAuthored, { _characterPartIndex: 5 }),
            MeshFixture(configuredBodyCarrier, {
                _characterPartIndex: 7,
                _characterPartSourceRecordID: "female/bottomouter/pantscf01"
            })
        ]
    }, texture);

    assert.deepEqual(result, {
        total: 3,
        foundation: 1,
        configuredProof: 2,
        configuredPartIndices: [ 4, 7 ],
        foundationBindings: [ {
            status: "retained",
            rule: "authored-transform-retained-v1",
            correctness: "unverified",
            role: "body",
            effectFilePath: null,
            sampleBounds: [ 0, 0, 0.5, 1 ],
            source: "shared-body-diffuse-target",
            effectBinding: {
                effectFilePath: "",
                effectResourcePath: "",
                authoredEffectFilePath: "",
                options: {},
                parameterNames: [
                    "DiffuseMap",
                    "NormalMap",
                    "SpecularMap",
                    "TransformUV0"
                ],
                transformUV0: [ 0, 0, 0.5, 1 ],
                materialDiffuseColor: null,
                materialSpecularColor: null,
                materialSpecularCurve: null,
                wrinkleParams: null,
                colorCorrectionSource: null,
                materialLibraryID: null,
                material2LibraryID: null
            }
        } ],
        configuredProofBindings: [ {
            status: "experimental-policy",
            rule: "authored-transform-retained-v1",
            correctness: "unverified",
            partIndex: 4,
            groupID: null,
            partSourceRecordID: "female/dependants/tuck/basic",
            effectFilePath: null,
            previousSampleBounds: [ 0.2, 0.1, 0.6, 0.8 ],
            sampleBounds: [ 0.2, 0.1, 0.6, 0.8 ],
            source: "shared-body-diffuse-target",
            diffuseColorPolicy: "neutral-body-atlas-sample"
        }, {
            status: "experimental-policy",
            rule: "authored-transform-retained-v1",
            correctness: "unverified",
            partIndex: 7,
            groupID: null,
            partSourceRecordID: "female/bottomouter/pantscf01",
            effectFilePath: null,
            previousSampleBounds: null,
            sampleBounds: null,
            source: "shared-body-diffuse-target",
            diffuseColorPolicy: "neutral-body-atlas-sample"
        } ]
    });
    assert.strictEqual(foundation.attachedTexture, texture);
    assert.equal(foundation.transform, null);
    assert.strictEqual(configuredProof.attachedTexture, texture);
    assert.deepEqual(
        configuredProof.parameters.MaterialDiffuseColor.value,
        [ 1, 1, 1, 1 ]
    );
    assert.strictEqual(configuredBodyCarrier.attachedTexture, texture);
    assert.equal(configuredProof.transform, null);
    assert.equal(ordinaryGarmentProof.attachedTexture, null);
    assert.equal(ordinaryGarmentProof.transform, null);
    assert.equal(configuredAuthored.attachedTexture, null);
});

test("legacy body diffuse diagnostic can neutralize foundation lighting maps", () =>
{
    const texture = { path: "#composed-body" };
    const foundation = EffectFixture(false, [ 0, 0, 0.5, 1 ]);

    attachLegacyBodyDiffuse({
        meshes: [ MeshFixture(foundation, { _characterFoundationRole: "body" }) ]
    }, texture, { neutralLighting: true });

    assert.strictEqual(foundation.attachedTexture, texture);
    assert.equal(
        foundation.parameters.NormalMap.resourcePath,
        "res:/graphics/shared_texture/global/normal_flat.dds"
    );
    assert.equal(foundation.parameters.SpecularMap.resourcePath, "dynamic:/color/0,0,0,1");
});

test("GLES atlas composer loads resource bytes through tw2.resMan", async () =>
{
    const requests = [];
    SetTestTw2({
        GetClass() {},
        resMan: {
            BuildUrl(path)
            {
                requests.push([ "url", path ]);
                return `/resources/${path.slice(5)}`;
            },
            async FetchRaw(url, responseType)
            {
                requests.push([ "fetch", url, responseType ]);
                return new Uint8Array([ 1, 2, 3 ]).buffer;
            }
        }
    });

    const composer = new TnyGlesAtlasComposer();
    await assert.rejects(
        composer.Compose({ sex: "female", textureContributions: [] }),
        /no readable PNG atlas metadata/u
    );
    assert.deepEqual(requests, [
        [
            "url",
            "res:/graphics/character/female/paperdoll/archetypes/ccshape/cd_female_body_d_4k.png"
        ],
        [
            "fetch",
            "/resources/graphics/character/female/paperdoll/archetypes/ccshape/cd_female_body_d_4k.png",
            "arraybuffer"
        ]
    ]);
});

test("legacy atlas composer reads exact normalized PNG placement metadata", () =>
{
    const bytes = Buffer.concat([
        Buffer.from([ 137, 80, 78, 71, 13, 10, 26, 10 ]),
        Chunk("IHDR", Uint32Pair(1672, 1191, Buffer.from([ 8, 6, 0, 0, 0 ]))),
        Chunk("oFFs", Int32Pair(91797, 119629, Buffer.from([ 0 ]))),
        Chunk("pHYs", Uint32Pair(816406, 581543, Buffer.from([ 0 ]))),
        Chunk("IEND", Buffer.alloc(0))
    ]);
    const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);

    assert.deepEqual(parsePngAtlasMetadata(arrayBuffer), {
        width: 1672,
        height: 1191,
        offset: [ 0.091797, 0.119629 ],
        extent: [ 0.816406, 0.581543 ],
        hasOffsetMetadata: true,
        hasPlacementMetadata: true
    });
});

test("GLES atlas composer resolves DDS placement from the hydrated library", async () =>
{
    const requested = [];
    SetTestTw2({
        GetClass() {},
        resMan: {
            BuildUrl(path) { requested.push(path); return path; },
            async FetchRaw() { throw new Error("PNG fallback must not run"); }
        }
    });
    const record = {
        recordID: "res:/example/garment/colorize_body_l",
        sourcePath: "res:/example/garment/colorize_body_l.png",
        width: 1672,
        height: 1191,
        offsetX: 0.091797,
        offsetY: 0.119629,
        extentX: 0.816406,
        extentY: 0.581543,
        hasOffsetMetadata: true,
        hasPlacementMetadata: true,
        placementEncoding: "png-oFFs-pHYs-millionths",
        placementPolicy: "ccp-character-atlas-millionths-v1",
        placementStatus: "experimental-policy"
    };
    const source = {
        Get(documentName, recordID)
        {
            assert.equal(documentName, "characterTextureMetadata");
            assert.equal(recordID, record.recordID);
            return record;
        }
    };
    const composer = new TnyGlesAtlasComposer().SetTextureMetadataSource(source);

    assert.deepEqual(await composer._ReadMetadata(
        "RES:/Example/Garment/Colorize_Body_L.DDS"
    ), ReadLibraryAtlasMetadata(record));
    assert.deepEqual(requested, []);
});

test("legacy atlas composer rejects non-PNG bytes without fabricating placement", () =>
{
    assert.equal(parsePngAtlasMetadata(new Uint8Array([ 1, 2, 3 ]).buffer), null);
});

test("legacy atlas composer distinguishes image dimensions from absent placement metadata", () =>
{
    const bytes = Buffer.concat([
        Buffer.from([ 137, 80, 78, 71, 13, 10, 26, 10 ]),
        Chunk("IHDR", Uint32Pair(512, 256, Buffer.from([ 8, 6, 0, 0, 0 ]))),
        Chunk("IEND", Buffer.alloc(0))
    ]);
    const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);

    assert.deepEqual(parsePngAtlasMetadata(arrayBuffer), {
        width: 512,
        height: 256,
        offset: [ 0, 0 ],
        extent: [ 1, 1 ],
        hasOffsetMetadata: false,
        hasPlacementMetadata: false
    });
});

test("legacy atlas composer explicitly defers every contribution it cannot compose", () =>
{
    const base = {
        layerIndex: 4,
        groupID: "topmiddle",
        selectedTextures: [],
        materialValues: null
    };

    assert.deepEqual(resolveLegacyBodyDiffuseContribution(base), {
        status: "deferred",
        reason: "body-target-unavailable"
    });

    const detail = {
        ...base,
        selectedTextures: [ {
            path: "res:/detail.png",
            target: "body",
            role: "colorize-layer"
        } ]
    };

    assert.deepEqual(resolveLegacyBodyDiffuseContribution(detail), {
        status: "deferred",
        reason: "body-colorize-zones-unresolved"
    });

    const versionAuthored = {
        ...detail,
        groupID: "makeup/bodyaugmentations",
        source: {
            versionIndex: 3,
            typeDefinitionPath: "res:/graphics/character/female/paperdoll/makeup/bodyaugmentations/bodyaugmentation_f01/types/bodyaugmentationf01_goldcamo.type",
            materialDefinitionPath: null
        },
        selectedTextures: [ {
            path: "res:/graphics/character/female/paperdoll/makeup/bodyaugmentations/bodyaugmentation_f01/v3/colorize_body_l_4k.png",
            target: "body",
            role: "colorize-layer"
        } ],
        textureCandidates: [ {
            path: "res:/graphics/character/female/paperdoll/makeup/bodyaugmentations/bodyaugmentation_f01/v3/colorize_body_l_4k.png",
            target: "body",
            role: "colorize-layer",
            recognized: true
        } ]
    };

    assert.deepEqual(resolveLegacyBodyDiffuseContribution(versionAuthored), {
        status: "ready",
        operation: "alpha-overlay",
        texture: versionAuthored.selectedTextures[0],
        evidenceRule: "exact-version-authored-rgba-overlay-v1"
    });
    assert.deepEqual(planLegacyBodyDiffuseOperations([ versionAuthored ]).operations, [ {
        operation: "alpha-overlay",
        contribution: versionAuthored,
        texture: versionAuthored.selectedTextures[0],
        evidenceRule: "exact-version-authored-rgba-overlay-v1"
    } ]);

    const textures = {
        ...detail,
        selectedTextures: [
            ...detail.selectedTextures,
            {
                path: "res:/zones.png",
                target: "body",
                role: "colorize-zones"
            }
        ]
    };

    assert.deepEqual(resolveLegacyBodyDiffuseContribution(textures), {
        status: "deferred",
        reason: "material-colors-unresolved"
    });

    const patterned = {
        ...textures,
        materialValues: {
            colors: [ [ 1, 0, 0 ], [ 0, 1, 0 ], [ 0, 0, 1 ] ],
            pattern: "res:/pattern.png"
        }
    };

    assert.deepEqual(resolveLegacyBodyDiffuseContribution(patterned), {
        status: "deferred",
        reason: "pattern-colors-unresolved"
    });

    const fullyPatterned = resolveLegacyBodyDiffuseContribution({
        ...patterned,
        materialValues: {
            ...patterned.materialValues,
            pattern: "Amarr_B",
            patternColors: [
                [ 0.1, 0.2, 0.3, 1 ],
                [ 0.4, 0.5, 0.6, 1 ],
                [ 0.7, 0.8, 0.9, 1 ],
                null,
                null,
                [ 0, 0, 8, 8 ],
                20
            ]
        }
    });

    assert.equal(fullyPatterned.status, "ready");
    assert.deepEqual(fullyPatterned.candidate.pattern, {
        name: "Amarr_B",
        path: "res:/graphics/character/patterns/amarr_b_z.dds",
        colors: [
            [ 0.1, 0.2, 0.3, 1 ],
            [ 0.4, 0.5, 0.6, 1 ],
            [ 0.7, 0.8, 0.9, 1 ]
        ],
        transform: [ 0, 0, 8, 8 ],
        rotation: 20
    });

    const ready = resolveLegacyBodyDiffuseContribution({
        ...patterned,
        materialValues: { ...patterned.materialValues, pattern: "" }
    });

    assert.equal(ready.status, "ready");
    assert.strictEqual(ready.candidate.contribution.groupID, "topmiddle");
    assert.equal(ready.candidate.detail.path, "res:/detail.png");
    assert.equal(ready.candidate.zones.path, "res:/zones.png");
    assert.deepEqual(ready.candidate.colors, [
        [ 1, 0, 0, 1 ],
        [ 0, 1, 0, 1 ],
        [ 0, 0, 1, 1 ]
    ]);
});

test("legacy atlas composer restores a typed owner cut mask before its colorized layer", () =>
{
    const topInner = ColorizedContribution(1, 0, "topinner");
    const pants = ColorizedContribution(2, 1, "bottomouter");
    const mask = {
        layerIndex: 3,
        ownerSelectionIndex: 1,
        groupID: "bottomouter",
        selectedTextures: [ {
            path: "res:/graphics/character/female/paperdoll/dependants/masktuck/tuckmaskmid/comp_body_m.png",
            target: "body",
            role: "cut-mask"
        } ],
        materialValues: null
    };
    const shirt = ColorizedContribution(4, 2, "topmiddle");
    const planned = planLegacyBodyDiffuseOperations([ topInner, pants, mask, shirt ]);

    assert.deepEqual(planned.operations.map(value => [
        value.operation,
        value.contribution.layerIndex
    ]), [
        [ "colorized", 1 ],
        [ "restore-base", 3 ],
        [ "colorized", 2 ],
        [ "colorized", 4 ]
    ]);
    assert.deepEqual(planned.deferred, []);
});

test("legacy body atlas admits exact body diffuse overlays without a makeup exception", () =>
{
    const freckles = {
        layerIndex: 20,
        groupID: "makeup/freckles",
        weight: 0.75,
        selectedTextures: [ {
            path: "res:/graphics/character/female/paperdoll/makeup/freckles/freckles_03/comp_body_d_4k.png",
            target: "body",
            role: "diffuse-overlay"
        } ],
        materialValues: null
    };
    const planned = planLegacyBodyDiffuseOperations([ freckles ]);

    assert.deepEqual(planned.operations, [ {
        operation: "alpha-overlay",
        contribution: freckles,
        texture: freckles.selectedTextures[0]
    } ]);
    assert.deepEqual(planned.deferred, []);
    assert.deepEqual(planned.notApplicable, []);
});

test("legacy body diffuse keeps shared skin layers in the head composition order", () =>
{
    const skintype = ColorizedContribution(30, 30, "skintype");
    const augmentation = ColorizedContribution(10, 10, "makeup/augmentations");
    const freckles = {
        layerIndex: 20,
        groupID: "makeup/freckles",
        selectedTextures: [ {
            path: "res:/freckles-body.png",
            target: "body",
            role: "diffuse-overlay"
        } ],
        materialValues: null
    };

    const planned = planLegacyBodyDiffuseOperations([
        augmentation,
        freckles,
        skintype
    ]);

    assert.deepEqual(planned.operations.map(value => [
        value.operation,
        value.contribution.groupID
    ]), [
        [ "colorized", "skintype" ],
        [ "alpha-overlay", "makeup/freckles" ],
        [ "colorized", "makeup/augmentations" ]
    ]);
});

test("legacy body atlas reports head-only contributions as retained but not applicable", () =>
{
    const headOnly = {
        layerIndex: 21,
        groupID: "makeup/lipstick",
        selectedTextures: [ {
            path: "res:/graphics/character/female/paperdoll/makeup/lipstick/lipstick_04/colorize_head_l_4k.png",
            target: "head",
            role: "colorize-layer"
        } ],
        materialValues: null
    };
    const planned = planLegacyBodyDiffuseOperations([ headOnly ]);

    assert.deepEqual(planned.operations, []);
    assert.deepEqual(planned.deferred, []);
    assert.deepEqual(planned.notApplicable, [ {
        layerIndex: 21,
        groupID: "makeup/lipstick",
        reason: "body-diffuse-channel-not-authored"
    } ]);
});

test("legacy body atlas retains pants under the separately owned female boot mask", () =>
{
    const pants = ColorizedContribution(13, 12, "bottomouter");
    const mask = {
        layerIndex: 10,
        ownerSelectionIndex: 9,
        groupID: "feet",
        source: { partSourceRecordID: "female/dependants/bootmasks/bootmaskshin" },
        selectedTextures: [ {
            path: "res:/graphics/character/female/paperdoll/dependants/bootmasks/bootmaskshin/comp_body_m.png",
            target: "body",
            role: "cut-mask"
        } ]
    };
    const boots = ColorizedContribution(9, 9, "feet");
    boots.source = { partSourceRecordID: "female/feet/bootscf01" };

    const planned = planLegacyBodyDiffuseOperations([ pants, mask, boots ]);

    assert.deepEqual(planned.operations.map(value => [
        value.operation,
        value.contribution.layerIndex
    ]), [
        [ "colorized", 13 ],
        [ "colorized", 9 ]
    ]);
    assert.deepEqual(planned.deferred, [ {
        layerIndex: 10,
        groupID: "feet",
        reason: "foundation-cut-mask-owned-separately"
    } ]);
});

test("legacy atlas composer retains an ownerless cut mask as deferred", () =>
{
    const mask = {
        layerIndex: 7,
        ownerSelectionIndex: -1,
        groupID: "bottomouter",
        selectedTextures: [ {
            path: "res:/mask.png",
            target: "body",
            role: "cut-mask"
        } ]
    };
    const planned = planLegacyBodyDiffuseOperations([ mask ]);

    assert.deepEqual(planned.operations, []);
    assert.deepEqual(planned.deferred, [ {
        layerIndex: 7,
        groupID: "bottomouter",
        reason: "cut-mask-owner-unresolved"
    } ]);
});

test("legacy atlas keeps configured garment materials out of the shared body target", () =>
{
    const skinLayer = ColorizedContribution(2, 1, "topmiddle");
    skinLayer.partIndex = 2;
    const pants = ColorizedContribution(15, 12, "bottomouter");
    pants.partIndex = 15;
    pants.source = { partSourceRecordID: "male/bottomouter/pantsam01" };

    const planned = planLegacyBodyDiffuseOperations([ skinLayer, pants ], {
        excludePartIndices: new Set([ 15 ])
    });

    assert.deepEqual(planned.operations.map(value => value.contribution.partIndex), [ 2 ]);
    assert.deepEqual(planned.deferred, [ {
        layerIndex: 15,
        groupID: "bottomouter",
        reason: "configured-garment-material-owned-separately"
    } ]);
});

test("legacy atlas retains authored-occluded layers without composing them", () =>
{
    const underwear = ColorizedContribution(13, 12, "bottomunderwear");
    underwear.occludedBy = [ {
        partIndex: 15,
        groupID: "bottomouter",
        partSourceRecordID: "male/bottomouter/pantsam01",
        authoredValue: "bottomunderwear"
    } ];
    const skinLayer = ColorizedContribution(2, 1, "skin");

    const planned = planLegacyBodyDiffuseOperations([ skinLayer, underwear ]);

    assert.deepEqual(planned.operations.map(value => value.contribution.layerIndex), [ 2 ]);
    assert.deepEqual(planned.deferred, [ {
        layerIndex: 13,
        groupID: "bottomunderwear",
        reason: "authored-modifier-occluded"
    } ]);
});

function ColorizedContribution(layerIndex, ownerSelectionIndex, groupID)
{
    return {
        layerIndex,
        ownerSelectionIndex,
        groupID,
        selectedTextures: [
            { path: `res:/layer-${layerIndex}.png`, target: "body", role: "colorize-layer" },
            { path: `res:/zones-${layerIndex}.png`, target: "body", role: "colorize-zones" }
        ],
        materialValues: {
            colors: [ [ 1, 0, 0 ], [ 0, 1, 0 ], [ 0, 0, 1 ] ],
            pattern: ""
        }
    };
}

function ExactFemaleTuckContributions()
{
    return [ {
        layerIndex: 13,
        partIndex: 13,
        ownerSelectionIndex: 12,
        groupID: "bottomouter",
        source: {
            partSourceRecordID: "female/bottomouter/pantscf01",
            materialDefinitionPath: "res:/graphics/character/female/paperdoll/bottomouter/pantscf01/generic02.color"
        },
        selectedTextures: [
            {
                path: "res:/graphics/character/female/paperdoll/bottomouter/pantscf01/colorize_body_l_4k.png",
                role: "colorize-layer",
                target: "body"
            },
            {
                path: "res:/graphics/character/female/paperdoll/bottomouter/pantscf01/colorize_body_z_4k.png",
                role: "colorize-zones",
                target: "body"
            }
        ],
        materialValues: {
            colors: [ [ 0.15, 0.17, 0.2 ], [ 0.06, 0.06, 0.07 ], [ 0.12, 0.14, 0.17 ] ],
            pattern: ""
        }
    }, {
        layerIndex: 14,
        partIndex: 14,
        ownerSelectionIndex: 12,
        groupID: "bottomouter",
        source: { partSourceRecordID: "female/dependants/tuck/basic" },
        selectedTextures: []
    }, {
        layerIndex: 15,
        partIndex: 15,
        ownerSelectionIndex: 12,
        groupID: "bottomouter",
        source: { partSourceRecordID: "female/dependants/masktuck/tuckmaskmid" },
        selectedTextures: [ {
            path: "res:/graphics/character/female/paperdoll/dependants/masktuck/tuckmaskmid/comp_body_m.png",
            role: "cut-mask",
            target: "body"
        } ]
    }, {
        layerIndex: 16,
        partIndex: 16,
        ownerSelectionIndex: 13,
        groupID: "topmiddle",
        source: {
            partSourceRecordID: "female/topmiddle/shirtcf01",
            materialDefinitionPath: "res:/graphics/character/female/paperdoll/topmiddle/shirtcf01/generic02.color"
        },
        selectedTextures: [ {
            path: "res:/graphics/character/female/paperdoll/topmiddle/shirtcf01/colorize_body_l_4k.png",
            role: "colorize-layer",
            target: "body"
        }, {
            path: "res:/graphics/character/female/paperdoll/topmiddle/shirtcf01/colorize_body_z_4k.png",
            role: "colorize-zones",
            target: "body"
        } ],
        materialValues: {
            colors: [ [ 0.04, 0.05, 0.05 ], [ 0.08, 0.09, 0.1 ], [ 0.12, 0.13, 0.14 ] ],
            pattern: ""
        }
    } ];
}

function SelectedTopDrapeStaged()
{
    const drapeEffect = AtomicEffectFixture({
        texture: { path: "#shared-skin-fallback" },
        transform: [ 0, 0, 0.5, 1 ],
        materialDiffuseColor: [ 0.2, 0, 0.2, 1 ]
    });
    drapeEffect._characterProofFallback = true;
    drapeEffect._characterAuthoredBodyAtlasConsumer = true;
    return {
        sex: "male",
        backend: {
            visualModel: {
                meshes: [ MeshFixture(drapeEffect, { _characterPartIndex: 4 }) ]
            }
        },
        configuredParts: [ {
            partIndex: 4,
            partSourceRecordID: "male/dependants/drape/standard",
            renderStatus: "ready",
            materialStatus: "body-diffuse-policy",
            compositionStatus: "body-diffuse-attached"
        } ],
        textureContributions: [ {
            layerIndex: 4,
            partIndex: 4,
            ownerSelectionIndex: 7,
            groupID: "topmiddle",
            source: {
                partPath: "dependants/drape/standard",
                partSourceRecordID: "male/dependants/drape/standard"
            },
            selectedTextures: []
        }, {
            layerIndex: 3,
            partIndex: 3,
            ownerSelectionIndex: 7,
            groupID: "topmiddle",
            source: {
                partPath: "topmiddle/shirtcm01",
                partSourceRecordID: "male/topmiddle/shirtcm01",
                materialDefinitionPath: "res:/shirt.color"
            },
            selectedTextures: [ {
                path: "res:/top_l.png",
                role: "colorize-layer",
                target: "body"
            }, {
                path: "res:/top_z.png",
                role: "colorize-zones",
                target: "body"
            } ],
            materialValues: {
                colors: [
                    [ 0.1, 0.12, 0.14, 1 ],
                    [ 0.2, 0.22, 0.24, 1 ],
                    [ 0.3, 0.32, 0.34, 1 ]
                ],
                pattern: ""
            }
        } ],
        compositionTargets: [],
        drapeEffect
    };
}

function ExactFemaleUpperSleeveContributions()
{
    return [ {
        layerIndex: 16,
        partIndex: 16,
        ownerSelectionIndex: 13,
        groupID: "topmiddle",
        source: { partSourceRecordID: "female/topmiddle/shirtcf01" },
        selectedTextures: [ {
            path: "res:/graphics/character/female/paperdoll/topmiddle/shirtcf01/colorize_body_l_4k.png",
            role: "colorize-layer",
            target: "body"
        } ]
    }, {
        layerIndex: 17,
        partIndex: 17,
        ownerSelectionIndex: 13,
        groupID: "topmiddle",
        source: { partSourceRecordID: "female/dependants/sleevesupper/creased_01" },
        selectedTextures: []
    } ];
}

function ExactFemaleLowerSleeveContributions()
{
    return [ {
        layerIndex: 16,
        partIndex: 16,
        ownerSelectionIndex: 13,
        groupID: "topmiddle",
        source: { partSourceRecordID: "female/topmiddle/shirtcf01" },
        selectedTextures: [ {
            path: "res:/graphics/character/female/paperdoll/topmiddle/shirtcf01/colorize_body_l_4k.png",
            role: "colorize-layer",
            target: "body"
        } ]
    }, {
        layerIndex: 18,
        partIndex: 18,
        ownerSelectionIndex: 13,
        groupID: "topmiddle",
        source: { partSourceRecordID: "female/dependants/sleeveslower/longcreased_01" },
        selectedTextures: []
    } ];
}

function ExactFemaleTuckStaged()
{
    const tuckEffect = AtomicEffectFixture({
        texture: { path: "#shared-body-fallback" },
        transform: [ 0.2, 0.1, 0.6, 0.8 ],
        materialDiffuseColor: [ 0.2, 0, 0.2, 1 ]
    });
    tuckEffect._characterProofFallback = true;
    tuckEffect._characterAuthoredBodyAtlasConsumer = true;
    return {
        sex: "female",
        backend: {
            visualModel: {
                meshes: [ TuckMeshFixture(tuckEffect, { _characterPartIndex: 14 }) ]
            }
        },
        configuredParts: [ {
            partIndex: 14,
            partSourceRecordID: "female/dependants/tuck/basic",
            renderStatus: "ready",
            materialStatus: "body-diffuse-policy",
            compositionStatus: "body-diffuse-attached"
        } ],
        textureContributions: ExactFemaleTuckContributions(),
        composedBodyDiffuseTexture: { path: "#shared-body-atlas" },
        compositionTargets: [],
        tuckEffect
    };
}

function ExactFemaleUpperSleeveStaged()
{
    const upperEffect = AtomicEffectFixture({
        texture: { path: "#shared-body-fallback" },
        transform: [ 0.1, 0.2, 0.7, 0.6 ]
    });
    upperEffect._characterProofFallback = true;
    const configuredParts = [ {
        partIndex: 17,
        partSourceRecordID: "female/dependants/sleevesupper/creased_01",
        renderStatus: "ready",
        materialStatus: "body-diffuse-policy",
        compositionStatus: "body-diffuse-attached"
    } ];
    return {
        construction: { paperdollRecordID: "3000001" },
        sex: "female",
        backend: {
            visualModel: {
                meshes: [ MeshFixture(upperEffect, { _characterPartIndex: 17 }) ]
            }
        },
        configuredParts,
        textureContributions: ExactFemaleUpperSleeveContributions(),
        composedBodyDiffuseTexture: { path: "#shared-body-atlas" },
        compositionTargets: [],
        upperEffect
    };
}

function ExactFemaleLowerSleeveStaged()
{
    const lowerEffect = AtomicEffectFixture({
        texture: { path: "#shared-body-fallback" },
        transform: [ 0.1, 0.2, 0.7, 0.6 ]
    });
    lowerEffect._characterProofFallback = true;
    const configuredParts = [ {
        partIndex: 18,
        partSourceRecordID: "female/dependants/sleeveslower/longcreased_01",
        renderStatus: "ready",
        materialStatus: "body-diffuse-policy",
        compositionStatus: "body-diffuse-attached"
    } ];
    return {
        construction: { paperdollRecordID: "3000001" },
        sex: "female",
        backend: {
            visualModel: {
                meshes: [ MeshFixture(lowerEffect, { _characterPartIndex: 18 }) ]
            }
        },
        configuredParts,
        textureContributions: ExactFemaleLowerSleeveContributions(),
        composedBodyDiffuseTexture: { path: "#shared-body-atlas" },
        compositionTargets: [],
        lowerEffect
    };
}

function AtlasComposerFixture({
    renderSucceeds = true,
    headNormalMode = "authored",
    headMaterialMode = "authored",
    skinLightingMode = "authored",
    skinDiffuseMode = "authored",
    tattooTextureOffsetY = 0,
    browSupportEnabled = true,
    browLightingMode = "authored",
    browDiffuseColorMode = "authored",
    tearductsEnabled = true,
    tearductLightingMode = "authored",
    tearductUvMode = "authored",
    tearductDiffuseMode = "composed",
    eyelashCarrierMode = "all",
    eyelashUvMode = "carrier-specific",
    eyelashDepthMode = "authored",
    eyelashAlphaMode = "source"
} = {})
{
    const renderedModes = [];
    const targets = [];
    const effects = [];
    const gl = {
        COLOR_CLEAR_VALUE: 1,
        COLOR_WRITEMASK: 2,
        SCISSOR_TEST: 3,
        COLOR_BUFFER_BIT: 4,
        TEXTURE_2D: 5,
        RGBA: 6,
        UNSIGNED_BYTE: 7,
        getParameter(value)
        {
            return value === this.COLOR_CLEAR_VALUE ? [ 0, 0, 0, 0 ] : [ true, true, true, true ];
        },
        isEnabled() { return false; },
        disable() {},
        enable() {},
        colorMask() {},
        clearColor() {},
        clear() {},
        viewport() {},
        createTexture() { return {}; },
        bindTexture() {},
        texImage2D() {}
    };
    class Tw2Effect
    {
        static from(values)
        {
            const textureParameters = Object.fromEntries(
                Object.keys(values.textures ?? {}).map(name => [ name, {
                    textureRes: null,
                    AttachTextureRes(value) { this.textureRes = value; }
                } ])
            );
            const effect = {
                ...values,
                techniques: { Main: {} },
                stateOverrides: [],
                parameters: {
                    ...(values.parameters ?? {}),
                    ...textureParameters,
                    Texture: textureParameters.Texture ?? {
                        textureRes: null,
                        AttachTextureRes(value) { this.textureRes = value; }
                    }
                },
                GetPassCount() { return 1; },
                SetTechniquePassStateOverride(...state)
                {
                    this.stateOverrides.push(state);
                },
                IsGood() { return true; }
            };
            effects.push(effect);
            return effect;
        }
    }
    class Tw2RenderTarget
    {
        constructor(name, width, height)
        {
            this.name = name;
            this.width = width;
            this.height = height;
            this.texture = { path: `#${name}`, IsGood: () => true };
            this.destroyed = false;
            targets.push(this);
        }

        IsGood() { return true; }
        SetCallUnset(callback) { callback(); return true; }
        Destroy() { this.destroyed = true; }
    }
    class Tw2TextureRes
    {
        Attach(texture, path)
        {
            this.texture = texture;
            this.path = path;
        }

        DeleteGL() { this.texture = null; }
    }
    const tw2 = {
        GetClass(name)
        {
            if (name === "Tw2Effect") return Tw2Effect;
            if (name === "Tw2TextureRes") return Tw2TextureRes;
            return Tw2RenderTarget;
        },
        resMan: {
            async Watch() {},
            BuildUrl(path)
            {
                return path.replace(
                    /^res:\//u,
                    "http://127.0.0.1:3000/ccp/3453885/resources/"
                );
            },
            async FetchRaw(path, responseType)
            {
                assert.match(path, /^http:\/\/127\.0\.0\.1:3000\/ccp\/3453885\/resources\//u);
                assert.equal(responseType, "arraybuffer");
                return /\.dds$/iu.test(path) ? bc3ArrayBuffer : arrayBuffer;
            }
        },
        device: {
            gl,
            perObjectData: null,
            RenderFullScreenQuad(effect)
            {
                renderedModes.push(effect.effectFilePath);
                return renderSucceeds;
            }
        }
    };
    const png = Buffer.concat([
        Buffer.from([ 137, 80, 78, 71, 13, 10, 26, 10 ]),
        Chunk("IHDR", Uint32Pair(2048, 2048, Buffer.from([ 8, 6, 0, 0, 0 ]))),
        Chunk("IEND", Buffer.alloc(0))
    ]);
    const arrayBuffer = png.buffer.slice(png.byteOffset, png.byteOffset + png.byteLength);
    const bc3 = CreateBc3Dds(4, 4, 255, 0, 0);
    const bc3ArrayBuffer = bc3.buffer.slice(bc3.byteOffset, bc3.byteOffset + bc3.byteLength);
    SetTestTw2(tw2);
    return {
        composer: new TnyGlesAtlasComposer({
            headNormalMode,
            headMaterialMode,
            skinLightingMode,
            skinDiffuseMode,
            tattooTextureOffsetY,
            browSupportEnabled,
            browLightingMode,
            browDiffuseColorMode,
            tearductsEnabled,
            tearductLightingMode,
            tearductUvMode,
            tearductDiffuseMode,
            eyelashCarrierMode,
            eyelashUvMode,
            eyelashDepthMode,
            eyelashAlphaMode
        }),
        renderedModes,
        targets,
        effects
    };
}

function EffectFixture(proofFallback, sampleBounds = null, resourcePath = "")
{
    const effect = {
        _characterProofFallback: proofFallback,
        attachedTexture: null,
        transform: null,
        parameters: {
            DiffuseMap: {
                resourcePath,
                AttachTextureRes(texture)
                {
                    this.owner.attachedTexture = texture;
                },
                owner: null
            },
            NormalMap: TextureParameterFixture("res:/authored-normal.dds"),
            SpecularMap: TextureParameterFixture("res:/authored-specular.dds")
        },
        SetParameters(values)
        {
            this.transform = [ ...values.TransformUV0 ];
            return true;
        },
        SetTextures(values)
        {
            for (const [ name, value ] of Object.entries(values))
            {
                this.parameters[name]?.SetValue?.(value);
            }
            return true;
        }
    };

    if (sampleBounds)
    {
        effect.parameters.TransformUV0 = {
            GetValue(out)
            {
                out.push(...sampleBounds);
                return out;
            }
        };
    }

    return effect;
}

function BodyConsumerShader(family = "skinnedavatarbrdfdoublelinear")
{
    return `res:/graphics/effect.gles2/managed/interior/avatar/${family}.sm_hi`;
}

function UseAllRetainedCutMasks({ retainedCutMaskPaths })
{
    return retainedCutMaskPaths;
}

function AtomicEffectFixture({
    texture,
    transform,
    rejectTexture = null,
    cutMask = null,
    materialDiffuseColor = [ 1, 1, 1, 1 ],
    glassTransparencyColor = null,
    materialSpecularColor = null,
    hairSpecularColor1 = null,
    hairSpecularColor2 = null,
    materialSpecularCurve = null,
    materialLibraryID = null,
    material2LibraryID = null,
    staleParameters = []
})
{
    const effect = {
        transform: [ ...transform ],
        materialDiffuseColor: [ ...materialDiffuseColor ],
        glassTransparencyColor: glassTransparencyColor
            ? [ ...glassTransparencyColor ]
            : null,
        materialSpecularColor: materialSpecularColor ? [ ...materialSpecularColor ] : null,
        hairSpecularColor1: hairSpecularColor1 ? [ ...hairSpecularColor1 ] : null,
        hairSpecularColor2: hairSpecularColor2 ? [ ...hairSpecularColor2 ] : null,
        materialSpecularCurve: materialSpecularCurve ? [ ...materialSpecularCurve ] : null,
        materialLibraryID: materialLibraryID ? [ ...materialLibraryID ] : null,
        material2LibraryID: material2LibraryID ? [ ...material2LibraryID ] : null,
        options: {},
        autoParameter: false,
        cleanEffectCalls: 0,
        techniques: { Main: [] },
        stateOverrides: [],
        parameters: {
            DiffuseMap: {
                textureRes: texture,
                resourcePath: "",
                isAttached: true,
                AttachTextureRes(value)
                {
                    if (rejectTexture !== null && value === rejectTexture)
                    {
                        throw new Error("fixture texture rejection");
                    }
                    this.textureRes = value;
                    this.isAttached = Boolean(value);
                },
                SetValue(value)
                {
                    this.resourcePath = value;
                    this.textureRes = { path: value, IsGood: () => true };
                    this.isAttached = false;
                    return true;
                }
            },
            NormalMap: TextureParameterFixture("res:/neutral-normal.dds"),
            SpecularMap: TextureParameterFixture("res:/neutral-specular.dds"),
            TransformUV0: {
                GetValue(out)
                {
                    out.push(...effect.transform);
                    return out;
                }
            },
            MaterialDiffuseColor: {
                GetValue(out)
                {
                    out.push(...effect.materialDiffuseColor);
                    return out;
                }
            },
            ...(materialSpecularColor ? {
                MaterialSpecularColor: {
                    GetValue(out)
                    {
                        out.push(...effect.materialSpecularColor);
                        return out;
                    }
                }
            } : {}),
            ...(glassTransparencyColor ? {
                GlassTransparencyColor: {
                    GetValue(out)
                    {
                        out.push(...effect.glassTransparencyColor);
                        return out;
                    }
                }
            } : {})
        },
        SetParameters(values)
        {
            if (values.TransformUV0) this.transform = [ ...values.TransformUV0 ];
            if (values.MaterialDiffuseColor)
            {
                this.materialDiffuseColor = [ ...values.MaterialDiffuseColor ];
            }
            if (values.MaterialSpecularColor)
            {
                this.materialSpecularColor = [ ...values.MaterialSpecularColor ];
            }
            if (values.GlassTransparencyColor)
            {
                this.glassTransparencyColor = [ ...values.GlassTransparencyColor ];
            }
            if (values.HairSpecularColor1)
            {
                this.hairSpecularColor1 = [ ...values.HairSpecularColor1 ];
            }
            if (values.HairSpecularColor2)
            {
                this.hairSpecularColor2 = [ ...values.HairSpecularColor2 ];
            }
            if (values.MaterialSpecularCurve)
            {
                this.materialSpecularCurve = [ ...values.MaterialSpecularCurve ];
            }
            if (values.MaterialLibraryID)
            {
                this.materialLibraryID = [ ...values.MaterialLibraryID ];
            }
            if (values.Material2LibraryID)
            {
                this.material2LibraryID = [ ...values.Material2LibraryID ];
            }
            return true;
        },
        CleanEffect()
        {
            this.cleanEffectCalls++;
            this.autoParameter = true;
            const retained = new Set([
                "DiffuseMap",
                "NormalMap",
                "SpecularMap",
                "TransformUV0",
                "MaterialDiffuseColor",
                "MaterialSpecularColor",
                "MaterialSpecularCurve",
                "GlassTransparencyColor"
            ]);
            this.parameters = Object.fromEntries(Object.entries(this.parameters)
                .filter(([ name ]) => retained.has(name)));
        },
        GetPassCount()
        {
            return 1;
        },
        SetTechniquePassStateOverride(technique, pass, state, value)
        {
            this.techniques[technique][pass] ??= { state: [] };
            const states = this.techniques[technique][pass].state;
            const current = states.find(candidate => candidate.state === state);
            if (current) current.value = value;
            else states.push({ state, value });
            this.stateOverrides.push([ technique, pass, state, value ]);
        }
    };
    if (cutMask)
    {
        effect.parameters.CutMaskMap = TextureParameterFixture(cutMask);
    }
    for (const [ name, value, property ] of [
        [ "HairSpecularColor1", hairSpecularColor1, "hairSpecularColor1" ],
        [ "HairSpecularColor2", hairSpecularColor2, "hairSpecularColor2" ]
    ])
    {
        if (!value) continue;
        effect.parameters[name] = {
            GetValue(out)
            {
                out.push(...effect[property]);
                return out;
            }
        };
    }
    for (const [ name, value ] of [
        [ "MaterialSpecularCurve", materialSpecularCurve ],
        [ "MaterialLibraryID", materialLibraryID ],
        [ "Material2LibraryID", material2LibraryID ]
    ])
    {
        if (!value) continue;
        effect.parameters[name] = {
            GetValue(out)
            {
                out.push(...effect[name.charAt(0).toLowerCase() + name.slice(1)]);
                return out;
            }
        };
    }
    for (const name of staleParameters)
    {
        effect.parameters[name] = {
            GetValue(out)
            {
                out.push(0, 0, 0, 0);
                return out;
            }
        };
    }
    return effect;
}

function TextureParameterFixture(resourcePath)
{
    return {
        textureRes: { path: resourcePath, IsGood: () => true },
        resourcePath,
        isAttached: false,
        AttachTextureRes(value)
        {
            this.textureRes = value;
            this.isAttached = Boolean(value);
        },
        SetValue(value)
        {
            this.resourcePath = value;
            this.textureRes = { path: value, IsGood: () => true };
            this.isAttached = false;
            return true;
        },
        IsGood()
        {
            return this.textureRes?.IsGood?.() === true;
        }
    };
}

function MeshFixture(effect, fields)
{
    effect.parameters.DiffuseMap.owner = effect;
    return { ...fields, opaqueAreas: [ { effect } ] };
}

function TuckMeshFixture(effect, fields)
{
    effect._characterAuthoredBodyAtlasConsumer = true;
    effect.parameters.DiffuseMap.owner = effect;
    return { ...fields, decalAreas: [ { effect } ] };
}

function Chunk(type, data)
{
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    return Buffer.concat([ length, Buffer.from(type), data, Buffer.alloc(4) ]);
}

function Uint32Pair(left, right, tail)
{
    const bytes = Buffer.alloc(8);
    bytes.writeUInt32BE(left, 0);
    bytes.writeUInt32BE(right, 4);
    return Buffer.concat([ bytes, tail ]);
}

function CreateBc3Dds(width, height, alpha0, alpha1, alphaIndex)
{
    const blocks = Math.ceil(width / 4) * Math.ceil(height / 4);
    const bytes = Buffer.alloc(128 + blocks * 16);
    bytes.write("DDS ", 0, "ascii");
    bytes.writeUInt32LE(124, 4);
    bytes.writeUInt32LE(height, 12);
    bytes.writeUInt32LE(width, 16);
    bytes.writeUInt32LE(32, 76);
    bytes.write("DXT5", 84, "ascii");
    for (let block = 0; block < blocks; block++)
    {
        const offset = 128 + block * 16;
        bytes[offset] = alpha0;
        bytes[offset + 1] = alpha1;
        let bits = BigInt(alphaIndex & 7);
        for (let pixel = 1; pixel < 16; pixel++)
        {
            bits |= BigInt(alphaIndex & 7) << BigInt(pixel * 3);
        }
        for (let byte = 0; byte < 6; byte++)
        {
            bytes[offset + 2 + byte] = Number((bits >> BigInt(byte * 8)) & 0xffn);
        }
    }
    return bytes;
}

function Int32Pair(left, right, tail)
{
    const bytes = Buffer.alloc(8);
    bytes.writeInt32BE(left, 0);
    bytes.writeInt32BE(right, 4);
    return Buffer.concat([ bytes, tail ]);
}
