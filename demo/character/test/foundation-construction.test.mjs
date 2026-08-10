import assert from "node:assert/strict";
import test from "node:test";

import {
    CcpwglLegacyFoundationConstruction
} from "../src/character/CcpwglLegacyFoundationConstruction.mjs";

test("foundation construction describes the exact female policy in execution order", () =>
{
    const resolver = new CcpwglLegacyFoundationConstruction({
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
            rule: "legacy-opengl-foundation-v1"
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
            operation: "bind-animation"
        } ]
    });
    assert.deepEqual({ paperdoll, plan }, before);
});

test("foundation construction emits every male body component with contiguous indices", () =>
{
    const resolver = new CcpwglLegacyFoundationConstruction();
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

test("foundation construction rejects absent or mixed character sex", () =>
{
    const resolver = new CcpwglLegacyFoundationConstruction();

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
