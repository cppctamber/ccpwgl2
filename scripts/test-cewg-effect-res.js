/**
 * Regression test: Tw2EffectRes format fork — CEWG packages (first dword > 8,
 * "CEWG" magic) route to the new reader while legacy v8 WebGL binaries take
 * the untouched PrepareCCP path through the same extension.
 *
 * Fixtures:
 * - test/fixtures/quadv5.webgl.cewg  — JS-emitter package (480 permutations)
 * - test/fixtures/quadv5.gles2.sm_hi — legacy version-8 WebGL binary
 *
 * Structural test only (GL is stubbed): compiles/links are no-ops; asserts
 * cover format detection, permutation resolution, technique/pass/stage
 * construction, constants, samplers, attribute names and binding manifests.
 * Real compile/link coverage lives in hlslreader's validateCewgWebgl2 (672/672).
 */
const fs = require("fs");
const path = require("path");
const assert = require("assert");

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
for (const name of [ "WebGLShader", "WebGLProgram", "WebGLBuffer", "WebGLTexture", "WebGLFramebuffer",
    "WebGLRenderbuffer", "WebGLRenderingContext", "WebGL2RenderingContext", "WebGLUniformLocation",
    "WebGLVertexArrayObject", "WebGLActiveInfo", "HTMLCanvasElement", "HTMLImageElement", "Image",
    "OffscreenCanvas", "ImageBitmap", "Audio", "HTMLVideoElement", "XMLHttpRequest" ])
{
    if (!global[name]) global[name] = class {};
}

const bundlePath = process.env.CCPWGL_TEST_BUNDLE
    ? path.resolve(process.env.CCPWGL_TEST_BUNDLE)
    : path.join(__dirname, "../dist/ccpwgl2_int.js");
const { tw2 } = require(bundlePath);

const glStub = new Proxy({}, {
    get: (target, prop) =>
    {
        if (prop === "then") return undefined;
        if (prop === "getExtension") return () => null;
        if (typeof prop === "string" && /^[A-Z0-9_]+$/.test(prop)) return 1;
        return () => ({});
    }
});
Object.defineProperty(tw2.device, "gl", { value: glStub, configurable: true, writable: true });

const Tw2EffectRes = tw2.GetClass("Tw2EffectRes");

function loadRes(fixture)
{
    const bytes = fs.readFileSync(path.join(__dirname, "../test/fixtures", fixture));
    const res = new Tw2EffectRes();
    res.path = `test:/${fixture}`;
    res._extension = "sm_hi";
    res.Prepare(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
    return res;
}

// --- CEWG path ---------------------------------------------------------------
const cewg = loadRes("quadv5.webgl.cewg");
assert(!cewg._error, "CEWG package should prepare without error");
assert.strictEqual(cewg.version, 9, "CEWG resources report version 9 (first post-v8 format)");
assert.strictEqual(cewg.permutations.length, 7, "QuadV5 has 7 permutations");
assert(cewg._cewgFactory, "CEWG factory should be attached");

const defaultShader = cewg.GetShader({});
assert(defaultShader, "default permutation shader should build");
const techniqueNames = Object.keys(defaultShader.techniques).sort();
assert.deepStrictEqual(
    techniqueNames,
    [ "Depth", "DynamicLightShadow", "Main", "Picking", "Shadow" ].sort(),
    "all five techniques should be present"
);

const mainPass = defaultShader.techniques["Main"].passes[0];
assert(mainPass, "Main pass 0 should exist");
assert.strictEqual(mainPass.isCewg, true);
assert.strictEqual(mainPass.stages.length, 2);

const [ vertexStage, pixelStage ] = mainPass.stages;
assert(vertexStage.shaderCode.startsWith("#version 300 es"), "vertex GLSL should be load-ready");
assert(!vertexStage.shaderCode.includes("TEX_with_SMP"), "no legacy combined sampler names");
assert(vertexStage.inputDefinition.elements.length > 0, "vertex inputs should be declared");
for (const element of vertexStage.inputDefinition.elements)
{
    assert(/^in_[A-Z]+\d+$/.test(element._attr), `attribute should use semantic name, got ${element._attr}`);
}
assert(pixelStage.constants.length > 0, "pixel stage should carry effect constants");
assert(pixelStage.constants.some(c => c.name === "GeneralData"), "pixel constants include GeneralData");
assert(pixelStage.textures.length > 0, "pixel stage should carry textures");
assert(pixelStage.samplers.length === pixelStage.textures.length, "sampler per texture");
assert(Array.isArray(pixelStage.cewgBindings), "emitter bindings should ride on the stage");
assert(
    pixelStage.cewgBindings.some(b => b.kind === "constantBuffer"),
    "bindings include constant buffers"
);

// Permutation selection: transparency option selects a different body/shader.
const transparent = cewg.GetShader({ SPACE_OBJECT_TRANSPARENCY: "SOT_TRANSPARENT" });
assert(transparent, "transparent permutation shader should build");
assert.notStrictEqual(transparent, defaultShader, "different options should map to a different permutation");
const defaultIndex = cewg._cewgFactory.ResolvePermutationIndex({});
const transparentIndex = cewg._cewgFactory.ResolvePermutationIndex({ SPACE_OBJECT_TRANSPARENCY: "SOT_TRANSPARENT" });
assert.notStrictEqual(defaultIndex, transparentIndex);
assert.strictEqual(cewg.GetShader({}), defaultShader, "shader instances should be cached per permutation");

// Skinned package: bone UBO bindings and shader construction.
const skinned = loadRes("skinned_quadv5.webgl.cewg");
assert(!skinned._error, "skinned CEWG package should prepare without error");
const boneShader = skinned._cewg.glslSet.shaders.find(s => (s.bindings || []).some(b => b.kind === "structuredUbo"));
assert(boneShader, "skinned package should contain a structured-UBO (bones) shader");
const boneBinding = boneShader.bindings.find(b => b.kind === "structuredUbo");
assert.strictEqual(boneBinding.capacityElements, 69, "bone UBO capacity should be Carbon's 69-joint maximum");
assert.strictEqual(boneBinding.strideBytes, 48, "bone stride is a float4x3 row set");
assert(boneShader.source.includes(`${boneBinding.name}Block`), "bone UBO block should be declared in GLSL");
const skinnedShader = skinned.GetShader({});
assert(skinnedShader, "skinned default shader should build");
const skinnedVs = skinnedShader.techniques["Main"].passes[0].stages[0];
assert(skinnedVs.cewgBindings.some(b => b.kind === "structuredUbo"), "bone binding rides on the vertex stage");

// Vertex usage codes are Trinity's (Tr2VertexDefinition::UsageCode:
// BLENDINDICES=6, BLENDWEIGHTS=7). The legacy GLES-v8 convention had
// them swapped and is translated away at its readers, so CEWG elements
// carry the Carbon-correct value untouched.
const blendIndices = skinnedVs.inputDefinition.elements.find(e => e._attr === "in_BLENDINDICES0");
assert(blendIndices, "skinned vertex stage declares in_BLENDINDICES0");
assert.strictEqual(blendIndices.usage, 6, "BLENDINDICES uses Trinity's usage code (6)");

// Local cb0/cb7 allocation must not trust constantValueSize alone. Avatar
// packages can omit it while retaining an emitted declaration and named
// constants, so exercise both independent sizing sources in memory.
const declarationSized = loadRes("quadv5.webgl.cewg");
for (const body of declarationSized._cewg.metadata.bodies || [])
{
    for (const stage of body.manifest?.stages || [])
    {
        for (const binding of stage.bindings || [])
        {
            if (binding.kind === "constantBuffer" && binding.registerIndex === 0)
            {
                binding.carbon.constantValueSize = 0;
                binding.carbon.constants = [];
            }
        }
    }
}
const declarationShader = declarationSized.GetShader({});
const declarationStages = Object.values(declarationShader.techniques).flatMap(t => t.passes.flatMap(p => p.stages));
assert(declarationStages.some(stage => stage.constantSize > 0), "emitted cb declaration sizes local constants without defaults");

const constantSized = loadRes("quadv5.webgl.cewg");
for (const body of constantSized._cewg.metadata.bodies || [])
{
    for (const stage of body.manifest?.stages || [])
    {
        for (const binding of stage.bindings || [])
        {
            if (binding.kind === "constantBuffer" && binding.registerIndex === 0)
            {
                binding.carbon.constantValueSize = 0;
                binding.carbon.constants.push({ name: "SizingSentinel", offset: 1024, size: 16, dimension: 4, elements: 1 });
            }
        }
    }
}
const constantShader = constantSized.GetShader({});
const constantStages = Object.values(constantShader.techniques).flatMap(t => t.passes.flatMap(p => p.stages));
assert(constantStages.some(stage => stage.constantSize >= 260), "named constant extent expands the local constant array");

// Explicit decoded t#/s# use wins over the legacy equal-register inference.
const paired = loadRes("quadv5.webgl.cewg");
let pairedResourceRegister = null;
for (const shaderRecord of paired._cewg.glslSet.shaders || [])
{
    const resources = (shaderRecord.bindings || []).filter(binding => binding.kind === "resource");
    const resource = resources.find(binding => binding.registerIndex !== 0);
    if (resource)
    {
        resource.samplerRegisterIndex = 0;
        pairedResourceRegister = resource.registerIndex;
        break;
    }
}
assert.notStrictEqual(pairedResourceRegister, null, "fixture exposes a non-zero texture register for pairing test");
const pairedShader = paired.GetShader({});
const pairedStages = Object.values(pairedShader.techniques).flatMap(t => t.passes.flatMap(p => p.stages));
const pairedTexture = pairedStages.flatMap(stage => stage.textures).find(texture =>
    texture.registerIndex === pairedResourceRegister && texture._sampler?.registerIndex === 0
);
assert(pairedTexture, "explicit texture/sampler register pairing survives stage construction");
const Tw2Effect = tw2.GetClass("Tw2Effect");
const Tw2TextureParameter = tw2.GetClass("Tw2TextureParameter");
const pairedEffect = new Tw2Effect();
pairedEffect.shader = pairedShader;
pairedEffect.parameters[pairedTexture.name] = new Tw2TextureParameter(pairedTexture.name);
assert(pairedEffect.BindParameters(), "paired shader binds through Tw2Effect");
const pairedRuntimeTexture = Object.values(pairedEffect.techniques)
    .flatMap(passes => passes.flatMap(pass => pass.stages.flatMap(stage => stage.textures)))
    .find(texture => texture.slot === pairedResourceRegister);
assert.strictEqual(pairedRuntimeTexture?.sampler.registerIndex, 0, "Tw2Effect retains the paired sampler register");

// Program-side CEWG setup: the linked program resolves the bone block to
// a uniform-block binding point (SetupCewgResources, consumed at draw
// time by CewgResourceBinder).
const skinnedProgram = skinnedShader.techniques["Main"].passes[0].shaderProgram;
assert(Array.isArray(skinnedProgram.cewgUniformBlocks), "CEWG programs carry a uniform-block manifest");
assert(Array.isArray(skinnedProgram.cewgDataTextures), "CEWG programs carry a data-texture manifest");
assert.strictEqual(skinnedProgram.cewgUniformBlocks.length, 1, "skinned program resolves exactly the bone block");
assert.strictEqual(skinnedProgram.cewgUniformBlocks[0].bindingPoint, 0, "bone block gets binding point 0");
assert.strictEqual(skinnedProgram.cewgUniformBlocks[0].byteLength, 69 * 48, "bone block byteLength = capacity x stride");
const quadProgram = defaultShader.techniques["Main"].passes[0].shaderProgram;
assert(Array.isArray(quadProgram.cewgUniformBlocks), "unskinned CEWG program still carries (empty) manifests");

// Light-visualizer package: the only shipped pixel shader that reads a
// structured buffer (Buffer A, stride 4). Its program must resolve the
// sb# usampler2D to a data-texture unit above the legacy 0-27 range.
const lightcount = loadRes("lightcount.webgl.cewg");
assert(!lightcount._error, "lightcount CEWG package should prepare without error");
const lightShader = lightcount.GetShader({});
const lightTech = Object.keys(lightShader.techniques)[0];
const lightProgram = lightShader.techniques[lightTech].passes[0].shaderProgram;
const sbEntry = lightProgram.cewgDataTextures.find(t => t.kind === "structuredTexture");
assert(sbEntry, "lightcount program resolves its structured light texture");
assert.strictEqual(sbEntry.strideBytes, 4, "lightcount reads Buffer A (index buffer, stride 4)");
assert(sbEntry.unit >= 28, "data textures sit above the legacy s/vs unit range");

// Post-fx package: pixel Buffer<> becomes a bt# RGBA32F data texture.
const lensgrime = loadRes("lensgrime.webgl.cewg");
assert(!lensgrime._error, "lensgrime CEWG package should prepare without error");
const grimeShader = lensgrime.GetShader({});
const grimeTech = Object.keys(grimeShader.techniques)[0];
const grimeProgram = grimeShader.techniques[grimeTech].passes[0].shaderProgram;
const btEntry = grimeProgram.cewgDataTextures.find(t => t.kind === "bufferTexture");
assert(btEntry, "lensgrime program resolves its Buffer<> emulation texture");

// --- Legacy path -------------------------------------------------------------
const legacy = loadRes("quadv5.gles2.sm_hi");
assert.strictEqual(legacy.version, 8, "legacy binary should read as version 8 via PrepareCCP");
assert.strictEqual(legacy._cewgFactory, null, "legacy path must not build a CEWG factory");
const legacyShader = legacy.GetShader({});
assert(legacyShader, "legacy shader should still build through GetShaderCCP");
const legacyTechName = Object.keys(legacyShader.techniques)[0];
const legacyProgram = legacyShader.techniques[legacyTechName].passes[0].shaderProgram;
assert.strictEqual(legacyProgram.cewgUniformBlocks, undefined, "legacy programs get no CEWG manifests");

console.log(`PASS: CEWG fork — v9 package (7 permutations, ${techniqueNames.length} techniques, ` +
    `${pixelStage.constants.length} pixel constants) and legacy v8 both load through Tw2EffectRes`);
