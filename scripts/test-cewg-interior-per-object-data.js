/* eslint-env node */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { CewgResourceBinder } = require("../src/core/cewg/CewgResourceBinder");


const sourcePath = path.resolve(
    __dirname,
    "../src/unsupported/interior/cewg/CewgInteriorPerObjectData.js"
);
const source = fs.readFileSync(sourcePath, "utf8")
    .replace(/export const /g, "const ")
    .replace(/export class /g, "class ")
    .replace(/export function /g, "function ");

const load = new Function(
    `${source}\nreturn { CEWG_INTERIOR_LAYOUT, CewgInteriorPerObjectData, ` +
    "CewgInteriorPerObjectAdapter, CreateCewgInteriorPerObjectAdapter };"
);
const {
    CEWG_INTERIOR_LAYOUT: layout,
    CewgInteriorPerObjectData,
    CewgInteriorPerObjectAdapter,
    CreateCewgInteriorPerObjectAdapter
} = load();

assert.equal(layout.maxJoints, 69);
assert.equal(layout.jointFloats, 828);
assert.equal(layout.jointRegisters, 207);
assert.equal(layout.cb3Registers, 212);
assert.equal(layout.cb4Registers, 79);

const joints = new Float32Array(70 * 12);
for (let joint = 0; joint < 70; joint++)
{
    joints.fill(joint + 1, joint * 12, joint * 12 + 12);
}

const world = Float32Array.from({ length: 16 }, (_, i) => 1000 + i);
const uv = [ 2, 3, 4, 5 ];
const lights = [];
for (let i = 0; i < 12; i++) lights.push(createLight(i));
const shadow0 = [ 610, 611, 612, 613 ];
const shadow1 = [ 620, 621, 622, 623 ];
const spotLights = Float32Array.from({ length: 64 }, (_, i) => 6300 + i);

const data = CewgInteriorPerObjectData.Pack({
    jointMatrices: joints,
    worldTransform: world,
    uvLinearTransform: uv,
    pointLights: lights,
    shadowCaster0: shadow0,
    shadowCaster1: shadow1,
    spotLightMatrices: spotLights
});

assert.equal(data.cb3.length, 212 * 4, "cb3 must expose 212 vec4 registers");
assert.equal(data.jointMatrices.length, 828, "joint palette must expose 69 float4x3 matrices");
assert.equal(data.jointCount, 69, "joint count must clamp at Carbon's mesh-area maximum");
assert.deepEqual(Array.from(data.jointMatrices.subarray(0, 12)), new Array(12).fill(1));
assert.deepEqual(Array.from(data.jointMatrices.subarray(68 * 12, 69 * 12)), new Array(12).fill(69));
assert.deepEqual(Array.from(data.cb3.subarray(207 * 4, 211 * 4)), Array.from(world));
assert.deepEqual(Array.from(data.cb3.subarray(211 * 4, 212 * 4)), uv);

assert.equal(data.cb4.length, 79 * 4, "cb4 must expose 79 vec4 registers");
assert.equal(data.cb4Int[0], 10, "cb4[0].x must contain the clamped int32 light count");
assert.equal(data.cb4Int[1], 0, "the rest of the light-count register must stay zero");
assert.deepEqual(Array.from(data.cb4.subarray(1 * 4, 7 * 4)), expectedLight(0));
assert.deepEqual(Array.from(data.cb4.subarray(55 * 4, 61 * 4)), expectedLight(9));
assert.deepEqual(Array.from(data.cb4.subarray(61 * 4, 62 * 4)), shadow0);
assert.deepEqual(Array.from(data.cb4.subarray(62 * 4, 63 * 4)), shadow1);
assert.deepEqual(Array.from(data.cb4.subarray(63 * 4, 79 * 4)), Array.from(spotLights));

const constants = data.GetConstantBuffers();
const palettes = data.GetPalettes();
assert.strictEqual(constants.cb3, data.cb3);
assert.strictEqual(constants.cb4, data.cb4);
assert.strictEqual(palettes[0].data, data.jointMatrices);
assert.equal(palettes[0].capacityElements, 69);
assert.equal(palettes[0].strideFloats, 12);
assert.equal(palettes[0].strideBytes, 48);
assert.equal(palettes[0].count, 69);
assert.strictEqual(data.GetPaletteData(), palettes[0]);
assert.strictEqual(data.GetJointMatrices(), data.jointMatrices);

const adapter = new CewgInteriorPerObjectAdapter();
const legacyJoints = joints.subarray(0, 58 * 12);
const pod = {
    cewgInteriorData: data,
    cewgPerObjectPacker: adapter,
    vs: {
        data: new Float32Array(200 * 4),
        Has: name => name === "JointMat",
        Get: name => name === "JointMat" ? legacyJoints : null
    },
    ps: { data: new Float32Array(77 * 4) }
};
assert.strictEqual(adapter.GetConstantBuffers(pod), constants);
assert.strictEqual(adapter.GetPalettes(pod), palettes);
assert.strictEqual(adapter.GetPaletteData(pod), palettes[0]);
assert.strictEqual(adapter.GetJointMatrices(pod), data.jointMatrices);
assert.strictEqual(CreateCewgInteriorPerObjectAdapter(data).GetCewgData(), data.GetCewgData());

const context = { perObjectData: pod };
assert.equal(adapter.OnBeforeCewgConstants(context), true);
assert.strictEqual(context.cewgPerObjectPacker, adapter);
assert.strictEqual(context.cewgJointMatrices, data.jointMatrices);
assert.strictEqual(context.cewgInteriorData, data.GetCewgData());
assert.strictEqual(adapter.OnAfterPerObjectData(context), data.GetCewgData());
assert.strictEqual(context.cewgInteriorData, data.GetCewgData());

const gl = createGl();
const device = { gl, perObjectData: pod };
const program = {
    constantBufferHandles: [ null, null, null, "cb3", "cb4" ],
    cewgUniformBlocks: [ {
        name: "CewgSb0",
        bindingPoint: 0,
        capacityElements: 69,
        strideBytes: 48,
        byteLength: 69 * 48
    } ],
    cewgDataTextures: []
};
const passContext = applyFakeCewgPass({ _adapters: [] }, program, device);
const uploads = gl.calls.filter(call => call[0] === "uniform4fv");
const cb3Upload = uploads.find(call => call[1] === "cb3")[2];
const cb4Upload = uploads.find(call => call[1] === "cb4")[2];
assert.equal(cb3Upload.length, 212 * 4, "hook-selected cb3 must bypass the 29-register hull scratch buffer");
assert.equal(cb4Upload.length, 79 * 4, "hook-selected cb4 must bypass the 29-register hull scratch buffer");
assert.equal(cb3Upload[68 * 12], 69, "cb3 must retain joint 69");
assert.strictEqual(passContext.cewgPerObjectPacker, adapter);

const boneUploads = gl.calls.filter(call => call[0] === "bufferData");
const boneUpload = boneUploads[boneUploads.length - 1][2];
assert.equal(boneUpload.length, 69 * 12, "binder must upload the complete 69-joint UBO");
assert.equal(boneUpload[68 * 12], 69, "hook-selected palette must win over legacy JointMat");

const
    frameGl = createGl(),
    spaceVS = { data: new Float32Array([ 1, 2, 3, 4 ]) },
    spacePS = { data: new Float32Array([ 5, 6, 7, 8 ]) },
    interiorVS = { data: new Float32Array([ 11, 12, 13, 14 ]) },
    interiorPS = { data: new Float32Array([ 15, 16, 17, 18 ]) },
    frameDevice = { gl: frameGl, perObjectData: null, perFrameVSData: spaceVS, perFramePSData: spacePS },
    frameProgram = { constantBufferHandles: [ null, "cb1", "cb2" ] },
    framePacker = {
        PackPerFrameVS(out, input) { return input; },
        PackPerFramePS(out, input) { return input; }
    };

CewgResourceBinder.Get(frameDevice).ApplyConstants(frameProgram, frameDevice, framePacker, {
    perFrameVSData: interiorVS,
    perFramePSData: interiorPS
});
assert.deepEqual(frameGl.calls.filter(call => call[0] === "uniform4fv"), [
    [ "uniform4fv", "cb1", interiorVS.data ],
    [ "uniform4fv", "cb2", interiorPS.data ]
]);

const
    sceneSource = fs.readFileSync(path.resolve(__dirname, "../src/unsupported/interior/scene/Tr2InteriorScene.js"), "utf8"),
    effectSource = fs.readFileSync(path.resolve(__dirname, "../src/core/mesh/Tw2Effect.js"), "utf8");
assert.doesNotMatch(sceneSource, /device\.perFrame(?:VS|PS)Data\s*=/, "interior collection must not replace Eve frame data");
assert.match(effectSource, /pod && pod\.perFrameVSData \|\| d\.perFrameVSData/);
assert.match(effectSource, /pod && pod\.perFramePSData \|\| d\.perFramePSData/);

const defaults = new CewgInteriorPerObjectData().Pack();
assert.deepEqual(Array.from(defaults.jointMatrices.subarray(0, 12)), [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0
]);
assert.deepEqual(Array.from(defaults.cb3.subarray(207 * 4, 211 * 4)), [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
]);
assert.deepEqual(Array.from(defaults.cb3.subarray(211 * 4)), [ 1, 1, 0, 0 ]);
assert.equal(defaults.cb4Int[0], 0);
assert(defaults.cb4.every(value => value === 0), "empty cb4 must be zero initialized");

console.log("CEWG interior cb3/cb4 and 69-joint palette packing verified");


function createLight(i)
{
    return {
        position: [ i + 1, i + 2, i + 3 ],
        radius: i + 4,
        color: [ i + 5, i + 6, i + 7 ],
        pointLightFalloff: i + 8,
        shadow0Influence: i + 9,
        shadow1Influence: i + 10,
        coneCosAlphaOuter: i + 11,
        coneCosAlphaInner: i + 12,
        spotDirection: [ i + 13, i + 14, i + 15 ],
        unused2: i + 16,
        boxTransformRow3: [ i + 17, i + 18, i + 19, i + 20 ],
        boxTransformRow4: [ i + 21, i + 22, i + 23, i + 24 ]
    };
}


function expectedLight(i)
{
    return Array.from({ length: 24 }, (_, index) => i + index + 1);
}


function applyFakeCewgPass(effect, program, device)
{
    const context = {
        device,
        program,
        perObjectData: device.perObjectData,
        cewgPerObjectPacker: null,
        cewgJointMatrices: undefined
    };
    const podPacker = context.perObjectData && context.perObjectData.cewgPerObjectPacker;
    if (podPacker && !effect._adapters.includes(podPacker) && podPacker.OnBeforeCewgConstants)
    {
        podPacker.OnBeforeCewgConstants(context);
    }
    for (let i = 0; i < effect._adapters.length; i++)
    {
        const hook = effect._adapters[i].OnBeforeCewgConstants;
        if (hook) hook.call(effect._adapters[i], context);
    }

    const binder = CewgResourceBinder.Get(device);
    binder.ApplyConstants(program, device, context.cewgPerObjectPacker);
    const selectedJoints = context.cewgJointMatrices !== undefined
        ? context.cewgJointMatrices
        : (device.perObjectData.vs.Has("JointMat") ? device.perObjectData.vs.Get("JointMat") : null);
    binder.SetJointMatrices(selectedJoints);
    binder.ApplyPass(program, device);
    return context;
}


function createGl()
{
    let nextBuffer = 0;
    const gl = {
        calls: [],
        MAX_COMBINED_TEXTURE_IMAGE_UNITS: 0x8B4D,
        UNIFORM_BUFFER: 0x8A11,
        DYNAMIC_DRAW: 0x88E8,
        getParameter: () => 32,
        uniform4fv(handle, value)
        {
            this.calls.push([ "uniform4fv", handle, value.slice() ]);
        },
        createBuffer: () => ({ id: ++nextBuffer }),
        deleteBuffer() {},
        bindBuffer() {},
        bufferData(target, value)
        {
            gl.calls.push([ "bufferData", target, value.slice() ]);
        },
        bindBufferBase(target, bindingPoint)
        {
            gl.calls.push([ "bindBufferBase", target, bindingPoint ]);
        }
    };
    return gl;
}
