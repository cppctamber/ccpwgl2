import assert from "node:assert/strict";
import test from "node:test";

import {
    TnyGlesFoundationCoveragePolicy
} from "./runtime-character-modules.mjs";

test("foundation coverage policy resolves male boot coverage from authored height metadata", () =>
{
    const policy = new TnyGlesFoundationCoveragePolicy();

    assert.deepEqual(policy.Resolve({
        sex: "male",
        groupID: "feet",
        partSourceRecordID: "male/feet/any-source",
        metadata: FootwearMetadata("utilityshapes/pantstuckmediumshape")
    }), {
        strategy: "hide-carrier",
        roles: [ "feet" ],
        evidence: {
            status: "policy",
            rule: "legacy-opengl-authored-footwear-coverage-v1",
            sex: "male",
            groupID: "feet",
            partSourceRecordID: "male/feet/any-source",
            footwearHeight: "medium",
            authoredModifierPaths: [ "utilityshapes/pantstuckmediumshape" ]
        }
    });
});

test("foundation coverage policy resolves female boot coverage from authored mask metadata", () =>
{
    const policy = new TnyGlesFoundationCoveragePolicy();

    assert.deepEqual(policy.Resolve({
        sex: "female",
        groupID: "feet",
        partSourceRecordID: "female/feet/any-source",
        metadata: FootwearMetadata("dependants/bootmasks/bootmaskshin")
    }), {
        strategy: "triangle-mask",
        roles: [ "body" ],
        triangleRule: "legacy-opengl-exact-foundation-triangle-coverage-v1",
        bonePrefixes: [ "LeftFoot", "RightFoot", "LeftToe", "RightToe" ],
        evidence: {
            status: "policy",
            rule: "legacy-opengl-authored-footwear-coverage-v1",
            sex: "female",
            groupID: "feet",
            partSourceRecordID: "female/feet/any-source",
            footwearHeight: "shin",
            authoredModifierPaths: [ "dependants/bootmasks/bootmaskshin" ]
        }
    });
});

test("foundation coverage policy targets the exact split female foot carrier", () =>
{
    const policy = new TnyGlesFoundationCoveragePolicy();
    const coverage = policy.Resolve({
        sex: "female",
        foundationLayout: "split-lod0",
        groupID: "feet",
        partSourceRecordID: "female/feet/bootscf01",
        metadata: {
            dependencies: [ {
                modifierPath: "dependants/bootmasks/bootmaskshin"
            } ]
        }
    });

    assert.deepEqual(coverage.roles, [ "feet" ]);
    assert.equal(coverage.strategy, "triangle-mask");
});

test("foundation coverage policy resolves only exact male PantsAM01 authored bottominner coverage", () =>
{
    const policy = new TnyGlesFoundationCoveragePolicy();

    assert.deepEqual(policy.Resolve({
        sex: "male",
        groupID: "bottomouter",
        partSourceRecordID: "male/bottomouter/pantsam01"
    }), {
        strategy: "hide-carrier",
        roles: [ "legs" ],
        authoredOcclusion: "bottominner",
        evidence: {
            status: "policy",
            rule: "legacy-opengl-exact-foundation-coverage-v1",
            sex: "male",
            groupID: "bottomouter",
            partSourceRecordID: "male/bottomouter/pantsam01"
        }
    });
});

test("foundation coverage policy maps an exact authored topinner relation to the male torso", () =>
{
    const policy = new TnyGlesFoundationCoveragePolicy();
    const metadata = UpperBodyMetadata();

    assert.deepEqual(policy.Resolve({
        sex: "male",
        groupID: "outer",
        partSourceRecordID: "male/outer/fixture",
        metadata
    }), {
        strategy: "hide-carrier",
        roles: [ "torso" ],
        evidence: {
            status: "policy",
            rule: "legacy-opengl-authored-modifier-coverage-v1",
            sex: "male",
            groupID: "outer",
            partSourceRecordID: "male/outer/fixture",
            authoredValue: "topinner",
            modifierLocationKey: "topinner",
            relation: "typed-modifier-location"
        }
    });

    assert.equal(policy.Resolve({
        sex: "female",
        groupID: "outer",
        partSourceRecordID: "female/outer/fixture",
        metadata
    }), null);
    assert.equal(policy.Resolve({
        sex: "male",
        groupID: "outer",
        partSourceRecordID: "male/outer/near-match",
        metadata: UpperBodyMetadata("topinnerdetail")
    }), null);

    assert.equal(policy.Resolve({
        sex: "male",
        groupID: "outer",
        partSourceRecordID: "male/outer/tattoos-only",
        metadata: UpperBodyMetadata(null)
    }), null);
});

test("foundation coverage policy does not infer coverage for unknown footwear", () =>
{
    const policy = new TnyGlesFoundationCoveragePolicy();

    assert.equal(policy.Resolve({
        sex: "male",
        groupID: "feet",
        partSourceRecordID: "male/feet/shoesam01",
        metadata: FootwearMetadata("utilityshapes/pantstuckshoesshape")
    }), null);
    assert.equal(policy.Resolve({
        sex: "male",
        groupID: "bottomouter",
        partSourceRecordID: "male/feet/bootsam01"
    }), null);
    assert.equal(policy.Resolve({
        sex: "male",
        groupID: "bottomouter",
        partSourceRecordID: "male/bottomouter/pantsother"
    }), null);
});

function FootwearMetadata(...modifierPaths)
{
    return {
        dependencies: modifierPaths.map(modifierPath => ({ modifierPath }))
    };
}

function UpperBodyMetadata(modifierKey = "topinner")
{
    return {
        occludesModifiers: [
            "tattoo/upperback",
            "tattoo/lowerback",
            "tattoo/chest",
            "tattoo/abs",
            "tattoo/leftarm",
            "tattoo/rightarm"
        ],
        occlusions: modifierKey === null ? [] : [ {
            authoredValue: modifierKey,
            modifierPath: modifierKey,
            modifierLocation: { modifierKey }
        } ]
    };
}
