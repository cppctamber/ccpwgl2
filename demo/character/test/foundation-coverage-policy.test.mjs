import assert from "node:assert/strict";
import test from "node:test";

import {
    CcpwglLegacyFoundationCoveragePolicy
} from "../src/character/CcpwglLegacyFoundationCoveragePolicy.mjs";

test("foundation coverage policy resolves only the reviewed male boot source", () =>
{
    const policy = new CcpwglLegacyFoundationCoveragePolicy();

    assert.deepEqual(policy.Resolve({
        sex: "male",
        groupID: "feet",
        partSourceRecordID: "male/feet/bootsam01"
    }), {
        strategy: "hide-carrier",
        roles: [ "feet" ],
        evidence: {
            status: "policy",
            rule: "legacy-opengl-exact-foundation-coverage-v1",
            sex: "male",
            groupID: "feet",
            partSourceRecordID: "male/feet/bootsam01"
        }
    });
});

test("foundation coverage policy resolves exact female boots to semantic body coverage", () =>
{
    const policy = new CcpwglLegacyFoundationCoveragePolicy();

    assert.deepEqual(policy.Resolve({
        sex: "female",
        groupID: "feet",
        partSourceRecordID: "female/feet/bootscf01"
    }), {
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
    });
});

test("foundation coverage policy does not infer coverage for unknown footwear", () =>
{
    const policy = new CcpwglLegacyFoundationCoveragePolicy();

    assert.equal(policy.Resolve({
        sex: "male",
        groupID: "feet",
        partSourceRecordID: "male/feet/shoesam01"
    }), null);
    assert.equal(policy.Resolve({
        sex: "male",
        groupID: "bottomouter",
        partSourceRecordID: "male/feet/bootsam01"
    }), null);
});
