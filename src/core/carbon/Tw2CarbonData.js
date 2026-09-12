/**
 * Tw2CarbonData
 *
 * Packs ccpwgl's GLES-v8-shaped per-frame / per-object constant arrays
 * into the Carbon/Trinity DX11 layouts the Carbon (translated) shaders
 * were compiled against. Register maps come from the carbonengine
 * source survey (see the reader-dxbc/reader-hlsl project's
 * carbon-constant-layouts.md survey document):
 *
 * - b1 per-frame VS: Carbon 46 regs vs GLES 34 — GLES omits the three
 *   motion-vector matrices at regs 28-39, shifting everything after
 *   EnvMapRotationMat by -12. We approximate the *Last matrices with
 *   the current-frame ones (zero motion vectors) until ccpwgl tracks
 *   previous-frame transforms.
 * - b2 per-frame PS: Carbon 118 regs vs GLES 23 — aligned through reg
 *   20, GLES misses Carbon reg 22 (frame/jitter/shadow-atlas), and the
 *   whole cascaded-shadow + froxel tail (24-117). Missing regs pack as
 *   zero; shaders sampling them get neutral values.
 * - b3 per-object VS: aligned 0-25; Carbon 26 = boneOffsets (uint bit
 *   patterns). The Carbon bone UBO is per-object and base-0, so zeros
 *   are the CORRECT offsets (translated shaders compute
 *   boneIndex = blendIndex + floatBitsToInt(cb3[26].xy)). GLES's
 *   inline JointMat splice at 26.. is NOT copied — bones ride the
 *   dedicated CjsSb UBO instead.
 * - b4 per-object PS: Carbon leads with world/worldLast/invWorld
 *   matrices (regs 0-11) that the GLES PS layout lacks; they are taken
 *   from the per-object VS data (regs 0-11 are identical by layout),
 *   then the GLES PS regs 0-15 land at Carbon 12-27.
 *
 * Pure typed-array module (CommonJS, no ccpwgl aliases) so node tests
 * can require it directly.
 */

const FLOATS_PER_REG = 4;

/** Carbon EveSpaceScene::PerFrameVSData register count */
const PER_FRAME_VS_REGS = 46;

/** Carbon EveSpaceScene::PerFramePSData register count */
const PER_FRAME_PS_REGS = 118;

/** Carbon EveSpaceObjectVSData / PSData register count */
const PER_OBJECT_REGS = 29;

/**
 * Copies whole vec4 registers between packed float arrays
 * @param {Float32Array} out
 * @param {Number} outReg
 * @param {Float32Array} src
 * @param {Number} srcReg
 * @param {Number} regCount
 */
function copyRegs(out, outReg, src, srcReg, regCount)
{
    const floats = regCount * FLOATS_PER_REG;
    const srcStart = srcReg * FLOATS_PER_REG;
    out.set(src.subarray(srcStart, srcStart + floats), outReg * FLOATS_PER_REG);
}

/**
 * Which clip convention the camera matrices are converted INTO.
 *
 * Must match the translator's `depthRange` - they are two halves of one pair.
 * "reversed" (default) pairs with the emitter's `w - 2z`; "forward" pairs with
 * `2z - w`. Mismatch them and the composition is `-z` rather than the identity,
 * which renders the scene inside out.
 *
 * Exists so the convention can be A/B tested. `scripts/test-carbon-clip-convention.js`
 * asserts the SHIPPED default against the installed emitter; this switch is for
 * a deliberate experiment, and flipping it alone is not one.
 * @type {String}
 */
let CLIP_DEPTH_RANGE = "reversed";

/**
 * @param {String} value - "reversed" or "forward"
 */
function SetClipDepthRange(value)
{
    if (value !== "reversed" && value !== "forward")
    {
        throw new TypeError(`Tw2CarbonData: clip depth range must be "reversed" or "forward", got ${JSON.stringify(value)}`);
    }
    CLIP_DEPTH_RANGE = value;
}

/** @returns {String} */
function GetClipDepthRange()
{
    return CLIP_DEPTH_RANGE;
}

/**
 * Rewrites a transposed clip matrix from the GL depth convention to Carbon's.
 *
 * Carbon renders REVERSED depth. `EveSpaceScene.cpp:4002` sets the scene
 * projection from `Tr2Renderer::GetReversedDepthProjectionTransform()`, and the
 * same transform feeds ProjectionInverseMat, the froxel fog, the raytracing
 * denoiser and the light manager. So a Carbon shader expects z_clip in [w, 0] -
 * near at w, far at 0 - and every dx11-translated vertex stage closes with the
 * emitter's `gl_Position.z = w - 2z`, which maps that onto GL NDC [-1, 1].
 *
 * ccpwgl's cameras build `mat4.frustum`, which is GL-convention (-w..w). This
 * converts: `z' = (w - z) / 2`, sending near to w and far to 0.
 *
 * Composed with the emitter fixup this is exactly the IDENTITY for an unbiased
 * vertex, so the depth buffer keeps conventional GL values, `clearDepth(1)` and
 * `LEQUAL` stand, and legacy gles2 shaders sharing the buffer are untouched.
 * What it restores is the direction of any offset the shader authors itself.
 * The decal family adds `+1e-5` to lift off the hull, which is toward the
 * camera only on a reversed axis; against a forward axis it sinks the decal
 * INTO the hull by `2e-5/w` - an error that grows as the camera closes in, and
 * the reason decals vanished on approach.
 *
 * The matrices arrive TRANSPOSED (row-vector/Carbon layout), so register
 * `base + 2` holds the z row and `base + 3` the w row.
 * @param {Float32Array} out - packed Carbon register array
 * @param {Number} baseReg   - first register of the 4-register matrix
 * @returns {Float32Array} out
 */
function GlClipToCarbonClip(out, baseReg)
{
    const z = (baseReg + 2) * FLOATS_PER_REG, w = (baseReg + 3) * FLOATS_PER_REG;
    for (let i = 0; i < FLOATS_PER_REG; i++)
    {
        out[z + i] = (out[w + i] - out[z + i]) * 0.5;
    }
    return out;
}

/**
 * GL to FORWARD D3D: `z' = (z + w) / 2`. The pre-2026-08-18 mapping, kept only
 * so the convention can be A/B tested against the emitter's "forward" tail.
 * @param {Float32Array} out
 * @param {Number} baseReg
 * @returns {Float32Array} out
 */
function GlClipToForwardClip(out, baseReg)
{
    const z = (baseReg + 2) * FLOATS_PER_REG, w = (baseReg + 3) * FLOATS_PER_REG;
    for (let i = 0; i < FLOATS_PER_REG; i++)
    {
        out[z + i] = (out[z + i] + out[w + i]) * 0.5;
    }
    return out;
}

/**
 * Rewrites a transposed clip matrix from FORWARD D3D to Carbon's reversed one.
 *
 * For matrices that are already `0..w` rather than GL's `-w..w`: the shadow
 * cascades, which `Tw2CarbonShadowData` builds with `carbonPerspectiveOffCenter`
 * and `carbonOrthoOffCenter`. Those are Carbon-form in x, y and range but NOT
 * reversed, and the caster shaders carry the same emitter fixup as every other
 * dx11 body - so they need `z' = w - z` to land on the same axis.
 *
 * Running the GL converter over one of these instead is silent and wrong: it
 * would halve an already-halved range and leave the atlas holding a depth that
 * still sits inside 0..1, which is exactly the kind of error that reads as
 * correct.
 * @param {Float32Array} out - packed Carbon register array
 * @param {Number} baseReg   - first register of the 4-register matrix
 * @returns {Float32Array} out
 */
function D3DClipToCarbonClip(out, baseReg)
{
    const z = (baseReg + 2) * FLOATS_PER_REG, w = (baseReg + 3) * FLOATS_PER_REG;
    for (let i = 0; i < FLOATS_PER_REG; i++)
    {
        out[z + i] = out[w + i] - out[z + i];
    }
    return out;
}

/**
 * Packs Carbon PerFrameVSData (b1) from the GLES-v8 per-frame VS array
 * @param {Float32Array} out - 46 * 4 floats
 * @param {Float32Array} gles - ccpwgl perFrameVSData.data (34 regs)
 * @returns {Float32Array} out
 */
/**
 * The registers holding a clip matrix, so a converter is applied to all four or
 * none. Skipping ProjLast is the kind of omission that shows up only in motion
 * vectors, long after the change that caused it.
 * @type {Array<Number>}
 */
const CLIP_MATRIX_REGS = [ 4, 12, 28, 36 ];

/**
 * Packs Carbon PerFrameVSData with NO clip conversion applied.
 *
 * Split out because the caller, not this function, knows which convention the
 * device projection is in: the camera builds GL, and the shadow caster swaps in
 * a Carbon-form cascade. Applying the wrong converter is silent - both land
 * inside a plausible range - so the choice is made explicitly at each call site.
 * @param {Float32Array} out - 46 * 4 floats
 * @param {Float32Array} gles - ccpwgl perFrameVSData.data (34 regs)
 * @returns {Float32Array} out
 */
function PackPerFrameVSRaw(out, gles)
{
    // 0-27: ViewInverseTranspose, ViewProjection, View, Projection,
    // ShadowView, ShadowViewProjection, EnvMapRotation — aligned.
    copyRegs(out, 0, gles, 0, 28);
    // 28-39: ViewProjectionLast/ViewLast/ProjLast — approximated with
    // the current matrices (motion vectors read as zero motion).
    copyRegs(out, 28, gles, 4, 4);   // ViewProjectionLast <- ViewProjectionMat
    copyRegs(out, 32, gles, 8, 4);   // ViewLast           <- ViewMat
    copyRegs(out, 36, gles, 12, 4);  // ProjLast           <- ProjectionMat
    // 40-45: sun/fog/resolution block, GLES 28-33 shifted +12.
    copyRegs(out, 40, gles, 28, 6);
    // Carbon reg 45.y = upscaling amount (GLES leaves it unused/0).
    out[45 * FLOATS_PER_REG + 1] = 1;
    return out;
}

/**
 * Whether the device renders into a REVERSED depth buffer (`Tw2Device.depthMode`
 * "reversed-buffer"). Gates the per-frame values that only mean anything on
 * that buffer, so the legacy A/B modes pack exactly what they always did.
 * @type {Boolean}
 */
let DEPTH_BUFFER_REVERSED = false;

/** @param {Boolean} value */
function SetDepthBufferReversed(value)
{
    DEPTH_BUFFER_REVERSED = !!value;
}

/** @returns {Boolean} */
function GetDepthBufferReversed()
{
    return DEPTH_BUFFER_REVERSED;
}

/**
 * `ProjectionInverseMat` for PerFramePSData 93-96, refreshed by
 * {@link PackPerFrameVS} from the projection it has just packed, so the two
 * cannot disagree. Rows, in register order.
 * @type {Float32Array}
 */
const PROJECTION_INVERSE = new Float32Array(16);

/**
 * Inverts a 4x4 held as 16 floats (any consistent layout; the inverse keeps it).
 * @param {Float32Array} out
 * @param {Float32Array|Array} m
 * @returns {Boolean} false when singular (out untouched)
 */
function invert4(out, m)
{
    const
        a00 = m[0], a01 = m[1], a02 = m[2], a03 = m[3],
        a10 = m[4], a11 = m[5], a12 = m[6], a13 = m[7],
        a20 = m[8], a21 = m[9], a22 = m[10], a23 = m[11],
        a30 = m[12], a31 = m[13], a32 = m[14], a33 = m[15],
        b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10,
        b02 = a00 * a13 - a03 * a10, b03 = a01 * a12 - a02 * a11,
        b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12,
        b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30,
        b08 = a20 * a33 - a23 * a30, b09 = a21 * a32 - a22 * a31,
        b10 = a21 * a33 - a23 * a31, b11 = a22 * a33 - a23 * a32;

    let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
    if (!det) return false;
    det = 1 / det;

    out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
    out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
    out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
    out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
    out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
    out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
    out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
    return true;
}

function PackPerFrameVS(out, gles)
{
    PackPerFrameVSRaw(out, gles);
    // The camera's matrices are GL-convention and become Carbon's reversed
    // clip here. ShadowViewProjectionMat (20-23) is deliberately absent from
    // CLIP_MATRIX_REGS: it is the LOOKUP matrix, read by main-pass shaders as
    // ordinary constants rather than written to gl_Position, so it carries no
    // emitter fixup and must stay exactly as Tw2CarbonShadowData built it.
    const convert = CLIP_DEPTH_RANGE === "forward" ? GlClipToForwardClip : GlClipToCarbonClip;
    for (const reg of CLIP_MATRIX_REGS) convert(out, reg);

    // Carbon: `ProjectionInverseMat = Inverse(Transpose(reversedProjection))`
    // beside `ProjectionMat = Transpose(reversedProjection)`
    // (EveSpaceScene.cpp:3193). Registers 12-15 now hold the latter, so the
    // inverse of those same registers is the former in the same layout.
    if (DEPTH_BUFFER_REVERSED)
    {
        invert4(PROJECTION_INVERSE, out.subarray(12 * FLOATS_PER_REG, 16 * FLOATS_PER_REG));
    }
    return out;
}

/**
 * Packs Carbon PerFramePSData (b2) from the GLES-v8 per-frame PS array
 * @param {Float32Array} out - 118 * 4 floats (zero-filled tail persists)
 * @param {Float32Array} gles - ccpwgl perFramePSData.data (23 regs)
 * @returns {Float32Array} out
 */
function PackPerFramePS(out, gles)
{
    // 0-20 aligned (individual .zw semantic drift noted in the survey
    // is carried through as-is — same slots, GLES-sourced values).
    copyRegs(out, 0, gles, 0, 21);
    // 21: Time, SceneMipLodBias, Upscaling, GammaBrightness.
    const r21 = 21 * FLOATS_PER_REG;
    out[r21] = gles[r21];   // Time
    out[r21 + 1] = 0;       // SceneMipLodBias
    out[r21 + 2] = 1;       // Upscaling
    out[r21 + 3] = 1;       // GammaBrightness
    // 22: FrameIndex/Jittering/shadow-atlas (uint bit patterns) — left
    // zero: small-int bit patterns are denormals and unsafe through
    // uniform4fv, and no jitter/atlas exists in ccpwgl yet.
    // 23: VolumetricSlices — GLES has it one register early (22).
    copyRegs(out, 23, gles, 22, 1);
    // 24-117: cascaded shadow maps, ProjectionInverseMat, cascade
    // ranges, froxel fog — no ccpwgl sources yet; stays zero, except below.

    if (DEPTH_BUFFER_REVERSED)
    {
        // 17.z DepthMapSampleCount: Carbon writes 1 ("legacy",
        // EveSpaceScene.cpp PopulatePerFramePSData). GLES carries FovXY there.
        out[17 * FLOATS_PER_REG + 2] = 1;

        // 93-96 ProjectionInverseMat, from the projection PackPerFrameVS packed.
        out.set(PROJECTION_INVERSE, 93 * FLOATS_PER_REG);

        // 113-115 FroxelFogData with no fog: Tr2VolumetricsRenderer::
        // PopulatePerFrameData (.cpp:1047-1071) over the default settings
        // (.h:28-53, all 0). Zeros would mean MaxDistance 0 and a visibility
        // of 0 - fully fogged - rather than Carbon's "no fog".
        const r113 = 113 * FLOATS_PER_REG;
        out.fill(0, r113, r113 + 4);          // FogColor, BackgroundVisibility 0
        out[r113 + 4] = 0;                    // BaseDensity = thickness / Far
        out[r113 + 5] = 1e6;                  // MaxDistance = m_gameBackClip (:75)
        out[r113 + 6] = 1;                    // MaxDistanceVisibility = exp(-0)
        out[r113 + 7] = 0;                    // EnvironmentIntensity
        out[r113 + 8] = -0.001;               // EnvironmentG = -clamp(0, .001, .999)
    }
    return out;
}

/**
 * Packs Carbon EveSpaceObjectVSData (b3) from the GLES per-object VS array
 * @param {Float32Array} out - 29 * 4 floats
 * @param {Float32Array} gles - ccpwgl per-object vs data (world..masks + inline JointMat)
 * @returns {Float32Array} out
 */
function PackPerObjectVS(out, gles)
{
    // 0-25: world/worldLast/invWorld, shipData, clipData, ellipsoid,
    // custom masks — aligned.
    copyRegs(out, 0, gles, 0, 26);
    // 26: boneOffsets [cur, prev, count, -] as uint bits. The Carbon bone
    // UBO is per-object/base-0 so cur=prev=0 (0.0 bit pattern == uint 0
    // — exact and denormal-free). GLES's inline JointMat is NOT copied.
    // 27: morph-target offsets — no morph pipeline; zero.
    // 28: customData — no GLES source; zero.
    out.fill(0, 26 * FLOATS_PER_REG, PER_OBJECT_REGS * FLOATS_PER_REG);
    return out;
}

/**
 * Packs Carbon EveSpaceObjectPSData (b4) from GLES per-object VS+PS arrays
 * @param {Float32Array} out - 29 * 4 floats
 * @param {Float32Array} glesVs - per-object vs data (for the leading matrices)
 * @param {Float32Array} glesPs - per-object ps data (16 regs)
 * @returns {Float32Array} out
 */
function PackPerObjectPS(out, glesVs, glesPs)
{
    // 0-11: worldTransform/worldTransformLast/invWorldTransform — the
    // GLES PS layout omits them; per-object VS regs 0-11 are identical
    // by layout.
    copyRegs(out, 0, glesVs, 0, 12);
    // 12-27: shipData..screenSize — GLES PS 0-15 shifted +12.
    copyRegs(out, 12, glesPs, 0, 16);
    // 28: customData — zero.
    out.fill(0, 28 * FLOATS_PER_REG, PER_OBJECT_REGS * FLOATS_PER_REG);
    return out;
}

/**
 * Packs a decal's per-object VS data (b3) into Carbon DecalVSPerObjectData.
 * The decal per-object schema is already that layout (worldMatrix@0,
 * invWorldMatrix@4, decalMatrix@8, inverseDecalMatrix@12, parentBoneMatrix@16,
 * invParentBoneMatrix@20), so this is a direct copy — unlike the hull
 * PackPerObjectVS. Registers past the decal data are zeroed.
 * @param {Float32Array} out - PER_OBJECT_REGS * 4 floats
 * @param {Float32Array} glesVs - decal per-object vs data
 * @returns {Float32Array} out
 */
function PackDecalPerObjectVS(out, glesVs)
{
    const regs = Math.min(Math.floor(glesVs.length / FLOATS_PER_REG), PER_OBJECT_REGS);
    copyRegs(out, 0, glesVs, 0, regs);
    out.fill(0, regs * FLOATS_PER_REG, PER_OBJECT_REGS * FLOATS_PER_REG);
    return out;
}

/**
 * Packs a decal's per-object PS data (b4) into Carbon DecalPSPerObjectData
 * (displayData@0, shipData@1, clipData@2, clipRadius2Sq@3, shLighting@4+). The
 * decal PS schema already leads with displayData/shipData, so this is a direct
 * copy — NOT the hull PackPerObjectPS, which prepends the VS world matrices at
 * regs 0-11 and would push displayData/shipData out to 12+ (the decal reads them
 * at cb4[0]/[1]). The decal object packs its PS data in Carbon order before this
 * direct copy.
 * @param {Float32Array} out - PER_OBJECT_REGS * 4 floats
 * @param {Float32Array} glesPs - decal per-object ps data
 * @returns {Float32Array} out
 */
function PackDecalPerObjectPS(out, glesPs)
{
    const regs = Math.min(Math.floor(glesPs.length / FLOATS_PER_REG), PER_OBJECT_REGS);
    copyRegs(out, 0, glesPs, 0, regs);
    out.fill(0, regs * FLOATS_PER_REG, PER_OBJECT_REGS * FLOATS_PER_REG);
    return out;
}

module.exports = {
    FLOATS_PER_REG,
    PER_FRAME_VS_REGS,
    PER_FRAME_PS_REGS,
    PER_OBJECT_REGS,
    CLIP_MATRIX_REGS,
    PackPerFrameVS,
    PackPerFrameVSRaw,
    PackPerFramePS,
    PackPerObjectVS,
    PackPerObjectPS,
    GlClipToCarbonClip,
    GlClipToForwardClip,
    SetClipDepthRange,
    SetDepthBufferReversed,
    GetDepthBufferReversed,
    GetClipDepthRange,
    D3DClipToCarbonClip,
    PackDecalPerObjectVS,
    PackDecalPerObjectPS
};
