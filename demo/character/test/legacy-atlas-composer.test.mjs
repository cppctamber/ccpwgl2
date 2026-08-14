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
    commitLegacyConfiguredHeadBindings,
    commitLegacyFoundationCutMaskBindings,
    composeLegacyConfiguredConsumerPixel,
    composeLegacyFoundationCutMaskPixel,
    decodeLegacyBc3AlphaMask,
    getLegacyConfiguredConsumerPassContract,
    isLegacyConfiguredBodyConsumerEffect,
    parsePngAtlasMetadata,
    ReadLibraryAtlasMetadata,
    planLegacyConfiguredBodyConsumers,
    planLegacyBodyDiffuseOperations,
    planLegacyExactFemaleLowerSleeve,
    planLegacyExactFemaleUpperSleeve,
    planLegacyExactFemaleTuckSupport,
    planLegacyFemaleFoundationCutMask,
    resolveLegacyBodyDiffuseContribution,
    resolveLegacyBodyMaterialChannels,
    resolveLegacyDefaultBrowCandidate,
    resolveLegacyDefaultEyelashCandidate,
    resolveLegacyBodyFoundationPath,
    resolveLegacyBodyFoundationSpecularPath,
    resolveLegacyCroppedTextureTransform,
    resolveLegacyHeadMaterialChannels,
    summarizeLegacyTextureAlpha
} from "./runtime-character-modules.mjs";

SetTestTw2({});

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

test("body lighting planner admits proved skin specular and defers garment specular", () =>
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
            { path: "res:/underwear-body-s.png", role: "specular-overlay", target: "body" }
        ]
    } ]);

    assert.deepEqual(plan.specular.map(value => ({
        path: value.path,
        op: value.op,
        weight: value.weight,
        order: value.layerOrder
    })), [ {
        path: "res:/implant-body-s.png",
        op: "alpha-overlay",
        weight: 0.6,
        order: 110
    } ]);
    assert.deepEqual(plan.deferred.map(value => ({
        path: value.path,
        reason: value.reason
    })), [ {
        path: "res:/underwear-body-s.png",
        reason: "body-lighting-contribution-outside-current-proof"
    } ]);
});

test("body augmentation keeps plain normals unresolved while admitting exact specular", () =>
{
    const plan = resolveLegacyBodyMaterialChannels([ {
        layerIndex: 8,
        groupID: "makeup/bodyaugmentations",
        source: {
            partSourceRecordID: "female/makeup/bodyaugmentations/bodyaugmentation_f01"
        },
        selectedTextures: [
            { path: "res:/body-augmentation-n.png", role: "normal-overlay", target: "body" },
            { path: "res:/body-augmentation-s.png", role: "specular-overlay", target: "body" }
        ]
    } ]);

    assert.deepEqual(plan.normal, []);
    assert.deepEqual(plan.specular.map(value => ({ path: value.path, op: value.op })), [ {
        path: "res:/body-augmentation-s.png",
        op: "alpha-overlay"
    } ]);
    assert.deepEqual(plan.deferred.map(value => ({ path: value.path, reason: value.reason })), [ {
        path: "res:/body-augmentation-n.png",
        reason: "body-normal-replacement-unproved"
    } ]);
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
        { groupID: "makeup/aging", order: 10 },
        { groupID: "makeup/blemish", order: 20 }
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
        tattooTextureOffsetY: 0.25
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
        [ [ 2048, 2048 ], [ 2048, 2048 ], [ 2048, 2048 ] ]
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
        "colorized",
        "base-skin-colours",
        "res:/skintone/colorize_head_l.png",
        "res:/skintone/colorize_head_z.png"
    ] ]);
    assert.equal(normal.diagnosticMode, "authored-additive-detail-normal");
    assert.deepEqual(normal.passes.slice(1).map(value => [
        value.mode,
        value.path,
        value.strength
    ]), [ [ "configured-head-normal-add", "res:/aging-tn.png", 0.5 ] ]);
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
        transform: [ 0, 0, 0.5, 1 ]
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
    assert.deepEqual(browCarrier.transform, [ 0, 0, 1, 1 ]);
    assert.deepEqual(browCarrier.materialDiffuseColor, [ 1, 1, 1, 1 ]);
    assert.equal(browCarrier.stateOverrides.length, 3);
    assert.deepEqual(diffuse.passes.at(-1).materialControls, {
        layerWeight: 1,
        colorSelectionWeight: 0.3258,
        gloss: 0.36,
        specularColors: Array.from({ length: 3 }, () => [ 0.8, 0.8, 0.8, 1.3 ]),
        applied: [ "layerWeight" ],
        retainedNotApplied: [ "colorSelectionWeight", "gloss", "specularColors" ]
    });
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
    eye.name = "C_Eyes";
    lashes.name = "C_SkinShiny_EyeLashes";
    eyeShadow.name = "C_SkinShiny_EyeLashes";
    skin.name = "C_Skin_blinn1";
    const composedEye = { path: "#composed-eye", IsGood: () => true };
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
        headDiffuseTexture: composedEye,
        eyelashTexture: composedLashes
    });

    assert.equal(report.status, "applied");
    assert.equal(report.appliedEffects, 3);
    assert.strictEqual(eye.parameters.DiffuseMap.textureRes, composedEye);
    assert.strictEqual(lashes.parameters.DiffuseMap.textureRes, composedLashes);
    assert.strictEqual(eyeShadow.parameters.DiffuseMap.textureRes, composedLashes);
    assert.equal(lashes.parameters.SpecularMap.resourcePath, "res:/lashes/comp_head_s.png");
    assert.equal(eyeShadow.parameters.SpecularMap.resourcePath, "res:/lashes/comp_head_s.png");
    assert.equal(report.eyelashes.binding, "colorized-transparent-head-atlas");
    assert.equal(report.eyelashes.specularPath, "res:/lashes/comp_head_s.png");
    assert.equal(report.eyelashes.transform, "carrier-specific");
    assert.deepEqual(report.eyelashes.carriers.map(value => value.meshName), [
        "Eyelashes_GeoShape",
        "EyeShadow_GeoShape"
    ]);
    assert.equal(skin.parameters.DiffuseMap.resourcePath, "");
    assert.deepEqual(eye.transform, [ 0, 0, 1, 1 ]);
    assert.deepEqual(lashes.transform, [ 0, 0, 1, 1 ]);
    assert.deepEqual(eyeShadow.transform, [ 0, 0, 0.5, 1 ]);
    assert.deepEqual(lashes.materialDiffuseColor, [ 1, 1, 1, 1 ]);
    assert.deepEqual(eyeShadow.materialDiffuseColor, [ 1, 1, 1, 1 ]);
    assert.deepEqual(skin.transform, [ 0.5, 0, 1, 0.5 ]);
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
        materialDiffuseColor: [ 1, 0, 1, 1 ]
    });
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
        "configured-shared-rgba",
        "colorized"
    ]);
    assert.equal(report.applied[0].surfaces[1].passes[2].detailMask, "enabled");
    assert.equal(report.applied[0].surfaces[1].passes[2].blend, "source-alpha");
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
    assert.strictEqual(skin.parameters.DiffuseMap.textureRes, originalSkinTexture);
    assert.deepEqual(skin.transform, originalSkinTransform);
    assert.equal(part.materialStatus, "configured-garment-colorized-policy");
    assert.equal(part.compositionStatus, "configured-garment-colorized-attached");
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
        { meshes: [ MeshFixture(effect, { _characterPartIndex: 14 }) ] },
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
            { meshes: [ MeshFixture(effect, { _characterPartIndex: 14 }) ] },
            configuredParts,
            contributions
        ).reason,
        "exact-female-tuck-mask-unresolved"
    );

    contributions[2].ownerSelectionIndex = 12;
    contributions[3].groupID = "bottomouter";
    assert.equal(
        planLegacyExactFemaleTuckSupport(
            "female",
            { meshes: [ MeshFixture(effect, { _characterPartIndex: 14 }) ] },
            configuredParts,
            contributions
        ).reason,
        "exact-female-tuck-alpha-unresolved"
    );

    contributions[3].groupID = "topmiddle";
    contributions[3].ownerSelectionIndex = 12;
    assert.equal(
        planLegacyExactFemaleTuckSupport(
            "female",
            { meshes: [ MeshFixture(effect, { _characterPartIndex: 14 }) ] },
            configuredParts,
            contributions
        ).reason,
        "exact-female-tuck-alpha-unresolved"
    );
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
        { meshes: [ MeshFixture(authored, { _characterPartIndex: 14 }) ] },
        configuredParts,
        contributions
    ).reason, "exact-female-tuck-effect-unresolved");
    assert.equal(planLegacyExactFemaleTuckSupport(
        "female",
        { meshes: [
            MeshFixture(proofA, { _characterPartIndex: 14 }),
            MeshFixture(proofB, { _characterPartIndex: 14 })
        ] },
        configuredParts,
        contributions
    ).reason, "exact-female-tuck-mesh-unresolved");

    const shared = EffectFixture(true, [ 0, 0, 1, 1 ], "res:/shared.png");
    assert.equal(planLegacyExactFemaleTuckSupport(
        "female",
        { meshes: [
            MeshFixture(shared, { _characterPartIndex: 14 }),
            MeshFixture(shared, { _characterPartIndex: 99 })
        ] },
        configuredParts,
        contributions
    ).reason, "exact-female-tuck-effect-shared");
});

test("legacy exact female stomach tuck uses the selected top RGB by default", async () =>
{
    const fixture = AtlasComposerFixture();
    const staged = ExactFemaleTuckStaged();
    const report = await fixture.composer.ComposeExactFemaleTuckSupport(staged);

    assert.equal(report.status, "applied");
    assert.equal(report.rgbSource, "selected-top-colorized");
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
    assert.deepEqual(staged.tuckEffect.stateOverrides, []);
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
    assert.equal(report.rgbSource, "historical-shared-body-comparison");
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

test("legacy female foundation cut uses authored full-leg occlusion rather than garment names", () =>
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
    assert.equal(planned.status, "ready");
    assert.equal(planned.masks[0].owner, "female-authored-full-leg-garment");
    assert.match(planned.masks[0].maskPath, /trousersfixture\/colorize_body_l_4k\.png$/u);

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

test("legacy body atlas updates only proof fallbacks with a proven authored body-atlas contract", () =>
{
    const texture = { path: "#composed-body" };
    const foundation = EffectFixture(false, [ 0, 0, 0.5, 1 ]);
    const configuredProof = EffectFixture(true, [ 0.2, 0.1, 0.6, 0.8 ]);
    configuredProof._characterAuthoredBodyAtlasConsumer = true;
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
            source: "shared-body-diffuse-target"
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
            source: "shared-body-diffuse-target"
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
            source: "shared-body-diffuse-target"
        } ]
    });
    assert.strictEqual(foundation.attachedTexture, texture);
    assert.equal(foundation.transform, null);
    assert.strictEqual(configuredProof.attachedTexture, texture);
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
        transform: [ 0.2, 0.1, 0.6, 0.8 ]
    });
    tuckEffect._characterProofFallback = true;
    return {
        sex: "female",
        backend: {
            visualModel: {
                meshes: [ MeshFixture(tuckEffect, { _characterPartIndex: 14 }) ]
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
    skinLightingMode = "authored",
    tattooTextureOffsetY = 0
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
            skinLightingMode,
            tattooTextureOffsetY
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
    materialDiffuseColor = [ 1, 1, 1, 1 ]
})
{
    const effect = {
        transform: [ ...transform ],
        materialDiffuseColor: [ ...materialDiffuseColor ],
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
            }
        },
        SetParameters(values)
        {
            if (values.TransformUV0) this.transform = [ ...values.TransformUV0 ];
            if (values.MaterialDiffuseColor)
            {
                this.materialDiffuseColor = [ ...values.MaterialDiffuseColor ];
            }
            return true;
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
