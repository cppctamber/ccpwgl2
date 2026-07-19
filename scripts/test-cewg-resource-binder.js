/**
 * Regression test: CewgResourceBinder — the GL upload/binding layer for
 * CEWG non-sampler bindings (bone UBO, light-list RGBA32UI data
 * textures, post-fx buffer textures).
 *
 * Runs against a recording GL stub (no real context): asserts resource
 * creation, joint-matrix staging/upload behaviour, stride-based Buffer
 * A/B selection, fallback light-list sizing from the device viewport,
 * dirty-row texSubImage2D updates and texture-unit binding.
 */
const assert = require("assert");
const { CewgResourceBinder } = require("../src/core/cewg/CewgResourceBinder");
const { CewgLightList } = require("../src/core/cewg/CewgLightList");

// --- recording GL stub -------------------------------------------------------
function makeGl()
{
    const calls = [];
    const constants = {
        UNIFORM_BUFFER: "UNIFORM_BUFFER",
        DYNAMIC_DRAW: "DYNAMIC_DRAW",
        TEXTURE_2D: "TEXTURE_2D",
        TEXTURE0: 33984,
        RGBA32UI: "RGBA32UI",
        RGBA_INTEGER: "RGBA_INTEGER",
        UNSIGNED_INT: "UNSIGNED_INT",
        RGBA32F: "RGBA32F",
        RGBA: "RGBA",
        FLOAT: "FLOAT",
        TEXTURE_MIN_FILTER: "TEXTURE_MIN_FILTER",
        TEXTURE_MAG_FILTER: "TEXTURE_MAG_FILTER",
        TEXTURE_WRAP_S: "TEXTURE_WRAP_S",
        TEXTURE_WRAP_T: "TEXTURE_WRAP_T",
        NEAREST: "NEAREST",
        CLAMP_TO_EDGE: "CLAMP_TO_EDGE"
    };
    let nextId = 1;
    const gl = {
        calls,
        createBuffer: () => ({ id: `buffer${nextId++}` }),
        deleteBuffer: buffer => calls.push([ "deleteBuffer", buffer.id ]),
        bindBuffer: (target, buffer) => calls.push([ "bindBuffer", target, buffer.id ]),
        bufferData: (target, data, usage) => calls.push([ "bufferData", target, data.byteLength, usage, data.slice ? data.slice(0, 4) : null ]),
        bindBufferBase: (target, index, buffer) => calls.push([ "bindBufferBase", target, index, buffer.id ]),
        createTexture: () => ({ id: `texture${nextId++}` }),
        bindTexture: (target, texture) => calls.push([ "bindTexture", target, texture.id ]),
        texParameteri: () => {},
        texImage2D: (...args) => calls.push([ "texImage2D", args[2], args[3], args[4], args[8] ? args[8].length : 0 ]),
        texSubImage2D: (...args) => calls.push([ "texSubImage2D", args[3], args[4], args[5], args[8] ? args[8].length : 0 ]),
        activeTexture: unit => calls.push([ "activeTexture", unit - constants.TEXTURE0 ]),
        uniform4fv: (handle, data) => calls.push([ "uniform4fv", handle, data.slice() ])
    };
    Object.assign(gl, constants);
    return gl;
}

function callNames(gl) { return gl.calls.map(c => c[0]); }
function findCalls(gl, name) { return gl.calls.filter(c => c[0] === name); }

// --- bone UBO ----------------------------------------------------------------
{
    const gl = makeGl();
    const device = { gl, viewportWidth: 1920, viewportHeight: 1080 };
    const binder = CewgResourceBinder.Get(device);
    assert.strictEqual(CewgResourceBinder.Get(device), binder, "binder is a device singleton");

    const program = {
        cewgUniformBlocks: [ { name: "CewgSb0", bindingPoint: 0, capacityElements: 69, strideBytes: 48, byteLength: 69 * 48 } ],
        cewgDataTextures: []
    };

    // No joints staged yet: buffer allocated zeroed and bound
    binder.ApplyPass(program, device);
    let bufferDatas = findCalls(gl, "bufferData");
    assert(bufferDatas.length >= 1, "bone UBO should be allocated");
    assert.strictEqual(bufferDatas[0][2], 69 * 48, "bone UBO sized to the block's byteLength");
    assert(findCalls(gl, "bindBufferBase").some(c => c[2] === 0), "bone UBO bound to binding point 0");

    // Staging joints re-uploads on the next apply
    gl.calls.length = 0;
    const joints = new Float32Array(58 * 12);
    joints[0] = 1; joints[5] = 1; joints[10] = 1; // identity-ish first joint rows
    binder.SetJointMatrices(joints);
    binder.ApplyPass(program, device);
    bufferDatas = findCalls(gl, "bufferData");
    assert.strictEqual(bufferDatas.length, 1, "staged joints trigger exactly one upload");
    assert.strictEqual(bufferDatas[0][2], 69 * 48, "upload is always full UBO size (69-joint staging)");
    assert.deepStrictEqual(Array.from(bufferDatas[0][4]), [ 1, 0, 0, 0 ], "joint data lands at the start of the staging buffer");

    // Same staged data, no re-stage: no redundant upload
    gl.calls.length = 0;
    binder.ApplyPass(program, device);
    assert.strictEqual(findCalls(gl, "bufferData").length, 0, "no upload without a new SetJointMatrices");
    assert.strictEqual(findCalls(gl, "bindBufferBase").length, 1, "UBO still bound every apply");

    // Re-staging the same array re-uploads (animation mutates in place)
    binder.SetJointMatrices(joints);
    gl.calls.length = 0;
    binder.ApplyPass(program, device);
    assert.strictEqual(findCalls(gl, "bufferData").length, 1, "re-staged joints re-upload");
}

// --- per-object constant packing hook ---------------------------------------
{
    const gl = makeGl();
    const device = {
        gl,
        perObjectData: {
            vs: { data: new Float32Array(40 * 4).fill(3) },
            ps: { data: new Float32Array(16 * 4).fill(4) }
        }
    };
    const binder = CewgResourceBinder.Get(device);
    const program = { constantBufferHandles: [ null, null, null, "cb3", "cb4" ] };
    const packer = {
        PackPerObjectVS(out, pod, receivedDevice, receivedProgram)
        {
            assert.strictEqual(pod, device.perObjectData);
            assert.strictEqual(receivedDevice, device);
            assert.strictEqual(receivedProgram, program);
            out[0] = 31;
        },
        PackPerObjectPS(out)
        {
            out[0] = 41;
            return out;
        }
    };

    binder.ApplyConstants(program, device, packer);
    let uploads = findCalls(gl, "uniform4fv");
    assert.strictEqual(uploads.find(call => call[1] === "cb3")[2][0], 31, "custom cb3 packer controls the VS upload");
    assert.strictEqual(uploads.find(call => call[1] === "cb4")[2][0], 41, "custom cb4 packer controls the PS upload");

    gl.calls.length = 0;
    binder.ApplyConstants(program, device, { PackPerObjectVS: out => { out[0] = 99; } });
    uploads = findCalls(gl, "uniform4fv");
    assert.strictEqual(uploads.find(call => call[1] === "cb3")[2][0], 99, "packing overrides are per apply");
    assert.strictEqual(uploads.find(call => call[1] === "cb4")[2][0], 3, "missing cb4 override retains the space fallback");

    gl.calls.length = 0;
    program.constantBufferSizes = [ null, null, null, 1, 2 ];
    binder.ApplyConstants(program, device, packer);
    uploads = findCalls(gl, "uniform4fv");
    assert.strictEqual(uploads.find(call => call[1] === "cb3")[2].length, 4, "cb3 upload clips to the linked declaration");
    assert.strictEqual(uploads.find(call => call[1] === "cb4")[2].length, 8, "cb4 upload clips to the linked declaration");

    gl.calls.length = 0;
    device.perFrameVSData = { data: new Float32Array(8).fill(5) };
    device.perFramePSData = { data: new Float32Array(12).fill(6) };
    const frameProgram = {
        constantBufferHandles: [ null, "cb1", "cb2" ],
        constantBufferSizes: [ null, 2, 3 ]
    };
    binder.ApplyConstants(frameProgram, device, {
        PackPerFrameVS(out) { out.fill(7); },
        PackPerFramePS(out) { out.fill(8); }
    });
    uploads = findCalls(gl, "uniform4fv");
    assert.deepStrictEqual(Array.from(uploads.find(call => call[1] === "cb1")[2]), new Array(8).fill(7));
    assert.deepStrictEqual(Array.from(uploads.find(call => call[1] === "cb2")[2]), new Array(12).fill(8));
}

// --- light-list data textures (fallback list) ---------------------------------
{
    const gl = makeGl();
    const device = { gl, viewportWidth: 1920, viewportHeight: 1080 };
    const binder = CewgResourceBinder.Get(device);

    const program = {
        cewgUniformBlocks: [],
        cewgDataTextures: [
            { name: "sb5", kind: "structuredTexture", unit: 28, registerIndex: 5, strideBytes: 4, width: 2048 },
            { name: "sb6", kind: "structuredTexture", unit: 29, registerIndex: 6, strideBytes: 48, width: 2048 }
        ]
    };

    binder.ApplyPass(program, device);

    // Fallback list must match the viewport's tile layout: 1920x1080 -> 120x68 tiles
    const fallback = binder._fallbackLightList;
    assert(fallback instanceof CewgLightList, "fallback light list created");
    assert.strictEqual(fallback.GetTilesPerRow(), 120, "fallback tiles per row follows viewport width");
    assert.strictEqual(fallback.GetTilesPerCol(), 68, "fallback tiles per col follows viewport height");
    assert.strictEqual(fallback.GetBufferA()[fallback.GetListBase()], 0, "fallback draw list is the empty gate node");

    const images = findCalls(gl, "texImage2D");
    assert.strictEqual(images.length, 2, "both RGBA32UI textures allocated");
    const unitBinds = findCalls(gl, "activeTexture").map(c => c[1]);
    assert(unitBinds.includes(28) && unitBinds.includes(29), "sb textures bound on their assigned units");
    assert.strictEqual(unitBinds[unitBinds.length - 1], 0, "active texture restored to unit 0");
    assert.strictEqual(fallback.GetDirtyA(), null, "Buffer A dirty range cleared after upload");
    assert.strictEqual(fallback.GetDirtyB(), null, "Buffer B dirty range cleared after upload");

    // Second apply with nothing dirty: textures bound, nothing uploaded
    gl.calls.length = 0;
    binder.ApplyPass(program, device);
    assert.strictEqual(findCalls(gl, "texImage2D").length, 0, "no realloc on clean apply");
    assert.strictEqual(findCalls(gl, "texSubImage2D").length, 0, "no upload on clean apply");
    assert.strictEqual(findCalls(gl, "bindTexture").length, 2, "textures still bound on clean apply");
}

// --- scene-owned list: dirty rows -> texSubImage2D ----------------------------
{
    const gl = makeGl();
    const device = { gl, viewportWidth: 640, viewportHeight: 480 };
    const binder = CewgResourceBinder.Get(device);

    const list = new CewgLightList();
    list.SetScreenSize(640, 480);
    list.SetLights([ { position: [ 1, 2, 3 ], radius: 50, color: [ 1, 1, 1 ], flags: 0x10000, params: [ 0, 0, 0, 0 ] } ]);
    list.WriteDrawList([ 1 ]);
    binder.SetLightList(list);

    const program = {
        cewgUniformBlocks: [],
        cewgDataTextures: [
            { name: "sb5", kind: "structuredTexture", unit: 28, registerIndex: 5, strideBytes: 4, width: 2048 },
            { name: "sb6", kind: "structuredTexture", unit: 29, registerIndex: 6, strideBytes: 48, width: 2048 }
        ]
    };
    binder.ApplyPass(program, device);
    assert.strictEqual(findCalls(gl, "texImage2D").length, 2, "initial full alloc of both textures");

    // Mutate one light: only Buffer B rows should re-upload
    gl.calls.length = 0;
    list.SetLights([ { position: [ 9, 9, 9 ], radius: 25, color: [ 1, 0, 0 ], flags: 0x10000, params: [ 0, 0, 0, 0 ] } ]);
    binder.ApplyPass(program, device);
    assert.strictEqual(findCalls(gl, "texImage2D").length, 0, "no realloc for a data-only change");
    const subs = findCalls(gl, "texSubImage2D");
    assert.strictEqual(subs.length, 1, "exactly one dirty-row upload (Buffer B)");
    assert.strictEqual(subs[0][3], 1, "single dirty row uploaded");
}

// --- packed light-list data texture -------------------------------------------
{
    const gl = makeGl();
    const device = { gl, viewportWidth: 640, viewportHeight: 480 };
    const binder = CewgResourceBinder.Get(device);

    const list = new CewgLightList();
    list.SetScreenSize(640, 480);
    list.SetLights([ { position: [ 1, 2, 3 ], radius: 50, color: [ 1, 1, 1 ], flags: 0x10000, params: [ 0, 0, 0, 0 ] } ]);
    list.WriteDrawList([ 1 ]);
    binder.SetLightList(list);

    const program = {
        cewgUniformBlocks: [],
        cewgDataTextures: [
            {
                name: "cewgLocalLightTexture",
                kind: "structuredTexture",
                cewgSemantic: "packedLocalLights",
                unit: 28,
                registerIndex: 13,
                strideBytes: 0,
                width: 2048,
                dataTexelBase: 2048
            }
        ]
    };

    binder.ApplyPass(program, device);
    let images = findCalls(gl, "texImage2D");
    assert.strictEqual(images.length, 1, "packed path allocates one RGBA32UI texture");
    assert.strictEqual(images[0][2], 2048, "packed texture keeps the data texture width");
    assert.strictEqual(images[0][3], 2, "packed texture spans Buffer A plus Buffer B region");
    assert(findCalls(gl, "activeTexture").some(c => c[1] === 28), "packed texture binds on its assigned unit");
    assert.strictEqual(list.GetDirtyA(), null, "packed upload clears Buffer A dirty range");
    assert.strictEqual(list.GetDirtyB(), null, "packed upload clears Buffer B dirty range");

    gl.calls.length = 0;
    list.SetLights([ { position: [ 9, 9, 9 ], radius: 25, color: [ 1, 0, 0 ], flags: 0x10000, params: [ 0, 0, 0, 0 ] } ]);
    binder.ApplyPass(program, device);
    images = findCalls(gl, "texImage2D");
    assert.strictEqual(images.length, 0, "packed path does not reallocate for data-only changes");
    const subs = findCalls(gl, "texSubImage2D");
    assert.strictEqual(subs.length, 1, "packed path uploads one dirty Buffer B row");
    assert.strictEqual(subs[0][1], 1, "packed Buffer B dirty row is shifted by dataTexelBase");
}
// --- bufferTexture placeholder -------------------------------------------------
{
    const gl = makeGl();
    const device = { gl, viewportWidth: 100, viewportHeight: 100 };
    const binder = CewgResourceBinder.Get(device);

    const program = {
        cewgUniformBlocks: [],
        cewgDataTextures: [ { name: "bt0", kind: "bufferTexture", unit: 28, registerIndex: 0, strideBytes: 0, width: 2048 } ]
    };
    binder.ApplyPass(program, device);
    const floatAllocs = findCalls(gl, "texImage2D").filter(c => c[1] === "RGBA32F");
    assert.strictEqual(floatAllocs.length, 1, "unset bt register binds the 1x1 zero placeholder");

    // A registered source is bound instead
    gl.calls.length = 0;
    const source = { id: "postFxTexture" };
    binder.SetBufferTextureSource(0, source);
    binder.ApplyPass(program, device);
    assert(findCalls(gl, "bindTexture").some(c => c[2] === "postFxTexture"), "registered bt source is bound");
}

console.log("PASS: CewgResourceBinder — bone UBO staging/upload, stride-routed light textures, " +
    "fallback viewport list, dirty-row updates and bt placeholder all behave");
