import assert from "node:assert/strict";
import test from "node:test";

import {
    applyLegacyConfiguredCardAreas,
    applyLegacyProofGarmentMaterial,
    OrderConfiguredHairMeshesForRendering,
    PrepareConfiguredFaceCarriers,
    SetTestTw2,
    TnyGlesCharacterAdapter
} from "./runtime-character-modules.mjs";

test("configured hair renders authored glass after visible hair consumers", () =>
{
    const hair = {
        name: "HairMeshShape",
        transparentAreas: [ {
            effect: {
                effectFilePath: "res:/graphics/effect.gles2/managed/interior/avatar/skinnedavatarhair_detailed.sm_hi"
            }
        } ]
    };
    const glass = {
        name: "helmetShape",
        transparentAreas: [ {
            effect: {
                effectFilePath: "res:/graphics/effect.gles2/managed/interior/avatar/glassshader.sm_hi"
            }
        } ]
    };
    const authored = [ glass, hair ];
    const ordered = OrderConfiguredHairMeshesForRendering("hair", authored);

    assert.deepEqual(ordered, [ hair, glass ]);
    assert.deepEqual(authored, [ glass, hair ]);
    assert.strictEqual(
        OrderConfiguredHairMeshesForRendering("outer", authored),
        authored
    );
});

test("configured hair glass ordering recognizes the retained authored effect", () =>
{
    const hair = { name: "HairMeshShape", transparentAreas: [] };
    const fallbackGlass = {
        name: "helmetShape",
        transparentAreas: [ {
            effect: {
                effectFilePath: "res:/custom/proof.sm_hi",
                _characterAuthoredEffect: {
                    effectFilePath: "res:/graphics/effect.gles2/managed/interior/avatar/glassshader.sm_hi"
                }
            }
        } ]
    };

    assert.deepEqual(
        OrderConfiguredHairMeshesForRendering("hair", [ fallbackGlass, hair ]),
        [ hair, fallbackGlass ]
    );
});

test("legacy eyelash card policy collapses an authored reversed pair", () =>
{
    const states = [];
    const createEffect = () => ({
        name: "C_SkinShiny_EyeLashes",
        effectFilePath: "res:/graphics/effect.gles2/managed/interior/avatar/skinnedavatar.sm_hi",
        techniques: { Main: [ {} ] },
        GetPassCount: () => 1,
        SetTechniquePassStateOverride(...value)
        {
            states.push(value);
        }
    });
    const forward = {
        name: "lashes",
        meshIndex: 1,
        index: 2,
        count: 3,
        effect: createEffect()
    };
    const reversed = {
        ...forward,
        reversed: true,
        effect: createEffect()
    };
    const d3d = { RS_CULLMODE: 22, CULL_NONE: 1, CULL_CCW: 3 };
    const result = applyLegacyConfiguredCardAreas([ {
        name: "Eyelashes_GeoShape",
        transparentAreas: [ forward, reversed ]
    } ], d3d);

    assert.equal(result.status, "applied");
    assert.equal(result.reversedAreas, 1);
    assert.equal(result.collapsedPairs, 1);
    assert.equal(reversed.display, false);
    assert.deepEqual(states, [ [ "Main", 0, d3d.RS_CULLMODE, d3d.CULL_NONE ] ]);
});

test("legacy hair card policy collapses only the matching authored hair pair", () =>
{
    const states = [];
    const createHairEffect = () => ({
        name: "C_Hair_Hair",
        effectFilePath:
            "res:/graphics/effect.gles2/managed/interior/avatar/skinnedavatarhair_detailed.sm_hi",
        techniques: { Main: [ {}, {} ] },
        GetPassCount: () => 2,
        SetTechniquePassStateOverride(...value)
        {
            states.push(value);
        }
    });
    const forward = {
        name: "hair cards",
        meshIndex: 0,
        index: 0,
        count: 14,
        effect: createHairEffect()
    };
    const reversed = {
        ...forward,
        reversed: true,
        effect: createHairEffect()
    };
    const rigidReversed = {
        name: "rigid headwear",
        meshIndex: 0,
        index: 14,
        count: 2,
        reversed: true,
        effect: {
            name: "C_Rigid_Hat",
            effectFilePath:
                "res:/graphics/effect.gles2/managed/interior/avatar/skinnedavatarbrdflinear.sm_hi"
        }
    };
    const d3d = { RS_CULLMODE: 22, CULL_NONE: 1, CULL_CCW: 3 };
    const result = applyLegacyConfiguredCardAreas([ {
        name: "HairMesh",
        transparentAreas: [ forward, reversed, rigidReversed ]
    } ], d3d);

    assert.equal(result.status, "applied");
    assert.equal(result.reversedAreas, 2);
    assert.equal(result.collapsedPairs, 1);
    assert.equal(reversed.display, false);
    assert.notEqual(rigidReversed.display, false);
    assert.deepEqual(states, [
        [ "Main", 0, d3d.RS_CULLMODE, d3d.CULL_NONE ],
        [ "Main", 1, d3d.RS_CULLMODE, d3d.CULL_NONE ]
    ]);
    assert.equal(result.areas[1].mode, "reversed-winding");
});

test("legacy hair card policy preserves a reversed draw with a different effect contract", () =>
{
    const states = [];
    const createEffect = noise => ({
        name: "C_Hair_Hair",
        effectFilePath:
            "res:/graphics/effect.gles2/managed/interior/avatar/skinnedavatarhair_detailed.sm_hi",
        parameters: { HairNoiseParameters: { value: noise } },
        techniques: { Main: [ {} ] },
        GetPassCount: () => 1,
        SetTechniquePassStateOverride(...value) { states.push(value); }
    });
    const forward = {
        name: "hair cards", meshIndex: 0, index: 0, count: 4,
        effect: createEffect([ 0, 0, 4, 100 ])
    };
    const reversed = {
        ...forward,
        reversed: true,
        effect: createEffect([ 0, 0, 8, 100 ])
    };
    const d3d = { RS_CULLMODE: 22, CULL_NONE: 1, CULL_CCW: 3 };
    const result = applyLegacyConfiguredCardAreas([ {
        name: "HairMesh", transparentAreas: [ forward, reversed ]
    } ], d3d);

    assert.equal(result.collapsedPairs, 0);
    assert.notEqual(reversed.display, false);
    assert.deepEqual(states, [ [ "Main", 0, d3d.RS_CULLMODE, d3d.CULL_CCW ] ]);
});

test("configured face carriers stay hidden until an exact material commits", () =>
{
    const skin = { name: "HeadShape", display: true };
    const eyeWet = { name: "EyeWet_GeoShape", display: true };
    const tearducts = { name: "Tearducts_GeoShape", display: true };
    const eyelashes = { name: "Eyelashes_GeoShape", display: true };
    const eyeShadow = { name: "EyeShadow_GeoShape", display: true };
    const bindings = [ skin, eyeWet, tearducts, eyelashes, eyeShadow ].map(mesh => ({
        mesh,
        meshName: mesh.name,
        geometryMeshName: mesh.name
    }));
    const result = PrepareConfiguredFaceCarriers(bindings);

    assert.equal(result.status, "applied");
    assert.equal(skin.display, true);
    assert.equal(eyeWet.display, false);
    assert.equal(tearducts.display, false);
    assert.equal(eyelashes.display, false);
    assert.equal(eyeShadow.display, false);
    assert.deepEqual(result.carriers.map(value => value.meshName), [
        "EyeWet_GeoShape",
        "Tearducts_GeoShape",
        "Eyelashes_GeoShape",
        "EyeShadow_GeoShape"
    ]);
});

test("legacy proof material colors only a retained non-skin garment surface", () =>
{
    const updates = [];
    const textures = [];
    const createEffect = (materialLibraryID, material2LibraryID = 0) => ({
        _characterAuthoredEffect: {
            parameters: {
                MaterialLibraryID: { value: [ materialLibraryID, 0, 0, 0 ] },
                Material2LibraryID: { value: [ material2LibraryID, 0, 0, 0 ] }
            }
        },
        SetParameters(values)
        {
            updates.push(values);
        },
        SetTextures(values)
        {
            textures.push(values);
        }
    });
    const garment = createEffect(14);
    const hybrid = createEffect(0, 14);
    const bodyConsumer = createEffect(0, 14);
    bodyConsumer._characterAuthoredBodyAtlasConsumer = true;
    const skin = createEffect(0);
    const report = applyLegacyProofGarmentMaterial([
        garment,
        hybrid,
        bodyConsumer,
        skin
    ], {
        source: { materialDefinitionPath: "res:/pants.color" },
        materialValues: {
            colors: [ [ 0.1, 0.2, 0.3, 1 ] ],
            specularColors: [ [ 0.4, 0.5, 0.6, 1 ] ]
        }
    });

    assert.equal(report.status, "applied");
    assert.equal(report.appliedEffects, 3);
    assert.equal(report.privateEffects, 1);
    assert.equal(report.hybridEffects, 2);
    assert.deepEqual(report.authoredColor, [ 0.1, 0.2, 0.3, 1 ]);
    assert.deepEqual(report.fallbackColor, [ 1, 0, 1, 1 ]);
    assert.deepEqual(updates, [ {
        MaterialDiffuseColor: [ 1, 0, 1, 1 ],
        MaterialSpecularColor: [ 0.4, 0.5, 0.6, 1 ]
    }, {
        MaterialDiffuseColor: [ 1, 0, 1, 1 ],
        MaterialSpecularColor: [ 0.4, 0.5, 0.6, 1 ]
    }, {
        MaterialDiffuseColor: [ 1, 0, 1, 1 ],
        MaterialSpecularColor: [ 0.4, 0.5, 0.6, 1 ]
    } ]);
    assert.deepEqual(textures, [ {
        DiffuseMap: "res:/dx9/model/decal/shared/bw_000_000_100.dds"
    }, {
        DiffuseMap: "res:/dx9/model/decal/shared/bw_000_000_100.dds"
    }, {
        DiffuseMap: "res:/dx9/model/decal/shared/bw_000_000_100.dds"
    } ]);
    assert.equal(garment._characterGarmentMaterialFallback, true);
    assert.equal(hybrid._characterGarmentBodyFallback, true);
    assert.equal(bodyConsumer._characterGarmentBodyFallback, true);
    assert.equal(skin._characterGarmentMaterialFallback, undefined);
});

test("legacy proof material classifies a lone two-material body consumer as a hybrid", () =>
{
    const effect = {
        _characterAuthoredBodyAtlasConsumer: true,
        _characterAuthoredEffect: {
            parameters: {
                MaterialLibraryID: { value: [ 0, 0, 0, 0 ] },
                Material2LibraryID: { value: [ 14, 23, 26, 0 ] }
            }
        },
        SetParameters() {},
        SetTextures() {}
    };

    const report = applyLegacyProofGarmentMaterial([ effect ], {
        source: { materialDefinitionPath: "res:/spacesuit.color" },
        materialValues: { colors: [ [ 0.1, 0.2, 0.3, 1 ] ] }
    });

    assert.equal(report.status, "applied");
    assert.equal(report.privateEffects, 0);
    assert.equal(report.hybridEffects, 1);
    assert.equal(effect._characterGarmentBodyFallback, true);
});

test("legacy proof material classifies a private baked garment without tint colors", () =>
{
    const effect = {
        _characterAuthoredEffect: {
            parameters: {
                MaterialLibraryID: { value: [ 10, 0, 0, 0 ] },
                Material2LibraryID: { value: [ 0, 0, 0, 0 ] }
            }
        },
        SetParameters() {},
        SetTextures() {}
    };
    const report = applyLegacyProofGarmentMaterial([ effect ], {
        source: { materialDefinitionPath: null },
        materialValues: null
    });

    assert.equal(report.status, "applied");
    assert.equal(report.authoredColor, null);
    assert.equal(report.privateEffects, 1);
    assert.equal(effect._characterGarmentMaterialFallback, true);
});

test("GLES adapter constructs its scene and camera through the Tny client store", async () =>
{
    class CharacterScene
    {
        lights = [];

        wrapped = {
            SetValues: values =>
            {
                this.sceneValues = values;
            }
        };

        AddLight(light)
        {
            this.lights.push(light);
        }

        ClearLights()
        {
            this.lights.splice(0);
        }

        Initialize()
        {
            this.initialized = true;
        }
    }

    class Camera
    {
        constructor(values)
        {
            this.values = values;
        }
    }

    class Light
    {
        SetValues(values)
        {
            this.values = values;
        }

        Initialize() {}
    }

    const classes = {
        TnyCameraTest: Camera,
        TnyCharacterScene: CharacterScene,
        TnySpaceObject: class {}
    };
    const client = {
        scene: null,
        camera: null,
        GetClass: name => classes[name],
        HasClass: name => !!classes[name],
        async Initialize(options)
        {
            this.initializeOptions = options;
            this.scene = options.scene;
            this.camera = options.camera;
        }
    };

    SetTestTw2({
        Fetch() {},
        Gr2Reader: { DEFAULT_OPTIONS: {} },
        Tr2InteriorLightSource: Light
    });
    const adapter = new TnyGlesCharacterAdapter({
        client,
        cameraDistance: 0.8,
        clearColor: [ 0.05, 1, 0, 1 ]
    });
    await adapter._Initialize();

    assert.ok(client.scene instanceof CharacterScene);
    assert.ok(client.camera instanceof Camera);
    assert.equal(client.scene.initialized, true);
    assert.equal(client.initializeOptions.scene, client.scene);
    assert.equal(client.initializeOptions.camera, client.camera);
    assert.equal(client.camera.values.distance, 0.8);
    assert.deepEqual(client.initializeOptions.client.clearColor, [ 0.05, 1, 0, 1 ]);
    assert.deepEqual(client.scene.sceneValues.clearColor, [ 0.05, 1, 0, 1 ]);
    assert.equal(client.initializeOptions.scene.wrapped, client.scene.wrapped);
    assert.deepEqual(client.scene.lights.map(light => light.values.name), [
        "character_front",
        "character_left",
        "character_right",
        "character_back"
    ]);
});

test("legacy adapter stages and commits the exact female LOD0 foundation", async () =>
{
    const fixture = CreateFixture();
    SetTestTw2(fixture.tw2);
    const adapter = new TnyGlesCharacterAdapter({
        client: fixture.tiny,
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
        "http://127.0.0.1:5510/eve/3453885/resources"
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
            position: [ 0, 135, 190 ],
            color: [ 4.4, 4.4, 4.4, 1 ],
            radius: 300,
            falloff: 1
        },
        {
            name: "character_left",
            primaryLighting: true,
            position: [ -190, 115, 0 ],
            color: [ 2.15, 2.15, 2.15, 1 ],
            radius: 280,
            falloff: 1
        },
        {
            name: "character_right",
            primaryLighting: true,
            position: [ 190, 115, 0 ],
            color: [ 2.15, 2.15, 2.15, 1 ],
            radius: 280,
            falloff: 1
        },
        {
            name: "character_back",
            primaryLighting: true,
            position: [ 0, 150, -200 ],
            color: [ 4.8, 4.8, 4.8, 1 ],
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

test("legacy adapter replaces a generic head carrier with exact configured face meshes", async () =>
{
    const fixture = CreateFixture({
        configuredMeshIndices: [ 0, 1 ],
        configuredMeshNames: [ "zero", "one" ],
        geometryBindingIndex: 0
    });
    SetTestTw2(fixture.tw2);
    const adapter = new TnyGlesCharacterAdapter({
        client: fixture.tiny,
        atlasComposer: DEFERRED_ATLAS_COMPOSER
    });
    const construction = CreateConstruction("male", [
        [ "head", "res:/custom/male-head.gr2" ]
    ]);
    construction.operations.splice(-1, 0, {
        operation: "configured-foundation",
        role: "head",
        index: 0,
        configurationPath: "res:/custom/male-head.black",
        geometryPath: "res:/custom/male-head.gr2",
        skinTextures: {
            DiffuseMap: "res:/custom/male-head-d.png",
            NormalMap: "res:/custom/male-head-n.png",
            SpecularMap: "res:/custom/male-head-s.png"
        },
        skinEvidence: {
            status: "derived",
            rule: "exact-skintone-prs-archetype-foundation-v1",
            correctness: "test-fixture"
        }
    });

    const staged = await adapter.Prepare(construction);
    const diagnostics = adapter.GetDiagnostics(staged);
    const heads = staged.backend.visualModel.meshes.filter(mesh =>
        mesh._characterFoundationRole === "head");

    assert.equal(heads.length, 2);
    assert.deepEqual(heads.map(mesh => mesh.name), [ "zero", "one" ]);
    assert.equal(diagnostics.configuredFoundationCount, 1);
    assert.equal(diagnostics.configuredFoundations[0].meshCount, 2);
    assert.deepEqual(
        diagnostics.configuredFoundations[0].meshes.map(value => value.geometryMeshName),
        [ "zero", "one" ]
    );
    assert.equal(fixture.fetches.filter(value => value === "res:/custom/male-head.gr2").length, 2);
});

test("configured head replaces only the skin carrier textures and preserves authored face materials", async () =>
{
    const eyeTextures = {
        DiffuseMap: "res:/custom/eye-authored-d.png",
        CutMaskMap: "res:/custom/eye-authored-mask.png"
    };
    const fixture = CreateFixture({
        configuredMeshIndices: [ 0, 1 ],
        configuredMeshNames: [ "zero", "one" ],
        configuredEffectNames: [ "C_Skin_blinn1", "C_Eyes" ],
        configuredTransforms: [ [ 0.5, 0, 1, 0.5 ], [ 0, 0, 1, 1 ] ],
        configuredInitialTextures: [
            { DiffuseMap: "res:/custom/head-authored-d.png" },
            eyeTextures
        ]
    });
    SetTestTw2(fixture.tw2);
    const adapter = new TnyGlesCharacterAdapter({
        client: fixture.tiny,
        atlasComposer: DEFERRED_ATLAS_COMPOSER
    });
    const construction = CreateConstruction("female", [
        [ "head", "res:/custom/female-head.gr2" ]
    ]);
    const skinTextures = {
        DiffuseMap: "res:/custom/female-head-d.png",
        NormalMap: "res:/custom/female-head-n.png",
        SpecularMap: "res:/custom/female-head-s.png"
    };
    construction.operations.splice(-1, 0, {
        operation: "configured-foundation",
        role: "head",
        index: 0,
        configurationPath: "res:/custom/female-head.black",
        geometryPath: "res:/custom/female-head.gr2",
        skinTextures,
        skinEvidence: {
            status: "retained",
            rule: "exact-head-generic-texture-inventory-v1",
            correctness: "test-fixture"
        }
    });

    const staged = await adapter.Prepare(construction);

    const [ authoredSkinEffect, eyeEffect ] = fixture.configuredEffects;
    const skinEffect = staged.configuredFoundationBindings[0]
        .resolvedMeshBindings[0].mesh.opaqueAreas[0].effect;
    assert.deepEqual(skinEffect.textures, skinTextures);
    assert.deepEqual(eyeEffect.textures, eyeTextures);
    assert.equal(eyeEffect.setTexturesCalls, 0);
    assert.equal(skinEffect.effectFilePath, "res:/custom/female-avatar.sm_hi");
    assert.equal(skinEffect.autoPopulateCalls, 1);
    assert.deepEqual(
        skinEffect.parameters.TransformUV0.GetValue([]),
        [ 0.5, 0, 1, 0.5 ]
    );
    assert.deepEqual(skinEffect._characterAuthoredTransformUV0, [ 0.5, 0, 1, 0.5 ]);
    assert.deepEqual(skinEffect._characterFoundationSkinShader, {
        status: "applied",
        rule: "legacy-opengl-shared-foundation-skin-shader-v1",
        shaderPath: "res:/custom/female-avatar.sm_hi"
    });
    assert.equal(eyeEffect.effectFilePath, "");
    assert.equal(skinEffect, authoredSkinEffect);
});

test("configured head does not proof-fill a declared-empty face carrier", async () =>
{
    const fixture = CreateFixture({
        configuredMeshIndices: [ 0, 8 ],
        configuredMeshNames: [ "HeadShape", "EyeWet_GeoShape" ],
        geometryMeshNames: [ "HeadShape", "EyeWet_GeoShape" ],
        configuredEffectNames: [ "C_Skin_blinn1", "C_eyewetness_eyes" ],
        configuredInitialTextures: [
            { DiffuseMap: "res:/custom/head-authored-d.png" },
            {}
        ],
        configuredDiffusePath: "",
        configuredDeferredTextureConsumer: true
    });
    SetTestTw2(fixture.tw2);
    const adapter = new TnyGlesCharacterAdapter({
        client: fixture.tiny,
        atlasComposer: DEFERRED_ATLAS_COMPOSER
    });
    const construction = CreateConstruction("female", [
        [ "head", "res:/custom/female-head.gr2" ]
    ]);
    construction.operations.splice(-1, 0, {
        operation: "configured-foundation",
        role: "head",
        index: 0,
        configurationPath: "res:/custom/female-head.black",
        geometryPath: "res:/custom/female-head.gr2",
        skinTextures: {
            DiffuseMap: "res:/custom/female-head-d.png",
            NormalMap: "res:/custom/female-head-n.png",
            SpecularMap: "res:/custom/female-head-s.png"
        },
        skinEvidence: {
            status: "retained",
            rule: "exact-head-generic-texture-inventory-v1",
            correctness: "test-fixture"
        }
    });

    const staged = await adapter.Prepare(construction);
    const eyeWetMesh = staged.configuredFoundationBindings[0]
        .resolvedMeshBindings.find(value => value.meshName === "EyeWet_GeoShape").mesh;
    const eyeWetEffect = fixture.configuredEffects[1];

    assert.equal(eyeWetMesh.display, false);
    assert.equal(eyeWetEffect.setTexturesCalls, 0);
    assert.deepEqual(eyeWetEffect.textures, {});
    assert.equal(
        staged.configuredFoundations[0].faceCarriers.carriers[0].status,
        "awaiting-exact-material"
    );
});

test("configured foundation attaches one exact retained eyebrow support carrier", async () =>
{
    const fixture = CreateFixture({
        configuredMeshIndex: 0,
        configuredMeshNames: [ "BrowBaseShape" ],
        geometryMeshNames: [ "BrowBaseShape" ],
        configuredEffectNames: [ "C_SkinShiny_BrowBase" ],
        configuredEffectFilePath:
            "res:/graphics/effect.gles2/managed/interior/avatar/"
            + "skinnedavatarbrdfdoublelinear.sm_hi",
        configuredDiffusePath: "",
        configuredDeferredTextureConsumer: true
    });
    SetTestTw2(fixture.tw2);
    const adapter = new TnyGlesCharacterAdapter({
        client: fixture.tiny,
        atlasComposer: DEFERRED_ATLAS_COMPOSER
    });
    const construction = CreateConstruction("female", [
        [ "head", "res:/custom/female-head.gr2" ]
    ]);
    construction.operations.splice(-1, 0, {
        operation: "configured-foundation-support",
        role: "eyebrowbase",
        partSourceRecordID: "female/accessories/browbase/cd",
        configurationPath: "res:/custom/browbase.black",
        geometryPath: "res:/custom/browbase.gr2",
        evidence: {
            status: "derived",
            rule: "exact-head-archetype-brow-support-dependency-v1"
        }
    });

    const staged = await adapter.Prepare(construction);
    const diagnostics = adapter.GetDiagnostics(staged);

    assert.equal(diagnostics.configuredFoundationSupportCount, 1);
    assert.equal(diagnostics.configuredPartCount, 0);
    assert.equal(
        diagnostics.configuredFoundationSupports[0].partSourceRecordID,
        "female/accessories/browbase/cd"
    );
    assert.equal(
        staged.configuredFoundationSupportBindings[0].configuredMeshes[0]
            ._characterFoundationSupportRole,
        "eyebrowbase"
    );
    assert.equal(diagnostics.configuredFoundationSupports[0].proofFallbackEffectCount, 0);
    assert.equal(
        staged.configuredFoundationSupportBindings[0].configuredMeshes[0]
            .opaqueAreas[0].effect,
        fixture.configuredEffects[0]
    );
    assert.deepEqual(fixture.fetches.slice(-2), [
        "res:/custom/browbase.black",
        "res:/custom/browbase.gr2"
    ]);
});

test("configured female body preserves only the exact authored basenude carrier", async () =>
{
    const fixture = CreateFixture({
        configuredMeshIndex: 0,
        configuredMeshNames: [ "BasenudeShape" ],
        geometryMeshNames: [ "BasenudeShape" ],
        configuredEffectNames: [ "C_Skin_body" ],
        configuredBodyEffect: true
    });
    SetTestTw2(fixture.tw2);
    const adapter = new TnyGlesCharacterAdapter({
        client: fixture.tiny,
        atlasComposer: DEFERRED_ATLAS_COMPOSER
    });
    const construction = CreateConstruction("female");
    const skinTextures = {
        DiffuseMap: "res:/custom/cd-female-body-d.png",
        NormalMap: "res:/graphics/shared_texture/global/normal_flat.dds",
        SpecularMap: "res:/custom/cd-female-body-s.png"
    };
    construction.operations.splice(-1, 0, {
        operation: "configured-foundation",
        role: "body",
        index: 0,
        configurationPath: "res:/custom/basenude.black",
        geometryPath: "res:/custom/female-body.gr2",
        skinTextures,
        skinEvidence: {
            status: "derived",
            rule: "exact-skintone-prs-archetype-foundation-v1",
            correctness: "test-fixture"
        }
    });

    const staged = await adapter.Prepare(construction);

    assert.deepEqual(fixture.configuredEffects[0].textures, skinTextures);
    assert.equal(staged.configuredFoundations[0].role, "body");
    assert.equal(staged.configuredFoundations[0].meshes[0].meshName, "BasenudeShape");
});

test("unavailable authored body retains and reports the prepared body fallback", async () =>
{
    const fixture = CreateFixture({ configuredFetchFailure: true });
    SetTestTw2(fixture.tw2);
    const adapter = new TnyGlesCharacterAdapter({
        client: fixture.tiny,
        atlasComposer: DEFERRED_ATLAS_COMPOSER
    });
    const construction = CreateConstruction("female");
    construction.operations.splice(-1, 0, {
        operation: "configured-foundation",
        role: "body",
        index: 0,
        configurationPath: "res:/custom/basenude.black",
        geometryPath: "res:/custom/female-body.gr2",
        fallbackOnFailure: true,
        skinTextures: {
            DiffuseMap: "res:/custom/cd-female-body-d.png",
            NormalMap: "res:/graphics/shared_texture/global/normal_flat.dds",
            SpecularMap: "res:/custom/cd-female-body-s.png"
        },
        skinEvidence: {
            status: "derived",
            rule: "exact-skintone-prs-archetype-foundation-v1",
            correctness: "test-fixture"
        }
    });

    const staged = await adapter.Prepare(construction);

    assert.equal(staged.backend.visualModel.meshes.some(mesh =>
        mesh._characterFoundationRole === "body"), true);
    assert.equal(staged.configuredFoundations[0].status, "deferred");
    assert.match(staged.configuredFoundations[0].reason, /fixture configured fetch failure/u);
});

test("visually unqualified authored body remains retained without replacing the GLES carrier", async () =>
{
    const fixture = CreateFixture();
    SetTestTw2(fixture.tw2);
    const adapter = new TnyGlesCharacterAdapter({
        client: fixture.tiny,
        atlasComposer: DEFERRED_ATLAS_COMPOSER
    });
    const construction = CreateConstruction("female");
    construction.operations.splice(-1, 0, {
        operation: "configured-foundation",
        role: "body",
        index: 0,
        configurationPath: "res:/custom/basenude.black",
        geometryPath: "res:/custom/female-body.gr2",
        renderConfiguredCarrier: false,
        renderEvidence: {
            status: "observed",
            rule: "legacy-opengl-authored-body-carrier-unqualified-v1"
        },
        skinTextures: {
            DiffuseMap: "res:/custom/cd-female-body-d.png",
            NormalMap: "res:/graphics/shared_texture/global/normal_flat.dds",
            SpecularMap: "res:/custom/cd-female-body-s.png"
        },
        skinEvidence: {
            status: "derived",
            rule: "exact-skintone-prs-archetype-foundation-v1",
            correctness: "test-fixture"
        }
    });

    const staged = await adapter.Prepare(construction);

    assert.equal(staged.backend.visualModel.meshes.some(mesh =>
        mesh._characterFoundationRole === "body"), true);
    assert.equal(staged.configuredFoundations[0].status, "retained-not-rendered");
    assert.equal(
        staged.configuredFoundations[0].reason,
        "configured-body-carrier-visually-unqualified"
    );
    assert.equal(fixture.fetches.includes("res:/custom/basenude.black"), false);
});

test("legacy adapter applies exact morph requests only during atomic commit and restores on release", async () =>
{
    const fixture = CreateFixture();
    const calls = [];
    const morphDeformation = {
        HasAnyTarget(resource, targets)
        {
            calls.push([ "match", resource.path, targets[0].targetName ]);
            return true;
        },
        async Acquire(resource, targets)
        {
            calls.push([ "acquire", resource.path, targets.map(value => value.weight) ]);
            return {
                lease: { id: 1 },
                report: { status: "applied", matchedTargets: [ "pushhemmidshape" ] }
            };
        },
        Release(resource, lease)
        {
            calls.push([ "release", resource.path, lease.id ]);
            return true;
        }
    };

    SetTestTw2(fixture.tw2);
    const adapter = new TnyGlesCharacterAdapter({
        client: fixture.tiny,
        morphDeformation
    });
    const construction = CreateConstruction("male");
    construction.morphTargets = [ {
        modifierPath: "utilityshapes/pushhemmidshape",
        targetName: "PushHemMidShape",
        weight: 0.35,
        ownerGroupID: "bottomouter",
        evidence: {
            status: "policy",
            rule: "legacy-gles-unique-normalized-morph-target-match-v1"
        }
    } ];

    const staged = await adapter.Prepare(construction);
    assert.deepEqual(calls.map(value => value[0]), [ "match" ]);
    assert.equal(staged.morphDeformation.at(-1).status, "pending-commit");

    await adapter.Commit(staged);
    assert.deepEqual(calls.map(value => value[0]), [ "match", "acquire" ]);
    assert.equal(staged.morphDeformation.at(-1).status, "applied");

    adapter.Release(staged);
    assert.deepEqual(calls.map(value => value[0]), [ "match", "acquire", "release" ]);
});

test("legacy adapter transfers conflicting morph leases during an appearance handoff", async () =>
{
    const fixture = CreateFixture();
    const calls = [];
    let leaseID = 0;
    let activeWeight = null;
    const morphDeformation = {
        HasAnyTarget() { return true; },
        async Acquire(resource, targets)
        {
            const weight = targets[0].weight;
            if (activeWeight !== null && activeWeight !== weight)
            {
                throw new Error("conflicting shared geometry");
            }
            activeWeight = weight;
            const lease = { id: ++leaseID, weight };
            calls.push([ "acquire", weight, lease.id ]);
            return { lease, report: { status: "applied" } };
        },
        Release(resource, lease)
        {
            calls.push([ "release", lease.weight, lease.id ]);
            activeWeight = null;
            return true;
        }
    };
    SetTestTw2(fixture.tw2);
    const adapter = new TnyGlesCharacterAdapter({
        client: fixture.tiny,
        morphDeformation
    });
    const firstConstruction = CreateConstruction("female");
    firstConstruction.morphTargets = [ MorphTargetFixture(0.25) ];
    const secondConstruction = CreateConstruction("female");
    secondConstruction.morphTargets = [ MorphTargetFixture(0.75) ];
    const first = await adapter.Prepare(firstConstruction);
    const second = await adapter.Prepare(secondConstruction);

    await adapter.Commit(first);
    await adapter.Handoff(first, second);

    assert.deepEqual(calls, [
        [ "acquire", 0.25, 1 ],
        [ "release", 0.25, 1 ],
        [ "acquire", 0.75, 2 ]
    ]);
    assert.equal(first.backend.display, false);
    assert.equal(second.backend.display, true);
    adapter.Release(first);
    adapter.Release(second);
    assert.deepEqual(calls.at(-1), [ "release", 0.75, 2 ]);
});

test("legacy adapter restores prior geometry leases when a handoff fails", async () =>
{
    const fixture = CreateFixture();
    const calls = [];
    let leaseID = 0;
    const morphDeformation = {
        HasAnyTarget() { return true; },
        async Acquire(resource, targets)
        {
            const weight = targets[0].weight;
            calls.push([ "acquire", weight ]);
            if (weight === 0.75) throw new Error("replacement rejected");
            return { lease: { id: ++leaseID, weight }, report: { status: "applied" } };
        },
        Release(resource, lease)
        {
            calls.push([ "release", lease.weight ]);
            return true;
        }
    };
    SetTestTw2(fixture.tw2);
    const adapter = new TnyGlesCharacterAdapter({
        client: fixture.tiny,
        morphDeformation
    });
    const firstConstruction = CreateConstruction("female");
    firstConstruction.morphTargets = [ MorphTargetFixture(0.25) ];
    const secondConstruction = CreateConstruction("female");
    secondConstruction.morphTargets = [ MorphTargetFixture(0.75) ];
    const first = await adapter.Prepare(firstConstruction);
    const second = await adapter.Prepare(secondConstruction);

    await adapter.Commit(first);
    await assert.rejects(adapter.Handoff(first, second), /replacement rejected/u);

    assert.deepEqual(calls, [
        [ "acquire", 0.25 ],
        [ "release", 0.25 ],
        [ "acquire", 0.75 ],
        [ "acquire", 0.25 ]
    ]);
    assert.equal(first.backend.display, true);
    assert.equal(second.backend.display, false);
    adapter.Release(second);
    adapter.Release(first);
});

test("legacy adapter can isolate authored morph deformation without dropping requests", async () =>
{
    const fixture = CreateFixture();
    const calls = [];
    SetTestTw2(fixture.tw2);
    const adapter = new TnyGlesCharacterAdapter({
        client: fixture.tiny,
        morphDeformationEnabled: false,
        morphDeformation: {
            HasAnyTarget(...args)
            {
                calls.push([ "match", ...args ]);
                return true;
            },
            async Acquire(...args)
            {
                calls.push([ "acquire", ...args ]);
                return { lease: {}, report: { status: "applied" } };
            },
            Release(...args)
            {
                calls.push([ "release", ...args ]);
                return true;
            }
        }
    });
    const construction = CreateConstruction("female");
    construction.morphTargets = [ {
        modifierPath: "utilityshapes/pinchlefthipsshape",
        targetName: "PinchLeftHips",
        weight: 1,
        ownerGroupID: "topmiddle",
        evidence: {
            status: "policy",
            rule: "legacy-gles-unique-normalized-morph-target-match-v1"
        }
    } ];

    const staged = await adapter.Prepare(construction);
    await adapter.Commit(staged);

    assert.equal(staged.morphTargets.length, 1);
    assert.deepEqual(staged.morphDeformation, []);
    assert.deepEqual(calls, []);
    adapter.Release(staged);
});

test("legacy adapter can isolate one authored morph target without dropping its request", async () =>
{
    const fixture = CreateFixture();
    const calls = [];
    SetTestTw2(fixture.tw2);
    const adapter = new TnyGlesCharacterAdapter({
        client: fixture.tiny,
        morphDeformationSkippedTargets: [ "PinchLeftHips" ],
        morphDeformation: {
            HasAnyTarget(...args)
            {
                calls.push([ "match", ...args ]);
                return true;
            },
            async Acquire(...args)
            {
                calls.push([ "acquire", ...args ]);
                return { lease: {}, report: { status: "applied" } };
            },
            Release(...args)
            {
                calls.push([ "release", ...args ]);
                return true;
            }
        }
    });
    const construction = CreateConstruction("female");
    construction.morphTargets = [ {
        modifierPath: "utilityshapes/pinchlefthipsshape",
        targetName: "PinchLeftHips",
        weight: 1,
        ownerGroupID: "topmiddle",
        evidence: {
            status: "policy",
            rule: "legacy-gles-unique-normalized-morph-target-match-v1"
        }
    } ];

    const staged = await adapter.Prepare(construction);
    await adapter.Commit(staged);

    assert.equal(staged.morphTargets.length, 1);
    assert.deepEqual(staged.morphDeformation, [ {
        ...construction.morphTargets[0],
        evidence: { ...construction.morphTargets[0].evidence },
        status: "diagnostic-target-skipped",
        reason: "explicit-diagnostic-target-exclusion",
        resourcePaths: []
    } ]);
    assert.deepEqual(calls, []);
    adapter.Release(staged);
});

test("legacy adapter initializes once and routes a male paper doll to male sources", async () =>
{
    const fixture = CreateFixture();
    SetTestTw2(fixture.tw2);
    const adapter = new TnyGlesCharacterAdapter({
        client: fixture.tiny,
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
    SetTestTw2(fixture.tw2);
    const adapter = new TnyGlesCharacterAdapter({
        client: fixture.tiny,
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
        /restricted to an exact female LOD0 foundation policy/u
    );

    adapter.Release(staged);
});

test("legacy adapter rejects malformed construction before loading assets", async () =>
{
    const fixture = CreateFixture();
    SetTestTw2(fixture.tw2);
    const adapter = new TnyGlesCharacterAdapter({
        client: fixture.tiny,
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
    SetTestTw2(fixture.tw2);
    const adapter = new TnyGlesCharacterAdapter({
        client: fixture.tiny,
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
    SetTestTw2(fixture.tw2);
    const adapter = new TnyGlesCharacterAdapter({
        client: fixture.tiny,
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
    SetTestTw2(fixture.tw2);
    const adapter = new TnyGlesCharacterAdapter({
        client: fixture.tiny,
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
        geometryBindingSource: "retained-explicit",
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
    const foundationMesh = staged.backend.visualModel.meshes.find(mesh =>
        mesh._characterFoundationRole === "body");
    assert.ok(foundationMesh);
    assert.deepEqual(adapter.SetFoundationDisplay(staged, "body", false), {
        role: "body",
        display: false,
        meshCount: 1
    });
    assert.equal(foundationMesh.display, false);
    adapter.SetFoundationDisplay(staged, "body", true);
    assert.equal(foundationMesh.display, true);
    assert.throws(
        () => adapter.SetFoundationDisplay(staged, "missing", false),
        /not attached/u
    );
    assert.deepEqual(adapter.GetDiagnostics(staged), {
        foundationGeometryCount: 1,
        foundationGeometry: [ {
            role: "body",
            index: 0,
            resourcePath: "res:/custom/female-body.gr2",
            evidence: null
        } ],
        configuredFoundationCount: 0,
        configuredFoundations: [],
        configuredFoundationSupportCount: 0,
        configuredFoundationSupports: [],
        configuredPartCount: 1,
        configuredParts: staged.configuredParts,
        deferredContributionCount: 0,
        deferredContributions: [],
        foundationCoverageCount: 0,
        foundationCoverage: [],
        paletteCompatibilityCount: 0,
        paletteCompatibility: [],
        configuredGarmentMaterials: {
            status: "deferred",
            reason: "configured-garment-composer-unavailable"
        },
        configuredHeadMaterials: {
            status: "deferred",
            reason: "configured-head-composer-unavailable"
        },
        configuredHairMaterials: {
            status: "deferred",
            reason: "configured-hair-composer-unavailable"
        },
        configuredHeadwearMaterials: {
            status: "deferred",
            reason: "configured-headwear-composer-unavailable"
        },
        configuredAccessoryMaterials: {
            status: "deferred",
            reason: "configured-accessory-composer-unavailable"
        },
        selectedTopDrape: {
            status: "deferred",
            reason: "selected-top-drape-composer-unavailable"
        },
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
        morphDeformation: [],
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

test("legacy adapter qualifies one configuration-authored retained geometry candidate", async () =>
{
    const fixture = CreateFixture({
        configuredGeometryResPaths: [ "res:/custom/jacket.gr2" ]
    });
    SetTestTw2(fixture.tw2);
    const adapter = new TnyGlesCharacterAdapter({
        client: fixture.tiny,
        atlasComposer: DEFERRED_ATLAS_COMPOSER
    });
    const construction = CreateConstruction("male");

    construction.evidence = { status: "policy", rule: "legacy-opengl-appearance-v1" };
    construction.resolvedPartCount = 1;
    construction.configuredPartCount = 1;
    construction.deferredContributionCount = 0;
    construction.textureContributions = [ IdentityContribution("outer") ];
    construction.operations.splice(-1, 0, {
        operation: "configured-part",
        layerIndex: 0,
        partIndex: 0,
        groupID: "outer",
        partSourceRecordID: "male/outer/jacket-fixture",
        configurationPath: "res:/custom/jacket.black",
        geometryPath: null,
        geometryCandidates: [
            "res:/custom/jacket_lod1.gr2",
            "res:/custom/jacket_lod2.gr2",
            "res:/custom/jacket.gr2"
        ],
        evidence: { status: "derived", rule: "exact-source-version" }
    });

    const staged = await adapter.Prepare(construction);

    assert.equal(staged.configuredParts[0].geometryPath, "res:/custom/jacket.gr2");
    assert.equal(staged.configuredParts[0].geometryBindingSource, "authored-retained");
    assert.deepEqual(fixture.fetches.slice(-2), [
        "res:/custom/jacket.black",
        "res:/custom/jacket.gr2"
    ]);
    adapter.Release(staged);

    const configuredOperation = construction.operations.find(value =>
        value.operation === "configured-part");
    configuredOperation.geometryPath = "res:/custom/jacket.gr2";
    const normalizedFixture = CreateFixture({
        configuredGeometryResPaths: [ "res:\\custom\\jacket.gr2" ]
    });
    SetTestTw2(normalizedFixture.tw2);
    const normalizedAdapter = new TnyGlesCharacterAdapter({
        client: normalizedFixture.tiny,
        atlasComposer: DEFERRED_ATLAS_COMPOSER
    });
    const normalizedStaged = await normalizedAdapter.Prepare(construction);
    assert.equal(normalizedStaged.configuredParts[0].geometryPath, "res:/custom/jacket.gr2");
    assert.equal(normalizedStaged.configuredParts[0].geometryBindingSource,
        "retained-explicit");
    normalizedAdapter.Release(normalizedStaged);

    configuredOperation.geometryPath = null;
    const rejectedFixture = CreateFixture({
        configuredGeometryResPaths: [ "res:/custom/unretained.gr2" ]
    });
    SetTestTw2(rejectedFixture.tw2);
    await assert.rejects(
        new TnyGlesCharacterAdapter({
            client: rejectedFixture.tiny,
            atlasComposer: DEFERRED_ATLAS_COMPOSER
        }).Prepare(construction),
        /outside the retained candidate inventory/u
    );

    configuredOperation.geometryPath = "res:/custom/unretained.gr2";
    const explicitUnretained = CreateFixture({
        configuredGeometryResPaths: [ "res:/custom/unretained.gr2" ]
    });
    SetTestTw2(explicitUnretained.tw2);
    await assert.rejects(
        new TnyGlesCharacterAdapter({
            client: explicitUnretained.tiny,
            atlasComposer: DEFERRED_ATLAS_COMPOSER
        }).Prepare(construction),
        /outside the retained candidate inventory/u
    );

    configuredOperation.geometryPath = "res:/custom/jacket_lod1.gr2";
    const explicitDisagreement = CreateFixture({
        configuredGeometryResPaths: [ "res:/custom/jacket.gr2" ]
    });
    SetTestTw2(explicitDisagreement.tw2);
    const explicitDisagreementAdapter = new TnyGlesCharacterAdapter({
        client: explicitDisagreement.tiny,
        atlasComposer: DEFERRED_ATLAS_COMPOSER
    });
    const explicitDisagreementStaged = await explicitDisagreementAdapter.Prepare(construction);
    assert.equal(explicitDisagreementStaged.configuredParts[0].geometryPath,
        "res:/custom/jacket_lod1.gr2");
    assert.equal(explicitDisagreementStaged.configuredParts[0].geometryBindingSource,
        "retained-explicit-config-alias");
    explicitDisagreementAdapter.Release(explicitDisagreementStaged);
});

test("legacy adapter restores exact multi-mesh bindings after resource watches", async () =>
{
    const fixture = CreateFixture({
        configuredMeshIndices: [ 0, 0 ],
        configuredMeshNames: [ "zero", "one" ],
        geometryBindingIndex: 0,
        resetConfiguredMeshIndicesOnWatch: true
    });
    SetTestTw2(fixture.tw2);
    const adapter = new TnyGlesCharacterAdapter({
        client: fixture.tiny,
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
    construction.textureContributions = [ IdentityContribution("outer") ];
    construction.operations.splice(-1, 0, {
        operation: "configured-part",
        layerIndex: 0,
        partIndex: 0,
        groupID: "outer",
        partSourceRecordID: "male/outer/robe",
        configurationPath: "res:/custom/robe.black",
        geometryPath: "res:/custom/robe.gr2",
        evidence: { status: "derived", rule: "unique-version-candidates" }
    });

    const staged = await adapter.Prepare(construction);
    const meshes = fixture.configuredModels[0].meshes;

    assert.deepEqual(meshes.map(mesh => mesh.meshIndex), [ 0, 1 ]);
    assert.deepEqual(meshes.map(mesh => mesh.opaqueAreas[0].meshIndex), [ 0, 1 ]);
    assert.equal(staged.configuredParts[0].namedMeshIndexCount, 1);
    assert.equal(staged.configuredParts[0].authoredMeshIndexCount, 1);
    assert.equal(staged.configuredParts[0].modelBindingMeshIndexCount, 0);
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
    SetTestTw2(fixture.tw2);
    const adapter = new TnyGlesCharacterAdapter({
        client: fixture.tiny,
        foundationCutMaskEnabled: false,
        lowerSleeveMaterialEnabled: false,
        tuckAuthoredUvEnabled: true,
        tuckCutMaskEnabled: false,
        tuckDetailMaskEnabled: false,
        tuckMaterialBaseEnabled: true,
        tuckAlphaMode: "opaque",
        tuckBlendDetailEnabled: true,
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
                assert.deepEqual(options, {
                    applyCutMask: false,
                    alphaMode: "opaque",
                    blendDetail: true,
                    depthTest: true,
                    fillMaterialBase: true,
                    useAuthoredTransform: true,
                    useDetailMask: false,
                    usePantsRgb: false,
                    useSharedBodyRgb: true
                });
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
    const fixture = CreateFixture({
        configuredEffectReady: false,
        configuredCutMaskInfluence: [ 0.85, 0, 0, 0 ],
        configuredCutMaskPath: ""
    });
    SetTestTw2(fixture.tw2);
    const adapter = new TnyGlesCharacterAdapter({
        client: fixture.tiny,
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
    assert.ok(Math.abs(effect._characterAuthoredCutMaskInfluence[0] - 0.85) < 1e-6);
    assert.deepEqual(effect._characterAuthoredCutMaskInfluence.slice(1), [ 0, 0, 0 ]);
    assert.equal(effect._characterAuthoredCutMaskInfluenceSource, "public-parameter");
    assert.deepEqual(effect._characterAuthoredCutMaskBinding, {
        declared: true,
        resourcePath: null,
        attached: false
    });
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
    SetTestTw2(fixture.tw2);
    const adapter = new TnyGlesCharacterAdapter({
        client: fixture.tiny,
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

test("legacy adapter retains a prepared glass effect with runtime-filled texture slots", async () =>
{
    const glassPath =
        "res:/graphics/effect.gles2/managed/interior/avatar/glassshader.sm_hi";
    const fixture = CreateFixture({
        configuredEffectFilePath: glassPath,
        configuredDiffusePath: "",
        configuredDeferredTextureConsumer: true
    });
    SetTestTw2(fixture.tw2);
    const adapter = new TnyGlesCharacterAdapter({
        client: fixture.tiny,
        atlasComposer: DEFERRED_ATLAS_COMPOSER
    });
    const construction = CreateAppearanceConstruction();
    construction.textureContributions[0].groupID = "hair";
    construction.operations.find(value => value.operation === "configured-part").groupID = "hair";
    const staged = await adapter.Prepare(construction);
    const effect = fixture.configuredModels[0].meshes[0].opaqueAreas[0].effect;

    assert.equal(effect.effectFilePath, glassPath);
    assert.equal(effect._characterAuthoredEffectFilePath, glassPath);
    assert.equal(effect._characterProofFallback, undefined);
    assert.equal(staged.configuredParts[0].proofFallbackEffectCount, 0);

    adapter.Release(staged);
});

test("legacy adapter retains a prepared accessory glass effect for atomic materialization", async () =>
{
    const glassPath =
        "res:/graphics/effect.gles2/managed/interior/avatar/glassshader.sm_hi";
    const fixture = CreateFixture({
        configuredEffectFilePath: glassPath,
        configuredDiffusePath: "",
        configuredDeferredTextureConsumer: true
    });
    SetTestTw2(fixture.tw2);
    const adapter = new TnyGlesCharacterAdapter({
        client: fixture.tiny,
        atlasComposer: DEFERRED_ATLAS_COMPOSER
    });
    const construction = CreateAppearanceConstruction();
    construction.textureContributions[0].groupID = "accessories/glasses";
    construction.operations.find(value => value.operation === "configured-part").groupID =
        "accessories/glasses";
    const staged = await adapter.Prepare(construction);
    const effect = fixture.configuredModels[0].meshes[0].opaqueAreas[0].effect;

    assert.equal(effect.effectFilePath, glassPath);
    assert.equal(effect._characterAuthoredEffectFilePath, glassPath);
    assert.deepEqual(effect._characterAuthoredTexturePaths, {});
    assert.equal(effect._characterProofFallback, undefined);
    assert.equal(staged.configuredParts[0].proofFallbackEffectCount, 0);

    adapter.Release(staged);
});

test("legacy adapter retains an effective reflected cut-mask constant", async () =>
{
    const fixture = CreateFixture({
        configuredEffectReady: false,
        configuredReflectedCutMaskInfluence: [ 0.85, 0, 0, 0 ],
        configuredCutMaskPath: ""
    });
    SetTestTw2(fixture.tw2);
    const adapter = new TnyGlesCharacterAdapter({
        client: fixture.tiny,
        atlasComposer: DEFERRED_ATLAS_COMPOSER
    });
    const staged = await adapter.Prepare(CreateAppearanceConstruction());
    const effect = fixture.configuredModels[0].meshes[0].opaqueAreas[0].effect;

    assert.ok(Math.abs(effect._characterAuthoredCutMaskInfluence[0] - 0.85) < 1e-6);
    assert.deepEqual(effect._characterAuthoredCutMaskInfluence.slice(1), [ 0, 0, 0 ]);
    assert.equal(effect._characterAuthoredCutMaskInfluenceSource, "shader-constant");
    assert.ok(Math.abs(effect._characterAppliedCutMaskInfluence[0] - 0.85) < 1e-6);
    assert.deepEqual(effect.parameters.CutMaskInfluence.GetValue([]).slice(1), [ 0, 0, 0 ]);
    assert.equal(effect._characterAppliedCutMaskPolicy,
        "authored-influence-with-neutral-white-mask");

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
    SetTestTw2(fixture.tw2);
    const adapter = new TnyGlesCharacterAdapter({
        client: fixture.tiny,
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
            rule: "legacy-opengl-authored-footwear-coverage-v1",
            sex: "male",
            groupID: "feet",
            partSourceRecordID: "male/feet/bootsam01",
            footwearHeight: "medium",
            authoredModifierPaths: [ "utilityshapes/pantstuckmediumshape" ]
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

test("legacy adapter hides exact male nude legs only after PantsAM01 is render-ready", async () =>
{
    const fixture = CreateFixture();
    let compositionSawVisibleLegs = false;

    SetTestTw2(fixture.tw2);
    const adapter = new TnyGlesCharacterAdapter({
        client: fixture.tiny,
        atlasComposer: {
            async Compose(staged)
            {
                compositionSawVisibleLegs = staged.backend.visualModel.meshes
                    .filter(mesh => mesh._characterFoundationRole === "legs")
                    .every(mesh => mesh.display !== false);
                return { status: "composed", passes: [] };
            }
        }
    });
    const staged = await adapter.Prepare(CreateMalePantsCoverageConstruction());
    const legs = staged.backend.visualModel.meshes.find(mesh =>
        mesh._characterFoundationRole === "legs");
    const pants = staged.configuredPartBindings[0].configuredMeshes[0];

    assert.equal(compositionSawVisibleLegs, true);
    assert.equal(legs.display, false);
    assert.notEqual(pants.display, false);
    assert.equal(staged.foundationCoverage[0].status, "applied");
    assert.equal(staged.foundationCoverage[0].evidence.partSourceRecordID,
        "male/bottomouter/pantsam01");
    assert.equal(staged.foundationCoverage[0].evidence.groupID, "bottomouter");
    assert.equal(
        staged.foundationCoverage[0].evidence.relationships[0].modifierLocationKey,
        "bottominner"
    );

    adapter.Release(staged);
});

test("legacy adapter hides qualified male body carriers and retains head and hands", async () =>
{
    const fixture = CreateFixture();
    let compositionSawVisibleTorso = false;

    SetTestTw2(fixture.tw2);
    const adapter = new TnyGlesCharacterAdapter({
        client: fixture.tiny,
        atlasComposer: {
            async Compose(staged)
            {
                compositionSawVisibleTorso = staged.backend.visualModel.meshes
                    .filter(mesh => mesh._characterFoundationRole === "torso")
                    .every(mesh => mesh.display !== false);
                return { status: "composed", passes: [] };
            }
        }
    });
    const staged = await adapter.Prepare(CreateMaleTorsoCoverageConstruction());
    const meshes = staged.backend.visualModel.meshes;
    const torso = meshes.find(mesh => mesh._characterFoundationRole === "torso");
    const legs = meshes.find(mesh => mesh._characterFoundationRole === "legs");
    const feet = meshes.find(mesh => mesh._characterFoundationRole === "feet");
    const head = meshes.find(mesh => mesh._characterFoundationRole === "head");
    const hands = meshes.find(mesh => mesh._characterFoundationRole === "hands");
    const robe = staged.configuredPartBindings[0].configuredMeshes[0];

    assert.equal(compositionSawVisibleTorso, true);
    assert.equal(torso.display, false);
    assert.equal(legs.display, false);
    assert.equal(feet.display, false);
    assert.equal(head.display, true);
    assert.equal(hands.display, true);
    assert.notEqual(robe.display, false);
    assert.equal(staged.foundationCoverage[0].status, "applied");
    assert.equal(staged.foundationCoverage[0].evidence.relationships[0].modifierLocationKey,
        "topinner");
    assert.deepEqual(staged.foundationCoverage[0].applied.map(value => value.role), [
        "torso",
        "legs",
        "feet"
    ]);

    adapter.Release(staged);
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
            rule: "legacy-opengl-authored-footwear-coverage-v1",
            sex: "female",
            groupID: "feet",
            partSourceRecordID: "female/feet/bootscf01",
            footwearHeight: "shin",
            authoredModifierPaths: [ "dependants/bootmasks/bootmaskshin" ]
        }
    };
    SetTestTw2(fixture.tw2);
    const adapter = new TnyGlesCharacterAdapter({
        client: fixture.tiny,
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

test("legacy adapter replaces split female feet with a configured skin consumer", async () =>
{
    const fixture = CreateFixture({
        configuredMeshIndex: 0,
        configuredMeshNames: [ "FeetShape" ],
        geometryMeshNames: [ "FeetShape" ],
        geometryBindingIndex: 0,
        configuredBodyEffect: true,
        configuredEffectFilePath:
            "res:/graphics/effect.gles2/managed/interior/avatar/skinnedavatarbrdfdoublelinear.sm_hi"
    });
    SetTestTw2(fixture.tw2);
    const adapter = new TnyGlesCharacterAdapter({
        client: fixture.tiny,
        atlasComposer: DEFERRED_ATLAS_COMPOSER
    });
    const staged = await adapter.Prepare(CreateFemaleReplacementFootwearConstruction());
    const foundationFeet = staged.backend.visualModel.meshes.find(mesh =>
        mesh._characterFoundationRole === "feet");
    const configuredFeet = staged.configuredPartBindings[0].configuredMeshes[0];

    assert.equal(foundationFeet.display, false);
    assert.notEqual(configuredFeet.display, false);
    assert.equal(
        fixture.configuredEffects[0]._characterFoundationReplacementRole,
        "feet"
    );
    assert.deepEqual(staged.foundationCoverage, [ {
        status: "applied",
        reason: null,
        partSourceRecordID: "female/feet/posed-footwear",
        roles: [ "feet" ],
        strategy: "hide-carrier",
        evidence: {
            status: "policy",
            rule: "legacy-opengl-configured-footwear-skin-replacement-v1",
            sex: "female",
            groupID: "feet",
            partSourceRecordID: "female/feet/posed-footwear",
            configurationPath: "res:/custom/posed-footwear.black",
            geometryPath: "res:/custom/posed-footwear.gr2",
            bodyConsumerCount: 1
        },
        applied: [ {
            role: "feet",
            meshIndex: staged.backend.visualModel.meshes.indexOf(foundationFeet),
            previousDisplay: true,
            display: false
        } ]
    } ]);

    adapter.Release(staged);
});

test("legacy adapter defers exact coverage when the configured boot is not render-ready", async () =>
{
    const fixture = CreateFixture({
        configuredEffectReady: false,
        configuredEffectInitializesReady: false
    });
    SetTestTw2(fixture.tw2);
    const adapter = new TnyGlesCharacterAdapter({
        client: fixture.tiny,
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
            rule: "legacy-opengl-authored-footwear-coverage-v1",
            sex: "male",
            groupID: "feet",
            partSourceRecordID: "male/feet/bootsam01",
            footwearHeight: "medium",
            authoredModifierPaths: [ "utilityshapes/pantstuckmediumshape" ]
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
    SetTestTw2(fixture.tw2);
    const adapter = new TnyGlesCharacterAdapter({
        client: fixture.tiny,
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
    SetTestTw2(fixture.tw2);
    const adapter = new TnyGlesCharacterAdapter({
        client: fixture.tiny,
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
    let textureMetadataSource = null;
    const libraryManager = { Get() {} };
    SetTestTw2(fixture.tw2);
    const adapter = new TnyGlesCharacterAdapter({
        client: fixture.tiny,
        atlasComposer: {
            SetTextureMetadataSource(source)
            {
                textureMetadataSource = source;
            },
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

    const staged = await adapter.Prepare(construction, {
        source: {
            GetLibraryManager() { return libraryManager; }
        }
    });
    const diagnostics = adapter.GetDiagnostics(staged);

    assert.strictEqual(composedStage, staged);
    assert.strictEqual(textureMetadataSource, libraryManager);
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
    SetTestTw2(fixture.tw2);
    const adapter = new TnyGlesCharacterAdapter({
        client: fixture.tiny,
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

test("legacy adapter admits a configured material alias only beside an exact sole-mesh sibling", async () =>
{
    const fixture = CreateFixture({
        configuredMeshIndices: [ 1, 0 ],
        configuredMeshNames: [ "Neck_RenamedShape", "TopTuckingShape" ],
        geometryBindingIndex: 0,
        geometryMeshNames: [ "TopTuckingShape" ]
    });
    SetTestTw2(fixture.tw2);
    const adapter = new TnyGlesCharacterAdapter({
        client: fixture.tiny,
        atlasComposer: DEFERRED_ATLAS_COMPOSER
    });

    const staged = await adapter.Prepare(CreateAppearanceConstruction());
    const meshes = fixture.configuredModels[0].meshes;

    assert.deepEqual(meshes.map(mesh => mesh.meshIndex), [ 0, 0 ]);
    assert.deepEqual(meshes.map(mesh => mesh.opaqueAreas[0].meshIndex), [ 0, 0 ]);
    assert.equal(staged.configuredParts[0].singleGeometryAliasCount, 1);
    assert.equal(staged.configuredParts[0].authoredMeshIndexCount, 1);
    adapter.Release(staged);
});

test("legacy adapter attaches only the exact carrier from a stale multi-carrier sole mesh", async () =>
{
    const fixture = CreateFixture({
        configuredMeshIndices: [ 3, 1, undefined, 2 ],
        configuredMeshNames: [
            "Cap1Shape", "Male_Head_AverageShape", "OriginalShape", "CapShape"
        ],
        geometryBindingIndex: 0,
        geometryMeshNames: [ "CapShape" ]
    });
    SetTestTw2(fixture.tw2);
    const adapter = new TnyGlesCharacterAdapter({
        client: fixture.tiny,
        atlasComposer: DEFERRED_ATLAS_COMPOSER
    });

    const staged = await adapter.Prepare(CreateAppearanceConstruction());
    const configuredPart = staged.configuredParts[0];

    assert.equal(configuredPart.meshCount, 1);
    assert.equal(configuredPart.retainedUnboundMeshCount, 3);
    assert.deepEqual(
        configuredPart.retainedUnboundConfiguredMeshes.map(value => value.meshName),
        [ "Cap1Shape", "Male_Head_AverageShape", "OriginalShape" ]
    );
    assert.equal(staged.configuredPartBindings[0].configuredMeshes[0].name, "CapShape");
    assert.equal(staged.configuredPartBindings[0].configuredMeshes[0].meshIndex, 0);
    adapter.Release(staged);
});

test("legacy adapter attaches one uniquely suffixed carrier to a sole geometry mesh", async () =>
{
    const fixture = CreateFixture({
        configuredMeshIndices: [ 2, 1, 0 ],
        configuredMeshNames: [ "RobeShape1", "Torso5Shape", "TorsoShape" ],
        geometryBindingIndex: 0,
        geometryMeshNames: [ "robeShape" ]
    });
    SetTestTw2(fixture.tw2);
    const adapter = new TnyGlesCharacterAdapter({
        client: fixture.tiny,
        atlasComposer: DEFERRED_ATLAS_COMPOSER
    });

    const staged = await adapter.Prepare(CreateAppearanceConstruction());
    const configuredPart = staged.configuredParts[0];

    assert.equal(configuredPart.meshCount, 1);
    assert.equal(configuredPart.singleGeometryAliasCount, 1);
    assert.equal(configuredPart.retainedUnboundMeshCount, 2);
    assert.deepEqual(
        configuredPart.retainedUnboundConfiguredMeshes.map(value => value.meshName),
        [ "Torso5Shape", "TorsoShape" ]
    );
    assert.equal(staged.configuredPartBindings[0].configuredMeshes[0].name, "RobeShape1");
    assert.equal(staged.configuredPartBindings[0].configuredMeshes[0].meshIndex, 0);
    adapter.Release(staged);
});

test("legacy adapter rejects ambiguous suffixed carriers for a sole geometry mesh", async () =>
{
    const fixture = CreateFixture({
        configuredMeshIndices: [ 2, 1, 0 ],
        configuredMeshNames: [ "RobeShape1", "RobeShape2", "TorsoShape" ],
        geometryBindingIndex: 0,
        geometryMeshNames: [ "robeShape" ]
    });
    SetTestTw2(fixture.tw2);
    const adapter = new TnyGlesCharacterAdapter({
        client: fixture.tiny,
        atlasComposer: DEFERRED_ATLAS_COMPOSER
    });

    await assert.rejects(
        adapter.Prepare(CreateAppearanceConstruction()),
        /differently named geometry mesh/u
    );
});

test("legacy adapter retains a stale carrier while accepting a unique unclaimed authored index", async () =>
{
    const fixture = CreateFixture({
        configuredMeshIndices: [ 0, 1, 2 ],
        configuredMeshNames: [ "HairMeshShape", "polySurfaceShape3", "pieceShape1" ],
        geometryBindingIndex: 0,
        geometryMeshNames: [ "HairMeshShape", "hairornamentShape" ]
    });
    SetTestTw2(fixture.tw2);
    const adapter = new TnyGlesCharacterAdapter({
        client: fixture.tiny,
        atlasComposer: DEFERRED_ATLAS_COMPOSER
    });

    const staged = await adapter.Prepare(CreateAppearanceConstruction());
    const configuredPart = staged.configuredParts[0];

    assert.equal(configuredPart.meshCount, 2);
    assert.equal(configuredPart.retainedUnboundMeshCount, 1);
    assert.deepEqual(configuredPart.retainedUnboundConfiguredMeshes, [ {
        meshName: "pieceShape1",
        authoredMeshIndex: 2,
        reason: "stale-out-of-range-configured-carrier"
    } ]);
    assert.deepEqual(
        staged.configuredPartBindings[0].configuredMeshes.map(mesh => mesh.meshIndex),
        [ 0, 1 ]
    );
    assert.deepEqual(
        staged.configuredPartBindings[0].resolvedMeshBindings.map(value => value.source),
        [ "authored", "unique-authored-index-alias" ]
    );
    adapter.Release(staged);
});

test("legacy adapter rejects a sole-mesh alias without an exact configured sibling", async () =>
{
    const fixture = CreateFixture({
        configuredMeshIndices: [ 1, 0 ],
        configuredMeshNames: [ "Neck_RenamedShape", "OtherCarrierShape" ],
        geometryBindingIndex: 0,
        geometryMeshNames: [ "TopTuckingShape" ]
    });
    SetTestTw2(fixture.tw2);
    const adapter = new TnyGlesCharacterAdapter({ client: fixture.tiny });

    await assert.rejects(
        adapter.Prepare(CreateAppearanceConstruction()),
        /resolved to differently named geometry mesh/u
    );
    assert.equal(fixture.scene.objects.length, 0);
});

test("legacy adapter rejects configured parts without an authored or model-resolved geometry binding", async () =>
{
    const fixture = CreateFixture({
        configuredMeshIndex: 3,
        geometryBindingIndex: null
    });
    SetTestTw2(fixture.tw2);
    const adapter = new TnyGlesCharacterAdapter({
        client: fixture.tiny,
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

test("legacy adapter retains a configured dependency with no visual meshes as support-only", async () =>
{
    const fixture = CreateFixture({ configuredMeshIndices: [] });
    SetTestTw2(fixture.tw2);
    const adapter = new TnyGlesCharacterAdapter({
        client: fixture.tiny,
        atlasComposer: DEFERRED_ATLAS_COMPOSER
    });

    const staged = await adapter.Prepare(CreateAppearanceConstruction());
    const part = staged.configuredParts[0];

    assert.equal(part.meshCount, 0);
    assert.equal(part.geometryStatus, "retained-support-only");
    assert.equal(part.renderStatus, "retained-not-rendered");
    assert.equal(staged.backend.visualModel.meshes.length, 1);
    assert.equal(
        fixture.fetches.includes("res:/custom/boots.gr2"),
        false
    );
    adapter.Release(staged);
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
                rule: "legacy-opengl-authored-footwear-coverage-v1",
                sex: "male",
                groupID: "feet",
                partSourceRecordID: "male/feet/bootsam01",
                footwearHeight: "medium",
                authoredModifierPaths: [ "utilityshapes/pantstuckmediumshape" ]
            }
        }
    });

    return construction;
}

function CreateFemaleReplacementFootwearConstruction()
{
    const construction = CreateConstruction("female", [
        [ "body", "res:/custom/female-body.gr2" ],
        [ "feet", "res:/custom/female-feet.gr2" ]
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
        partSourceRecordID: "female/feet/posed-footwear",
        configurationPath: "res:/custom/posed-footwear.black",
        geometryPath: "res:/custom/posed-footwear.gr2"
    });

    return construction;
}

function CreateMalePantsCoverageConstruction()
{
    const construction = CreateConstruction("male", [
        [ "torso", "res:/custom/male-torso.gr2" ],
        [ "legs", "res:/custom/male-legs.gr2" ]
    ]);

    construction.evidence = {
        status: "policy",
        rule: "legacy-opengl-appearance-v1"
    };
    construction.resolvedPartCount = 1;
    construction.configuredPartCount = 1;
    construction.deferredContributionCount = 0;
    construction.textureContributions = [ IdentityContribution("bottomouter") ];
    construction.operations.splice(-1, 0, {
        operation: "configured-part",
        layerIndex: 0,
        partIndex: 0,
        groupID: "bottomouter",
        partSourceRecordID: "male/bottomouter/pantsam01",
        configurationPath: "res:/custom/pants.black",
        geometryPath: "res:/custom/pants.gr2",
        foundationCoverage: {
            strategy: "hide-carrier",
            roles: [ "legs" ],
            evidence: {
                status: "policy",
                rule: "legacy-opengl-authored-modifier-coverage-v1",
                sex: "male",
                groupID: "bottomouter",
                partSourceRecordID: "male/bottomouter/pantsam01",
                relationships: [ {
                    authoredValue: "bottominner",
                    modifierLocationKey: "bottominner",
                    foundationRole: "legs",
                    relation: "typed-modifier-location"
                } ]
            }
        }
    });

    return construction;
}

function CreateMaleTorsoCoverageConstruction()
{
    const construction = CreateConstruction("male", [
        [ "head", "res:/custom/male-head.gr2" ],
        [ "torso", "res:/custom/male-torso.gr2" ],
        [ "legs", "res:/custom/male-legs.gr2" ],
        [ "feet", "res:/custom/male-feet.gr2" ],
        [ "hands", "res:/custom/male-hands.gr2" ]
    ]);

    construction.evidence = {
        status: "policy",
        rule: "legacy-opengl-appearance-v1"
    };
    construction.resolvedPartCount = 1;
    construction.configuredPartCount = 1;
    construction.deferredContributionCount = 0;
    construction.textureContributions = [ IdentityContribution("outer") ];
    construction.operations.splice(-1, 0, {
        operation: "configured-part",
        layerIndex: 0,
        partIndex: 0,
        groupID: "outer",
        partSourceRecordID: "male/outer/robe-fixture",
        configurationPath: "res:/custom/robe.black",
        geometryPath: "res:/custom/robe.gr2",
        foundationCoverage: {
            strategy: "hide-carrier",
            roles: [ "torso", "legs", "feet" ],
            evidence: {
                status: "policy",
                rule: "legacy-opengl-authored-modifier-coverage-v1",
                sex: "male",
                groupID: "outer",
                partSourceRecordID: "male/outer/robe-fixture",
                relationships: [ {
                    authoredValue: "topinner",
                    modifierLocationKey: "topinner",
                    foundationRole: "torso",
                    relation: "typed-modifier-location"
                }, {
                    authoredValue: "bottominner",
                    modifierLocationKey: "bottominner",
                    foundationRole: "legs",
                    relation: "typed-modifier-location"
                }, {
                    authoredValue: "feet",
                    modifierLocationKey: "feet",
                    foundationRole: "feet",
                    relation: "typed-modifier-location"
                } ]
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
    configuredMeshIndices = null,
    configuredMeshNames = null,
    configuredGeometryResPaths = null,
    geometryMeshNames = null,
    geometryBindingIndex = 0,
    resetConfiguredMeshIndicesOnWatch = false,
    configuredEffectReady = true,
    configuredEffectInitializesReady = true,
    configuredEffectFilePath = null,
    configuredDiffusePath = "res:/custom/authored-diffuse.png",
    configuredDeferredTextureConsumer = false,
    configuredEffectNames = null,
    configuredTransforms = null,
    configuredCutMaskInfluence = null,
    configuredReflectedCutMaskInfluence = null,
    configuredCutMaskPath = undefined,
    configuredInitialTextures = null,
    configuredBodyEffect = false,
    configuredFetchFailure = false,
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
        Tw2Effect: class
        {
            static from(values)
            {
                const effect = new this();
                Object.assign(effect, values);
                effect.Initialize();
                return effect;
            }
            parameters = {};
            IsGood()
            {
                return this.ready === true;
            }
            Initialize()
            {
                this.initialized = true;
                this.ready = configuredEffectInitializesReady;
            }
            SetTextures(value)
            {
                this.textures = value;
            }
            SetParameters(values)
            {
                for (const [ name, value ] of Object.entries(values))
                {
                    this.parameters[name] = {
                        value: [ ...value ],
                        GetValue(out)
                        {
                            out.push(...this.value);
                            return out;
                        },
                        SetValue(next)
                        {
                            this.value = [ ...next ];
                        }
                    };
                }
            }
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
        configuredEffects: [],
        createdMeshes,
        initializeCalls,
        fetches,
        scene,
        watched: null,
        tiny,
        tw2: {
            Gr2Reader: {
                DEFAULT_OPTIONS: {}
            },
            GetClass: name => classes[name] ?? null,
            async Fetch(resourcePath)
            {
                fetches.push(resourcePath);

                if (resourcePath.endsWith(".black"))
                {
                    if (configuredFetchFailure)
                    {
                        throw new Error("fixture configured fetch failure");
                    }
                    const model = new classes.Tr2SkinnedModel();
                    const meshIndices = configuredMeshIndices ?? [ configuredMeshIndex ];
                    for (let meshOffset = 0; meshOffset < meshIndices.length; meshOffset++)
                    {
                        const mesh = new classes.Tw2Mesh();
                        const effect = {
                            name: configuredEffectNames?.[meshOffset] ?? "C_Skin_blinn1",
                            effectFilePath: configuredEffectFilePath
                                ?? (configuredBodyEffect
                                    ? "res:/graphics/effect.gles2/managed/interior/avatar/skinnedavatarbrdflinear.sm_hi"
                                    : ""),
                            ready: configuredEffectReady,
                            textures: configuredInitialTextures?.[meshOffset],
                            setTexturesCalls: 0,
                            autoPopulateCalls: 0,
                            parameters: {
                                DiffuseMap: configuredDeferredTextureConsumer
                                    ? TextureAttachmentFixture(
                                        configuredInitialTextures?.[meshOffset]?.DiffuseMap
                                            ?? configuredDiffusePath
                                    )
                                    : {
                                        resourcePath:
                                            configuredInitialTextures?.[meshOffset]?.DiffuseMap
                                            ?? configuredDiffusePath
                                    },
                                ...(configuredDeferredTextureConsumer ? {
                                    NormalMap: TextureAttachmentFixture(""),
                                    SpecularMap: TextureAttachmentFixture("")
                                } : {}),
                                TransformUV0: {
                                    value: [ ...(configuredTransforms?.[meshOffset]
                                        ?? [ 0, 0, 0.5, 1 ]) ],
                                    GetValue(out)
                                    {
                                        out.push(...this.value);
                                        return out;
                                    },
                                    SetValue(value)
                                    {
                                        this.value = [ ...value ];
                                    }
                                },
                                ...(configuredCutMaskInfluence ? {
                                    CutMaskInfluence: {
                                        value: [ ...configuredCutMaskInfluence ],
                                        GetValue(out)
                                        {
                                            out.push(...this.value);
                                            return out;
                                        },
                                        SetValue(value)
                                        {
                                            this.value = [ ...value ];
                                        }
                                    }
                                } : {}),
                                ...(configuredCutMaskPath !== undefined ? {
                                    CutMaskMap: {
                                        resourcePath: configuredCutMaskPath
                                    }
                                } : {}),
                                ...(configuredBodyEffect ? {
                                    WrinkleParams: {},
                                    Material2LibraryID: {},
                                    ColorCorrectionSource: {}
                                } : {})
                            },
                            IsGood()
                            {
                                return this.ready;
                            },
                            SetValues(values)
                            {
                                Object.assign(this, values);
                            },
                            SetParameters(values)
                            {
                                for (const [ name, value ] of Object.entries(values))
                                {
                                    const parameter = this.parameters[name];
                                    if (typeof parameter?.SetValue === "function")
                                    {
                                        parameter.SetValue(value);
                                    }
                                }
                            },
                            Initialize()
                            {
                                this.initialized = true;
                                if (configuredEffectInitializesReady) this.ready = true;
                            },
                            AutoPopulate(autoClean)
                            {
                                assert.equal(autoClean, false);
                                this.autoPopulateCalls++;
                            },
                            SetTextures(value)
                            {
                                this.setTexturesCalls++;
                                this.textures = value;
                            }
                        };
                        if (configuredReflectedCutMaskInfluence)
                        {
                            effect.shader = {
                                techniques: {
                                    Main: {
                                        passes: [ {
                                            stages: [ {
                                                constants: [ {
                                                    name: "CutMaskInfluence",
                                                    offset: 0,
                                                    size: 4
                                                } ]
                                            } ]
                                        } ]
                                    }
                                }
                            };
                            effect.techniques = {
                                Main: [ {
                                    stages: [ {
                                        constantBuffer: Float32Array.from(
                                            configuredReflectedCutMaskInfluence
                                        )
                                    } ]
                                } ]
                            };
                        }
                        for (const [ name, resourcePath ] of Object.entries(
                            configuredInitialTextures?.[meshOffset] ?? {}
                        ))
                        {
                            effect.parameters[name] = { resourcePath };
                        }

                        mesh.meshIndex = meshIndices[meshOffset];
                        mesh.name = configuredMeshNames?.[meshOffset] ?? "";
                        mesh.geometryResPath = configuredGeometryResPaths?.[meshOffset] ?? "";
                        mesh.opaqueAreas.push({ meshIndex: 99, effect });
                        model.meshes.push(mesh);
                        fixture.configuredEffects.push(effect);
                    }
                    fixture.configuredModels.push(model);
                    return model;
                }

                return {
                    path: resourcePath,
                    meshes: (geometryMeshNames ?? [ "zero", "one" ])
                        .map(name => ({ name }))
                };
            },
            resMan: {
                async Watch(value)
                {
                    fixture.watched = value;
                    if (resetConfiguredMeshIndicesOnWatch
                        && fixture.configuredModels.includes(value))
                    {
                        for (const mesh of value.meshes)
                        {
                            mesh.meshIndex = geometryBindingIndex;
                            for (const area of mesh.opaqueAreas)
                            {
                                area.meshIndex = geometryBindingIndex;
                            }
                        }
                    }
                }
            },
            runtime: {}
        }
    };

    return fixture;
}

function TextureAttachmentFixture(resourcePath)
{
    return {
        resourcePath,
        textureRes: null,
        isAttached: false,
        AttachTextureRes(value)
        {
            this.textureRes = value;
            this.isAttached = Boolean(value);
        }
    };
}

function MorphTargetFixture(weight)
{
    return {
        modifierPath: "utilityshapes/pushhemmidshape",
        targetName: "PushHemMidShape",
        weight,
        ownerGroupID: "bottomouter",
        evidence: {
            status: "policy",
            rule: "legacy-gles-unique-normalized-morph-target-match-v1"
        }
    };
}
