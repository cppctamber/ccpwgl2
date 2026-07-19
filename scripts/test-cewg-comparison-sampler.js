/**
 * Regression test: CEWG comparison samplers opt into WebGL depth comparison
 * while ordinary/legacy samplers explicitly retain TEXTURE_COMPARE_MODE NONE.
 */
const path = require("path");
const fs = require("fs");
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
const Tw2SamplerState = tw2.GetClass("Tw2SamplerState");

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

function makeDevice()
{
    const calls = [];
    const gl = {
        TEXTURE_2D: 0x0DE1,
        TEXTURE_WRAP_S: 0x2802,
        TEXTURE_WRAP_T: 0x2803,
        TEXTURE_MIN_FILTER: 0x2801,
        TEXTURE_MAG_FILTER: 0x2800,
        TEXTURE_COMPARE_MODE: 0x884C,
        TEXTURE_COMPARE_FUNC: 0x884D,
        COMPARE_REF_TO_TEXTURE: 0x884E,
        NONE: 0,
        NEVER: 0x0200,
        LESS: 0x0201,
        EQUAL: 0x0202,
        LEQUAL: 0x0203,
        GREATER: 0x0204,
        NOTEQUAL: 0x0205,
        GEQUAL: 0x0206,
        ALWAYS: 0x0207,
        CLAMP_TO_EDGE: 0x812F,
        texParameteri: (target, pname, value) => calls.push([ target, pname, value ]),
        texParameterf: () => {}
    };
    return {
        calls,
        gl,
        GetExtension: () => null,
        enableAnisotropicFiltering: false
    };
}

const comparison = Tw2SamplerState.fromJSON({
    samplerType: 0x0DE1,
    comparison: true,
    comparisonFunc: 5
});
const comparisonDevice = makeDevice();
comparison.Apply(comparisonDevice, true, false);
assert(comparisonDevice.calls.some(call =>
    call[1] === comparisonDevice.gl.TEXTURE_COMPARE_MODE &&
    call[2] === comparisonDevice.gl.COMPARE_REF_TO_TEXTURE
));
assert(comparisonDevice.calls.some(call =>
    call[1] === comparisonDevice.gl.TEXTURE_COMPARE_FUNC &&
    call[2] === comparisonDevice.gl.GREATER
));

const ordinary = Tw2SamplerState.fromJSON({ samplerType: 0x0DE1 });
const ordinaryDevice = makeDevice();
ordinary.Apply(ordinaryDevice, true, false);
assert(ordinaryDevice.calls.some(call =>
    call[1] === ordinaryDevice.gl.TEXTURE_COMPARE_MODE &&
    call[2] === ordinaryDevice.gl.NONE
));
assert(!ordinaryDevice.calls.some(call => call[1] === ordinaryDevice.gl.TEXTURE_COMPARE_FUNC));

const Tw2SamplerOverride = tw2.GetClass("Tw2SamplerOverride");
const samplerOverride = new Tw2SamplerOverride();
const overriddenOrdinary = samplerOverride.GetSampler(ordinary);
assert.equal(overriddenOrdinary.comparison, false);
overriddenOrdinary.ComputeHash();
const ordinaryHash = overriddenOrdinary.hash;
const overriddenComparison = samplerOverride.GetSampler(comparison);
assert.equal(overriddenComparison.comparison, true, "cached override refreshes comparison mode from a new base sampler");
assert.equal(overriddenComparison.comparisonFunc, 5, "cached override refreshes the comparison function");
assert.notEqual(overriddenComparison.hash, ordinaryHash, "refresh invalidates the cached GL sampler hash");

// CEWG reader propagation: opt emitted resource bindings into comparison
// mode and confirm their paired Carbon comparison function reaches runtime.
const Tw2EffectRes = tw2.GetClass("Tw2EffectRes");
const bytes = fs.readFileSync(path.join(__dirname, "../test/fixtures/quadv5.webgl.cewg"));
const res = new Tw2EffectRes();
res.path = "test:/quadv5.webgl.cewg";
res._extension = "sm_hi";
res.Prepare(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
for (const shaderRecord of res._cewg.glslSet.shaders || [])
{
    for (const binding of shaderRecord.bindings || [])
    {
        if (binding.kind === "resource") binding.comparison = true;
    }
}
for (const body of res._cewg.metadata.bodies || [])
{
    for (const stage of body.manifest?.stages || [])
    {
        for (const binding of stage.bindings || [])
        {
            if (binding.kind === "sampler" && binding.carbon?.sampler)
            {
                binding.carbon.sampler.comparisonFunc = 5;
            }
        }
    }
}
const shader = res.GetShader({});
const comparisonSamplers = Object.values(shader.techniques)
    .flatMap(technique => technique.passes.flatMap(pass => pass.stages.flatMap(stage => stage.samplers)))
    .filter(sampler => sampler.comparison);
assert(comparisonSamplers.length > 0, "CEWG comparison binding reaches stage samplers");
assert(comparisonSamplers.some(sampler => sampler.comparisonFunc === 5), "Carbon comparison function reaches runtime sampler");

const multiple = new Tw2EffectRes();
multiple.path = "test:/quadv5-multiple-samplers.webgl.cewg";
multiple._extension = "sm_hi";
multiple.Prepare(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
const multiResource = multiple._cewg.glslSet.shaders
    .flatMap(record => record.bindings || [])
    .find(binding => binding.kind === "resource");
assert(multiResource, "fixture exposes a CEWG texture resource");
multiResource.samplerRegisterIndices = [ 0, 1 ];
const originalConsole = {
    error: console.error,
    warn: console.warn,
    log: console.log
};
let multipleShader;
try
{
    console.error = () => {};
    console.warn = () => {};
    console.log = () => {};
    multipleShader = multiple.GetShader({});
}
finally
{
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
    console.log = originalConsole.log;
}
assert.equal(multipleShader, null, "unsupported multi-sampler texture use fails explicitly");

console.log("CEWG comparison-sampler regression tests passed");
