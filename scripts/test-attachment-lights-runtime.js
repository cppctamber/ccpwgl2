/**
 * Attachment lights, RUNTIME behaviour - 2026-08-21.
 *
 * This exists because every other test around this feature reads SOURCE TEXT,
 * and a source check cannot see a constructor throw. CjsLightData defaulted its
 * colour with vec4.createLinear(), which ccpwgl did not have, so merely
 * CONSTRUCTING a light threw. SetupPlaneSetLights is called from SetupPlaneSets,
 * and SetupSpriteSets runs immediately after it, so that throw took out sprite
 * sets, decals, boosters, locators and children as well - the light code broke
 * things that have nothing to do with lights.
 *
 * NOTE this exercises dist/, so it proves the LAST BUILD. Rebuild before trusting it.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const bundle = path.resolve(__dirname, "../dist/ccpwgl2_int.js");
if (!fs.existsSync(bundle))
{
    console.log("Attachment light runtime skipped - no dist build");
    process.exit(0);
}

stubBrowser();
const mod = require(bundle);
const tw2 = mod.tw2 || mod.default || mod;

testLightDataConstructs();
testDerivedRadiusSurvivesStorage();
console.log("Attachment light runtime verified");

/** The regression itself: constructing a light must not throw. */
function testLightDataConstructs()
{
    const CjsLightData = tw2.GetClass("CjsLightData");
    const data = new CjsLightData();
    assert.equal(data.color[3], 1, "a colour defaults to OPAQUE alpha, not transparent");
    assert.equal(data.radius, 0, "a lights own radius still defaults to 0 (Fenris)");
}

/** radius = outerScaleMultiplier * scale, and it must survive being stored. */
function testDerivedRadiusSurvivesStorage()
{
    const attachment = tw2.GetClass("EveSOFDataPointLightAttachment").from({});
    const derived = attachment.AsLightData([ 1, 0.5, 0.25, 1 ], 3);

    assert.equal(derived.radius, 6, "outer 2 x scale 3");
    assert.equal(derived.innerRadius, 3, "inner 1 x scale 3");
    assert.equal(derived.brightness, 1, "brightness is intensity");

    // AddLightFromSOF passes through Model.from, which round trips values - the
    // derived radii must not be dropped on the way in.
    const set = tw2.GetClass("EvePlaneSet").from({ name: "t" });
    set.AddLightFromSOF({ lightData: derived, saturation: 1, index: 0, fadeType: 0, blinkPhase: 0, blinkRate: 0 });

    assert.equal(set.lights.length, 1, "the light must be stored");
    assert.equal(set.lights[0].lightData.radius, 6, "the derived radius must survive storage");
    assert.equal(set.lights[0].lightData.innerRadius, 3, "and so must the inner radius");
}

function stubBrowser()
{
    global.window = global;
    global.self = global;
    global.navigator = { userAgent: "node" };
    global.document = {
        baseURI: "http://localhost/",
        createElement: () => ({ getContext: () => null, style: {}, addEventListener: () => {} }),
        addEventListener: () => {},
        removeEventListener: () => {}
    };
    global.location = { search: "", href: "http://localhost/", protocol: "http:", hostname: "localhost" };
    global.requestAnimationFrame = fn => setTimeout(fn, 16);
    global.addEventListener = () => {};
    global.removeEventListener = () => {};

    const names = [ "WebGLShader", "WebGLProgram", "WebGLBuffer", "WebGLTexture", "WebGLFramebuffer",
        "WebGLRenderbuffer", "WebGLRenderingContext", "WebGL2RenderingContext", "WebGLUniformLocation",
        "WebGLVertexArrayObject", "WebGLActiveInfo", "HTMLCanvasElement", "HTMLImageElement", "Image",
        "OffscreenCanvas", "ImageBitmap", "Audio", "HTMLVideoElement", "XMLHttpRequest" ];

    for (const name of names) if (!global[name]) global[name] = class {};
}
