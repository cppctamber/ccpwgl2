const fs = require("fs");
const path = require("path");
const assert = require("assert");

const root = path.resolve(__dirname, "..");

function read(relativePath)
{
    return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function includes(file, text, message)
{
    assert(file.includes(text), message || `Expected source to include ${text}`);
}

function notIncludes(file, text, message)
{
    assert(!file.includes(text), message || `Expected source not to include ${text}`);
}

function test(name, fn)
{
    try
    {
        fn();
        console.log(`ok - ${name}`);
    }
    catch (err)
    {
        console.error(`not ok - ${name}`);
        console.error(err.stack || err.message || err);
        process.exitCode = 1;
    }
}

test("TEX_VOLUME maps to GL_TEXTURE_3D", () =>
{
    const source = read("src/global/constant/d3d.js");
    includes(source, "GL_TEXTURE_3D");
    includes(source, "export const TEX_VOLUME =  3;");
    includes(source, "[TEX_VOLUME] : GL_TEXTURE_3D");
    notIncludes(source, "[TEX_VOLUME] : GL_TEXTURE_2D");
});

test("device exposes a 3D fallback texture", () =>
{
    const source = read("src/core/engine/Tw2Device.js");
    includes(source, "_fallbackVolume");
    includes(source, "GetFallbackVolumeTexture()");
    includes(source, "CreateSolidVolumeTexture");
    includes(source, "gl.TEXTURE_3D");
    includes(source, "gl.texImage3D");
    includes(source, "gl.TEXTURE_WRAP_R");
});

test("texture resource binds 3D fallback textures", () =>
{
    const source = read("src/core/resource/Tw2TextureRes.js");
    includes(source, "this._target === gl.TEXTURE_3D");
    includes(source, "d.GetFallbackVolumeTexture()");
});

test("HTML textures reject volume targets instead of pretending they are 2D", () =>
{
    const source = read("src/core/resource/formats/TextureFormatHTML.js");
    includes(source, "case TEX_VOLUME:");
    includes(source, "ErrResourceFormatNotImplemented");
    includes(source, "HTML->Volume");
});

test("effect and shader binary decoders are chunk-safe", () =>
{
    const effectRes = read("src/core/resource/Tw2EffectRes.js");
    const shaderStage = read("src/core/shader/Tw2ShaderStage.js");

    includes(effectRes, "function BytesToString(bytes)");
    includes(shaderStage, "function BytesToString(bytes)");
    includes(effectRes, "BytesToString(reader.data.subarray");
    includes(shaderStage, "BytesToString(shaderCode)");
    notIncludes(shaderStage, "String.fromCharCode.apply(null, shaderCode)");
});

test("DDS reader uploads volume textures as native 3D textures", () =>
{
    const source = read("src/core/resource/formats/TextureFormatDDS.js");
    includes(source, "this.PrepareVolume3D(res, gl, arrayBuffer, info)");
    includes(source, "PrepareVolume3D(res, gl, arrayBuffer, info)");
    includes(source, "res._target = gl.TEXTURE_3D");
    includes(source, "gl.texImage3D");
    includes(source, "Compressed volume DDS not supported");
    notIncludes(source, "this.PrepareVolumeAtlas(res, gl, arrayBuffer, info)");
});

test("DDS volume upload preserves float and half-float typed arrays", () =>
{
    const source = read("src/core/resource/formats/TextureFormatDDS.js");
    includes(source, "let totalElements = 0;");
    includes(source, "const DataArray = slices[0] ? slices[0].constructor : Uint8Array;");
    includes(source, "const pixels = new DataArray(totalElements);");
    includes(source, "pixels.set(slice, targetOffset);");
    includes(source, "pixels");
    notIncludes(source, "const bytes = new Uint8Array(totalSize);");
});

test("DDS reader recognizes legacy float FOURCC formats", () =>
{
    const source = read("src/core/resource/formats/TextureFormatDDS.js");
    [
        "D3DFMT_R16F",
        "D3DFMT_G16R16F",
        "D3DFMT_A16B16G16R16F",
        "D3DFMT_R32F",
        "D3DFMT_G32R32F",
        "D3DFMT_A32B32G32R32F"
    ].forEach(name => includes(source, name));
    includes(source, "SetLegacyFloat(info, name, gl, channels, bits)");
    includes(source, "info.isFloat = true;");
    includes(source, "new Float32Array(arrayBuffer, offset, srcSize >> 2)");
    includes(source, "new Uint16Array(arrayBuffer, offset, srcSize >> 1)");
});

if (process.exitCode)
{
    process.exit(process.exitCode);
}
