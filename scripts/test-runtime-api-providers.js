/* eslint-env node */
const assert = require("node:assert/strict");
const path = require("node:path");


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

const bundlePath = path.resolve(__dirname, "../dist/ccpwgl2_int.js");
const { tw2 } = require(bundlePath);
const {
    TnyCharacterApiProvider,
    TnyGeneratedLibraryProvider,
    TnySkinApiProvider,
    TnyToolsApiProvider,
    TnyApiService
} = tw2.runtime;


(async () =>
{
    const generated = new TnyGeneratedLibraryProvider({ fetcher: async () => null });
    assert.throws(
        () => generated.GetLibrary(),
        /Generated library URL is required/
    );
    await assert.rejects(
        generated.GetLibrary("res:/missing.json"),
        /Generated library res:\/missing\.json returned no data/
    );

    const character = new TnyCharacterApiProvider();
    await assert.rejects(
        character.GetCharacterLibrary(),
        /TnyCharacterApiProvider API method not found: GetCharacterLibrary/
    );
    await assert.rejects(
        character.LookupCharacterName("Long Hair"),
        /TnyCharacterApiProvider API method not found: LookupCharacterName/
    );

    const emptyCharacterApi = new TnyCharacterApiProvider({
        apiRoot: "http://localhost/eve/latest",
        apiFetcher: async () => null
    });
    await assert.rejects(
        emptyCharacterApi.GetCharacterLibrary(),
        /Character API .*\/character returned no data/
    );

    const skin = new TnySkinApiProvider();
    await assert.rejects(
        skin.GetSkinLibrary(),
        /TnySkinApiProvider API method not found: GetSkinLibrary/
    );
    await assert.rejects(
        skin.GetSkin(1),
        /TnySkinApiProvider API method not found: GetSkin/
    );

    const emptySkinApi = new TnySkinApiProvider({
        apiRoot: "http://localhost/eve/latest",
        apiFetcher: async () => undefined
    });
    await assert.rejects(
        emptySkinApi.GetSkinLibrary(),
        /Skin API .*\/skin returned no data/
    );

    const requests = [];
    const tools = new TnyToolsApiProvider({
        apiRoot: "http://localhost/ccp/latest",
        resourceRoot: "http://localhost/ccp/latest/resources",
        fetcher: async url =>
        {
            requests.push(url);
            return { typeID: 42 };
        },
        postFetcher: async (url, body) =>
        {
            requests.push(url);
            return body.paths;
        }
    });
    const api = new TnyApiService({ tools });

    assert.deepEqual(await api.GetWeaponType(42), { typeID: 42 });
    assert.equal(requests[0], "http://localhost/ccp/latest/weapons/types/42");
    await api.GetResource("res:/texture/sprite/banners");
    assert.equal(requests[1], "http://localhost/ccp/latest/resources/texture/sprite/banners");
    assert.deepEqual(
        await api.ResolveHullResPathInserts("ab1_t1", "navy", [ "res:/ship_m.dds" ]),
        [ "res:/ship_m.dds" ]
    );
    assert.equal(
        requests[2],
        "http://localhost/ccp/latest/sof/hulls/ab1_t1/respathinserts/navy/resolve"
    );

    const sof = new tw2.EveSOFData();
    sof.Register({
        resolveHullResPathInserts: async (hull, insert, paths) =>
        {
            assert.equal(hull, "ab1_t1");
            assert.equal(insert, "navy");
            return paths.map(path => path.replace("ship_m.dds", "navy/ship_navy_m.dds"));
        }
    });
    assert.deepEqual(await sof.ResolveResPathInserts(
        { name: "ab1_t1" },
        { resPathInsert: "navy" },
        [ "RES:/SHIP_M.DDS" ],
        null
    ), [ "res:/navy/ship_navy_m.dds" ]);

    let factionDefaultResolved = false;
    const factionDefaultSof = new tw2.EveSOFData();
    factionDefaultSof.Register({
        resolveHullResPathInserts: async (hull, insert, paths) =>
        {
            factionDefaultResolved = true;
            assert.equal(hull, "ab1_t1");
            assert.equal(insert, "amarrbase");
            return paths;
        }
    });
    assert.deepEqual(await factionDefaultSof.ResolveResPathInserts(
        { name: "ab1_t1" },
        { resPathInsert: "amarrbase" },
        [ "RES:/SHIP_M.DDS" ],
        null
    ), [ "res:/ship_m.dds" ]);
    assert.equal(factionDefaultResolved, true);
    factionDefaultResolved = false;
    assert.deepEqual(await factionDefaultSof.ResolveResPathInserts(
        { name: "ab1_t1" },
        { resPathInsert: "navy" },
        [ "RES:/SHIP_M.DDS" ],
        "none"
    ), [ "res:/ship_m.dds" ]);
    assert.equal(factionDefaultResolved, false);

    const emptyTools = new TnyToolsApiProvider({
        apiRoot: "http://localhost/ccp/latest",
        fetcher: async () => null,
        postFetcher: async () => null
    });
    await assert.rejects(
        emptyTools.GetBillboards(),
        /Tools API .*\/billboards returned no data/
    );
    await assert.rejects(
        emptyTools.ResolveHullResPathInserts(
            "ab1_t1",
            "navy",
            [ "res:/ship_m.dds" ]
        ),
        /Tools API .*\/resolve returned no data/
    );

    console.log("Runtime API providers reject missing configuration and payloads");
})().catch(error =>
{
    console.error(error);
    process.exitCode = 1;
});
