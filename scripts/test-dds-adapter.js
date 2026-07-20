/* eslint-env node */
const assert = require("node:assert/strict");
const path = require("node:path");

global.window = global;
global.self = global;
global.navigator = { userAgent: "node" };
global.document = {
    createElement: () => ({ getContext: () => null, style: {}, addEventListener: () => {} }),
    addEventListener: () => {},
    removeEventListener: () => {}
};
global.location = { search: "", href: "http://localhost/", protocol: "http:", hostname: "localhost" };
global.requestAnimationFrame = fn => setTimeout(fn, 16);
global.addEventListener = () => {};
global.removeEventListener = () => {};

global.WebGLRenderingContext = class WebGLRenderingContext {};
global.WebGL2RenderingContext = class WebGL2RenderingContext {};
for (const name of [ "WebGLShader", "WebGLProgram", "WebGLBuffer", "WebGLTexture", "WebGLFramebuffer",
    "WebGLRenderbuffer", "WebGLUniformLocation", "WebGLVertexArrayObject", "WebGLActiveInfo", "HTMLCanvasElement",
    "HTMLImageElement", "Image", "OffscreenCanvas", "ImageBitmap", "Audio", "HTMLVideoElement", "XMLHttpRequest" ])
{
    if (!global[name]) global[name] = class {};
}

const { tw2 } = require(path.resolve(__dirname, "../dist/ccpwgl2_int.js"));
const TextureFormatDDS = tw2.GetClass("Tw2TextureRes").GetFormat("dds");

function createGl(nativeBc1)
{
    const calls = [];
    const gl = new global.WebGL2RenderingContext();
    Object.assign(gl, {
        TEXTURE_2D: 0x0de1,
        TEXTURE_CUBE_MAP: 0x8513,
        TEXTURE_CUBE_MAP_POSITIVE_X: 0x8515,
        UNPACK_ALIGNMENT: 0x0cf5,
        UNSIGNED_BYTE: 0x1401,
        FLOAT: 0x1406,
        HALF_FLOAT: 0x140b,
        RGBA: 0x1908,
        RGB: 0x1907,
        RED: 0x1903,
        RG: 0x8227,
        R8: 0x8229,
        RG8: 0x822b,
        R16F: 0x822d,
        R32F: 0x822e,
        RG32F: 0x8230,
        RGB32F: 0x8815,
        RGBA16F: 0x881a,
        RGBA32F: 0x8814,
        SRGB8_ALPHA8: 0x8c43,
        createTexture: () => ({}),
        deleteTexture: () => {},
        bindTexture: () => {},
        getParameter: () => 4,
        pixelStorei: () => {},
        compressedTexImage2D: (...args) => calls.push([ "compressed", ...args ]),
        texImage2D: (...args) => calls.push([ "rgba", ...args ]),
        getExtension: name => nativeBc1 && name.includes("compressed_texture_s3tc")
            ? {
                COMPRESSED_RGBA_S3TC_DXT1_EXT: 0x83f1,
                COMPRESSED_RGBA_S3TC_DXT3_EXT: 0x83f2,
                COMPRESSED_RGBA_S3TC_DXT5_EXT: 0x83f3
            }
            : null
    });
    return { gl, calls };
}

function makeBc1Dds(cube = false)
{
    const block = [ 0x00, 0xf8, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 ];
    const bytes = new Uint8Array(128 + block.length * (cube ? 6 : 1));
    const view = new DataView(bytes.buffer);
    bytes.set([ 0x44, 0x44, 0x53, 0x20 ]);
    view.setUint32(4, 124, true);
    view.setUint32(12, 4, true);
    view.setUint32(16, 4, true);
    view.setUint32(28, 1, true);
    view.setUint32(80, 4, true);
    bytes.set([ 0x44, 0x58, 0x54, 0x31 ], 84);
    if (cube) view.setUint32(112, 0xfe00, true);
    for (let face = 0; face < (cube ? 6 : 1); face++) bytes.set(block, 128 + face * block.length);
    return bytes.buffer;
}

function makeBc7Dds()
{
    const bytes = new Uint8Array(164);
    const view = new DataView(bytes.buffer);
    bytes.set([ 0x44, 0x44, 0x53, 0x20 ]);
    view.setUint32(4, 124, true);
    view.setUint32(12, 4, true);
    view.setUint32(16, 4, true);
    view.setUint32(28, 1, true);
    view.setUint32(80, 4, true);
    bytes.set([ 0x44, 0x58, 0x31, 0x30 ], 84);
    view.setUint32(128, 98, true);
    view.setUint32(132, 3, true);
    view.setUint32(140, 1, true);
    bytes.set([
        0xc0, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x7f,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ], 148);
    return bytes.buffer;
}

function makeBc6Dds()
{
    const bytes = new Uint8Array(164);
    const view = new DataView(bytes.buffer);
    bytes.set([ 0x44, 0x44, 0x53, 0x20 ]);
    view.setUint32(4, 124, true);
    view.setUint32(12, 4, true);
    view.setUint32(16, 4, true);
    view.setUint32(28, 1, true);
    view.setUint32(80, 4, true);
    bytes.set([ 0x44, 0x58, 0x31, 0x30 ], 84);
    view.setUint32(128, 96, true);
    view.setUint32(132, 3, true);
    view.setUint32(140, 1, true);

    // BC6H mode 11, two equal signed 10-bit endpoints (-256).
    writeBits(bytes, 148 * 8, 5, 0x03);
    for (const offset of [ 5, 15, 25, 35, 45, 55 ])
    {
        writeBits(bytes, 148 * 8 + offset, 10, 0x300);
    }
    return bytes.buffer;
}

function writeBits(bytes, offset, count, value)
{
    for (let bit = 0; bit < count; bit++)
    {
        bytes[(offset + bit) >>> 3] |= ((value >>> bit) & 1) << ((offset + bit) & 7);
    }
}

function prepare(nativeBc1, cube = false)
{
    const { gl, calls } = createGl(nativeBc1);
    tw2.device.gl = gl;
    tw2.device._extensions = {};
    const resource = {};
    TextureFormatDDS.Prepare(resource, gl, makeBc1Dds(cube));
    return { resource, calls };
}

const fallback = prepare(false);
assert.equal(fallback.calls.length, 1);
assert.equal(fallback.calls[0][0], "rgba");
assert.ok(fallback.calls[0][9] instanceof Uint8Array);
assert.deepEqual(Array.from(fallback.calls[0][9].slice(0, 4)), [ 255, 0, 0, 255 ]);

const fallbackCube = prepare(false, true);
assert.equal(fallbackCube.calls.length, 6);
assert.deepEqual(fallbackCube.calls.map(call => call[1]), [ 0x8515, 0x8516, 0x8517, 0x8518, 0x8519, 0x851a ]);
assert.ok(fallbackCube.calls.every(call => call[9] instanceof Uint8Array && call[9][0] === 255));

const native = prepare(true);
assert.equal(native.calls.length, 1);
assert.equal(native.calls[0][0], "compressed");
assert.equal(native.calls[0][7].byteLength, 8);

const bc7Gl = createGl(false);
tw2.device.gl = bc7Gl.gl;
tw2.device._extensions = {};
const previousBuffer = global.Buffer;
global.Buffer = undefined;
try
{
    TextureFormatDDS.Prepare({}, bc7Gl.gl, makeBc7Dds());
}
finally
{
    global.Buffer = previousBuffer;
}
assert.equal(bc7Gl.calls.length, 1);
assert.equal(bc7Gl.calls[0][0], "rgba");
assert.deepEqual(Array.from(bc7Gl.calls[0][9].slice(0, 4)), [ 254, 254, 254, 254 ]);

const bc6Gl = createGl(false);
tw2.device.gl = bc6Gl.gl;
tw2.device._extensions = {};
TextureFormatDDS.Prepare({}, bc6Gl.gl, makeBc6Dds());
assert.equal(bc6Gl.calls.length, 1);
assert.equal(bc6Gl.calls[0][0], "rgba");
assert.equal(bc6Gl.calls[0][8], bc6Gl.gl.FLOAT);
assert.ok(bc6Gl.calls[0][9] instanceof Float32Array);
assert.deepEqual(Array.from(bc6Gl.calls[0][9].slice(0, 4)), [ -1.5302734375, -1.5302734375, -1.5302734375, 1 ]);

console.log("DDS adapter tests passed");
