/**
 * Sprite sets are pinned to the gles2 profile - 2026-08-22.
 *
 * TEMPORARY. Sprite sets render nothing on effect.dx11 and render correctly on
 * effect.gles2, and the cause is not yet known. See
 * AGENT-FINDINGS-dx11-sprite-sets-2026-08-22.md.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(path.resolve(__dirname, "../src/sof/EveSOFData.js"), "utf8");

testSpriteEffectIsPinned();
testPinOnlyRewritesTheProfileDirectory();
testPinIsDocumentedAndFindable();
console.log("Sprite effect profile pin verified");

/** The pin has to be at the point the shared sprite effect is built. */
function testSpriteEffectIsPinned()
{
    assert.ok(source.includes("EveSOFData.PinnedProfile(effectPath.spriteSet, \"effect.gles2\")"),
        "the sprite effect path must be pinned to effect.gles2");
    assert.ok(!/effectFilePath: effectPath.spriteSet/.test(source),
        "the unpinned path must not remain");
}

/**
 * A qualified path is legal whatever device.effectProfile says, and ToEffectPath
 * leaves it alone because its /effect/ substitution cannot match an already
 * qualified path (Tw2Device.EffectProfileFromPath). The pin must therefore
 * rewrite ONLY that directory, and must not touch a path that is already
 * qualified or one that names no profile at all.
 */
function testPinOnlyRewritesTheProfileDirectory()
{
    const pin = loadPin();

    assert.equal(pin("res:/graphics/effect/managed/space/spaceobject/fx/blinkinglightspool.fx", "effect.gles2"),
        "res:/graphics/effect.gles2/managed/space/spaceobject/fx/blinkinglightspool.fx",
        "an unqualified path takes the pinned profile directory");

    const already = "res:/graphics/effect.dx11/managed/space/spaceobject/fx/blinkinglightspool.fx";
    assert.equal(pin(already, "effect.gles2"), already,
        "an already qualified path is left alone - it has no /effect/ to replace");

    const noProfile = "res:/texture/fx/whatever.dds";
    assert.equal(pin(noProfile, "effect.gles2"), noProfile, "a non shader path is untouched");
    assert.equal(pin(noProfile, ""), noProfile, "no profile means no rewrite");
}

/** A temporary divergence from Carbon must say so where someone will find it. */
function testPinIsDocumentedAndFindable()
{
    const at = source.indexOf("static PinnedProfile(");
    assert.ok(at !== -1, "PinnedProfile must exist");
    const doc = source.slice(Math.max(0, at - 3000), at);

    assert.ok(/TEMPORARY/.test(doc), "the pin must be marked temporary");
    assert.ok(/REMOVE THIS/.test(doc), "and must say when to remove it");
    assert.ok(/AGENT-FINDINGS-dx11-sprite-sets-2026-08-22.md/.test(doc),
        "and must point at the write up");
}

/** Extracts the real function rather than reimplementing it. */
function loadPin()
{
    const at = source.indexOf("static PinnedProfile(path, profile)");
    assert.ok(at !== -1, "PinnedProfile must exist");
    const open = source.indexOf("{", at);

    let depth = 0, end = open;
    for (let i = open; i < source.length; i++)
    {
        if (source[i] === "{") depth++;
        else if (source[i] === "}" && --depth === 0) { end = i; break; }
    }

    const body = source.slice(open + 1, end);
    return new Function("path", "profile", body);
}
