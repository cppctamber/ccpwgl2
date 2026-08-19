import assert from "node:assert/strict";
import test from "node:test";

import { TnyGlesTexturePolicy } from "./runtime-character-modules.mjs";

const root = "res:/graphics/character/female/paperdoll/topmiddle/shirtcf01";
const typePath = `${root}/types/shirtcf01_generic02.type`;
const materialPath = `${root}/generic02.color`;

test("legacy texture policy joins exact retained type and color definitions without dropping candidates", () =>
{
    const fixture = CreateFixture();
    const result = new TnyGlesTexturePolicy().Resolve(
        fixture.library,
        fixture.paperdoll,
        fixture.plan
    );

    assert.equal(result.length, 1);
    assert.equal(result[0].ownerSelectionIndex, 0);
    assert.equal(result[0].weight, 1);
    assert.deepEqual(result[0].source, {
        partSourceRecordID: "female/topmiddle/shirtcf01",
        partPath: "topmiddle/shirtcf01",
        versionIndex: 0,
        typeDefinitionPath: typePath,
        materialDefinitionPath: materialPath,
        occludesModifiers: []
    });
    assert.strictEqual(result[0].materialValues, fixture.materialValues);
    assert.equal(result[0].textureCandidates.length, 9);
    assert.equal(result[0].textureCandidates.filter(value => value.selected).length, 4);
    assert.deepEqual(result[0].selectedTextures.map(value => [ value.role, value.path ]), [
        [ "colorize-layer", `${root}/colorize_body_l_4k.png` ],
        [ "colorize-zones", `${root}/colorize_body_z_4k.png` ],
        [ "normal-source", `${root}/shirtcf01_n_4k.png` ],
        [ "specular-source", `${root}/shirtcf01_s_4k.png` ]
    ]);
    assert.deepEqual(
        result[0].textureCandidates.find(value => value.path.endsWith("unclassified.png")),
        {
            path: `${root}/unclassified.png`,
            family: "unclassified",
            quality: "standard",
            role: null,
            target: null,
            recognized: false,
            selected: false
        }
    );
    assert.deepEqual(result[0].diagnostics, []);
    assert.equal(result[0].evidence.rule, "legacy-opengl-texture-filename-v2");
});

test("legacy texture policy preserves an authored dependency layer weight", () =>
{
    const fixture = CreateFixture();
    fixture.plan.layers[0].weight = 0.4;

    const [ result ] = new TnyGlesTexturePolicy().Resolve(
        fixture.library,
        fixture.paperdoll,
        fixture.plan
    );

    assert.equal(result.weight, 0.4);
});

test("legacy texture policy treats version folders as family overlays", () =>
{
    const fixture = CreateFixture();
    const base = fixture.partSource.versions[0];
    const version = {
        resourceVersion: "v2",
        metadata: null,
        configurationCandidates: [],
        geometryCandidates: [],
        textureCandidates: [ `${root}/v2/shirtcf01_s_4k.png` ]
    };

    fixture.partSource.versions.push(version);
    fixture.plan.parts[0].origin.jsonPointer = "/versions/1";
    fixture.paperdoll.modifiers[0].paperdollResourceID.partType.resourceVersion = "v2";
    fixture.definitions.get(typePath).values[1] = "v2";

    const [ result ] = new TnyGlesTexturePolicy().Resolve(
        fixture.library,
        fixture.paperdoll,
        fixture.plan
    );

    assert.equal(result.source.versionIndex, 1);
    assert.ok(result.textureCandidates.some(value =>
        value.path === `${root}/v2/shirtcf01_s_4k.png` && value.selected));
    assert.equal(result.textureCandidates.some(value =>
        value.path === `${root}/shirtcf01_s_4k.png`), false);
    assert.ok(result.textureCandidates.some(value =>
        value.path === base.textureCandidates[1] && value.selected));
});

test("legacy texture policy lets exact version channels supersede differently named base channels", () =>
{
    const fixture = CreateFixture();
    const base = fixture.partSource.versions[0];
    const cutPath = `${root}/comp_body_m.png`;
    base.textureCandidates.push(cutPath);
    const version = {
        resourceVersion: "v4",
        metadata: null,
        configurationCandidates: [],
        geometryCandidates: [],
        textureCandidates: [
            `${root}/v4/colorize_body_n_4k.png`,
            `${root}/v4/colorize_body_s_4k.png`
        ]
    };

    fixture.partSource.versions.push(version);
    fixture.plan.parts[0].origin.jsonPointer = "/versions/1";
    fixture.paperdoll.modifiers[0].paperdollResourceID.partType.resourceVersion = "v4";
    fixture.definitions.get(typePath).values[1] = "v4";

    const [ result ] = new TnyGlesTexturePolicy().Resolve(
        fixture.library,
        fixture.paperdoll,
        fixture.plan
    );

    assert.ok(result.selectedTextures.some(value =>
        value.path === `${root}/v4/colorize_body_n_4k.png`));
    assert.ok(result.selectedTextures.some(value =>
        value.path === `${root}/v4/colorize_body_s_4k.png`));
    assert.equal(result.textureCandidates.some(value =>
        value.path === `${root}/shirtcf01_n_4k.png`), false);
    assert.equal(result.textureCandidates.some(value =>
        value.path === `${root}/shirtcf01_s_4k.png`), false);
    assert.ok(result.textureCandidates.some(value => value.path === cutPath));
});

test("legacy texture policy classifies material-qualified configured garment shorthand", () =>
{
    const fixture = CreateFixture();
    fixture.plan.layers[0].owner.groupID = "bottomouter";
    fixture.partSource.versions[0].textureCandidates = [
        `${root}/shirtcf01_l.png`,
        `${root}/shirtcf01_n.png`,
        `${root}/shirtcf01_s.png`
    ];

    const [ result ] = new TnyGlesTexturePolicy().Resolve(
        fixture.library,
        fixture.paperdoll,
        fixture.plan
    );

    assert.deepEqual(result.selectedTextures.map(value => [ value.role, value.target ]), [
        [ "colorize-layer", "body" ],
        [ "normal-source", "body" ],
        [ "specular-source", "body" ]
    ]);
});

test("legacy texture policy keeps anonymous luminance unresolved without material evidence", () =>
{
    const fixture = CreateFixture();
    fixture.plan.layers[0].owner.groupID = "bottomouter";
    fixture.definitions.delete(materialPath);
    fixture.partSource.versions[0].textureCandidates = [ `${root}/shirtcf01_l.png` ];

    const [ result ] = new TnyGlesTexturePolicy().Resolve(
        fixture.library,
        fixture.paperdoll,
        fixture.plan
    );

    assert.equal(result.selectedTextures.length, 0);
    assert.equal(result.textureCandidates[0].recognized, false);
    assert.equal(result.textureCandidates[0].target, null);
});

test("legacy texture policy lets exact shorthand skirt channels override semantic base channels", () =>
{
    const fixture = CreateFixture();
    const version = {
        resourceVersion: "v5",
        metadata: null,
        configurationCandidates: [],
        geometryCandidates: [],
        textureCandidates: [
            `${root}/v5/shirtcf01_l.png`,
            `${root}/v5/shirtcf01_s.png`
        ]
    };
    fixture.plan.layers[0].owner.groupID = "bottomouter";
    fixture.partSource.versions.push(version);
    fixture.plan.parts[0].origin.jsonPointer = "/versions/1";
    fixture.paperdoll.modifiers[0].paperdollResourceID.partType.resourceVersion = "v5";
    fixture.definitions.get(typePath).values[1] = "v5";

    const [ result ] = new TnyGlesTexturePolicy().Resolve(
        fixture.library,
        fixture.paperdoll,
        fixture.plan
    );

    assert.ok(result.selectedTextures.some(value =>
        value.path === `${root}/v5/shirtcf01_l.png`
        && value.role === "colorize-layer"));
    assert.ok(result.selectedTextures.some(value =>
        value.path === `${root}/v5/shirtcf01_s.png`
        && value.role === "specular-source"));
    assert.equal(result.textureCandidates.some(value =>
        value.path === `${root}/colorize_body_l_4k.png`), false);
    assert.equal(result.textureCandidates.some(value =>
        value.path === `${root}/shirtcf01_s_4k.png`), false);
    assert.ok(result.selectedTextures.some(value =>
        value.path === `${root}/colorize_body_z_4k.png`
        && value.role === "colorize-zones"));
    assert.ok(result.selectedTextures.some(value =>
        value.path === `${root}/shirtcf01_n_4k.png`
        && value.role === "normal-source"));
});

test("legacy texture policy resolves an exact paper-doll eye colour definition", () =>
{
    const fixture = CreateFixture();
    const eyeRoot = "res:/graphics/character/female/paperdoll/makeup/eyes/eyes_06";
    const colorPath = "res:/graphics/character/female/paperdoll/makeup/eyes/colors/darkbrown_abc.color";
    const colorValues = {
        colors: [ [ 0.2, 0.1, 0.07, 1 ], [ 0.5, 0.5, 0.5, 1 ], [ 0.17, 0.1, 0.07, 1 ] ]
    };
    fixture.plan.layers[0].owner.groupID = "makeup/eyes";
    fixture.plan.colorSelections = [ {
        colorKey: "makeup/eyes",
        colorNameA: "darkbrown_abc",
        colorNameBC: null,
        gloss: 0,
        weight: 0
    } ];
    fixture.paperdoll.modifiers[0].paperdollResourceID.partType = {
        sourcePath: `${eyeRoot}/types/eyes_06.type`,
        sourcePaths: [ `${eyeRoot}/types/eyes_06.type` ],
        partPath: "makeup/eyes/eyes_06",
        resourceVersion: null,
        colorVariant: null
    };
    fixture.partSource.versions[0].textureCandidates = [
        `${eyeRoot}/colorize_head_l_4k.png`,
        `${eyeRoot}/colorize_head_z_4k.png`
    ];
    fixture.definitions.set(`${eyeRoot}/types/eyes_06.type`, {
        sourcePath: `${eyeRoot}/types/eyes_06.type`,
        extension: ".type",
        values: [ "makeup/eyes/eyes_06", "", "" ]
    });
    fixture.definitions.set(colorPath, {
        sourcePath: colorPath,
        extension: ".color",
        values: colorValues
    });

    const [ result ] = new TnyGlesTexturePolicy().Resolve(
        fixture.library,
        fixture.paperdoll,
        fixture.plan
    );

    assert.equal(result.source.materialDefinitionPath, colorPath);
    assert.strictEqual(result.materialValues, colorValues);
    assert.equal(result.evidence.materialRule, "exact-group-color-selection-v1");
});

test("legacy texture policy gives an exact type colour precedence over the paper-doll hair colour", () =>
{
    const fixture = CreateFixture();
    const capRoot = "res:/graphics/character/female/paperdoll/hair/headwear_cap_f01";
    const capTypePath = `${capRoot}/types/headwear_cap_f01_yoiul.type`;
    const typeColorPath = "res:/graphics/character/female/paperdoll/hair/colors/28_bc.color";
    const selectedColorPath = "res:/graphics/character/female/paperdoll/hair/colors/09_a.color";
    const typeColorValues = {
        colors: [ [ 0.08, 0.06, 0.06, 1 ], [ 0.08, 0.06, 0.06, 1 ], [ 0.38, 0.12, 0.09, 1 ] ],
        specularColors: [ [ 0.34, 0.33, 0.27, 1 ] ]
    };

    fixture.plan.layers[0].owner.groupID = "hair";
    fixture.plan.colorSelections = [ {
        colorKey: "hair",
        colorNameA: "09_a",
        colorNameBC: "09_bc",
        gloss: 0,
        weight: 0
    } ];
    fixture.paperdoll.modifiers[0].paperdollResourceID.partType = {
        sourcePath: capTypePath,
        sourcePaths: [ capTypePath ],
        partPath: "hair/headwear_cap_f01",
        resourceVersion: "v23",
        colorVariant: "28_bc"
    };
    fixture.definitions.set(capTypePath, {
        sourcePath: capTypePath,
        extension: ".type",
        values: [ "hair/headwear_cap_f01", "v23", "28_bc" ]
    });
    fixture.definitions.set(typeColorPath, {
        sourcePath: typeColorPath,
        extension: ".color",
        values: typeColorValues
    });
    fixture.definitions.set(selectedColorPath, {
        sourcePath: selectedColorPath,
        extension: ".color",
        values: { colors: [ [ 0.9, 0.8, 0.7, 1 ] ] }
    });

    const [ result ] = new TnyGlesTexturePolicy().Resolve(
        fixture.library,
        fixture.paperdoll,
        fixture.plan
    );

    assert.equal(result.source.materialDefinitionPath, typeColorPath);
    assert.strictEqual(result.materialValues, typeColorValues);
    assert.equal(result.evidence.materialRule, "exact-type-group-color-definition-v1");
    assert.equal(result.diagnostics.some(value =>
        value.code === "MATERIAL_DEFINITION_UNRESOLVED"), false);
});

test("legacy texture policy resolves paper-doll makeup colour beside the exact selected part", () =>
{
    const fixture = CreateFixture();
    const lipstickRoot = "res:/graphics/character/female/paperdoll/makeup/lipstick/lipstick_04";
    const colorPath = `${lipstickRoot}/silver_light_matte.color`;
    const colorValues = {
        colors: [ [ 0.7, 0.7, 0.7, 1 ], [ 0.4, 0.4, 0.4, 1 ], [ 0.2, 0.2, 0.2, 1 ] ]
    };
    fixture.plan.layers[0].owner.groupID = "makeup/lipstick";
    fixture.plan.colorSelections = [ {
        colorKey: "makeup/lipstick",
        colorNameA: "silver_light_matte",
        colorNameBC: null,
        gloss: 0.36,
        weight: 0.3258
    } ];
    fixture.partSource.recordID = "female/makeup/lipstick/lipstick_04";
    fixture.partSource.sourcePath = lipstickRoot;
    fixture.plan.parts[0].origin.recordID = fixture.partSource.recordID;
    fixture.paperdoll.modifiers[0].paperdollResourceID.partType = {
        sourcePath: `${lipstickRoot}/types/lipstick_04.type`,
        sourcePaths: [ `${lipstickRoot}/types/lipstick_04.type` ],
        partPath: "makeup/lipstick/lipstick_04",
        resourceVersion: null,
        colorVariant: null
    };
    fixture.partSource.versions[0].textureCandidates = [
        `${lipstickRoot}/colorize_head_l_4k.png`,
        `${lipstickRoot}/colorize_head_z_4k.png`
    ];
    fixture.definitions.set(`${lipstickRoot}/types/lipstick_04.type`, {
        sourcePath: `${lipstickRoot}/types/lipstick_04.type`,
        extension: ".type",
        values: [ "makeup/lipstick/lipstick_04", "", "" ]
    });
    fixture.definitions.set(colorPath, {
        sourcePath: colorPath,
        extension: ".color",
        values: colorValues
    });
    fixture.library.Get = (documentName, recordID) =>
    {
        if (documentName === "characterDefinitions")
        {
            return fixture.definitions.get(recordID) ?? null;
        }
        if (documentName === "characterPartSources"
            && recordID === fixture.partSource.recordID) return fixture.partSource;
        return null;
    };

    const [ result ] = new TnyGlesTexturePolicy().Resolve(
        fixture.library,
        fixture.paperdoll,
        fixture.plan
    );

    assert.equal(result.source.materialDefinitionPath, colorPath);
    assert.strictEqual(result.materialValues, colorValues);
    assert.equal(result.evidence.materialRule, "exact-part-source-color-selection-v1");
});

test("legacy texture policy uses the outer modifier location for direct garment maps", () =>
{
    const fixture = CreateFixture();
    const directRoot = "res:/graphics/character/female/paperdoll/outer/jacketmf01";

    fixture.plan.layers[0].owner.groupID = "outer";
    fixture.partSource.versions[0].textureCandidates = [
        `${directRoot}/jacketmf01_d.png`,
        `${directRoot}/jacketmf01_s.png`
    ];

    const [ result ] = new TnyGlesTexturePolicy().Resolve(
        fixture.library,
        fixture.paperdoll,
        fixture.plan
    );

    assert.deepEqual(result.selectedTextures.map(value => [ value.role, value.target ]), [
        [ "diffuse-source", "body" ],
        [ "specular-source", "body" ]
    ]);
});

test("legacy texture policy reports missing material evidence while retaining all texture paths", () =>
{
    const fixture = CreateFixture();

    fixture.definitions.delete(materialPath);
    const [ result ] = new TnyGlesTexturePolicy().Resolve(
        fixture.library,
        fixture.paperdoll,
        fixture.plan
    );

    assert.equal(result.materialValues, null);
    assert.equal(result.textureCandidates.length, 9);
    assert.equal(result.diagnostics[0].code, "MATERIAL_DEFINITION_UNRESOLVED");
});

test("legacy texture policy retains but does not apply an unselected sibling default material", () =>
{
    const fixture = CreateFixture();
    const implantRoot = "res:/graphics/character/female/paperdoll/makeup/implants/plugs_02";
    const implantTypePath = `${implantRoot}/types/plugs_02.type`;
    const defaultPath = `${implantRoot}/default.color`;
    const defaultValues = {
        colors: [ [ 0.1, 0.1, 0.1, 1 ], [ 0.2, 0.2, 0.2, 1 ], [ 0.3, 0.3, 0.3, 1 ] ]
    };
    fixture.plan.layers[0].owner.groupID = "makeup/implants";
    fixture.partSource.recordID = "female/makeup/implants/plugs_02";
    fixture.plan.parts[0].origin.recordID = fixture.partSource.recordID;
    fixture.paperdoll.modifiers[0].paperdollResourceID.partType = {
        sourcePath: implantTypePath,
        sourcePaths: [ implantTypePath ],
        partPath: "makeup/implants/plugs_02",
        resourceVersion: null,
        colorVariant: null
    };
    fixture.definitions.set(implantTypePath, {
        sourcePath: implantTypePath,
        extension: ".type",
        values: [ "makeup/implants/plugs_02", "", "" ]
    });
    fixture.definitions.set(defaultPath, {
        sourcePath: defaultPath,
        extension: ".color",
        values: defaultValues
    });
    fixture.library.Get = (documentName, recordID) =>
    {
        if (documentName === "characterDefinitions")
        {
            return fixture.definitions.get(recordID) ?? null;
        }
        if (documentName === "characterPartSources"
            && recordID === fixture.partSource.recordID) return fixture.partSource;
        return null;
    };

    const [ result ] = new TnyGlesTexturePolicy().Resolve(
        fixture.library,
        fixture.paperdoll,
        fixture.plan
    );

    assert.equal(result.materialValues, null);
    assert.equal(result.source.materialDefinitionPath, null);
    assert.deepEqual(result.source.materialCandidatePaths, [ defaultPath ]);
    assert.equal(result.diagnostics[0].code, "DEFAULT_MATERIAL_POLICY_UNRESOLVED");
    assert.equal(result.evidence.materialRule, "unresolved");
    assert.equal(
        result.evidence.materialCandidateRule,
        "unselected-exact-sibling-default-v1"
    );
});

test("schema-v8 plan texture paths retain and classify dependency cut masks", () =>
{
    const fixture = CreateFixture();
    const part = fixture.plan.parts[0];

    fixture.library.schemaVersion = 8;
    part.texturePaths = [
        "res:/graphics/character/female/paperdoll/dependants/masktuck/tuckmaskmid/comp_body_m.png",
        "res:/graphics/character/female/paperdoll/dependants/masktuck/tuckmaskmid/comp_body_m_512.png"
    ];

    const [ result ] = new TnyGlesTexturePolicy().Resolve(
        fixture.library,
        fixture.paperdoll,
        fixture.plan
    );

    assert.equal(result.textureCandidates.length, 2);
    assert.deepEqual(result.selectedTextures, [ {
        path: part.texturePaths[0],
        role: "cut-mask",
        target: "body",
        quality: "standard"
    } ]);
});

test("legacy texture policy classifies authored composite normal variants", () =>
{
    const fixture = CreateFixture();
    const paths = [
        "res:/graphics/character/female/paperdoll/makeup/augmentations/face_01/comp_head_mn.png",
        "res:/graphics/character/female/paperdoll/makeup/augmentations/face_01/comp_head_tn.png",
        "res:/graphics/character/female/paperdoll/makeup/augmentations/face_01/comp_body_tn_4k.png"
    ];
    fixture.partSource.versions[0].textureCandidates = paths;

    const [ result ] = new TnyGlesTexturePolicy().Resolve(
        fixture.library,
        fixture.paperdoll,
        fixture.plan
    );

    assert.deepEqual(result.selectedTextures, [
        {
            path: paths[0],
            role: "normal-overlay",
            target: "head",
            quality: "standard"
        },
        {
            path: paths[1],
            role: "twist-normal",
            target: "head",
            quality: "standard"
        },
        {
            path: paths[2],
            role: "twist-normal",
            target: "body",
            quality: "4k"
        }
    ]);
});

test("legacy texture policy retains independent hair and scalp material channels", () =>
{
    const fixture = CreateFixture();
    fixture.partSource.versions[0].textureCandidates = [
        "res:/graphics/character/female/paperdoll/hair/hair_bun_01/colorize_hair_l_4k.png",
        "res:/graphics/character/female/paperdoll/hair/hair_bun_01/colorize_hair_z_4k.png",
        "res:/graphics/character/female/paperdoll/hair/hair_bun_01/comp_hair_n_4k.png",
        "res:/graphics/character/female/paperdoll/hair/hair_bun_01/comp_hair_s_4k.png",
        "res:/graphics/character/female/paperdoll/hair/hair_bun_01/colorize_head_l_4k.png",
        "res:/graphics/character/female/paperdoll/hair/hair_bun_01/colorize_head_z_4k.png"
    ];

    const [ result ] = new TnyGlesTexturePolicy().Resolve(
        fixture.library,
        fixture.paperdoll,
        fixture.plan
    );

    assert.deepEqual(result.selectedTextures.map(value => [
        value.target,
        value.role
    ]), [
        [ "hair", "colorize-layer" ],
        [ "hair", "colorize-zones" ],
        [ "hair", "normal-overlay" ],
        [ "hair", "specular-overlay" ],
        [ "head", "colorize-layer" ],
        [ "head", "colorize-zones" ]
    ]);
});

test("schema-v9 libraries remain compatible with the retained texture policy", () =>
{
    const fixture = CreateFixture();

    fixture.library.schemaVersion = 9;

    const [ result ] = new TnyGlesTexturePolicy().Resolve(
        fixture.library,
        fixture.paperdoll,
        fixture.plan
    );

    assert.equal(result.source.partSourceRecordID, "female/topmiddle/shirtcf01");
    assert.equal(result.textureCandidates.length, 9);
});

test("schema-v10 libraries remain compatible with the retained texture policy", () =>
{
    const fixture = CreateFixture();
    fixture.library.schemaVersion = 10;
    const [ result ] = new TnyGlesTexturePolicy().Resolve(
        fixture.library,
        fixture.paperdoll,
        fixture.plan
    );

    assert.equal(result.source.partSourceRecordID, "female/topmiddle/shirtcf01");
});

test("legacy texture policy retains and applies exact authored modifier occlusions", () =>
{
    const fixture = CreateFixture();
    const target = structuredClone(fixture.plan.layers[0]);
    const targetPart = structuredClone(fixture.plan.parts[0]);

    fixture.partSource.versions[0].metadata = {
        occludesModifiers: [ "bottominner" ]
    };
    target.owner.groupID = "bottominner";
    target.contributor = targetPart;
    targetPart.origin = {
        recordID: fixture.partSource.recordID,
        jsonPointer: "/versions/0"
    };
    fixture.plan.parts.push(targetPart);
    fixture.plan.layers.push(target);
    fixture.paperdoll.modifiers.push(fixture.paperdoll.modifiers[0]);

    const result = new TnyGlesTexturePolicy().Resolve(
        fixture.library,
        fixture.paperdoll,
        fixture.plan
    );

    assert.deepEqual(result[0].source.occludesModifiers, [ "bottominner" ]);
    assert.deepEqual(result[1].occludedBy, [ {
        partIndex: 0,
        groupID: fixture.plan.layers[0].owner.groupID,
        partSourceRecordID: fixture.partSource.recordID,
        authoredValue: "bottominner"
    } ]);
});

test("legacy texture policy resolves legacy topunderwear through its hydrated modifier location", () =>
{
    const fixture = CreateFixture();
    const target = structuredClone(fixture.plan.layers[0]);
    const targetPart = structuredClone(fixture.plan.parts[0]);

    fixture.partSource.versions[0].metadata = {
        occludesModifiers: [ "topunderwear" ],
        occlusions: [ {
            authoredValue: "topunderwear",
            modifierLocation: { modifierKey: "topinner" }
        } ]
    };
    target.owner.groupID = "topinner";
    target.contributor = targetPart;
    targetPart.origin = {
        recordID: fixture.partSource.recordID,
        jsonPointer: "/versions/0"
    };
    fixture.plan.parts.push(targetPart);
    fixture.plan.layers.push(target);
    fixture.paperdoll.modifiers.push(fixture.paperdoll.modifiers[0]);

    const result = new TnyGlesTexturePolicy().Resolve(
        fixture.library,
        fixture.paperdoll,
        fixture.plan
    );

    assert.deepEqual(result[1].occludedBy, [ {
        partIndex: 0,
        groupID: fixture.plan.layers[0].owner.groupID,
        partSourceRecordID: fixture.partSource.recordID,
        authoredValue: "topunderwear"
    } ]);
});

test("legacy texture policy resolves retained topunderwear when its location keeps the legacy key", () =>
{
    const fixture = CreateFixture();
    const target = structuredClone(fixture.plan.layers[0]);
    const targetPart = structuredClone(fixture.plan.parts[0]);

    fixture.partSource.versions[0].metadata = {
        occludesModifiers: [ "topunderwear" ],
        occlusions: [ {
            authoredValue: "topunderwear",
            modifierLocation: { modifierKey: "topunderwear" }
        } ]
    };
    target.owner.groupID = "topinner";
    target.contributor = targetPart;
    targetPart.origin = {
        recordID: fixture.partSource.recordID,
        jsonPointer: "/versions/0"
    };
    fixture.plan.parts.push(targetPart);
    fixture.plan.layers.push(target);
    fixture.paperdoll.modifiers.push(fixture.paperdoll.modifiers[0]);

    const result = new TnyGlesTexturePolicy().Resolve(
        fixture.library,
        fixture.paperdoll,
        fixture.plan
    );

    assert.deepEqual(result[1].occludedBy, [ {
        partIndex: 0,
        groupID: fixture.plan.layers[0].owner.groupID,
        partSourceRecordID: fixture.partSource.recordID,
        authoredValue: "topunderwear"
    } ]);
});

function CreateFixture()
{
    const materialValues = {
        colors: [
            [ 0.121569, 0.152941, 0.152941, 1 ],
            [ 0.0588235, 0.0666667, 0.0666667, 1 ],
            [ 0.380392, 0.419608, 0.419608, 1 ]
        ],
        pattern: ""
    };
    const definitions = new Map([ [ typePath, {
        sourcePath: typePath,
        extension: ".type",
        values: [ "topmiddle/shirtcf01", "", "generic02" ]
    } ], [ materialPath, {
        sourcePath: materialPath,
        extension: ".color",
        values: materialValues
    } ] ]);
    const version = {
        resourceVersion: null,
        configurationCandidates: [],
        geometryCandidates: [],
        textureCandidates: [
            `${root}/colorize_body_l.png`,
            `${root}/colorize_body_l_4k.png`,
            `${root}/colorize_body_z_512.png`,
            `${root}/colorize_body_z_4k.png`,
            `${root}/shirtcf01_n.png`,
            `${root}/shirtcf01_n_4k.png`,
            `${root}/shirtcf01_s_512.png`,
            `${root}/shirtcf01_s_4k.png`,
            `${root}/unclassified.png`
        ]
    };
    const partSource = {
        recordID: "female/topmiddle/shirtcf01",
        partPath: "topmiddle/shirtcf01",
        versions: [ version ]
    };
    const partType = {
        sourcePath: typePath,
        sourcePaths: [ typePath ],
        partPath: "topmiddle/shirtcf01",
        resourceVersion: null,
        colorVariant: "generic02"
    };
    const resource = {
        resGender: 0,
        partType
    };
    const paperdoll = {
        modifiers: [ { paperdollResourceID: resource } ]
    };
    const part = {
        origin: {
            recordID: partSource.recordID,
            jsonPointer: "/versions/0"
        }
    };
    const owner = { groupID: "topmiddle" };
    const plan = {
        selections: [ owner ],
        parts: [ part ],
        layers: [ {
            owner,
            contributor: part,
            origin: { jsonPointer: "/modifiers/0" }
        } ]
    };
    const records = new Map([ [ `characterPartSources\0${partSource.recordID}`, partSource ] ]);
    const library = {
        schema: "carbonenginejs.characterLibrary",
        schemaVersion: 7,
        Get(documentName, recordID)
        {
            if (documentName === "characterDefinitions") return definitions.get(recordID) ?? null;
            return records.get(`${documentName}\0${recordID}`) ?? null;
        }
    };

    return { definitions, library, materialValues, paperdoll, partSource, plan };
}
