/**
 * CewgCarbonData
 *
 * Packs ccpwgl's GLES-v8-shaped per-frame / per-object constant arrays
 * into the Carbon/Trinity DX11 layouts the CEWG (translated) shaders
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
 *   patterns). The CEWG bone UBO is per-object and base-0, so zeros
 *   are the CORRECT offsets (translated shaders compute
 *   boneIndex = blendIndex + floatBitsToInt(cb3[26].xy)). GLES's
 *   inline JointMat splice at 26.. is NOT copied — bones ride the
 *   dedicated CewgSb UBO instead.
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
 * Packs Carbon PerFrameVSData (b1) from the GLES-v8 per-frame VS array
 * @param {Float32Array} out - 46 * 4 floats
 * @param {Float32Array} gles - ccpwgl perFrameVSData.data (34 regs)
 * @returns {Float32Array} out
 */
function PackPerFrameVS(out, gles)
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
    // ranges, froxel fog — no ccpwgl sources yet; stays zero.
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
    // 26: boneOffsets [cur, prev, count, -] as uint bits. The CEWG bone
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
 * invWorldMatrix@4, decalMatrix@8, inverseDecalMatrix@12, parentBoneMatrix@16),
 * so this is a direct copy — unlike the hull PackPerObjectVS. Registers past
 * the decal data are zeroed (invParentBoneMatrix has no ccpwgl source yet).
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
 * at cb4[0]/[1]). clipData and the SH coefficients have no ccpwgl source and stay
 * zero.
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
    PackPerFrameVS,
    PackPerFramePS,
    PackPerObjectVS,
    PackPerObjectPS,
    PackDecalPerObjectVS,
    PackDecalPerObjectPS
};
