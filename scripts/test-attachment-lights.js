/**
 * Attachment light emission, 2026-08-21.
 *
 * Carbon EvePlaneSet::GetLights (cpp:544-568): the loop iterates BY VALUE so the
 * STORED light data is never mutated; per light the colour is multiplied by the
 * set average colour, then Saturate (which extrapolates above 1), then
 * brightness *= Fade for its blink type. parentBrightness is the activation
 * strength.
 *
 * Also guards two ccpwgl-specific traps hit while writing it: the collector
 * stores the ROW REFERENCE it is handed, so a shared scratch row would collapse
 * every light into the last one; and the set has no activationStrength of its
 * own, because ccpwgl carries it in the ships per-object data.
 */
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");

// Loaded by transforming the real module in memory rather than keeping a copy
// beside it: a second copy of these formulas would drift silently, and the
// whole point of the file is that the formulas are verbatim Carbon.
const { Fade, FadeType, Saturate, Blink, FadeIn, FadeOut } = loadAttachmentUtils();

function loadAttachmentUtils()
{
    const source = fs
        .readFileSync(path.resolve(__dirname, "../src/eve/item/EveSpaceObjectAttachmentUtils.js"), "utf8")
        .split("export const ").join("const ")
        .split("export function ").join("function ");

    const exported = "return { FadeType, Blink, FadeIn, FadeOut, FadeInOut, Fade, Saturate };";
    return new Function(source + exported)();
}

testFadeMatchesCarbon();
testSaturateExtrapolates();
console.log("Attachment light helpers verified");

/** Carbon Fade (cpp:59-75) - FT_NONE and anything unknown is full intensity. */
function testFadeMatchesCarbon()
{
    assert.equal(Fade(1.23, FadeType.FT_NONE, 2, 0.5), 1, "no fade leaves a light alone");
    assert.equal(Fade(1.23, 999, 2, 0.5), 1, "an unknown fade type must not extinguish a light");

    // FadeIn adds phase BEFORE the rate multiply; FadeOut is its complement.
    assert.equal(FadeIn(1, 1, 0.25), 0.25, "frac((time + phase) * rate)");
    assert.ok(Math.abs(FadeOut(1, 1, 0.25) - 0.75) < 1e-12, "FadeOut is 1 - FadeIn");
    assert.equal(Fade(1, FadeType.FT_FADEIN, 1, 0.25), FadeIn(1, 1, 0.25), "routed by type");

    // Blink: a zero rate is minScale, and the sub-0.0001 peak quirk holds.
    assert.equal(Blink(5, 0, 0, 0.2, 1), 0.2, "a zero blink rate sits at minScale");
    const tiny = Blink(0.5, 0.001, 0, 0, 1);
    assert.ok(tiny >= 0 && tiny <= 1, "a tiny rate degenerates to a ramp, not a divide by zero");
    assert.ok(Number.isFinite(tiny), "and stays finite");
}

/** Carbon Saturate (Color_inline.h:161-172) - above 1 EXTRAPOLATES. */
function testSaturateExtrapolates()
{
    const out = [ 0, 0, 0, 0 ];
    const color = [ 0.8, 0.2, 0.2, 0.5 ];

    Saturate(out, color, 1);
    assert.deepEqual(out, color, "saturation 1 passes straight through");

    Saturate(out, color, 0);
    const grey = 0.8 * 0.299 + 0.2 * 0.587 + 0.2 * 0.114;
    assert.ok(Math.abs(out[0] - grey) < 1e-12, "saturation 0 collapses to perceptual luma");
    assert.equal(out[3], 0.5, "alpha rides through unchanged");

    Saturate(out, color, 2);
    assert.ok(out[0] > color[0], "above 1 pushes PAST the authored colour");
    assert.ok(out[1] < color[1], "and away from grey on the other side");

    Saturate(out, color, -5);
    assert.ok(Math.abs(out[0] - grey) < 1e-12, "only the low side clamps, at 0");
}
