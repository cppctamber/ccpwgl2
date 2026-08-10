import assert from "node:assert/strict";
import test from "node:test";

import { formatCommittedStage } from "../src/demo/CharacterDemoApplication.mjs";

test("committed stage distinguishes applied body-diffuse contributions from retained work", () =>
{
    assert.equal(formatCommittedStage({
        configuredPartCount: 5,
        deferredContributionCount: 15,
        composition: {
            contributionCount: 20,
            composedContributionCount: 7,
            deferredContributionCount: 13
        }
    }), "5 exact configured part(s) attached; body diffuse applied 7/20 contribution(s); 13 retained/deferred");
});

test("committed stage retains a truthful fallback without a composer", () =>
{
    assert.equal(formatCommittedStage({
        configuredPartCount: 2,
        deferredContributionCount: 4
    }), "2 exact configured part(s) attached; 4 contribution(s) retained/deferred");
});
