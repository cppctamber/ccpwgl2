/**
 * dx11 sprite pool shader override - 2026-08-22.
 *
 * TEMPORARY. Sprite sets render nothing on effect.dx11 and correctly on
 * effect.gles2, from identical setup code, buffers, declaration and batch, so
 * the fault is inside the effect and is not yet understood. src/toDeprecate
 * exists to override shaders that are broken, and this registers the existing
 * hand written pool shader against the dx11 path too.
 *
 * See AGENT-FINDINGS-dx11-sprite-sets-2026-08-22.md.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(
    path.resolve(__dirname, "../src/toDeprecate/shaders/other/blinkinglightspool.js"), "utf8");

testBothProfilesAreOverridden();
testBodyIsSharedNotCopied();
testEffectPathIsNoLongerPinned();
testOverrideIsDocumented();
testKeyCoversEveryShaderVersion();
console.log("dx11 sprite pool override verified");

/** The store keys overrides on the profile qualified path, so each needs its own. */
function testBothProfilesAreOverridden()
{
    const gles2 = "graphics/effect.gles2/managed/space/spaceobject/fx/blinkinglightspool";
    assert.ok(source.includes(`replaces: "${gles2}"`), "gles2 must still be overridden");

    // The dx11 entry is DISABLED: the prefix makes the key unmatchable, so the
    // override never runs and dx11 takes the real translated container. Kept
    // rather than deleted so it can be switched back on by removing the prefix.
    const dx11 = "graphics/effect.dx11/managed/space/spaceobject/fx/blinkinglightspool";
    assert.ok(!source.includes(`replaces: "${dx11}"`), "the dx11 override must NOT be live");
    assert.ok(source.includes(`replaces: "_disabled_${dx11}"`), "and must be disabled by prefix, not deleted");

    // Distinct names: the store registers by name and would otherwise collide.
    assert.ok(source.includes("name: \"blinkinglightspool\""), "gles2 entry keeps its name");
    assert.ok(source.includes("name: \"blinkinglightspool_dx11\""), "dx11 entry needs its own name");
}

/** Two copies of this GLSL would drift. The dx11 entry spreads the gles2 one. */
function testBodyIsSharedNotCopied()
{
    assert.ok(source.includes("...blinkinglightspool,"),
        "the dx11 entry must share the technique body by reference");

    const bodies = source.split("inputDefinitions").length - 1;
    assert.equal(bodies, 1, `the shader body must appear once, found ${bodies}`);
}

/**
 * The earlier fix pinned the sprite EFFECT PATH to /effect.gles2/. It made
 * sprites appear but they drew THROUGH hull geometry, and it left the engine
 * loading a gles2 container while running the dx11 profile. The override
 * replaces it, so the pin must be gone.
 */
function testEffectPathIsNoLongerPinned()
{
    const sof = fs.readFileSync(path.resolve(__dirname, "../src/sof/EveSOFData.js"), "utf8");
    assert.ok(!sof.includes("PinnedProfile"), "the effect path pin must be removed");
    assert.ok(sof.includes("effectFilePath: effectPath.spriteSet"),
        "the sprite effect takes the ordinary unqualified path again");
}

/** A temporary divergence must say so, and say when it goes. */
function testOverrideIsDocumented()
{
    const at = source.indexOf("export const blinkinglightspoolDx11");
    assert.ok(at !== -1, "the dx11 override must exist");
    const doc = source.slice(Math.max(0, at - 2500), at);

    assert.ok(doc.includes("DISABLED"), "must say it is disabled");
    assert.ok(doc.includes("re-enable"), "must say how to turn it back on");
    assert.ok(doc.includes("To remove for good"), "and how to remove it for good");
    assert.ok(/AGENT-FINDINGS-dx11-sprite-sets-2026-08-22.md/.test(doc), "must point at the write up");
}

/**
 * The replaces key must carry NO extension.
 *
 * Registration stores `replaces` RAW (`overrides.set(registered.replaces, ...)`)
 * while lookup normalizes the resolved path through NormalizeShaderName, which
 * STRIPS .fx/.sm_hi/.sm_lo/.sm_depth and lowercases. So one extension-less key
 * already covers every shader version - that is how it replaces all of them -
 * and appending .fx would produce a key no lookup ever generates, silently
 * disabling the override.
 */
function testKeyCoversEveryShaderVersion()
{
    const normalize = loadNormalizer();
    const base = "res:/graphics/effect.dx11/managed/space/spaceobject/fx/blinkinglightspool";
    const marker = "replaces: \"_disabled_graphics/effect.dx11";
    const at = source.indexOf(marker);
    assert.ok(at !== -1, "the dx11 replaces key must exist");
    const key = source.slice(at + "replaces: \"_disabled_".length, source.indexOf("\"", at + marker.length));

    for (const ext of [ ".fx", ".sm_hi", ".sm_lo", ".sm_depth" ])
    {
        assert.equal(normalize(base + ext), key, ext + " must resolve to the override key");
    }

    assert.ok(!/.(fx|sm_hi|sm_lo|sm_depth)$/.test(key),
        "the key must carry no extension - lookup strips it, registration does not");
}

/** Extracts the shader store own normalizer rather than reimplementing the rule. */
function loadNormalizer()
{
    const store = fs.readFileSync(
        path.resolve(__dirname, "../src/core/store/Tw2ShaderStore.js"), "utf8");
    const at = store.indexOf("static NormalizeShaderName(name)");
    assert.ok(at !== -1, "NormalizeShaderName must exist");

    const open = store.indexOf("{", at);
    let depth = 0, end = open;
    for (let i = open; i < store.length; i++)
    {
        if (store[i] === "{") depth++;
        else if (store[i] === "}" && --depth === 0) { end = i; break; }
    }
    return new Function("name", store.slice(open + 1, end));
}
