const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { transformSync } = require("@babel/core");


const BLENDINDICES = 6;
const BLENDWEIGHT = 7;
const Tw2VertexDeclaration = loadDeclaration();

assert.equal(new Tw2VertexDeclaration().swapBlendWeightsAndIndices, false);

assert.equal(bindOffset(false, "attr0", BLENDWEIGHT), 70, "legacy geometry + legacy shader");
assert.equal(bindOffset(false, "in_BLENDINDICES0", BLENDINDICES), 70, "legacy geometry + CEWG shader");
assert.equal(bindOffset(true, "attr0", BLENDWEIGHT), 60, "direct geometry + legacy shader");
assert.equal(bindOffset(true, "in_BLENDINDICES0", BLENDINDICES), 60, "direct geometry + CEWG shader");
assert.equal(bindOffset(true, "in_POSITION0", 0), 0, "non-blend semantics remain unchanged");

console.log("Vertex blend semantic boundary verified");

function bindOffset(geometryDirect, attribute, usage)
{
    const declaration = new Tw2VertexDeclaration();
    declaration.swapBlendWeightsAndIndices = geometryDirect;
    declaration.elements = [
        makeElement(0, 0),
        makeElement(BLENDINDICES, 60),
        makeElement(BLENDWEIGHT, 70)
    ];
    declaration.RebuildHash();

    const calls = [];
    const device = {
        gl: {
            disableVertexAttribArray() {},
            enableVertexAttribArray() {},
            vertexAttrib4f() {},
            vertexAttribPointer(location, elements, type, normalized, stride, offset)
            {
                calls.push({ location, elements, type, normalized, stride, offset });
            }
        }
    };
    const input = makeElement(usage, 0);
    input.location = 3;
    input._attr = attribute;

    declaration.SetDeclaration(device, { elementsSorted: [ input ] }, 96);
    assert.equal(calls.length, 1, `${attribute} must bind exactly one vertex input`);
    return calls[0].offset;
}

function makeElement(usage, offset)
{
    return {
        usage,
        usageIndex: 0,
        offset,
        elements: usage === 0 ? 3 : 4,
        type: 0x1406,
        location: 0,
        customSetter: null
    };
}

function loadDeclaration()
{
    const filename = path.resolve(__dirname, "../src/core/vertex/Tw2VertexDeclaration.js");
    const source = fs.readFileSync(filename, "utf8");
    const output = transformSync(source, {
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
    const meta = {
        type: () => value => value,
        wgl: { define: () => value => value },
        list: () => () => undefined,
        isPrivate: () => undefined
    };
    class Tw2VertexElement {}
    Tw2VertexElement.Type = { BLENDINDICES, BLENDWEIGHT };

    new Function("require", "module", "exports", output.code)(id => {
        if (id === "utils") return { meta };
        if (id === "./Tw2VertexElement") return { Tw2VertexElement };
        throw new Error(`Unexpected dependency: ${id}`);
    }, module, module.exports);

    return module.exports.Tw2VertexDeclaration;
}
