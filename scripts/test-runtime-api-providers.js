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
    TnySkinApiProvider
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

    console.log("Runtime API providers reject missing configuration and payloads");
})().catch(error =>
{
    console.error(error);
    process.exitCode = 1;
});
