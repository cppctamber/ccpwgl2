/**
 * SOF locator set flattening - 2026-08-22.
 *
 * A hull's `locatorSets` list is polymorphic: an entry is either a flat
 * `EveSOFDataHullLocatorSet` carrying `locators`, or an
 * `EveSOFDataHullLocatorSetGroup` carrying a nested list of either. Carbon
 * flattens the tree recursively and merges by name
 * (EveSOFDataMgr::LoadLocatorData).
 *
 * ccpwgl skipped groups with a "not supported yet" log. That is invisible on
 * most hulls - damage, steam and contrails are authored flat - but every set a
 * smart light places against is authored inside a group, so those hulls
 * answered `GetLocatorsForSet` with null and no placement was ever generated.
 * Nothing threw and nothing rendered.
 *
 * NOTE this exercises dist/, so it proves the LAST BUILD.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const bundle = path.resolve(__dirname, "../dist/ccpwgl2_int.js");
if (!fs.existsSync(bundle))
{
    console.log("SOF locator sets skipped - no dist build");
    process.exit(0);
}

stubBrowser();
const mod = require(bundle);
const tw2 = mod.tw2 || mod.default || mod;

testGroupsAreFlattened();
testSameNameAcrossGroupsMerges();
console.log("SOF locator sets verified");

/**
 * Groups nest, so this is not one level deep - Carbon recurses. The flat
 * sibling is here to prove the flat path did not regress while the group path
 * was added.
 */
function testGroupsAreFlattened()
{
    const obj = { locatorSets: [] };

    const hull = {
        locatorSets: [
            flatSet("damage", 2),
            group([ flatSet("primaryspotlight_01", 3), group([ flatSet("dockinglights_01", 1) ]) ])
        ]
    };

    tw2.GetClass("EveSOFData").SetupLocatorSets(null, obj, { hull }, {});

    const names = obj.locatorSets.map(s => s.name);
    assert.deepEqual(names.sort(), [ "damage", "dockinglights_01", "primaryspotlight_01" ],
        "a set inside a group - at any depth - must reach the hull");

    const spotlight = obj.locatorSets.find(s => s.name === "primaryspotlight_01");
    assert.equal(spotlight.locators.length, 3, "every locator in the grouped set is carried");
    assert.equal(spotlight.locators[0].boneIndex, 0, "the bone index rides along");
}

/**
 * Carbon accumulates into `hd.locatorSets[name]`, so one named set assembled
 * from several groups is ONE set. Pushing a second EveLocatorSets with the same
 * name would leave the lookup finding only whichever came first.
 */
function testSameNameAcrossGroupsMerges()
{
    const obj = { locatorSets: [] };

    const hull = {
        locatorSets: [
            group([ flatSet("primaryflare_01", 2) ]),
            group([ flatSet("primaryflare_01", 3) ])
        ]
    };

    tw2.GetClass("EveSOFData").SetupLocatorSets(null, obj, { hull }, {});

    assert.equal(obj.locatorSets.length, 1, "the same name in two groups is one set, not two");
    assert.equal(obj.locatorSets[0].locators.length, 5, "and it holds every locator from both");
}

function flatSet(name, count)
{
    const locators = [];
    for (let i = 0; i < count; i++)
    {
        locators.push({
            boneIndex: i,
            position: [ i, 0, 0 ],
            rotation: [ 0, 0, 0, 1 ],
            scaling: [ 1, 1, 1 ]
        });
    }
    return { name, locators };
}

/** A group carries `locatorSets` and, deliberately, no `locators` key. */
function group(locatorSets)
{
    return { name: "group", locatorSets };
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
