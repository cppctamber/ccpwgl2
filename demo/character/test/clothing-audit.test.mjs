import assert from "node:assert/strict";
import test from "node:test";

import {
    classifyClothingChoiceRealization,
    classifyClothingOutfitRealizations,
    createSourceObservedOutfitCases,
    summarizeClothingRendererDetails
} from "../src/demo/CharacterDemoClothingAudit.mjs";

test("clothing audit builds a deterministic source-observed choice cover", () =>
{
    const bottom = { recordID: "25", modifierKey: "bottomouter" };
    const top = { recordID: "26", modifierKey: "topmiddle" };
    const outer = { recordID: "10", modifierKey: "outer" };
    const makeup = { recordID: "100", modifierKey: "makeup/aging" };
    const pants = ApparelResource(
        "200",
        "female/bottomouter/pants",
        "bottomOuter/Pants/Types/Black.type"
    );
    const shirt = ApparelResource(
        "201",
        "female/topmiddle/shirt",
        "topMiddle/Shirt/Types/White.type"
    );
    const skirt = ApparelResource(
        "203",
        "female/bottomouter/skirt",
        "bottomOuter/Skirt/Types/Gray.type"
    );
    const aging = ApparelResource(
        "202",
        "female/makeup/aging",
        "makeup/Aging/Types/Aging.type"
    );
    const malePants = ApparelResource(
        "204",
        "male/bottomouter/pants",
        "bottomOuter/Pants/Types/Male.type",
        1
    );
    const paperdolls = [
        Paperdoll("female-a", [
            Modifier(bottom, pants, 1),
            Modifier(bottom, skirt, 0),
            Modifier(top, shirt, 0),
            Modifier(bottom, "dangling-resource", 0),
            Modifier(outer, "dangling-outer", 0)
        ]),
        Paperdoll("female-b", [ Modifier(bottom, pants, 0) ]),
        Paperdoll("female-covered", [ Modifier(bottom, pants, 0) ]),
        Paperdoll("makeup-only", [ Modifier(makeup, aging, 0) ]),
        Paperdoll("male-a", [ Modifier(bottom, malePants, 0) ])
    ];

    const cases = createSourceObservedOutfitCases(paperdolls, undefined, 0);

    assert.deepEqual(cases.map(value => value.donorRecordID), [
        "female-a",
        "female-b"
    ]);
    assert.deepEqual(cases[0].choices.map(value => value.choiceID), [
        "200@1",
        "203@0",
        "201@0",
        "dangling-resource@0",
        "dangling-outer@0"
    ]);
    assert.equal(cases[0].choices[3].resourceResolved, false);
    assert.equal(cases[0].choices[4].resourceResolved, false);
    assert.deepEqual(cases[1].choices.map(value => value.choiceID), [ "200@0" ]);
    assert.equal(cases[0].auditKind, "source-observed-outfit-choice-cover");
    assert.equal(cases[0].coveredChoiceCount, 5);

    assert.deepEqual(createSourceObservedOutfitCases(
        paperdolls,
        undefined,
        0,
        { exhaustive: true }
    ).map(value => value.donorRecordID), [
        "female-a",
        "female-b",
        "female-covered"
    ]);
});

test("clothing audit classifies every selected member of one donor outfit", () =>
{
    const choices = [
        {
            modifierKey: "bottomouter",
            partSourceRecordID: "female/bottomouter/pants"
        },
        {
            modifierKey: "topmiddle",
            partSourceRecordID: "female/topmiddle/shirt"
        }
    ];
    const classified = classifyClothingOutfitRealizations(choices, {
        configuredParts: [ {
            groupID: "bottomouter",
            partSourceRecordID: "female/bottomouter/pants",
            renderStatus: "ready",
            materialStatus: "configured-garment-policy",
            compositionStatus: "configured-garment-colorized-attached"
        } ],
        bodyComposition: {
            bodyDiffuse: { passes: [ { groupID: "topmiddle" } ] }
        }
    });

    assert.equal(classified[0].realization.status, "configured-attached");
    assert.equal(classified[1].realization.status, "atlas-only-applied");
    assert.deepEqual(classifyClothingChoiceRealization({
        modifierKey: "outer",
        resourceResolved: false
    }, {
        configuredParts: [ {
            groupID: "outer",
            renderStatus: "ready",
            compositionStatus: "configured-garment-colorized-attached"
        } ]
    }), {
        status: "unresolved",
        reason: "retained-resource-identity-unavailable"
    });
});

test("clothing audit distinguishes configured, atlas-only, and unresolved choices", () =>
{
    const choice = {
        modifierKey: "hair",
        partSourceRecordID: "female/hair/example"
    };
    assert.deepEqual(classifyClothingChoiceRealization(choice, {
        configuredParts: [ {
            groupID: "hair",
            renderStatus: "ready",
            materialStatus: "configured-hair-policy",
            compositionStatus: "configured-hair-attached",
            partSourceRecordID: "female/hair/example"
        } ]
    }), {
        status: "configured-attached",
        materialStatus: "configured-hair-policy",
        compositionStatus: "configured-hair-attached",
        partSourceRecordID: "female/hair/example"
    });
    assert.deepEqual(classifyClothingChoiceRealization(choice, {
        configuredParts: [],
        headMaterials: {
            channels: [ {
                passes: [
                    { channel: "DiffuseMap", groupID: "hair" },
                    { channel: "SpecularMap", groupID: "hair" }
                ]
            } ]
        }
    }), {
        status: "atlas-only-applied",
        channelCount: 2,
        passCount: 2
    });
    assert.deepEqual(classifyClothingChoiceRealization(choice, {
        configuredParts: [],
        headMaterials: { channels: [] }
    }), { status: "unresolved" });
    assert.deepEqual(classifyClothingChoiceRealization(
        {
            modifierKey: "topmiddle",
            partSourceRecordID: "female/topmiddle/example"
        },
        {
            configuredParts: [ {
                groupID: "topmiddle",
                partSourceRecordID: "female/dependants/drape/standard",
                renderStatus: "ready",
                compositionStatus: "selected-top-drape-material-attached"
            } ],
            bodyComposition: {
                bodyDiffuse: {
                    passes: [ { groupID: "topmiddle" } ]
                }
            }
        }
    ), {
        status: "atlas-only-applied",
        channelCount: 1,
        passCount: 1
    });
});

test("clothing audit does not credit a configured support to its atlas-only owner", () =>
{
    assert.deepEqual(classifyClothingChoiceRealization({
        modifierKey: "topmiddle",
        partSourceRecordID: "female/topmiddle/shirt"
    }, {
        configuredParts: [ {
            groupID: "topmiddle",
            partSourceRecordID: "female/dependants/drape/standard",
            renderStatus: "ready",
            compositionStatus: "selected-top-drape-material-attached"
        } ],
        bodyComposition: {
            bodyDiffuse: {
                passes: [ { groupID: "topmiddle" } ]
            }
        }
    }), {
        status: "atlas-only-applied",
        channelCount: 1,
        passCount: 1
    });
});

test("clothing audit reports an exact selection suppression instead of unresolved", () =>
{
    assert.deepEqual(classifyClothingChoiceRealization({
        modifierKey: "topouter",
        partSourceRecordID: "male/topouter/shirt"
    }, {
        configuredParts: [],
        bodyComposition: { bodyDiffuse: { passes: [] } }
    }, {
        plan: {
            diagnostics: [ {
                code: "SELECTION_SUPPRESSED",
                message: "Selection \"topouter\" is suppressed by \"outer\" through an exact typed relationship."
            } ]
        }
    }), {
        status: "selection-suppressed",
        reason: "Selection \"topouter\" is suppressed by \"outer\" through an exact typed relationship."
    });
});

test("clothing audit retains compact configured material realization evidence", () =>
{
    const summary = summarizeClothingRendererDetails({
        configuredParts: [ {
            partIndex: 4,
            groupID: "outer",
            partSourceRecordID: "male/outer/example",
            geometryPath: "res:/example/example.gr2",
            geometryBindingSource: "retained-explicit",
            renderStatus: "ready",
            materialStatus: "configured-garment-baked-partial",
            compositionStatus: "configured-garment-baked-partial",
            liveObject: { mustNotLeak: true }
        } ],
        configuredGarmentMaterials: {
            status: "applied",
            applied: [ {
                partIndex: 4,
                groupID: "outer",
                partSourceRecordID: "male/outer/example",
                diffuseMode: "baked-direct",
                detailPath: "res:/example/comp_body_d.png",
                realizationStatus: "partial",
                expectedSurfaceCount: 1,
                completedSurfaceCount: 0,
                partialSurfaceCount: 1,
                deferredSurfaceCount: 0,
                materialChannels: {
                    status: "deferred",
                    reason: "garment-normal-map-unresolved"
                },
                bindings: [ {
                    areaContract: "opaque-only",
                    areaFields: [ "opaqueAreas" ],
                    authoredCutMaskInfluence: [ 0.85, 0, 0, 0 ],
                    authoredCutMaskBinding: {
                        declared: true,
                        resourcePath: null,
                        attached: false
                    },
                    appliedCutMaskInfluence: [ 0, 0, 0, 0 ],
                    appliedCutMaskPolicy: "authored-influence-with-neutral-white-mask",
                    appliedCutMaskBinding: {
                        declared: true,
                        resourcePath: "res:/texture/global/white.dds",
                        attached: false
                    },
                    sampleBounds: [ 0, 0, 1, 1 ],
                    effect: { mustNotLeak: true }
                } ]
            } ],
            deferred: [ {
                partIndex: 4,
                groupID: "outer",
                partSourceRecordID: "male/outer/example",
                surface: "private-garment",
                channel: "lighting",
                reason: "garment-normal-map-unresolved"
            } ]
        },
        configuredHairMaterials: {
            status: "applied",
            applied: [ {
                partIndex: 8,
                partSourceRecordID: "female/hair/example",
                detailPath: "res:/example/hair_l.png",
                zonePath: "res:/example/hair_z.png",
                normalPath: "res:/example/hair_n.png",
                specularPath: "res:/example/hair_s.png",
                lightingMode: "neutral-specular",
                materialMode: "selected",
                attachedEffects: 2,
                attachedRigidEffects: 1,
                hiddenDeferredConsumers: 1,
                consumers: [ {
                    meshName: "HairMeshShape",
                    areaField: "transparentAreas",
                    areaName: "hair",
                    display: true,
                    effectName: "hairshader",
                    effectPath: "res:/example/hair.sm_hi",
                    targetRole: "hair",
                    authoredRegion: [ 0.5, 0.5, 0.75, 1 ],
                    effect: { mustNotLeak: true }
                } ],
                excludedConsumers: [ {
                    meshName: "HeadShell",
                    targetRole: "head",
                    reason: "authored-material-target-is-head"
                } ]
            } ],
            deferred: []
        },
        configuredHeadwearMaterials: {
            status: "deferred",
            applied: [],
            deferred: [ {
                partIndex: 8,
                partSourceRecordID: "female/hair/example",
                reason: "private-headwear-effect-unavailable"
            } ]
        },
        configuredHeadMaterials: {
            status: "applied",
            channels: [ {
                name: "DiffuseMap",
                diagnosticMode: "authored",
                passes: [ {
                    mode: "colorized-layer",
                    detailPath: "res:/example/comp_head_l.png",
                    groupID: "hair",
                    layerIndex: 8,
                    role: "diffuse-overlay",
                    livePass: { mustNotLeak: true }
                } ],
                policySuppressed: []
            } ]
        },
        composition: {
            status: "composed",
            diagnosticMode: "authored",
            passes: [ {
                mode: "colorized-layer",
                detailPath: "res:/example/comp_body_l.png",
                groupID: "topmiddle",
                layerIndex: 9,
                role: "diffuse-overlay",
                placement: [ 0, 0, 1, 1 ]
            } ],
            bodyNormal: {
                status: "applied",
                diagnosticMode: "authored-additive-detail-normal",
                operationCount: 1,
                passes: [ {
                    mode: "normal-replace",
                    path: "res:/example/comp_body_n.png",
                    role: "normal-overlay",
                    target: "body",
                    groupID: "topunderwear",
                    placement: [ 0.1, 0.2, 0.3, 0.4 ],
                    liveEffect: { mustNotLeak: true }
                } ],
                deferred: []
            },
            bodySpecular: null,
            deferred: []
        },
        foundationCoverage: [ {
            ownerPartIndex: 4,
            role: "torso",
            strategy: "hide-carrier",
            status: "ready",
            liveLease: { mustNotLeak: true }
        } ]
    });

    assert.equal(summary.configuredParts[0].compositionStatus,
        "configured-garment-baked-partial");
    assert.equal(summary.configuredParts[0].geometryBindingSource,
        "retained-explicit");
    assert.equal(summary.garmentMaterials.applied[0].realizationStatus, "partial");
    assert.equal(summary.garmentMaterials.applied[0].bindings[0].areaContract,
        "opaque-only");
    assert.deepEqual(
        summary.garmentMaterials.applied[0].bindings[0].appliedCutMaskInfluence,
        [ 0, 0, 0, 0 ]
    );
    assert.equal(
        summary.garmentMaterials.applied[0].bindings[0].appliedCutMaskPolicy,
        "authored-influence-with-neutral-white-mask"
    );
    assert.equal(summary.garmentMaterials.deferred[0].channel, "lighting");
    assert.equal(summary.hairMaterials.applied[0].attachedRigidEffects, 1);
    assert.equal(summary.hairMaterials.applied[0].consumers[0].targetRole, "hair");
    assert.equal(summary.hairMaterials.applied[0].excludedConsumers[0].reason,
        "authored-material-target-is-head");
    assert.equal(summary.headwearMaterials.deferred[0].reason,
        "private-headwear-effect-unavailable");
    assert.equal(summary.headMaterials.channels[0].passes[0].groupID, "hair");
    assert.equal(summary.headMaterials.channels[0].passes[0].channel, "DiffuseMap");
    assert.equal(summary.bodyComposition.bodyNormal.operationCount, 1);
    assert.equal(summary.bodyComposition.bodyDiffuse.passes[0].groupID, "topmiddle");
    assert.equal(summary.bodyComposition.bodyNormal.passes[0].groupID,
        "topunderwear");
    assert.deepEqual(summary.foundationCoverage, [ {
        ownerPartIndex: 4,
        role: "torso",
        strategy: "hide-carrier",
        status: "ready"
    } ]);
    assert.equal(JSON.stringify(summary).includes("mustNotLeak"), false);
});

test("clothing audit summary accepts a renderer without adapter details", () =>
{
    assert.equal(summarizeClothingRendererDetails(null), null);
    assert.deepEqual(summarizeClothingRendererDetails({}), {
        configuredParts: [],
        garmentMaterials: null,
        hairMaterials: null,
        headwearMaterials: null,
        headMaterials: null,
        bodyComposition: null,
        foundationCoverage: []
    });
});

function ApparelResource(recordID, partSourceRecordID, resPath, resGender = 0)
{
    return {
        recordID,
        resGender,
        resPath,
        partType: {
            partSource: { recordID: partSourceRecordID }
        }
    };
}

function Modifier(modifierLocationID, paperdollResourceID, variation)
{
    return {
        modifierLocationID,
        paperdollResourceID,
        paperdollResourceVariation: variation
    };
}

function Paperdoll(recordID, modifiers)
{
    return { recordID, modifiers };
}
