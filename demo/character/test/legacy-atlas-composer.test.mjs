import assert from "node:assert/strict";
import test from "node:test";

import {
    attachLegacyBodyDiffuse,
    CcpwglLegacyAtlasComposer,
    commitLegacyConfiguredConsumerBindings,
    commitLegacyFoundationCutMaskBindings,
    composeLegacyConfiguredConsumerPixel,
    composeLegacyFoundationCutMaskPixel,
    getLegacyConfiguredConsumerPassContract,
    isLegacyConfiguredBodyConsumerEffect,
    parsePngAtlasMetadata,
    planLegacyConfiguredBodyConsumers,
    planLegacyBodyDiffuseOperations,
    planLegacyExactFemaleLowerSleeve,
    planLegacyExactFemaleUpperSleeve,
    planLegacyExactFemaleTuckSupport,
    planLegacyFemaleFoundationCutMask,
    resolveLegacyBodyDiffuseContribution
} from "../src/character/CcpwglLegacyAtlasComposer.mjs";

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
        source: { partSourceRecordID: "female/topmiddle/shirtcf01" },
        selectedTextures: [ {
            path: "res:/graphics/character/female/paperdoll/topmiddle/shirtcf01/colorize_body_l_4k.png",
            role: "colorize-layer",
            target: "body"
        } ]
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

test("legacy exact female stomach tuck keeps the shared body RGB by default", async () =>
{
    const fixture = AtlasComposerFixture();
    const staged = ExactFemaleTuckStaged();
    const report = await fixture.composer.ComposeExactFemaleTuckSupport(staged);

    assert.equal(report.status, "applied");
    assert.equal(report.rgbSource, "shared-body-comparison");
    assert.equal(report.pantsPartSourceRecordID, "female/bottomouter/pantscf01");
    assert.deepEqual(report.passes.map(value => value.mode), [
        "configured-authored-rgba",
        "configured-cut-alpha",
        "configured-shared-rgb"
    ]);
    assert.strictEqual(
        staged.tuckEffect.parameters.DiffuseMap.textureRes,
        staged.compositionTargets[0].texture
    );
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
            bootPartIndex: 9,
            bootPartSourceRecordID: "female/feet/bootscf01",
            bootOwnerSelectionIndex: 7,
            maskLayerIndex: 10,
            maskPartSourceRecordID: "female/dependants/bootmasks/bootmaskshin",
            maskPath: "res:/graphics/character/female/paperdoll/dependants/bootmasks/bootmaskshin/comp_body_m.png"
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
    configuredParts[0].renderStatus = "ready";
    contributions[0].ownerSelectionIndex = -1;
    assert.equal(
        planLegacyFemaleFoundationCutMask("female", configuredParts, contributions).reason,
        "exact-female-boot-owner-unresolved"
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
        transform: [ 0.1, 0.2, 0.3, 0.4 ]
    });
    const second = AtomicEffectFixture({
        texture: { path: "#shared-body-2" },
        transform: [ 0.2, 0.1, 0.4, 0.3 ],
        rejectTexture: replacement
    });
    const firstTexture = first.parameters.DiffuseMap.textureRes;
    const secondTexture = second.parameters.DiffuseMap.textureRes;

    let failure = null;
    try
    {
        commitLegacyConfiguredConsumerBindings([ first, second ], replacement);
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

test("legacy body atlas preserves authored consumers and updates only configured proof fallbacks", () =>
{
    const texture = { path: "#composed-body" };
    const foundation = EffectFixture(false, [ 0, 0, 0.5, 1 ]);
    const configuredProof = EffectFixture(true);
    const configuredAuthored = EffectFixture(false);
    const result = attachLegacyBodyDiffuse({
        meshes: [
            MeshFixture(foundation, { _characterFoundationRole: "body" }),
            MeshFixture(configuredProof, { _characterPartIndex: 4 }),
            MeshFixture(configuredAuthored, { _characterPartIndex: 5 })
        ]
    }, texture);

    assert.deepEqual(result, {
        total: 2,
        foundation: 1,
        configuredProof: 1,
        configuredPartIndices: [ 4 ],
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
            rule: "legacy-opengl-full-atlas-identity-v1",
            correctness: "unverified",
            partIndex: 4,
            groupID: null,
            partSourceRecordID: null,
            effectFilePath: null,
            previousSampleBounds: null,
            sampleBounds: [ 0, 0, 1, 1 ],
            source: "shared-body-diffuse-target"
        } ]
    });
    assert.strictEqual(foundation.attachedTexture, texture);
    assert.equal(foundation.transform, null);
    assert.strictEqual(configuredProof.attachedTexture, texture);
    assert.deepEqual(configuredProof.transform, [ 0, 0, 1, 1 ]);
    assert.equal(configuredAuthored.attachedTexture, null);
});

test("legacy atlas composer preserves the browser fetch receiver", async () =>
{
    const originalFetch = globalThis.fetch;
    let receiver = null;

    try
    {
        globalThis.fetch = function()
        {
            receiver = this;
            return Promise.resolve({ ok: false, status: 418 });
        };

        const composer = new CcpwglLegacyAtlasComposer({
            tw2: { GetClass() {} },
            resourceRoot: "http://127.0.0.1:3000/ccp/3453885/resources"
        });

        await assert.rejects(
            composer.Compose({ sex: "female", textureContributions: [] }),
            /HTTP 418/u
        );
        assert.strictEqual(receiver, globalThis);
    }
    finally
    {
        globalThis.fetch = originalFetch;
    }
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
        reason: "body-colorize-layer-unresolved"
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
        reason: "pattern-composition-unresolved"
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
        source: { partSourceRecordID: "female/topmiddle/shirtcf01" },
        selectedTextures: [ {
            path: "res:/graphics/character/female/paperdoll/topmiddle/shirtcf01/colorize_body_l_4k.png",
            role: "colorize-layer",
            target: "body"
        } ]
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

function AtlasComposerFixture({ renderSucceeds = true } = {})
{
    const renderedModes = [];
    const targets = [];
    const effects = [];
    const gl = {
        COLOR_CLEAR_VALUE: 1,
        COLOR_WRITEMASK: 2,
        SCISSOR_TEST: 3,
        COLOR_BUFFER_BIT: 4,
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
        viewport() {}
    };
    class Tw2Effect
    {
        static from(values)
        {
            const texture = {
                textureRes: null,
                AttachTextureRes(value) { this.textureRes = value; }
            };
            const effect = {
                ...values,
                techniques: { Main: {} },
                stateOverrides: [],
                parameters: { ...(values.parameters ?? {}), Texture: texture },
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
            this.texture = { path: `#${name}` };
            this.destroyed = false;
            targets.push(this);
        }

        IsGood() { return true; }
        SetCallUnset(callback) { callback(); return true; }
        Destroy() { this.destroyed = true; }
    }
    const tw2 = {
        GetClass(name)
        {
            return name === "Tw2Effect" ? Tw2Effect : Tw2RenderTarget;
        },
        resMan: { async Watch() {} },
        device: {
            gl,
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
    return {
        composer: new CcpwglLegacyAtlasComposer({
            tw2,
            resourceRoot: "http://127.0.0.1:3000/ccp/3453885/resources",
            fetchImpl: async () => ({ ok: true, arrayBuffer: async () => arrayBuffer })
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
            }
        },
        SetParameters(values)
        {
            this.transform = [ ...values.TransformUV0 ];
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

function AtomicEffectFixture({ texture, transform, rejectTexture = null })
{
    const effect = {
        transform: [ ...transform ],
        parameters: {
            DiffuseMap: {
                textureRes: texture,
                resourcePath: "",
                isAttached: true,
                AttachTextureRes(value)
                {
                    if (value === rejectTexture) throw new Error("fixture texture rejection");
                    this.textureRes = value;
                    this.isAttached = Boolean(value);
                }
            },
            TransformUV0: {
                GetValue(out)
                {
                    out.push(...effect.transform);
                    return out;
                }
            }
        },
        SetParameters(values)
        {
            this.transform = [ ...values.TransformUV0 ];
            return true;
        }
    };
    return effect;
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

function Int32Pair(left, right, tail)
{
    const bytes = Buffer.alloc(8);
    bytes.writeInt32BE(left, 0);
    bytes.writeInt32BE(right, 4);
    return Buffer.concat([ bytes, tail ]);
}
