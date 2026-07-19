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

test("experimental batch context is exposed in config", () =>
{
    const configSource = read("src/config.js");
    includes(configSource, "enableExperimentalBatchContext");
    includes(configSource, "// Enables experimental Carbon-shaped render batch context");
    includes(configSource, "enableExperimentalShadows");
});

test("experimental batch context is wired into Tw2Library", () =>
{
    const source = read("src/core/engine/Tw2Library.js");
    includes(source, "enableExperimentalBatchContext = false;");
    includes(source, "opt.enableExperimentalBatchContext");
    includes(source, "Register(opt)");
});

test("batch context exports are available", () =>
{
    const source = read("src/core/batch/index.js");
    includes(source, "Tw2RenderBatchContext");
    includes(source, "Tw2RenderBatchAccumulator");
    const contextSource = read("src/core/batch/Tw2RenderBatchContext.js");
    includes(contextSource, "class Tw2RenderBatchContext");
    includes(contextSource, "GetRenderPacket(object, mode, options = {})");
    includes(contextSource, "GetCurrentRenderPacket()");
    includes(contextSource, "GetObjectRenderPayload(object, mode, context = {})");
    includes(contextSource, "NormalizeOptions(options = {})");
    includes(contextSource, "CollectObjectBatches(object, modes, options = {})");
    includes(contextSource, "ResolvePerObjectData(batch");
    includes(contextSource, "if (batch && batch.perObjectData)");
    includes(contextSource, "ShouldCommitBatch(batch, accumulator)");
    const accumulatorSource = read("src/core/batch/Tw2RenderBatchAccumulator.js");
    includes(accumulatorSource, "GetCurrentRenderPacket()");
    includes(accumulatorSource, "GetCurrentPerObjectData()");
});

test("EveSpaceScene batches can be collected and rendered through context", () =>
{
    const source = read("src/eve/EveSpaceScene.js");
    includes(source, "GetBatchContext(create = true)");
    includes(source, "GetBatchContextWriter()");
    includes(source, "AddWriter(this.GetBatchContextWriter())");
    includes(source, "CollectObjectBatches(object, mode, accumulator = this._accumulator)");
    includes(source, "RenderCollectedBatches(accumulator = this._accumulator)");
    includes(source, "const useBatchContext = !!tw2.enableExperimentalBatchContext;");
    includes(source, "!batch.perObjectData && batch.source");
    includes(source, "_batchContext");
});

test("Depth pass supports experimental batch-context collection", () =>
{
    const source = read("src/eve/EveSpaceScene.js");
    includes(source, "GetDepthContext(create = true)");
    includes(source, "RenderDepthWithBatchContext(dt, force)");
    includes(source, "GetDepthContextReport()");
    includes(source, "const useBatchContext = !!tw2.enableExperimentalBatchContext;");
    includes(source, "depthContext.Clear();");
    includes(source, "collect(objectsOrderedByDistance, RM_DECAL, \"Depth\")");
    notIncludes(source, "collect(objectsOrderedByDistance, RM_OPAQUE, \"Normal\")");
    includes(source, "techniqueOverride: \"Main\"");
});

test("Distortion pass supports experimental batch-context collection", () =>
{
    const source = read("src/eve/EveSpaceScene.js");
    includes(source, "GetDistortionContext(create = true)");
    includes(source, "RenderDistortionWithBatchContext(dt)");
    includes(source, "PrepareDistortionPass()");
    includes(source, "GetDistortionContextReport()");
    includes(source, "distortionContext.Clear();");
    includes(source, "distortionContext.CollectObjectArrayBatches(this.objectsByDistance, RM_DISTORTION, {");
    includes(source, "techniqueOverride: \"Main\"");
    includes(source, "distortionContext.Render();");
});

test("runtime exposes render debug overlay helper", () =>
{
    const runtimeIndex = read("src/runtime/index.js");
    const debugIndex = read("src/runtime/debug/index.js");
    const overlaySource = read("src/runtime/debug/TnyRenderDebugOverlay.js");
    includes(runtimeIndex, "export * from \"./debug\";");
    includes(debugIndex, "TnyRenderDebugOverlay");
    includes(overlaySource, "class TnyRenderDebugOverlay");
    includes(overlaySource, "AddScenePasses(scene");
    includes(overlaySource, "RenderTexture(texture)");
    includes(overlaySource, "SetMode(mode = \"all\")");
    includes(overlaySource, "static Install(options = {})");
    includes(overlaySource, "labelPlacement = \"above\"");
    includes(overlaySource, "GetSlotHeaderHeight(slot");
});

test("Picker supports experimental batch-context rendering", () =>
{
    const source = read("src/core/Tw2Picker.js");
    includes(source, "this.GetContext()");
    includes(source, "context.CollectObjectArrayBatches(objects, RM_OPAQUE, {");
    includes(source, "RenderContext(context, this.technique, pickable);");
    includes(source, "GetContext(create = true)");
    includes(source, "RenderContext(context, technique = \"Main\"");
    includes(source, "!batch.perObjectData && batch.source");
});

test("EveShip2 exposes per-object batch context hooks", () =>
{
    const source = read("src/eve/object/EveShip2.js");
    includes(source, "GetPerObjectData(_mode, _context = {})");
    includes(source, "GetRenderPayload(mode, _context = {})");
    includes(source, "legacyPerObjectData: this._perObjectData");
    includes(source, "GetBatchesForMode(mode, accumulator, perObjectData = this._perObjectData");
    includes(source, "return this.GetBatches(mode, accumulator, perObjectData || this._perObjectData)");
});

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

test("managed interior avatar shaders repair dynamic fragment loop bounds", () =>
{
    const shaderStage = read("src/core/shader/Tw2ShaderStage.js");
    includes(shaderStage, "fixFragmentLoopCounts(code, fileName, path)");
    includes(shaderStage, "isInteriorAvatarShaderPath(path)");
    includes(shaderStage, "/\\/managed\\/interior\\/avatar\\//i");
});

test("shader failures report context and allocation diagnostics", () =>
{
    const shaderStage = read("src/core/shader/Tw2ShaderStage.js");
    includes(shaderStage, "getShaderFailureDetails(gl, null, shaderCode)");
    includes(shaderStage, "WebGL context lost");
    includes(shaderStage, "shaderCreated=${!!shader}");
    includes(shaderStage, "glError=0x${Number(glError || 0).toString(16)}");
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

test("shader quality names map to the correct compiled tiers", () =>
{
    const constants = read("src/global/constant/ccpwgl.js");
    const config = read("src/config.js");

    includes(constants, "HIGH: \"depth\"");
    includes(constants, "MEDIUM: \"hi\"");
    includes(constants, "LOW: \"lo\"");
    includes(config, "\"shaderQuality\": DeviceShaderQuality.MEDIUM");
});

test("Tw2Device protects authored effect paths with registered profiles", () =>
{
    const source = read("src/core/engine/Tw2Device.js");

    includes(source, "static EffectProfiles = {");
    includes(source, "\"effect.gles2\": \"/effect.gles2/\"");
    includes(source, "\"effect.webgl2\": \"/effect.webgl2/\"");
    includes(source, "SetEffectProfile(profile)");
    includes(source, "this.effectDir = this.constructor.EffectProfiles[normalized]");
    includes(source, "replace(\"/effect/\", this.effectDir)");
});

if (process.exitCode)
{
    process.exit(process.exitCode);
}
