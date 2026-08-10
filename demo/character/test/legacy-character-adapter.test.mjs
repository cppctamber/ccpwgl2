import assert from "node:assert/strict";
import test from "node:test";

import { CcpwglLegacyCharacterAdapter } from "../src/character/CcpwglLegacyCharacterAdapter.mjs";

test("legacy adapter stages and commits the exact female LOD0 foundation", async () =>
{
    const fixture = CreateFixture();
    const adapter = new CcpwglLegacyCharacterAdapter({
        tiny: fixture.tiny,
        tw2: fixture.tw2
    });
    const construction = CreateConstruction("female", [
        [ "head", "res:/custom/female-head.gr2" ],
        [ "body", "res:/custom/female-body.gr2" ]
    ]);
    const appearancePlan = { id: 1 };
    const staged = await adapter.Prepare(construction, { appearancePlan });

    assert.equal(fixture.initializeCalls.length, 1);
    assert.equal(
        fixture.initializeCalls[0].paths.res,
        "http://127.0.0.1:3000/ccp/3453885/resources"
    );
    assert.equal(staged.sex, "female");
    assert.deepEqual(fixture.fetches, [
        "res:/custom/female-skeleton.gr2",
        "res:/custom/female-head.gr2",
        "res:/custom/female-body.gr2"
    ]);
    assert.equal(staged.construction, construction);
    assert.equal(staged.appearancePlan, appearancePlan);
    assert.equal(staged.shaderPath, "res:/custom/female-avatar.sm_hi");
    assert.equal(staged.backend.display, false);
    assert.equal(staged.backend.bound, true);
    assert.equal(fixture.watched, staged.backend);
    assert.equal(fixture.scene.objects.length, 1);
    assert.deepEqual(staged.backend.interiorLights.map(light => light.values), [
        {
            name: "character_front",
            primaryLighting: true,
            position: [ 0, 190, 135 ],
            color: [ 2.2, 2.2, 2.2, 1 ],
            radius: 300,
            falloff: 1
        },
        {
            name: "character_left",
            primaryLighting: true,
            position: [ -190, 0, 115 ],
            color: [ 1.8, 1.8, 1.8, 1 ],
            radius: 280,
            falloff: 1
        },
        {
            name: "character_right",
            primaryLighting: true,
            position: [ 190, 0, 115 ],
            color: [ 1.8, 1.8, 1.8, 1 ],
            radius: 280,
            falloff: 1
        },
        {
            name: "character_back",
            primaryLighting: true,
            position: [ 0, -200, 150 ],
            color: [ 1.6, 1.6, 1.6, 1 ],
            radius: 320,
            falloff: 1
        }
    ]);
    assert.doesNotMatch(JSON.stringify(fixture.fetches), /cewg|mask/u);

    adapter.Commit(staged);
    assert.equal(staged.backend.display, true);

    assert.equal(adapter.Release(staged), true);
    assert.equal(fixture.scene.objects.length, 0);
});

test("legacy adapter initializes once and routes a male paper doll to male sources", async () =>
{
    const fixture = CreateFixture();
    const adapter = new CcpwglLegacyCharacterAdapter({
        tiny: fixture.tiny,
        tw2: fixture.tw2
    });
    const construction = CreateConstruction("male", [
        [ "head", "res:/custom/male-head.gr2" ],
        [ "torso", "res:/custom/male-torso.gr2" ],
        [ "legs", "res:/custom/male-legs.gr2" ],
        [ "hands", "res:/custom/male-hands.gr2" ],
        [ "feet", "res:/custom/male-feet.gr2" ]
    ]);
    const first = await adapter.Prepare(construction);
    const second = await adapter.Prepare(construction);

    assert.equal(fixture.initializeCalls.length, 1);
    assert.equal(first.sex, "male");
    assert.equal(second.sex, "male");
    assert.equal(first.geometryPaths.length, 5);
    assert.equal(first.skeletonPath, "res:/custom/male-skeleton.gr2");

    adapter.Release(first);
    adapter.Release(second);
});

test("legacy adapter applies and reports only the exact female LOD0 palette policy", async () =>
{
    const fixture = CreateFixture();
    const calls = [];
    const adapter = new CcpwglLegacyCharacterAdapter({
        tiny: fixture.tiny,
        tw2: fixture.tw2,
        paletteCompatibility: {
            async Apply(resource, policy, options)
            {
                calls.push({ resource, policy, options });
                return {
                    status: "applied",
                    rule: policy.rule,
                    shaderCapacity: 58,
                    requiredBoneCount: 69,
                    bonePrefixes: [ "RightHand" ],
                    matchedBoneCount: 17,
                    maskedVertexCount: 859,
                    maskedTriangleCount: 1389,
                    meshReports: []
                };
            }
        }
    });
    const construction = CreateConstruction("female", [
        [ "head", "res:/custom/female-head.gr2" ],
        [ "body", "res:/graphics/character/female/paperdoll/basenude/basenude.gr2" ]
    ]);
    construction.operations[2].compatibility = {
        status: "policy",
        rule: "legacy-opengl-bone-capacity-mask-v1",
        shaderCapacity: 58,
        requiredBoneCount: 69,
        bonePrefixes: [ "RightHand" ]
    };

    const staged = await adapter.Prepare(construction);
    const diagnostics = adapter.GetDiagnostics(staged);

    assert.equal(calls.length, 1);
    assert.equal(calls[0].resource.path, construction.operations[2].resourcePath);
    assert.strictEqual(calls[0].policy, construction.operations[2].compatibility);
    assert.equal(diagnostics.paletteCompatibilityCount, 1);
    assert.equal(diagnostics.paletteCompatibility[0].role, "body");
    assert.equal(diagnostics.paletteCompatibility[0].maskedTriangleCount, 1389);

    const invalid = CreateConstruction("male", [
        [ "body", "res:/graphics/character/female/paperdoll/basenude/basenude.gr2" ]
    ]);
    invalid.operations[1].compatibility = construction.operations[2].compatibility;
    await assert.rejects(
        adapter.Prepare(invalid),
        /restricted to the exact female LOD0 body policy/u
    );

    adapter.Release(staged);
});

test("legacy adapter rejects malformed construction before loading assets", async () =>
{
    const fixture = CreateFixture();
    const adapter = new CcpwglLegacyCharacterAdapter({
        tiny: fixture.tiny,
        tw2: fixture.tw2
    });

    await assert.rejects(
        adapter.Prepare({
            ...CreateConstruction("female"),
            backend: "webgl"
        }),
        /requires the legacy-opengl backend/u
    );
    await assert.rejects(
        adapter.Prepare({
            ...CreateConstruction("female"),
            sourceBuild: "latest"
        }),
        /exact numeric sourceBuild/u
    );
    assert.deepEqual(fixture.fetches, []);
});

test("legacy adapter rejects mutated texture contribution identity before loading assets", async () =>
{
    const fixture = CreateFixture();
    const adapter = new CcpwglLegacyCharacterAdapter({
        tiny: fixture.tiny,
        tw2: fixture.tw2
    });
    const construction = CreateAppearanceConstruction();

    construction.textureContributions[0].groupID = "bottomouter";

    await assert.rejects(
        adapter.Prepare(construction),
        /texture contribution identity does not match its layer/u
    );
    assert.deepEqual(fixture.fetches, []);
});

test("legacy adapter rejects non-contiguous geometry and unsupported LOD", async () =>
{
    const fixture = CreateFixture();
    const adapter = new CcpwglLegacyCharacterAdapter({
        tiny: fixture.tiny,
        tw2: fixture.tw2
    });
    const badGeometry = CreateConstruction("female");

    badGeometry.operations[1].index = 2;

    await assert.rejects(
        adapter.Prepare(badGeometry),
        /contiguous ordered indices/u
    );
    await assert.rejects(
        adapter.Prepare({ ...CreateConstruction("female"), lod: 1 }),
        /requires whole-character LOD 0/u
    );
    assert.deepEqual(fixture.fetches, []);
});

test("legacy adapter attaches exact configured pairs without replacing authored effects", async () =>
{
    const fixture = CreateFixture();
    const adapter = new CcpwglLegacyCharacterAdapter({
        tiny: fixture.tiny,
        tw2: fixture.tw2,
        atlasComposer: DEFERRED_ATLAS_COMPOSER
    });
    const construction = CreateConstruction("female");

    construction.evidence = {
        status: "policy",
        rule: "legacy-opengl-appearance-v1"
    };
    construction.resolvedPartCount = 1;
    construction.configuredPartCount = 1;
    construction.deferredContributionCount = 0;
    construction.textureContributions = [ IdentityContribution("feet") ];
    construction.operations.splice(-1, 0, {
        operation: "configured-part",
        layerIndex: 0,
        partIndex: 0,
        groupID: "feet",
        partSourceRecordID: "female/feet/bootscf01",
        configurationPath: "res:/custom/boots.black",
        geometryPath: "res:/custom/boots.gr2",
        evidence: {
            status: "derived",
            rule: "unique-version-candidates"
        }
    });

    const staged = await adapter.Prepare(construction);
    const configuredMesh = fixture.configuredModels[0].meshes[0];

    assert.deepEqual(fixture.fetches, [
        "res:/custom/female-skeleton.gr2",
        "res:/custom/female-body.gr2",
        "res:/custom/boots.black",
        "res:/custom/boots.gr2"
    ]);
    assert.equal(staged.backend.visualModel.meshes.includes(configuredMesh), true);
    assert.equal(configuredMesh.meshIndex, 1);
    assert.equal(configuredMesh.opaqueAreas[0].meshIndex, 1);
    assert.equal(configuredMesh.opaqueAreas[0].effect.textures, undefined);
    assert.deepEqual(staged.configuredParts, [ {
        groupID: "feet",
        layerIndex: 0,
        partIndex: 0,
        partSourceRecordID: "female/feet/bootscf01",
        configurationPath: "res:/custom/boots.black",
        geometryPath: "res:/custom/boots.gr2",
        meshCount: 1,
        authoredMeshIndexCount: 1,
        modelBindingMeshIndexCount: 0,
        effectCount: 1,
        geometryStatus: "attached",
        authoredEffectStatus: "ready",
        proofFallbackEffectCount: 0,
        proofEffectStatus: "not-required",
        renderStatus: "ready",
        displayStatus: "visible",
        materialStatus: "deferred",
        compositionStatus: "deferred",
        foundationCoverage: null
    } ]);

    assert.deepEqual(
        adapter.SetConfiguredPartDisplay(staged, "female/feet/bootscf01", false),
        {
            partSourceRecordID: "female/feet/bootscf01",
            display: false,
            meshCount: 1
        }
    );
    assert.equal(configuredMesh.display, false);
    adapter.SetConfiguredPartDisplay(staged, "female/feet/bootscf01", true);
    assert.equal(configuredMesh.display, true);
    assert.throws(
        () => adapter.SetConfiguredPartDisplay(staged, "female/feet/missing", false),
        /not attached/u
    );
    assert.deepEqual(adapter.GetDiagnostics(staged), {
        foundationGeometryCount: 1,
        configuredPartCount: 1,
        configuredParts: staged.configuredParts,
        deferredContributionCount: 0,
        deferredContributions: [],
        foundationCoverageCount: 0,
        foundationCoverage: [],
        paletteCompatibilityCount: 0,
        paletteCompatibility: [],
        tuckSupport: {
            status: "deferred",
            reason: "exact-tuck-composer-unavailable"
        },
        upperSleeve: {
            status: "deferred",
            reason: "exact-upper-sleeve-composer-unavailable"
        },
        lowerSleeve: {
            status: "deferred",
            reason: "exact-lower-sleeve-composer-unavailable"
        },
        foundationCutMask: {
            status: "deferred",
            reason: "foundation-cut-composer-unavailable"
        },
        textureContributionCount: 1,
        textureContributions: staged.textureContributions,
        composition: {
            status: "deferred",
            reason: "test-composition-not-under-test",
            passes: [],
            targetSize: undefined,
            deferred: undefined
        }
    });

    adapter.Release(staged);
});

test("legacy adapter applies exact material policies only after final configured readiness", async () =>
{
    const fixture = CreateFixture({ configuredEffectReady: false });
    const calls = [];
    const target = {
        destroyed: false,
        Destroy()
        {
            this.destroyed = true;
        }
    };
    const adapter = new CcpwglLegacyCharacterAdapter({
        tiny: fixture.tiny,
        tw2: fixture.tw2,
        foundationCutMaskEnabled: false,
        lowerSleeveMaterialEnabled: false,
        tuckPantsRgbEnabled: false,
        upperSleeveMaterialEnabled: false,
        atlasComposer: {
            async Compose(staged)
            {
                calls.push("compose");
                staged.compositionTargets = [ target ];
                staged.composedBodyDiffuseTexture = { name: "shared-body" };
                return { status: "composed", passes: [] };
            },
            async ComposeExactFemaleTuckSupport(staged, options)
            {
                calls.push("tuck");
                assert.equal(staged.configuredParts[0].renderStatus, "ready");
                assert.deepEqual(options, { usePantsRgb: false });
                return { status: "applied", rule: "test-exact-tuck" };
            },
            async ComposeExactFemaleUpperSleeve(staged, options)
            {
                calls.push("upper-sleeve");
                assert.equal(staged.configuredParts[0].renderStatus, "ready");
                assert.deepEqual(options, { attach: false });
                return { status: "applied", rule: "test-exact-upper-sleeve" };
            },
            async ComposeExactFemaleLowerSleeve(staged, options)
            {
                calls.push("lower-sleeve");
                assert.equal(staged.configuredParts[0].renderStatus, "ready");
                assert.deepEqual(options, { attach: false });
                return { status: "applied", rule: "test-exact-lower-sleeve" };
            },
            async ComposeFoundationCutMask(staged, options)
            {
                calls.push("foundation-cut");
                assert.equal(staged.configuredParts[0].renderStatus, "ready");
                assert.deepEqual(options, { attach: false });
                return { status: "deferred", reason: "not-under-test" };
            }
        }
    });

    const staged = await adapter.Prepare(CreateAppearanceConstruction());
    assert.deepEqual(calls, [
        "compose", "tuck", "upper-sleeve", "lower-sleeve", "foundation-cut"
    ]);
    assert.deepEqual(adapter.GetDiagnostics(staged).tuckSupport, {
        status: "applied",
        rule: "test-exact-tuck"
    });
    assert.deepEqual(adapter.GetDiagnostics(staged).upperSleeve, {
        status: "applied",
        rule: "test-exact-upper-sleeve"
    });
    assert.deepEqual(adapter.GetDiagnostics(staged).lowerSleeve, {
        status: "applied",
        rule: "test-exact-lower-sleeve"
    });

    adapter.Release(staged);
    assert.equal(target.destroyed, true);
    assert.equal(staged.composedBodyDiffuseTexture, null);
});

test("legacy adapter visualizes a failed authored effect with the verified GLES proof shader", async () =>
{
    const fixture = CreateFixture({ configuredEffectReady: false });
    const adapter = new CcpwglLegacyCharacterAdapter({
        tiny: fixture.tiny,
        tw2: fixture.tw2,
        atlasComposer: DEFERRED_ATLAS_COMPOSER
    });
    const construction = CreateAppearanceConstruction();
    const staged = await adapter.Prepare(construction);
    const effect = fixture.configuredModels[0].meshes[0].opaqueAreas[0].effect;

    assert.equal(effect.effectFilePath, "res:/custom/female-avatar.sm_hi");
    assert.equal(effect.initialized, true);
    assert.deepEqual(effect._characterAuthoredTexturePaths, {
        DiffuseMap: "res:/custom/authored-diffuse.png"
    });
    assert.deepEqual(effect._characterAuthoredTransformUV0, [ 0, 0, 0.5, 1 ]);
    assert.equal(
        effect.textures.DiffuseMap,
        "res:/dx9/model/decal/shared/bw_000_000_065.dds"
    );
    assert.equal(staged.configuredParts[0].authoredEffectStatus, "deferred");
    assert.equal(staged.configuredParts[0].proofFallbackEffectCount, 1);
    assert.equal(staged.configuredParts[0].proofEffectStatus, "ready");
    assert.equal(staged.configuredParts[0].materialStatus, "deferred");

    adapter.Release(staged);
});

test("legacy adapter does not treat a linked shader without DiffuseMap as a renderable garment", async () =>
{
    const fixture = CreateFixture({ configuredDiffusePath: "" });
    const adapter = new CcpwglLegacyCharacterAdapter({
        tiny: fixture.tiny,
        tw2: fixture.tw2,
        atlasComposer: DEFERRED_ATLAS_COMPOSER
    });
    const staged = await adapter.Prepare(CreateAppearanceConstruction());
    const effect = fixture.configuredModels[0].meshes[0].opaqueAreas[0].effect;

    assert.equal(staged.configuredParts[0].authoredEffectStatus, "deferred");
    assert.equal(staged.configuredParts[0].proofFallbackEffectCount, 1);
    assert.equal(staged.configuredParts[0].proofEffectStatus, "ready");
    assert.equal(effect._characterAuthoredEffectFilePath, "");
    assert.equal(effect.effectFilePath, "res:/custom/female-avatar.sm_hi");
    assert.equal(
        effect.textures.DiffuseMap,
        "res:/dx9/model/decal/shared/bw_000_000_065.dds"
    );

    adapter.Release(staged);
});

test("legacy adapter hides every exact male feet carrier after reviewed boots attach", async () =>
{
    const fixture = CreateFixture({ expandMaleFeetFoundation: true });
    const construction = CreateMaleBootCoverageConstruction();
    let compositionSawVisibleFeet = false;
    let finalWatchSawVisibleFeet = false;
    const watch = fixture.tw2.resMan.Watch;

    fixture.tw2.resMan.Watch = async value =>
    {
        if (value?.visualModel)
        {
            finalWatchSawVisibleFeet = value.visualModel.meshes
                .filter(mesh => mesh._characterFoundationRole === "feet")
                .every(mesh => mesh.display !== false);
        }
        return watch(value);
    };
    const adapter = new CcpwglLegacyCharacterAdapter({
        tiny: fixture.tiny,
        tw2: fixture.tw2,
        atlasComposer: {
            async Compose(staged)
            {
                compositionSawVisibleFeet = staged.backend.visualModel.meshes
                    .filter(mesh => mesh._characterFoundationRole === "feet")
                    .every(mesh => mesh.display !== false);
                return { status: "composed", passes: [] };
            }
        }
    });
    const staged = await adapter.Prepare(construction);
    const torso = staged.backend.visualModel.meshes.find(mesh =>
        mesh._characterFoundationRole === "torso");
    const feet = staged.backend.visualModel.meshes.filter(mesh =>
        mesh._characterFoundationRole === "feet");

    assert.equal(torso.display, true);
    assert.equal(compositionSawVisibleFeet, true);
    assert.equal(finalWatchSawVisibleFeet, true);
    assert.equal(feet.length, 2);
    assert.deepEqual(feet.map(mesh => mesh.display), [ false, false ]);
    assert.deepEqual(staged.foundationCoverage, [ {
        status: "applied",
        reason: null,
        partSourceRecordID: "male/feet/bootsam01",
        roles: [ "feet" ],
        strategy: "hide-carrier",
        evidence: {
            status: "policy",
            rule: "legacy-opengl-exact-foundation-coverage-v1",
            sex: "male",
            groupID: "feet",
            partSourceRecordID: "male/feet/bootsam01"
        },
        applied: [ {
            role: "feet",
            meshIndex: 1,
            previousDisplay: true,
            display: false
        }, {
            role: "feet",
            meshIndex: 2,
            previousDisplay: true,
            display: false
        } ]
    } ]);
    assert.deepEqual(
        staged.configuredParts[0].foundationCoverage,
        staged.foundationCoverage[0]
    );
    assert.deepEqual(
        adapter.GetDiagnostics(staged).foundationCoverage,
        staged.foundationCoverage
    );

    adapter.Release(staged);

    const rebuilt = await adapter.Prepare(CreateConstruction("male", [
        [ "torso", "res:/custom/male-torso.gr2" ],
        [ "feet", "res:/custom/male-feet.gr2" ]
    ]));
    const rebuiltFeet = rebuilt.backend.visualModel.meshes.find(mesh =>
        mesh._characterFoundationRole === "feet");

    assert.equal(rebuiltFeet.display, true);
    assert.deepEqual(rebuilt.foundationCoverage, []);
    adapter.Release(rebuilt);
});

test("legacy adapter commits and releases exact female boot triangle coverage", async () =>
{
    const fixture = CreateFixture();
    const calls = [];
    const construction = CreateAppearanceConstruction();
    const configured = construction.operations.find(value => value.operation === "configured-part");
    configured.foundationCoverage = {
        strategy: "triangle-mask",
        roles: [ "body" ],
        triangleRule: "legacy-opengl-exact-foundation-triangle-coverage-v1",
        bonePrefixes: [ "LeftFoot", "RightFoot", "LeftToe", "RightToe" ],
        evidence: {
            status: "policy",
            rule: "legacy-opengl-exact-foundation-coverage-v1",
            sex: "female",
            groupID: "feet",
            partSourceRecordID: "female/feet/bootscf01"
        }
    };
    const adapter = new CcpwglLegacyCharacterAdapter({
        tiny: fixture.tiny,
        tw2: fixture.tw2,
        atlasComposer: DEFERRED_ATLAS_COMPOSER,
        triangleCoverage: {
            async Acquire(resource, policy, options)
            {
                calls.push({ operation: "acquire", resource, policy, options });
                return {
                    lease: { id: 1 },
                    report: {
                        status: "applied",
                        rule: policy.triangleRule,
                        bonePrefixes: [ ...policy.bonePrefixes ],
                        matchedBoneCount: 4,
                        maskedVertexCount: 348,
                        maskedTriangleCount: 618,
                        meshReports: []
                    }
                };
            },
            Release(resource, lease, options)
            {
                calls.push({ operation: "release", resource, lease, options });
                return true;
            }
        }
    });
    const staged = await adapter.Prepare(construction);

    assert.equal(staged.foundationCoverage[0].status, "pending-commit");
    assert.equal(staged.backend.display, false);
    assert.equal(calls.length, 0);

    await adapter.Commit(staged);

    assert.equal(calls[0].operation, "acquire");
    assert.equal(calls[0].resource.path, "res:/custom/female-body.gr2");
    assert.equal(staged.backend.display, true);
    assert.equal(staged.foundationCoverage[0].status, "applied");
    assert.equal(staged.foundationCoverage[0].applied[0].maskedTriangleCount, 618);

    assert.equal(adapter.Release(staged), true);
    assert.equal(calls[1].operation, "release");
});

test("legacy adapter defers exact coverage when the configured boot is not render-ready", async () =>
{
    const fixture = CreateFixture({
        configuredEffectReady: false,
        configuredEffectInitializesReady: false
    });
    const adapter = new CcpwglLegacyCharacterAdapter({
        tiny: fixture.tiny,
        tw2: fixture.tw2,
        atlasComposer: DEFERRED_ATLAS_COMPOSER
    });
    const staged = await adapter.Prepare(CreateMaleBootCoverageConstruction());
    const feet = staged.backend.visualModel.meshes.find(mesh =>
        mesh._characterFoundationRole === "feet");

    assert.equal(feet.display, true);
    assert.equal(staged.configuredParts[0].renderStatus, "deferred-not-render-ready");
    assert.deepEqual(staged.foundationCoverage, [ {
        status: "deferred-not-render-ready",
        reason: "configured-part-not-render-ready",
        partSourceRecordID: "male/feet/bootsam01",
        roles: [ "feet" ],
        strategy: "hide-carrier",
        evidence: {
            status: "policy",
            rule: "legacy-opengl-exact-foundation-coverage-v1",
            sex: "male",
            groupID: "feet",
            partSourceRecordID: "male/feet/bootsam01"
        },
        applied: []
    } ]);
    assert.deepEqual(
        adapter.GetDiagnostics(staged).foundationCoverage,
        staged.foundationCoverage
    );

    adapter.Release(staged);
});

test("legacy adapter leaves male foundation visible when configured footwear fails", async () =>
{
    const fixture = CreateFixture({
        configuredMeshIndex: 3,
        geometryBindingIndex: null
    });
    const adapter = new CcpwglLegacyCharacterAdapter({
        tiny: fixture.tiny,
        tw2: fixture.tw2
    });

    await assert.rejects(
        adapter.Prepare(CreateMaleBootCoverageConstruction()),
        /no exact geometry binding/u
    );

    const feet = fixture.createdMeshes.find(mesh =>
        mesh._characterFoundationRole === "feet");

    assert.equal(feet.display, true);
    assert.equal(fixture.scene.objects.length, 0);
});

test("legacy adapter retains a deferred texture-only contribution without fetching fabricated geometry", async () =>
{
    const fixture = CreateFixture();
    const adapter = new CcpwglLegacyCharacterAdapter({
        tiny: fixture.tiny,
        tw2: fixture.tw2,
        atlasComposer: DEFERRED_ATLAS_COMPOSER
    });
    const construction = CreateConstruction("female");

    construction.evidence = {
        status: "policy",
        rule: "legacy-opengl-appearance-v1"
    };
    construction.resolvedPartCount = 1;
    construction.configuredPartCount = 0;
    construction.deferredContributionCount = 1;
    construction.textureContributions = [ IdentityContribution("topmiddle") ];
    construction.operations.splice(-1, 0, {
        operation: "deferred-contribution",
        layerIndex: 0,
        partIndex: 0,
        groupID: "topmiddle",
        partSourceRecordID: "female/topmiddle/shirtcf01",
        configurationPath: null,
        geometryPath: null,
        evidence: {
            status: "derived",
            document: "characterPartSources",
            recordID: "female/topmiddle/shirtcf01",
            rule: "exact-source-version"
        }
    });

    const staged = await adapter.Prepare(construction);

    assert.deepEqual(fixture.fetches, [
        "res:/custom/female-skeleton.gr2",
        "res:/custom/female-body.gr2"
    ]);
    assert.deepEqual(staged.deferredContributions, [ {
        groupID: "topmiddle",
        layerIndex: 0,
        partIndex: 0,
        partSourceRecordID: "female/topmiddle/shirtcf01",
        configurationPath: null,
        geometryPath: null,
        evidence: {
            status: "derived",
            document: "characterPartSources",
            recordID: "female/topmiddle/shirtcf01",
            rule: "exact-source-version"
        },
        status: "retained-not-rendered"
    } ]);

    adapter.Release(staged);
});

test("legacy adapter carries retained texture evidence through the injected composer", async () =>
{
    const fixture = CreateFixture();
    let composedStage = null;
    const adapter = new CcpwglLegacyCharacterAdapter({
        tiny: fixture.tiny,
        tw2: fixture.tw2,
        atlasComposer: {
            async Compose(staged)
            {
                composedStage = staged;
                return {
                    status: "composed-partial",
                    contributionCount: staged.textureContributions.length,
                    composedContributionCount: 0,
                    deferredContributionCount: 1,
                    passes: [],
                    deferred: [ {
                        layerIndex: 0,
                        groupID: "topmiddle",
                        reason: "pattern-composition-unresolved"
                    } ]
                };
            }
        }
    });
    const construction = CreateConstruction("female");

    construction.evidence = {
        status: "policy",
        rule: "legacy-opengl-appearance-v1"
    };
    construction.resolvedPartCount = 1;
    construction.configuredPartCount = 0;
    construction.deferredContributionCount = 1;
    construction.operations.splice(-1, 0, {
        operation: "deferred-contribution",
        layerIndex: 0,
        partIndex: 0,
        groupID: "topmiddle",
        configurationPath: null,
        geometryPath: null
    });
    construction.textureContributions = [ {
        layerIndex: 0,
        partIndex: 0,
        groupID: "topmiddle",
        source: { partSourceRecordID: "female/topmiddle/shirtcf01" },
        materialValues: {
            pattern: "res:/pattern.png",
            colors: [ [ 1, 0, 0, 1 ] ]
        },
        textureCandidates: [ {
            path: "res:/shirt_detail.png",
            recognized: true,
            selected: true
        } ],
        selectedTextures: [ {
            path: "res:/shirt_detail.png",
            role: "colorize-layer",
            target: "body",
            quality: "4k"
        } ],
        diagnostics: [],
        evidence: { rule: "exact-retained-definition-v1" }
    } ];

    const staged = await adapter.Prepare(construction);
    const diagnostics = adapter.GetDiagnostics(staged);

    assert.strictEqual(composedStage, staged);
    assert.notStrictEqual(staged.textureContributions, construction.textureContributions);
    assert.deepEqual(staged.textureContributions, construction.textureContributions);
    assert.notStrictEqual(
        staged.textureContributions[0].materialValues,
        construction.textureContributions[0].materialValues
    );
    assert.equal(diagnostics.textureContributionCount, 1);
    assert.deepEqual(diagnostics.composition.deferred, [ {
        layerIndex: 0,
        groupID: "topmiddle",
        reason: "pattern-composition-unresolved"
    } ]);

    diagnostics.textureContributions[0].materialValues.pattern = "res:/mutated.png";
    diagnostics.textureContributions[0].materialValues.colors[0][0] = 0;
    assert.equal(staged.textureContributions[0].materialValues.pattern, "res:/pattern.png");
    assert.deepEqual(staged.textureContributions[0].materialValues.colors, [ [ 1, 0, 0, 1 ] ]);
    assert.equal(construction.textureContributions[0].materialValues.pattern, "res:/pattern.png");

    adapter.Release(staged);
});

test("legacy adapter uses the skinned-model geometry binding when the Black index is not a GR2 index", async () =>
{
    const fixture = CreateFixture({
        configuredMeshIndex: 3,
        geometryBindingIndex: 0
    });
    const adapter = new CcpwglLegacyCharacterAdapter({
        tiny: fixture.tiny,
        tw2: fixture.tw2,
        atlasComposer: DEFERRED_ATLAS_COMPOSER
    });
    const construction = CreateConstruction("female");

    construction.evidence = {
        status: "policy",
        rule: "legacy-opengl-appearance-v1"
    };
    construction.resolvedPartCount = 1;
    construction.configuredPartCount = 1;
    construction.deferredContributionCount = 0;
    construction.textureContributions = [ IdentityContribution("feet") ];
    construction.operations.splice(-1, 0, {
        operation: "configured-part",
        layerIndex: 0,
        partIndex: 0,
        groupID: "feet",
        partSourceRecordID: "female/feet/bootscf01",
        configurationPath: "res:/custom/boots.black",
        geometryPath: "res:/custom/boots.gr2"
    });

    const staged = await adapter.Prepare(construction);
    const configuredMesh = fixture.configuredModels[0].meshes[0];

    assert.equal(configuredMesh.meshIndex, 0);
    assert.equal(configuredMesh.opaqueAreas[0].meshIndex, 0);
    assert.equal(staged.configuredParts[0].authoredMeshIndexCount, 0);
    assert.equal(staged.configuredParts[0].modelBindingMeshIndexCount, 1);

    adapter.Release(staged);
});

test("legacy adapter rejects configured parts without an authored or model-resolved geometry binding", async () =>
{
    const fixture = CreateFixture({
        configuredMeshIndex: 3,
        geometryBindingIndex: null
    });
    const adapter = new CcpwglLegacyCharacterAdapter({
        tiny: fixture.tiny,
        tw2: fixture.tw2
    });
    const construction = CreateConstruction("female");

    construction.evidence = {
        status: "policy",
        rule: "legacy-opengl-appearance-v1"
    };
    construction.resolvedPartCount = 1;
    construction.configuredPartCount = 1;
    construction.deferredContributionCount = 0;
    construction.textureContributions = [ IdentityContribution("feet") ];
    construction.operations.splice(-1, 0, {
        operation: "configured-part",
        layerIndex: 0,
        partIndex: 0,
        groupID: "feet",
        partSourceRecordID: "female/feet/bootscf01",
        configurationPath: "res:/custom/boots.black",
        geometryPath: "res:/custom/boots.gr2"
    });

    await assert.rejects(
        adapter.Prepare(construction),
        /no exact geometry binding/u
    );
    assert.equal(fixture.scene.objects.length, 0);
});

function CreateConstruction(sex, geometry = [ [ "body", `res:/custom/${sex}-body.gr2` ] ])
{
    return {
        backend: "legacy-opengl",
        evidence: {
            status: "policy",
            rule: "legacy-opengl-foundation-v1"
        },
        paperdollRecordID: "3000001",
        sourceBuild: "3453885",
        sex,
        lod: 0,
        textureContributions: [],
        operations: [ {
            operation: "skeleton",
            resourcePath: `res:/custom/${sex}-skeleton.gr2`
        }, ...geometry.map(([ role, resourcePath ], index) => ({
            operation: "geometry",
            role,
            index,
            resourcePath
        })), {
            operation: "rebuild-areas",
            shaderPath: `res:/custom/${sex}-avatar.sm_hi`
        }, {
            operation: "proof-textures",
            profile: "neutral"
        }, {
            operation: "bind-animation"
        } ]
    };
}

function CreateAppearanceConstruction()
{
    const construction = CreateConstruction("female");

    construction.evidence = {
        status: "policy",
        rule: "legacy-opengl-appearance-v1"
    };
    construction.resolvedPartCount = 1;
    construction.configuredPartCount = 1;
    construction.deferredContributionCount = 0;
    construction.textureContributions = [ IdentityContribution("feet") ];
    construction.operations.splice(-1, 0, {
        operation: "configured-part",
        layerIndex: 0,
        partIndex: 0,
        groupID: "feet",
        partSourceRecordID: "female/feet/bootscf01",
        configurationPath: "res:/custom/boots.black",
        geometryPath: "res:/custom/boots.gr2"
    });
    return construction;
}

function CreateMaleBootCoverageConstruction()
{
    const construction = CreateConstruction("male", [
        [ "torso", "res:/custom/male-torso.gr2" ],
        [ "feet", "res:/custom/male-feet.gr2" ]
    ]);

    construction.evidence = {
        status: "policy",
        rule: "legacy-opengl-appearance-v1"
    };
    construction.resolvedPartCount = 1;
    construction.configuredPartCount = 1;
    construction.deferredContributionCount = 0;
    construction.textureContributions = [ IdentityContribution("feet") ];
    construction.operations.splice(-1, 0, {
        operation: "configured-part",
        layerIndex: 0,
        partIndex: 0,
        groupID: "feet",
        partSourceRecordID: "male/feet/bootsam01",
        configurationPath: "res:/custom/boots.black",
        geometryPath: "res:/custom/boots.gr2",
        foundationCoverage: {
            strategy: "hide-carrier",
            roles: [ "feet" ],
            evidence: {
                status: "policy",
                rule: "legacy-opengl-exact-foundation-coverage-v1",
                sex: "male",
                groupID: "feet",
                partSourceRecordID: "male/feet/bootsam01"
            }
        }
    });

    return construction;
}

const DEFERRED_ATLAS_COMPOSER = {
    async Compose()
    {
        return { status: "deferred", reason: "test-composition-not-under-test", passes: [] };
    }
};

function IdentityContribution(groupID, layerIndex = 0, partIndex = 0)
{
    return {
        layerIndex,
        partIndex,
        groupID,
        source: {},
        materialValues: null,
        textureCandidates: [],
        selectedTextures: [],
        diagnostics: [],
        evidence: {}
    };
}

function CreateFixture({
    configuredMeshIndex = 1,
    geometryBindingIndex = 0,
    configuredEffectReady = true,
    configuredEffectInitializesReady = true,
    configuredDiffusePath = "res:/custom/authored-diffuse.png",
    expandMaleFeetFoundation = false
} = {})
{
    const initializeCalls = [];
    const fetches = [];
    const createdMeshes = [];
    const scene = {
        objects: [],
        wrapped: {
            ApplyPerFrameData() {},
            SetValues() {}
        },
        AddObject(value)
        {
            this.objects.push(value);
        },
        RemoveObject(value)
        {
            const index = this.objects.indexOf(value);
            if (index !== -1) this.objects.splice(index, 1);
        }
    };
    const classes = {
        Tr2IntSkinnedObject: class
        {
            display = true;
            interiorLights = [];
            Initialize() {}
            BindAnimationToVisualModel()
            {
                this.bound = true;
            }
            UpdateViewDependentData() {}
            UpdatePerObjectData() {}
        },
        Tr2SkinnedModel: class
        {
            meshes = [];
            EnsureMesh()
            {
                this.meshes.push(new classes.Tw2Mesh());
            }
            SetSkeletonResource(value)
            {
                this.skeleton = value;
            }
            SetGeometryResource(value, index)
            {
                this.meshes[index] ||= new classes.Tw2Mesh();
                this.meshes[index].geometryResource = value;
                if (geometryBindingIndex !== null)
                {
                    this.meshes[index].meshIndex = geometryBindingIndex;
                }
                return this.meshes[index];
            }
            RebuildAreas(shaderPath)
            {
                if (expandMaleFeetFoundation)
                {
                    for (const source of [ ...this.meshes ])
                    {
                        if (!source.geometryResPath?.endsWith("male-feet.gr2")) continue;
                        const part = new classes.Tw2Mesh();

                        part.name = "male-feet-auto-part";
                        part.display = source.display;
                        part.geometryResource = source.geometryResource;
                        part.geometryResPath = source.geometryResPath;
                        part.meshIndex = 1;
                        part._interiorAutoPart = true;
                        this.meshes.push(part);
                    }
                }

                for (const mesh of this.meshes)
                {
                    mesh.opaqueAreas.push({
                        effect: {
                            shaderPath,
                            SetTextures(value)
                            {
                                this.textures = value;
                            }
                        }
                    });
                }
            }
        },
        Tw2Mesh: class
        {
            constructor()
            {
                createdMeshes.push(this);
            }
            display = true;
            opaqueAreas = [];
            transparentAreas = [];
            additiveAreas = [];
            decalAreas = [];
            depthAreas = [];
            depthNormalAreas = [];
            distortionAreas = [];
            pickableAreas = [];
        },
        TnySpaceObject: class
        {
            constructor(wrapped)
            {
                this.wrapped = wrapped;
            }
        },
        Tr2InteriorLightSource: class
        {
            SetValues(values)
            {
                this.values = values;
            }
            Initialize() {}
        }
    };
    const tiny = {
        scene,
        async Initialize(value)
        {
            initializeCalls.push(value);
        }
    };
    const fixture = {
        configuredModels: [],
        createdMeshes,
        initializeCalls,
        fetches,
        scene,
        watched: null,
        tiny,
        tw2: {
            GetClass: name => classes[name] ?? null,
            async Fetch(resourcePath)
            {
                fetches.push(resourcePath);

                if (resourcePath.endsWith(".black"))
                {
                    const model = new classes.Tr2SkinnedModel();
                    const mesh = new classes.Tw2Mesh();
                    const effect = {
                        ready: configuredEffectReady,
                        parameters: {
                            DiffuseMap: {
                                resourcePath: configuredDiffusePath
                            },
                            TransformUV0: {
                                GetValue(out)
                                {
                                    out.push(0, 0, 0.5, 1);
                                    return out;
                                }
                            }
                        },
                        IsGood()
                        {
                            return this.ready;
                        },
                        SetValues(values)
                        {
                            Object.assign(this, values);
                        },
                        Initialize()
                        {
                            this.initialized = true;
                            if (configuredEffectInitializesReady) this.ready = true;
                        },
                        SetTextures(value)
                        {
                            this.textures = value;
                        }
                    };

                    mesh.meshIndex = configuredMeshIndex;
                    mesh.opaqueAreas.push({ meshIndex: 99, effect });
                    model.meshes.push(mesh);
                    fixture.configuredModels.push(model);
                    return model;
                }

                return {
                    path: resourcePath,
                    meshes: [ { name: "zero" }, { name: "one" } ]
                };
            },
            resMan: {
                async Watch(value)
                {
                    fixture.watched = value;
                }
            },
            runtime: {}
        }
    };

    return fixture;
}
