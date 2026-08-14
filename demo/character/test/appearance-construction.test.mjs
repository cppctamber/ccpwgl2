import assert from "node:assert/strict";
import test from "node:test";

import {
    TnyGlesAppearanceConstruction
} from "./runtime-character-modules.mjs";

test("appearance construction inserts exact resolved parts before animation binding", () =>
{
    const foundation = {
        backend: "legacy-opengl",
        evidence: { status: "policy", rule: "legacy-opengl-foundation-v1" },
        paperdollRecordID: "3000001",
        sourceBuild: "3453885",
        sex: "female",
        lod: 0,
        operations: [
            { operation: "skeleton", resourcePath: "res:/female/skeleton.gr2" },
            { operation: "geometry", role: "body", index: 0, resourcePath: "res:/female/body.gr2" },
            { operation: "rebuild-areas", shaderPath: "res:/proof/avatar.sm_hi" },
            { operation: "proof-textures", profile: "neutral" },
            { operation: "bind-animation" }
        ]
    };
    const foundationResolver = {
        Resolve()
        {
            return foundation;
        }
    };
    const boots = CreatePart("boots", "female/feet/bootscf01");
    const trousers = CreatePart("trousers", "female/bottomouter/pantscf01");
    const plan = {
        parts: [ boots, trousers ],
        layers: [
            { owner: { groupID: "feet" }, contributor: boots },
            { owner: { groupID: "bottomouter" }, contributor: trousers }
        ],
        morphTargets: [ {
            modifierPath: "utilityshapes/pushhemmidshape",
            targetName: "PushHemMidShape",
            weight: 0.35,
            owner: { groupID: "bottomouter" },
            origin: {
                kind: "decoded",
                document: "characterPartMetadata",
                recordID: "male/bottomouter/pantsam01/metadata.yaml",
                jsonPointer: "/dependencies/6",
                rule: "utility-shape-triple-suffix-weight"
            }
        } ]
    };
    const before = JSON.parse(JSON.stringify(plan));
    const resolver = CreateResolver(foundationResolver);
    assert.throws(
        () => resolver.Resolve({ recordID: "3000001" }, plan),
        /installed character library/u
    );
    const construction = resolver.Resolve({ recordID: "3000001" }, plan, {});
    const configured = construction.operations.filter(value =>
        value.operation === "configured-part");

    assert.equal(construction.evidence.rule, "legacy-opengl-appearance-v1");
    assert.equal(construction.resolvedPartCount, 2);
    assert.equal(construction.configuredPartCount, 2);
    assert.equal(construction.deferredContributionCount, 0);
    assert.deepEqual(construction.morphTargets, [ {
        modifierPath: "utilityshapes/pushhemmidshape",
        targetName: "PushHemMidShape",
        weight: 0.35,
        ownerGroupID: "bottomouter",
        evidence: {
            status: "policy",
            rule: "legacy-gles-unique-normalized-morph-target-match-v1",
            sourceStatus: "decoded",
            document: "characterPartMetadata",
            recordID: "male/bottomouter/pantsam01/metadata.yaml",
            jsonPointer: "/dependencies/6",
            sourceRule: "utility-shape-triple-suffix-weight"
        }
    } ]);
    assert.deepEqual(configured.map(value => ({
        layerIndex: value.layerIndex,
        partIndex: value.partIndex,
        groupID: value.groupID,
        partSourceRecordID: value.partSourceRecordID,
        configurationPath: value.configurationPath,
        geometryPath: value.geometryPath,
        evidence: value.evidence
    })), [ {
        layerIndex: 0,
        partIndex: 0,
        groupID: "feet",
        partSourceRecordID: "female/feet/bootscf01",
        configurationPath: "res:/boots.black",
        geometryPath: "res:/boots.gr2",
        evidence: {
            status: "derived",
            document: "characterPartSources",
            recordID: "female/feet/bootscf01",
            rule: "unique-version-candidates"
        }
    }, {
        layerIndex: 1,
        partIndex: 1,
        groupID: "bottomouter",
        partSourceRecordID: "female/bottomouter/pantscf01",
        configurationPath: "res:/trousers.black",
        geometryPath: "res:/trousers.gr2",
        evidence: {
            status: "derived",
            document: "characterPartSources",
            recordID: "female/bottomouter/pantscf01",
            rule: "unique-version-candidates"
        }
    } ]);
    assert.deepEqual(construction.operations.slice(-3).map(value => value.operation), [
        "configured-part",
        "configured-part",
        "bind-animation"
    ]);
    assert.deepEqual(plan, before);
    assert.deepEqual(foundation.operations.map(value => value.operation), [
        "skeleton",
        "geometry",
        "rebuild-areas",
        "proof-textures",
        "bind-animation"
    ]);
});

test("appearance construction rejects texture-policy omission", () =>
{
    const part = CreatePart("boots", "female/feet/bootscf01");
    const resolver = new TnyGlesAppearanceConstruction({
        foundationResolver: {
            Resolve: () => ({
                evidence: { rule: "legacy-opengl-foundation-v1" },
                operations: [ { operation: "bind-animation" } ]
            })
        },
        texturePolicy: { Resolve: () => [] }
    });

    assert.throws(() => resolver.Resolve({}, {
        parts: [ part ],
        layers: [ { owner: { groupID: "feet" }, contributor: part } ]
    }, {}), /one texture contribution per expected layer/u);
});

test("appearance construction rejects duplicate or mismatched texture identities", () =>
{
    const boots = CreatePart("boots", "female/feet/bootscf01");
    const trousers = CreatePart("trousers", "female/bottomouter/pantscf01");
    const plan = {
        parts: [ boots, trousers ],
        layers: [
            { owner: { groupID: "feet" }, contributor: boots },
            { owner: { groupID: "bottomouter" }, contributor: trousers }
        ]
    };
    const foundationResolver = {
        Resolve: () => ({
            evidence: { rule: "legacy-opengl-foundation-v1" },
            operations: [ { operation: "bind-animation" } ]
        })
    };
    const duplicate = new TnyGlesAppearanceConstruction({
        foundationResolver,
        texturePolicy: {
            Resolve: () => [
                { layerIndex: 0, partIndex: 0, groupID: "feet" },
                { layerIndex: 0, partIndex: 0, groupID: "feet" }
            ]
        }
    });
    const mismatched = new TnyGlesAppearanceConstruction({
        foundationResolver,
        texturePolicy: {
            Resolve: () => [
                { layerIndex: 0, partIndex: 0, groupID: "feet" },
                { layerIndex: 1, partIndex: 1, groupID: "feet" }
            ]
        }
    });

    assert.throws(() => duplicate.Resolve({}, plan, {}), /unique contiguous texture layer indices/u);
    assert.throws(() => mismatched.Resolve({}, plan, {}), /identity does not match its layer/u);
});

test("appearance construction rejects unowned parts and retains incomplete contributions", () =>
{
    const resolver = CreateResolver({
        Resolve: () => ({
            evidence: { rule: "legacy-opengl-foundation-v1" },
            operations: [ { operation: "bind-animation" } ]
        })
    });
    const part = CreatePart("broken", "broken");

    assert.throws(() => resolver.Resolve({}, {
        parts: [],
        layers: [ { owner: { groupID: "feet" }, contributor: part } ]
    }, {}), /does not reference a plan-owned part/u);

    part.geometryPath = null;
    const retained = resolver.Resolve({}, {
        parts: [ part ],
        layers: [ { owner: { groupID: "feet" }, contributor: part } ]
    }, {});

    assert.equal(retained.configuredPartCount, 0);
    assert.equal(retained.deferredContributionCount, 1);
    assert.deepEqual(retained.operations.at(-2), {
        operation: "deferred-contribution",
        layerIndex: 0,
        partIndex: 0,
        groupID: "feet",
        partSourceRecordID: "broken",
        configurationPath: "res:/broken.black",
        geometryPath: null,
        evidence: {
            status: "derived",
            document: "characterPartSources",
            recordID: "broken",
            rule: "unique-version-candidates"
        }
    });

    part.geometryPath = "invalid";
    assert.throws(() => resolver.Resolve({}, {
        parts: [ part ],
        layers: [ { owner: { groupID: "feet" }, contributor: part } ]
    }, {}), /optional contribution path must be a res:\/ path/u);
});

test("appearance construction labels authored sex-specific boot coverage strategies", () =>
{
    const maleFoundation = {
        backend: "legacy-opengl",
        evidence: { status: "policy", rule: "legacy-opengl-foundation-v1" },
        sex: "male",
        operations: [
            { operation: "skeleton", resourcePath: "res:/male/skeleton.gr2" },
            { operation: "geometry", role: "feet", index: 0, resourcePath: "res:/male/feet.gr2" },
            { operation: "rebuild-areas", shaderPath: "res:/proof/avatar.sm_hi" },
            { operation: "proof-textures", profile: "neutral" },
            { operation: "bind-animation" }
        ]
    };
    const maleResolver = CreateResolver({ Resolve: () => maleFoundation });
    const maleBoots = CreatePart("boots", "male/feet/bootsam01");
    const maleOperation = maleResolver.Resolve({}, {
        parts: [ maleBoots ],
        layers: [ { owner: { groupID: "feet" }, contributor: maleBoots } ]
    }, CoverageLibrary({
        "male/feet/bootsam01": "utilityshapes/pantstuckmediumshape"
    })).operations.at(-2);

    assert.deepEqual(maleOperation.foundationCoverage, {
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
    });

    const femaleBoots = CreatePart("boots", "female/feet/bootscf01");
    const femaleOperation = CreateResolver({
        Resolve: () => ({ ...maleFoundation, sex: "female" })
    }).Resolve({}, {
        parts: [ femaleBoots ],
        layers: [ { owner: { groupID: "feet" }, contributor: femaleBoots } ]
    }, CoverageLibrary({
        "female/feet/bootscf01": "dependants/bootmasks/bootmaskshin"
    })).operations.at(-2);

    assert.deepEqual(femaleOperation.foundationCoverage, {
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
    });

    const wrongDocument = CreatePart("boots", "male/feet/bootsam01");
    wrongDocument.origin.document = "unrelatedDocument";
    const wrongDocumentOperation = maleResolver.Resolve({}, {
        parts: [ wrongDocument ],
        layers: [ { owner: { groupID: "feet" }, contributor: wrongDocument } ]
    }, {}).operations.at(-2);

    assert.equal(wrongDocumentOperation.partSourceRecordID, null);
    assert.equal(wrongDocumentOperation.foundationCoverage, undefined);
});

test("appearance construction carries exact typed topinner coverage to the male torso", () =>
{
    const foundation = {
        backend: "legacy-opengl",
        evidence: { status: "policy", rule: "legacy-opengl-foundation-v1" },
        sex: "male",
        operations: [
            { operation: "geometry", role: "torso", index: 0, resourcePath: "res:/male/torso.gr2" },
            { operation: "bind-animation" }
        ]
    };
    const robe = CreatePart("robe", "male/outer/robe-fixture");
    const operation = CreateResolver({ Resolve: () => foundation }).Resolve({}, {
        parts: [ robe ],
        layers: [ { owner: { groupID: "outer" }, contributor: robe } ]
    }, CoverageLibrary({
        "male/outer/robe-fixture": {
            occludesModifiers: [ "topinner" ],
            occlusions: [ {
                authoredValue: "topinner",
                modifierPath: "topinner",
                modifierLocation: { modifierKey: "topinner" }
            } ]
        }
    })).operations.at(-2);

    assert.deepEqual(operation.foundationCoverage, {
        strategy: "hide-carrier",
        roles: [ "torso" ],
        evidence: {
            status: "policy",
            rule: "legacy-opengl-authored-modifier-coverage-v1",
            sex: "male",
            groupID: "outer",
            partSourceRecordID: "male/outer/robe-fixture",
            authoredValue: "topinner",
            modifierLocationKey: "topinner",
            relation: "typed-modifier-location"
        }
    });
});

function CreatePart(name, recordID)
{
    return {
        configurationPath: `res:/${name}.black`,
        geometryPath: `res:/${name}.gr2`,
        origin: {
            kind: "derived",
            document: "characterPartSources",
            recordID,
            jsonPointer: "/versions/0",
            rule: "unique-version-candidates"
        }
    };
}

function CoverageLibrary(paths)
{
    return {
        Get(documentName, recordID)
        {
            if (documentName !== "characterPartSources" || !paths[recordID]) return null;
            const source = paths[recordID];
            const metadata = typeof source === "string"
                ? { dependencies: [ { modifierPath: source } ] }
                : source;
            return { metadata, versions: [ { metadata } ] };
        }
    };
}

function CreateResolver(foundationResolver)
{
    return new TnyGlesAppearanceConstruction({
        foundationResolver,
        texturePolicy: {
            Resolve(_library, _paperdoll, plan)
            {
                return plan.layers.map((layer, layerIndex) => ({
                    layerIndex,
                    partIndex: plan.parts.indexOf(layer.contributor),
                    groupID: layer.owner.groupID
                }));
            }
        }
    });
}
