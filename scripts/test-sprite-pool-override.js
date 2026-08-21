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
console.log("dx11 sprite pool override verified");

/** The store keys overrides on the profile qualified path, so each needs its own. */
function testBothProfilesAreOverridden()
{
    for (const profile of [ "effect.gles2", "effect.dx11" ])
    {
        const key = `graphics/${profile}/managed/space/spaceobject/fx/blinkinglightspool`;
        assert.ok(source.includes(`replaces: "${key}"`), `${profile} must be overridden`);
    }

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

    assert.ok(/REMOVE THIS/.test(doc), "must say when to remove it");
    assert.ok(/AGENT-FINDINGS-dx11-sprite-sets-2026-08-22.md/.test(doc), "must point at the write up");
}
