/**
 * Regression test: CewgCarbonData — GLES-v8 -> Carbon DX11 constant
 * repacking (register maps from docs/carbon-constant-layouts.md in
 * hlslreader). Each GLES register is stamped with a recognizable value
 * (reg index in .x) so every Carbon destination can be asserted by
 * source register.
 */
const assert = require("assert");
const {
    PER_FRAME_VS_REGS, PER_FRAME_PS_REGS, PER_OBJECT_REGS,
    PackPerFrameVS, PackPerFramePS, PackPerObjectVS, PackPerObjectPS
} = require("../src/core/cewg/CewgCarbonData");

/** Builds a GLES array of `regs` registers, reg r = [r, r+0.25, r+0.5, r+0.75] */
function stamp(regs)
{
    const out = new Float32Array(regs * 4);
    for (let r = 0; r < regs; r++)
    {
        out[r * 4] = r; out[r * 4 + 1] = r + 0.25; out[r * 4 + 2] = r + 0.5; out[r * 4 + 3] = r + 0.75;
    }
    return out;
}

/** Asserts Carbon reg `outReg` came from GLES reg `srcReg` */
function expectReg(out, outReg, srcReg, label)
{
    for (let c = 0; c < 4; c++)
    {
        assert.strictEqual(out[outReg * 4 + c], srcReg + c * 0.25, `${label}: carbon reg ${outReg}[${c}] should come from gles reg ${srcReg}`);
    }
}

function expectZeroReg(out, outReg, label)
{
    for (let c = 0; c < 4; c++)
    {
        assert.strictEqual(out[outReg * 4 + c], 0, `${label}: carbon reg ${outReg}[${c}] should be zero`);
    }
}

// --- per-frame VS (b1): 34 GLES regs -> 46 Carbon regs ------------------------
{
    const out = PackPerFrameVS(new Float32Array(PER_FRAME_VS_REGS * 4), stamp(34));
    for (let r = 0; r < 28; r++) expectReg(out, r, r, "pfVS aligned block");
    for (let r = 0; r < 4; r++)
    {
        expectReg(out, 28 + r, 4 + r, "pfVS ViewProjectionLast<-ViewProjection");
        expectReg(out, 32 + r, 8 + r, "pfVS ViewLast<-View");
        expectReg(out, 36 + r, 12 + r, "pfVS ProjLast<-Projection");
    }
    for (let r = 0; r < 6; r++)
    {
        if (r === 5) continue; // reg 45 gets .y patched
        expectReg(out, 40 + r, 28 + r, "pfVS sun/fog block +12");
    }
    assert.strictEqual(out[45 * 4], 33, "pfVS reg45.x = time from gles reg 33");
    assert.strictEqual(out[45 * 4 + 1], 1, "pfVS reg45.y = upscaling forced to 1");
}

// --- per-frame PS (b2): 23 GLES regs -> 118 Carbon regs -----------------------
{
    const out = PackPerFramePS(new Float32Array(PER_FRAME_PS_REGS * 4), stamp(23));
    for (let r = 0; r < 21; r++) expectReg(out, r, r, "pfPS aligned block");
    assert.strictEqual(out[21 * 4], 21, "pfPS reg21.x = time");
    assert.strictEqual(out[21 * 4 + 1], 0, "pfPS reg21.y = mip bias 0");
    assert.strictEqual(out[21 * 4 + 2], 1, "pfPS reg21.z = upscaling 1");
    assert.strictEqual(out[21 * 4 + 3], 1, "pfPS reg21.w = gamma 1");
    expectZeroReg(out, 22, "pfPS frame/jitter/atlas reg");
    expectReg(out, 23, 22, "pfPS VolumetricSlices shifted +1");
    for (let r = 24; r < PER_FRAME_PS_REGS; r++) expectZeroReg(out, r, "pfPS shadow/froxel tail");
}

// --- per-object VS (b3): masks aligned, bones zeroed --------------------------
{
    const out = PackPerObjectVS(new Float32Array(PER_OBJECT_REGS * 4), stamp(200));
    for (let r = 0; r < 26; r++) expectReg(out, r, r, "poVS aligned block");
    expectZeroReg(out, 26, "poVS boneOffsets (base-0 UBO)");
    expectZeroReg(out, 27, "poVS morph offsets");
    expectZeroReg(out, 28, "poVS customData");
    // Re-pack over a dirty buffer must not leak the inline JointMat.
    const dirty = new Float32Array(PER_OBJECT_REGS * 4).fill(123);
    PackPerObjectVS(dirty, stamp(200));
    expectZeroReg(dirty, 26, "poVS bones stay zero on reused scratch");
}

// --- per-object PS (b4): VS matrices prepended, PS shifted +12 -----------------
{
    const glesVs = stamp(200);
    const glesPs = new Float32Array(16 * 4);
    for (let r = 0; r < 16; r++)
    {
        glesPs[r * 4] = 100 + r; glesPs[r * 4 + 1] = 100 + r + 0.25;
        glesPs[r * 4 + 2] = 100 + r + 0.5; glesPs[r * 4 + 3] = 100 + r + 0.75;
    }
    const out = PackPerObjectPS(new Float32Array(PER_OBJECT_REGS * 4), glesVs, glesPs);
    for (let r = 0; r < 12; r++) expectReg(out, r, r, "poPS world matrices from VS");
    for (let r = 0; r < 16; r++)
    {
        assert.strictEqual(out[(12 + r) * 4], 100 + r, `poPS carbon reg ${12 + r} from gles ps reg ${r}`);
    }
    expectZeroReg(out, 28, "poPS customData");
}

console.log("PASS: CewgCarbonData — GLES->Carbon repack maps verified for b1(46), b2(118), b3(29), b4(29)");
