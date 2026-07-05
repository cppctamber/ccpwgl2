/**
 * Regression test: black-format Tr2Effect option and samplerOverride parsing.
 *
 * Fixture: test/fixtures/as6_breacheroidfx_01a.black — production data
 * (res:/dx9/model/celestial/environment/rock/asteroidset_06, TQ build
 * 3421648). Contains 24 Tr2Effect instances: 20 with options and 2 with a
 * DiffuseMapSampler samplerOverride (56-byte Carbon Sampler::Save layout).
 *
 * Runs against dist/ccpwgl2_int.js — rebuild before testing source changes.
 * Usage: npm run test:black-sampler-override
 */
const fs = require("fs");
const path = require("path");
const assert = require("assert");

// Browser shims for the UMD bundle's import-time expectations.
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

const { tw2 } = require("../dist/ccpwgl2_int.js");

// GL stub so geometry construction during the read doesn't explode.
const glStub = new Proxy({}, {
    get: (target, prop) =>
    {
        if (prop === "then") return undefined;
        if (typeof prop === "string" && /^[A-Z0-9_]+$/.test(prop)) return 1;
        return () => ({});
    }
});
Object.defineProperty(tw2.device, "gl", { value: glStub, configurable: true, writable: true });

const Tw2BlackReader = tw2.GetClass("Tw2BlackReader");
const fixture = path.join(__dirname, "../test/fixtures/as6_breacheroidfx_01a.black");
const bytes = fs.readFileSync(fixture);
const reader = new Tw2BlackReader(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
const root = reader.Construct();

// Walk the object graph collecting effects.
const effects = [];
const seen = new Set();
(function walk(node)
{
    if (!node || typeof node !== "object" || seen.has(node)) return;
    seen.add(node);
    if (node.constructor && /Effect$/.test(node.constructor.name) && node.options !== undefined)
    {
        effects.push(node);
    }
    for (const key of Object.keys(node))
    {
        const value = node[key];
        if (Array.isArray(value)) value.forEach(walk);
        else if (value && typeof value === "object") walk(value);
    }
})(root);

// --- Options ---------------------------------------------------------------
const withOptions = effects.filter(e => Object.keys(e.options || {}).length > 0);
assert(effects.length >= 20, `expected >=20 effects, got ${effects.length}`);
assert(withOptions.length >= 15, `expected >=15 effects with options, got ${withOptions.length}`);
const clipped = withOptions.find(e => e.options["SPACE_OBJECT_CLIPPING"] === "SOC_ENABLED");
assert(clipped, "expected an effect with SPACE_OBJECT_CLIPPING=SOC_ENABLED");
assert(
    clipped.options["SPACE_OBJECT_CLIPPING_TYPE"] === "SOCT_DISSOLVE_ALL_OVER",
    "expected SOCT_DISSOLVE_ALL_OVER clipping type"
);

// --- Sampler overrides (Carbon Sampler::Save layout, 56 bytes) --------------
const withOverrides = effects.filter(e => Object.keys(e.samplerOverrides || {}).length > 0);
assert(withOverrides.length === 2, `expected 2 effects with samplerOverrides, got ${withOverrides.length}`);
for (const effect of withOverrides)
{
    const override = effect.samplerOverrides["DiffuseMapSampler"];
    assert(override, "expected a DiffuseMapSampler override");
    assert.strictEqual(override.name, "DiffuseMapSampler");
    assert.strictEqual(override.comparison, 0);
    assert.strictEqual(override.filterMode, 3, "minFilter should be 3 (anisotropic)");
    assert.strictEqual(override.magFilterMode, 3, "magFilter should be 3 (anisotropic)");
    assert.strictEqual(override.mipFilterMode, 1);
    assert.strictEqual(override.addressUMode, 2, "addressU should be 2 (clamp)");
    assert.strictEqual(override.addressVMode, 2, "addressV should be 2 (clamp)");
    assert.strictEqual(override.addressWMode, 0, "addressW should be 0 (wrap)");
    assert.strictEqual(override.lodBias, 0);
    assert.strictEqual(override.maxAnisotropy, 4);
    assert.strictEqual(override.comparisonFunc, 0);
}

console.log(`PASS: ${effects.length} effects, ${withOptions.length} with options, ` +
    `${withOverrides.length} with correctly parsed DiffuseMapSampler overrides`);
