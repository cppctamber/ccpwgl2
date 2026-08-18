/**
 * Interlock: the clip convention is split across two packages.
 *
 * `Tw2CarbonData` converts the camera's projection into Carbon's REVERSED clip
 * space, and `DxbcGlslEmitter` — which lives in @carbonenginejs/runtime-resource
 * and runs at load time — maps that back to GL with `gl_Position.z = w - 2z`.
 * The two compose to the identity, which is what keeps the depth buffer
 * conventional and legacy gles2 shaders unaffected.
 *
 * Pair either half with the other convention and depth inverts. Nothing throws:
 * every value still lands inside a valid range, so the failure presents as
 * geometry sorting wrongly rather than as a version error. The 0.16.0 skew
 * already cost a day of exactly this, so the coupling is asserted rather than
 * remembered.
 */
const assert = require("assert");
const fs = require("fs");
const path = require("path");

const EMITTER = path.resolve(
    __dirname,
    "../node_modules/@carbonenginejs/runtime-resource/dist/formats/webgl/core/glsl/DxbcGlslEmitter.js"
);

// What the seam produces: near -> w, far -> 0.
const SEAM_IS_REVERSED = true;
// The tail that undoes a reversed seam.
const REVERSED_TAIL = "gl_Position.w - 2.0 * gl_Position.z";
// The tail that undoes a forward one, kept so the failure can name what it found.
const FORWARD_TAIL = "2.0 * gl_Position.z - gl_Position.w";

assert.ok(fs.existsSync(EMITTER), `emitter not found at ${EMITTER}`);

const source = fs.readFileSync(EMITTER, "utf8");
const match = source.match(/gl_Position\.z = ([^"]+);/);
assert.ok(match, "no gl_Position.z fixup found in the installed emitter");

const tail = match[1];
const expected = SEAM_IS_REVERSED ? REVERSED_TAIL : FORWARD_TAIL;

if (tail !== expected)
{
    // Read directly: the package restricts its `exports`, so the manifest is
    // not requirable by subpath.
    const version = JSON.parse(fs.readFileSync(
        path.resolve(__dirname, "../node_modules/@carbonenginejs/runtime-resource/package.json"),
        "utf8"
    )).version;
    assert.fail(
        `Clip convention skew.\n`
        + `  seam (Tw2CarbonData): ${SEAM_IS_REVERSED ? "REVERSED" : "forward"} Carbon clip\n`
        + `  emitter tail found  : ${tail}\n`
        + `  emitter tail wanted : ${expected}\n`
        + `  runtime-resource    : ${version}\n`
        + `The reversed tail ships in runtime-resource >= 0.20.0. Install it, or\n`
        + `revert the seam - but never run one half of the pair against the other.`
    );
}

// The composition must be the identity, not merely consistent.
const { PackPerFrameVSRaw, GlClipToCarbonClip, PER_FRAME_VS_REGS } = require("../src/core/carbon/Tw2CarbonData");

const near = 100, far = 10000, h = Math.tan(0.5) * near, w = h * 1.6;
const P = new Float32Array(16);
P[0] = near * 2 / (w + w); P[5] = near * 2 / (h + h);
P[10] = (far + near) / (near - far); P[11] = -1; P[14] = far * near * 2 / (near - far);

const T = new Float32Array(16);
for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) T[i * 4 + j] = P[j * 4 + i];

const gles = new Float32Array(34 * 4);
gles.set(T, 4 * 4);
const out = PackPerFrameVSRaw(new Float32Array(PER_FRAME_VS_REGS * 4), gles);
GlClipToCarbonClip(out, 4);

for (const viewZ of [ near, 250, 1000, far ])
{
    const p = [ 0, 0, -viewZ, 1 ];
    const dot = (r) => p[0] * out[r * 4] + p[1] * out[r * 4 + 1] + p[2] * out[r * 4 + 2] + p[3] * out[r * 4 + 3];
    const carbon = (dot(7) - 2 * dot(6)) / dot(7);
    const legacyZ = P[2] * p[0] + P[6] * p[1] + P[10] * p[2] + P[14] * p[3];
    const legacyW = P[3] * p[0] + P[7] * p[1] + P[11] * p[2] + P[15] * p[3];
    assert.ok(
        Math.abs(carbon - legacyZ / legacyW) < 1e-6,
        `seam + tail must be the identity at ${viewZ}: got ${carbon}, legacy GL is ${legacyZ / legacyW}`
    );
}

console.log("PASS: Carbon clip convention — seam and installed emitter agree, and compose to the identity");
