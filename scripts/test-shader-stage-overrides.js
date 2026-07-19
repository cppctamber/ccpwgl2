/* eslint-env node */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { transformSync } = require("@babel/core");


const { Tw2ShaderStage } = loadShaderStage();

const literal = "ivec4 i2=ivec4(3);for(int i=0;i<i2.x;++i){r0+=1.0;}";
assert.equal(
    Tw2ShaderStage.inspectShaderCode(literal, "res:/graphics/effect/managed/space/literal.fx", 1),
    "ivec4 i2=ivec4(3);for(int i=0;i<3;++i){r0+=1.0;}",
    "literal loop bounds can be folded when their register is not rewritten"
);

const reassigned = "ivec4 i2=ivec4(3);i2.x=7;for(int i=0;i<i2.x;++i){r0+=1.0;}";
assert.equal(
    Tw2ShaderStage.inspectShaderCode(reassigned, "res:/graphics/effect/managed/space/literal.fx", 1),
    reassigned,
    "a register write after initialization must block literal folding"
);

const spaceShader = "for(int i=0;i<i15.x;++i){r0+=1.0;}r0.x=r5.y;";
assert.equal(
    Tw2ShaderStage.inspectShaderCode(spaceShader, "res:/graphics/effect/managed/space/skinnedavatar.fx", 1),
    spaceShader,
    "interior compatibility rules must not alter a same-named EVE shader"
);

assert.equal(
    Tw2ShaderStage.inspectShaderCode(
        spaceShader,
        "res:/graphics/effect/managed/interior/avatar/skinnedavatar.sm_hi.fx",
        1
    ),
    "for(int i=0;i<10;++i){r0+=1.0;}r0.x=c11.y;",
    "managed interior avatar variants receive their scoped compatibility rules"
);

assert.equal(
    Tw2ShaderStage.inspectShaderCode(
        "for(int i=0;i<i0.x;++i){}for(int i=0;i<i15.x;++i){}",
        "res:/graphics/effect/managed/interior/avatar/glassshader.fx",
        1
    ),
    "for(int i=0;i<5;++i){}for(int i=0;i<10;++i){}"
);

console.log("Shader override scoping and loop-fold safety verified");


function loadShaderStage()
{
    const
        filename = path.resolve(__dirname, "../src/core/shader/Tw2ShaderStage.js"),
        output = transformSync(fs.readFileSync(filename, "utf8"), {
            babelrc: false,
            configFile: false,
            filename,
            plugins: [
                [ require("@babel/plugin-proposal-decorators"), { legacy: true } ],
                [ require("@babel/plugin-proposal-class-properties"), { loose: true } ],
                require("@babel/plugin-transform-modules-commonjs")
            ]
        }),
        module = { exports: {} },
        shaderOverrides = require("../src/core/shader/shaderOverrides.json"),
        property = () => undefined,
        meta = {
            type: () => value => value,
            wgl: { define: () => value => value },
            uint: property,
            vector: property,
            list: () => property,
            struct: () => property,
            isPrivate: property,
            string: property
        },
        modules = {
            utils: {
                addToArray() {},
                get(value, key, fallback) { return value[key] === undefined ? fallback : value[key]; },
                getKeyFromValue() { return "INVALID"; },
                isString: value => typeof value === "string",
                meta
            },
            "../vertex": { Tw2VertexDeclaration: class {}, Tw2VertexElement: class {} },
            "../sampler": { Tw2SamplerState: class {} },
            "./Tw2Shader": { ErrShaderCompile: class extends Error {}, Tw2Shader: { DEBUG_ENABLED: false } },
            "./Tw2ShaderStageConstant": { Tw2ShaderStageConstant: { IgnoreOffset: [] } },
            "./Tw2ShaderStageTexture": { Tw2ShaderStageTexture: class {} },
            "global/tw2": { device: {} },
            "./shaderOverrides": shaderOverrides,
            "core/shader/Tw2ShaderAnnotation": { Tw2ShaderAnnotation: class {} }
        };

    new Function("require", "module", "exports", "WebGLShader", output.code)(id =>
    {
        if (id in modules) return modules[id];
        throw new Error(`Unexpected shader-stage dependency: ${id}`);
    }, module, module.exports, class WebGLShader {});
    return module.exports;
}
