/* eslint-env node */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { transformSync } = require("@babel/core");


class FakeTextureRes
{
    texture = null;

    Attach(texture)
    {
        this.texture = texture;
    }

    IsGood()
    {
        return !!this.texture;
    }
}


function LoadRenderTarget(tw2)
{
    const filename = path.resolve(__dirname, "../src/core/Tw2RenderTarget.js");
    const output = transformSync(fs.readFileSync(filename, "utf8"), {
        babelrc: false,
        configFile: false,
        filename,
        plugins: [
            [ require("@babel/plugin-proposal-decorators"), { legacy: true } ],
            [ require("@babel/plugin-proposal-class-properties"), { loose: true } ],
            require("@babel/plugin-transform-modules-commonjs")
        ]
    });
    const module = { exports: {} };
    new Function("require", "module", "exports", output.code)(id =>
    {
        if (id === "utils") return { meta: MakeMeta() };
        if (id === "global") return { tw2 };
        if (id === "./resource/Tw2TextureRes") return { Tw2TextureRes: FakeTextureRes };
        throw new Error(`Unexpected dependency: ${id}`);
    }, module, module.exports);
    return module.exports.Tw2RenderTarget;
}


function MakeMeta()
{
    const property = () => undefined;
    const classDecorator = () => value => value;
    return {
        type: classDecorator,
        wgl: { define: classDecorator },
        string: property,
        float: property,
        boolean: property
    };
}


function MakeTw2(frameBufferStatus)
{
    const deleted = { textures: 0, frameBuffers: 0, renderBuffers: 0 };
    const gl = {
        FRAMEBUFFER: 0x8D40,
        RENDERBUFFER: 0x8D41,
        FRAMEBUFFER_COMPLETE: 0x8CD5,
        COLOR_ATTACHMENT0: 0x8CE0,
        DEPTH_ATTACHMENT: 0x8D00,
        TEXTURE_2D: 0x0DE1,
        RGBA: 0x1908,
        UNSIGNED_BYTE: 0x1401,
        LINEAR: 0x2601,
        CLAMP_TO_EDGE: 0x812F,
        TEXTURE_MIN_FILTER: 0x2801,
        TEXTURE_WRAP_S: 0x2802,
        TEXTURE_WRAP_T: 0x2803,
        createTexture: () => ({}),
        createFramebuffer: () => ({}),
        createRenderbuffer: () => ({}),
        bindFramebuffer: () => undefined,
        bindTexture: () => undefined,
        bindRenderbuffer: () => undefined,
        texImage2D: () => undefined,
        texParameteri: () => undefined,
        framebufferTexture2D: () => undefined,
        framebufferRenderbuffer: () => undefined,
        renderbufferStorage: () => undefined,
        checkFramebufferStatus: () => frameBufferStatus,
        deleteTexture: () => deleted.textures++,
        deleteFramebuffer: () => deleted.frameBuffers++,
        deleteRenderbuffer: () => deleted.renderBuffers++
    };
    return {
        tw2: { gl, device: { glVersion: 2 } },
        deleted
    };
}


{
    const { tw2 } = MakeTw2(0x8CD5);
    const Tw2RenderTarget = LoadRenderTarget(tw2);
    const target = new Tw2RenderTarget();
    target.Create(64, 64, false);
    assert.equal(target.IsGood(), true, "complete framebuffer is good");
}

{
    const { tw2, deleted } = MakeTw2(0x8CD6);
    const Tw2RenderTarget = LoadRenderTarget(tw2);
    const target = new Tw2RenderTarget();
    assert.doesNotThrow(() => target.Create(64, 64, false));
    assert.equal(target.IsGood(), false, "incomplete framebuffer remains fail-soft and not-good");
    assert.equal(deleted.textures, 1, "incomplete color texture is released");
    assert.equal(deleted.frameBuffers, 1, "incomplete framebuffer is released");
}

console.log("Tw2RenderTarget fail-soft framebuffer handling verified");
