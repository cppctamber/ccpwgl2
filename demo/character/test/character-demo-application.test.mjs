import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { formatCommittedStage } from "../src/demo/CharacterDemoFormatting.mjs";

const mainSource = readFileSync(new URL("../src/main.mjs", import.meta.url), "utf8");
const applicationSource = readFileSync(
    new URL("../src/demo/CharacterDemoApplication.mjs", import.meta.url),
    "utf8"
);

test("committed stage distinguishes applied body-diffuse contributions from retained work", () =>
{
    assert.equal(formatCommittedStage({
        configuredPartCount: 5,
        deferredContributionCount: 15,
        composition: {
            contributionCount: 20,
            applicableContributionCount: 14,
            notApplicableContributionCount: 6,
            composedContributionCount: 7,
            deferredContributionCount: 13
        }
    }), "5 exact configured part(s) attached; body diffuse applied 7/14 applicable contribution(s); 13 retained/deferred; 6 retained for other channels");
});

test("committed stage retains a truthful fallback without a composer", () =>
{
    assert.equal(formatCommittedStage({
        configuredPartCount: 2,
        deferredContributionCount: 4
    }), "2 exact configured part(s) attached; 4 contribution(s) retained/deferred");
});

test("character demo keeps selected-top tuck RGB as the default", () =>
{
    assert.match(
        mainSource,
        /tuckSharedBodyRgbEnabled:\s*parameters\.get\("tuckRgb"\)\s*===\s*"body"/u
    );
});

test("character demo replaces parts in place without page navigation", () =>
{
    assert.doesNotMatch(applicationSource, /reason:\s*"interactive-part-replace"/u);
    assert.doesNotMatch(applicationSource, /reason:\s*"interactive-part-reset"/u);
    assert.match(applicationSource, /const previousParts = captureCharacterPaperdollParts/u);
    assert.match(applicationSource, /restoreCharacterPaperdollParts\(paperdoll, previousParts\)/u);
    assert.match(mainSource, /globalThis\.history\.replaceState\(null,\s*"",\s*url\)/u);
    assert.match(mainSource, /url\.searchParams\.set\(name,\s*choiceID\)/u);
    assert.doesNotMatch(
        mainSource,
        /routePartSelection:[\s\S]*?globalThis\.location\.assign\(url\)/u
    );
});
