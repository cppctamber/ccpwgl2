/**
 * Regression test: Tw2CarbonData — GLES-v8 -> Carbon DX11 constant
 * repacking (register maps from docs/carbon-constant-layouts.md in
 * hlslreader). Each GLES register is stamped with a recognizable value
 * (reg index in .x) so every Carbon destination can be asserted by
 * source register.
 */
const assert = require("assert");
const {
    PER_FRAME_VS_REGS, PER_FRAME_PS_REGS, PER_OBJECT_REGS,
    PackPerFrameVS, PackPerFramePS, PackPerObjectVS, PackPerObjectPS
} = require("../src/core/carbon/Tw2CarbonData");

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
    // ViewProjectionMat (4) and ProjectionMat (12) have their z row rewritten
    // to the D3D convention, so only their z register moves; everything else in
    // the aligned block is still a verbatim copy.
    const CONVERTED_Z = [ 6, 14 ];
    for (let r = 0; r < 28; r++)
    {
        if (CONVERTED_Z.includes(r)) continue;
        expectReg(out, r, r, "pfVS aligned block");
    }
    for (const z of CONVERTED_Z)
    {
        for (let c = 0; c < 4; c++)
        {
            // z' = (w - z) / 2 over the transposed rows, i.e. gles reg z and z + 1.
            assert.strictEqual(
                out[z * 4 + c],
                ((z + 1 + c * 0.25) - (z + c * 0.25)) / 2,
                `pfVS reg ${z} z row converted to Carbon reversed clip`
            );
        }
        expectReg(out, z + 1, z + 1, "pfVS w row untouched by the clip conversion");
    }
    // ShadowViewProjectionMat is already D3D-form and must survive unconverted.
    for (let r = 20; r < 24; r++) expectReg(out, r, r, "pfVS ShadowViewProjection not converted");
    for (let r = 0; r < 4; r++)
    {
        expectReg(out, 32 + r, 8 + r, "pfVS ViewLast<-View");
    }
    for (let r = 0; r < 4; r++)
    {
        for (let c = 0; c < 4; c++)
        {
            assert.strictEqual(out[(28 + r) * 4 + c], out[(4 + r) * 4 + c], "pfVS ViewProjectionLast<-converted ViewProjection");
            assert.strictEqual(out[(36 + r) * 4 + c], out[(12 + r) * 4 + c], "pfVS ProjLast<-converted Projection");
        }
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

console.log("PASS: Tw2CarbonData — GLES->Carbon repack maps verified for b1(46), b2(118), b3(29), b4(29)");

// --- customMaskClamps reaches Carbon reg 26 through the +12 shift -------------
// Carbon reads clamps at cb4[26] as [m0.U, m0.V, m1.U, m1.V]
// (EveCustomMask.cpp:80-81). ccpwgl carries them in GLES PS reg 14, chosen so
// the existing shift lands them there with no special case in the packer.
//
// Regression for a silent failure: zeros here mean a translated pattern shader
// does not clamp, and the pattern tiles across the hull instead of stopping.
{
    const glesVs = stamp(200);
    const glesPs = new Float32Array(16 * 4);
    glesPs[14 * 4] = 1;      // mask 0 clamp U
    glesPs[14 * 4 + 1] = 0;  // mask 0 clamp V
    glesPs[14 * 4 + 2] = 0;  // mask 1 clamp U
    glesPs[14 * 4 + 3] = 1;  // mask 1 clamp V

    const out = PackPerObjectPS(new Float32Array(PER_OBJECT_REGS * 4), glesVs, glesPs);
    assert.strictEqual(out[26 * 4], 1, "carbon reg 26.x = mask0 clampU");
    assert.strictEqual(out[26 * 4 + 1], 0, "carbon reg 26.y = mask0 clampV");
    assert.strictEqual(out[26 * 4 + 2], 0, "carbon reg 26.z = mask1 clampU");
    assert.strictEqual(out[26 * 4 + 3], 1, "carbon reg 26.w = mask1 clampV");
}


// --- clip convention: a translated shader must reproduce the GL depth exactly --
//
// Enter through the shader's door. A dx11-translated vertex stage reads the
// packed ViewProjectionMat with dot products and then applies the emitter's
// `gl_Position.z = 2z - w` fixup. Run that whole chain against the GL depth a
// legacy gles2 shader produces from the same camera: the two must agree at
// every distance, because both write into one depth buffer.
//
// The negative control is the unconverted GLES array. It clips everything
// nearer than 2nf/(n + f) - the defect that made decals vanish on approach.
{
    const near = 100, far = 10000;
    const h = Math.tan(0.5) * near, w = h * 1.6;
    const rl = 1 / (w + w), tb = 1 / (h + h), nf = 1 / (near - far);

    // gl-matrix frustum, column-major, GL convention.
    const P = new Float32Array(16);
    P[0] = near * 2 * rl; P[5] = near * 2 * tb;
    P[10] = (far + near) * nf; P[11] = -1; P[14] = far * near * 2 * nf;

    const T = new Float32Array(16);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) T[i * 4 + j] = P[j * 4 + i];

    const gles = new Float32Array(34 * 4);
    gles.set(T, 4 * 4);
    gles.set(T, 12 * 4);
    const out = PackPerFrameVS(new Float32Array(PER_FRAME_VS_REGS * 4), gles);

    // The translated shader: two dot products, then the emitter fixup.
    function translatedNdcZ(regs, base, viewZ, bias = 0)
    {
        const pos = [ 0, 0, -viewZ, 1 ];
        const dot = (r) => pos[0] * regs[r * 4] + pos[1] * regs[r * 4 + 1]
            + pos[2] * regs[r * 4 + 2] + pos[3] * regs[r * 4 + 3];
        const z = dot(base + 2) + bias, wc = dot(base + 3);
        // The emitter tail, verbatim: gl_Position.z = w - 2z.
        return (wc - 2 * z) / wc;
    }

    // A legacy gles2 shader: the same dot products, no fixup.
    function legacyNdcZ(viewZ)
    {
        const pos = [ 0, 0, -viewZ, 1 ];
        const z = P[2] * pos[0] + P[6] * pos[1] + P[10] * pos[2] + P[14] * pos[3];
        const wc = P[3] * pos[0] + P[7] * pos[1] + P[11] * pos[2] + P[15] * pos[3];
        return z / wc;
    }

    for (const viewZ of [ near, 150, 250, 1000, far ])
    {
        const carbon = translatedNdcZ(out, 4, viewZ);
        const legacy = legacyNdcZ(viewZ);
        assert.ok(
            Math.abs(carbon - legacy) < 1e-6,
            `translated NDC z at ${viewZ} (${carbon}) must match the legacy GL depth (${legacy})`
        );
        assert.ok(carbon >= -1 - 1e-6, `translated NDC z at ${viewZ} must not clip`);
    }

    // The point of the reversal: a shader-authored offset must move the vertex
    // TOWARD the camera. The decal family adds +1e-5 in its own clip space to
    // lift itself off the hull, and under LEQUAL that only draws if the biased
    // depth is the smaller one. Against a forward axis this inverts, and the
    // error grows as w shrinks - which is why decals vanished on approach.
    const DECAL_BIAS = 0.000009999999747378752;
    let previousGap = Infinity;
    for (const viewZ of [ 150, 300, 1000, 5000 ])
    {
        const hull = translatedNdcZ(out, 4, viewZ);
        const decal = translatedNdcZ(out, 4, viewZ, DECAL_BIAS);
        assert.ok(
            decal < hull,
            `a biased decal at ${viewZ} must land nearer than the hull (${decal} vs ${hull})`
        );
        // And the lift must shrink with distance, never grow.
        const gap = hull - decal;
        assert.ok(gap < previousGap, `the decal lift at ${viewZ} must be smaller than at the previous, nearer distance`);
        previousGap = gap;
    }
}
