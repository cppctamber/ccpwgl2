import assert from "node:assert/strict";
import test from "node:test";

import {
    TnyGlesFoundationConstruction
} from "./runtime-character-modules.mjs";

test("foundation construction describes the exact female policy in execution order", () =>
{
    const resolver = new TnyGlesFoundationConstruction({
        shaderPath: "res:/proof/avatar.sm_hi"
    });
    const paperdoll = CreatePaperdoll(0);
    const plan = { sourceBuild: "3453885" };
    const before = JSON.parse(JSON.stringify({ paperdoll, plan }));
    const construction = resolver.Resolve(paperdoll, plan);

    assert.deepEqual(construction, {
        backend: "legacy-opengl",
        evidence: {
            status: "policy",
            rule: "legacy-opengl-foundation-v1",
            layout: "combined"
        },
        paperdollRecordID: "3000001",
        sourceBuild: "3453885",
        sex: "female",
        lod: 0,
        operations: [ {
            operation: "skeleton",
            resourcePath: "res:/graphics/character/female/skeleton/masterskeletonfemale.gr2"
        }, {
            operation: "geometry",
            role: "head",
            index: 0,
            resourcePath: "res:/graphics/character/female/paperdoll/head/head_generic/head_generic.gr2"
        }, {
            operation: "geometry",
            role: "body",
            index: 1,
            resourcePath: "res:/graphics/character/female/paperdoll/basenude/basenude.gr2",
            compatibility: {
                status: "policy",
                rule: "legacy-opengl-bone-capacity-mask-v1",
                shaderCapacity: 58,
                requiredBoneCount: 69,
                bonePrefixes: [ "RightHand" ]
            }
        }, {
            operation: "rebuild-areas",
            shaderPath: "res:/proof/avatar.sm_hi"
        }, {
            operation: "proof-textures",
            profile: "neutral"
        }, {
            operation: "configured-foundation",
            role: "head",
            index: 0,
            configurationPath: "res:/graphics/character/female/paperdoll/head/head_generic/head_generic.black",
            geometryPath: "res:/graphics/character/female/paperdoll/head/head_generic/head_generic.gr2",
            skinTextures: {
                DiffuseMap: "res:/graphics/character/female/paperdoll/head/head_generic/genericfemhead_d_4k.png",
                NormalMap: "res:/graphics/character/female/paperdoll/head/head_generic/genericfemhead_n_4k.png",
                SpecularMap: "res:/graphics/character/female/paperdoll/head/head_generic/genericfemhead_s_4k.png"
            },
            skinEvidence: {
                status: "retained",
                rule: "exact-head-generic-texture-inventory-v1",
                correctness: "exact-folder-inventory"
            }
        }, {
            operation: "bind-animation"
        } ]
    });
    assert.deepEqual({ paperdoll, plan }, before);
});

test("foundation construction exposes the exact split female LOD0 comparison", () =>
{
    const resolver = new TnyGlesFoundationConstruction({
        femaleFoundationLayout: "split-lod0"
    });
    const construction = resolver.Resolve(CreatePaperdoll(0), {
        sourceBuild: "3453885"
    });
    const geometry = construction.operations.filter(value => value.operation === "geometry");

    assert.equal(construction.evidence.layout, "split-lod0");
    assert.deepEqual(geometry.map(value => value.role), [
        "head",
        "torso",
        "sleevesUpper",
        "sleevesLower",
        "legs",
        "hands",
        "feet"
    ]);
    assert.deepEqual(geometry.map(value => value.index), [ 0, 1, 2, 3, 4, 5, 6 ]);
    assert.match(geometry[1].resourcePath, /\/paperdoll\/topinner\/torso_nude\/torso_nude\.gr2$/u);
    assert.match(geometry[2].resourcePath, /\/paperdoll\/dependants\/sleevesupper\/standard\/standard\.gr2$/u);
    assert.match(geometry[3].resourcePath, /\/paperdoll\/dependants\/sleeveslower\/standard\/standard\.gr2$/u);
    assert.match(geometry[4].resourcePath, /\/paperdoll\/bottominner\/legs_nude\/legs_nude\.gr2$/u);
    assert.match(geometry[5].resourcePath, /\/paperdoll\/hands\/hands_nude\/hands_nude\.gr2$/u);
    assert.match(geometry[6].resourcePath, /\/paperdoll\/feet\/feet_nude\/feet_nude\.gr2$/u);
});

test("foundation construction emits every male body component with contiguous indices", () =>
{
    const resolver = new TnyGlesFoundationConstruction();
    const construction = resolver.Resolve(CreatePaperdoll(1), {
        sourceBuild: "3453885"
    });
    const geometry = construction.operations.filter(value => value.operation === "geometry");

    assert.equal(construction.sex, "male");
    assert.deepEqual(geometry.map(value => value.role), [
        "head",
        "torso",
        "legs",
        "hands",
        "feet"
    ]);
    assert.deepEqual(geometry.map(value => value.index), [ 0, 1, 2, 3, 4 ]);
});

test("foundation construction resolves the selected skintone through retained source records", () =>
{
    const resolver = new TnyGlesFoundationConstruction();
    const paperdoll = CreatePaperdoll(0);
    paperdoll.colorSelections = [ {
        colorID: { colorKey: "skintone" },
        colorNameA: { colorName: "deteis_dark" }
    } ];
    const definitions = [ {
        recordID: "res:/graphics/character/female/paperdoll/skintone/basic/deteis.base",
        values: [ 0.7, 0.6, 0.5, 1 ]
    }, {
        recordID: "res:/graphics/character/female/paperdoll/skintone/basic/deteis_dark.color",
        values: {
            colors: [
                [ 0.3, 0.12, 0.01, 1 ],
                [ 0.1, 0.15, 0.14, 1 ],
                [ 0.21, 0.21, 0.21, 1 ]
            ]
        }
    }, {
        recordID: "res:/graphics/character/dnafiles/characterselect/deteisfemaleclothing.prs",
        values: [
            "female",
            { category: "bodyshapes", path: "bodyshapes/cdshape", weight: 1 },
            { category: "bodyshapes", path: "bodyshapes/thinshape", weight: 0.2 }
        ]
    } ];
    const source = {
        recordID: "female/archetypes/cdshape",
        versions: [ {
            textureCandidates: [
                "res:/graphics/character/female/paperdoll/archetypes/cdshape/cd_female_head_d_4k.png",
                "res:/graphics/character/female/paperdoll/archetypes/cdshape/cd_female_head_n_4k.png",
                "res:/graphics/character/female/paperdoll/archetypes/cdshape/cd_female_head_s_4k.png",
                "res:/graphics/character/female/paperdoll/archetypes/cdshape/cd_female_body_d_4k.png",
                "res:/graphics/character/female/paperdoll/archetypes/cdshape/cd_female_body_s_4k.png"
            ]
        } ]
    };
    const browSource = {
        recordID: "female/accessories/browbase/cd",
        versions: [ {
            configurationCandidates: [
                "res:/graphics/character/female/paperdoll/accessories/browbase/cd/cd.black"
            ],
            geometryCandidates: [
                "res:/graphics/character/female/paperdoll/accessories/browbase/cd/cd.gr2"
            ]
        } ]
    };
    const headSource = {
        recordID: "female/head/caldari_deteis",
        metadata: {
            recordID: "res:/graphics/character/female/paperdoll/head/caldari_deteis/metadata.yaml",
            dependentModifiers: [
                "archetypes/cdshape###1.2",
                "accessories/browbase/cd",
                "head/head_generic"
            ],
            dependencies: [ {
                authoredValue: "archetypes/cdshape###1.2"
            }, {
                authoredValue: "accessories/browbase/cd",
                partSource: browSource
            }, {
                authoredValue: "head/head_generic"
            } ]
        },
        versions: [ {} ]
    };
    const library = {
        GetDocument(name)
        {
            if (name === "characterDefinitions") return definitions;
            if (name === "characterPartSources")
            {
                return [ source, headSource, browSource ];
            }
            return null;
        },
        Get(name, recordID)
        {
            if (name === "characterDefinitions")
            {
                return definitions.find(value => value.recordID === recordID) ?? null;
            }
            return name === "characterPartSources"
                && recordID === source.recordID ? source : null;
        }
    };

    const construction = resolver.Resolve(paperdoll, { sourceBuild: "3453885" }, library);
    const head = construction.operations.find(value =>
        value.operation === "configured-foundation" && value.role === "head");
    const body = construction.operations.find(value =>
        value.operation === "configured-foundation" && value.role === "body");
    const brow = construction.operations.find(value =>
        value.operation === "configured-foundation-support"
        && value.role === "eyebrowbase");

    assert.deepEqual(head.skinTextures, {
        DiffuseMap: "res:/graphics/character/female/paperdoll/archetypes/cdshape/cd_female_head_d_4k.png",
        NormalMap: "res:/graphics/character/female/paperdoll/archetypes/cdshape/cd_female_head_n_4k.png",
        SpecularMap: "res:/graphics/character/female/paperdoll/archetypes/cdshape/cd_female_head_s_4k.png"
    });
    assert.deepEqual(head.skinEvidence, {
        status: "derived",
        rule: "exact-skintone-prs-archetype-foundation-v1",
        correctness: "retained-source-join",
        colorName: "deteis_dark",
        basePath: "res:/graphics/character/female/paperdoll/skintone/basic/deteis.base",
        baseColor: [ 0.7, 0.6, 0.5, 1 ],
        materialDefinitionPath: "res:/graphics/character/female/paperdoll/skintone/basic/deteis_dark.color",
        definitionPath: "res:/graphics/character/dnafiles/characterselect/deteisfemaleclothing.prs",
        archetypeSourceRecordID: "female/archetypes/cdshape",
        bodyDiffusePath: "res:/graphics/character/female/paperdoll/archetypes/cdshape/cd_female_body_d_4k.png",
        bodySpecularPath: "res:/graphics/character/female/paperdoll/archetypes/cdshape/cd_female_body_s_4k.png"
    });
    assert.deepEqual(head.skinColorization, {
        materialDefinitionPath: "res:/graphics/character/female/paperdoll/skintone/basic/deteis_dark.color",
        colors: [
            [ 0.3, 0.12, 0.01, 1 ],
            [ 0.1, 0.15, 0.14, 1 ],
            [ 0.21, 0.21, 0.21, 1 ]
        ],
        headDetailPath: "res:/graphics/character/female/paperdoll/skintone/basic/colorize_head_l.png",
        headZonePath: "res:/graphics/character/female/paperdoll/skintone/basic/colorize_head_z.png",
        bodyDetailPath: "res:/graphics/character/female/paperdoll/skintone/basic/colorize_body_l.png",
        bodyZonePath: "res:/graphics/character/female/paperdoll/skintone/basic/colorize_body_z.png"
    });
    assert.deepEqual(body.skinColorization, head.skinColorization);
    assert.deepEqual(body.skinTextures, {
        DiffuseMap: "res:/graphics/character/female/paperdoll/archetypes/cdshape/cd_female_body_d_4k.png",
        NormalMap: "res:/graphics/shared_texture/global/normal_flat.dds",
        SpecularMap: "res:/graphics/character/female/paperdoll/archetypes/cdshape/cd_female_body_s_4k.png"
    });
    assert.equal(body.renderConfiguredCarrier, false);
    assert.deepEqual(body.renderEvidence, {
        status: "observed",
        rule: "legacy-opengl-authored-body-carrier-unqualified-v1"
    });
    assert.equal(body.skinEvidence.normalStatus, "unresolved-neutral");
    assert.equal(body.skinEvidence.normalRule, "legacy-opengl-neutral-body-normal-v1");
    assert.deepEqual(brow, {
        operation: "configured-foundation-support",
        role: "eyebrowbase",
        partSourceRecordID: "female/accessories/browbase/cd",
        configurationPath:
            "res:/graphics/character/female/paperdoll/accessories/browbase/cd/cd.black",
        geometryPath:
            "res:/graphics/character/female/paperdoll/accessories/browbase/cd/cd.gr2",
        evidence: {
            status: "derived",
            rule: "exact-head-archetype-brow-support-dependency-v1",
            headPartSourceRecordID: "female/head/caldari_deteis",
            metadataRecordID:
                "res:/graphics/character/female/paperdoll/head/caldari_deteis/metadata.yaml",
            authoredDependency: "accessories/browbase/cd",
            archetypeSourceRecordID: "female/archetypes/cdshape"
        }
    });
});

test("foundation construction rejects absent or mixed character sex", () =>
{
    const resolver = new TnyGlesFoundationConstruction();

    assert.throws(
        () => resolver.Resolve(CreatePaperdoll(null), {}),
        /does not resolve to one character sex/u
    );
    assert.throws(
        () => resolver.Resolve({
            recordID: "mixed",
            modifiers: [
                { paperdollResourceID: { resGender: 0 } },
                { paperdollResourceID: { resGender: 1 } }
            ]
        }, {}),
        /does not resolve to one character sex/u
    );
});

function CreatePaperdoll(resGender)
{
    return {
        recordID: "3000001",
        modifiers: resGender === null
            ? []
            : [ { paperdollResourceID: { resGender } } ]
    };
}
