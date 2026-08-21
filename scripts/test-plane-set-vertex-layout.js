/**
 * EvePlaneSet vertex layout parity with Carbon, 2026-08-21.
 *
 * Ground truth is the static Tr2VertexDefinition in
 * `e:\carbonengine\trinity\trinity\Eve\SpaceObject\Attachments\Sets\EvePlaneSet.cpp:154-168`,
 * which maps 1:1 onto its `PlaneVertex` struct (`cpp:45-60`).
 *
 * ccpwgl was missing TEXCOORD 8 (`blinkData`) entirely and carried only three of
 * TEXCOORD 7's four components. A missing input is NOT an error in
 * `Tw2VertexDeclaration.SetPartialDeclaration` - it disables the attribute and
 * feeds it `vertexAttrib4f(0,0,0,0)` silently - so on `effect.dx11`, whose Carbon
 * shaders declare the stream, plane sets got zeroed blink data. The legacy gles2
 * shaders never declared it, which is why gles2 looked fine and this read as a
 * backend bug. Plane sets that play video are the same objects, so they went dark
 * for the same reason.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(path.resolve(__dirname, "../src/eve/item/EvePlaneSet.js"), "utf8");

testDeclarationMatchesCarbon();
testVertexSizeMatchesDeclaration();
testStrideIsDerivedNotHardCoded();
testWriterFillsEveryComponent();
console.log("EvePlaneSet vertex layout verified");


/** The exact semantics Carbon declares, in its own order. */
function carbonLayout()
{
    return [
        [ "TEXCOORD", 0, 4 ], [ "TEXCOORD", 1, 4 ], [ "TEXCOORD", 2, 4 ],
        [ "COLOR", 0, 4 ],
        [ "TEXCOORD", 3, 4 ], [ "TEXCOORD", 4, 4 ], [ "TEXCOORD", 5, 4 ], [ "TEXCOORD", 6, 4 ],
        [ "TEXCOORD", 7, 4 ],   // index, boneIndex, maskMapAtlasIndex, pickBufferID
        [ "TEXCOORD", 8, 4 ]    // blinkData - rate, phase, dutyCycle, blinkMode
    ];
}

function parseDeclaration()
{
    const block = source.match(/static vertexDeclarations\s*=\s*\[([\s\S]*?)\n\s*\];/);
    assert.ok(block, "vertexDeclarations must be a static array literal");

    const out = [];
    const re = /\{\s*usage:\s*"(\w+)",\s*usageIndex:\s*(\d+),\s*elements:\s*(\d+)\s*\}/g;
    let m;
    while ((m = re.exec(block[1]))) out.push([ m[1], Number(m[2]), Number(m[3]) ]);
    return out;
}

function testDeclarationMatchesCarbon()
{
    const declared = parseDeclaration();
    const expected = carbonLayout();

    // Compare as SETS of semantics - byte order is ccpwgl's own business, since
    // it builds its own buffer; what must agree is which streams exist and how
    // wide they are.
    const key = ([ u, i, e ]) => `${u}${i}:${e}`;
    assert.deepEqual(
        declared.map(key).sort(),
        expected.map(key).sort(),
        "every Carbon stream must be published, at Carbon's width"
    );
}

function testVertexSizeMatchesDeclaration()
{
    const declared = parseDeclaration();
    const total = declared.reduce((sum, [ , , elements ]) => sum + elements, 0);
    const declaredSize = Number(source.match(/static vertexSize\s*=\s*(\d+)/)[1]);

    assert.equal(declaredSize, total,
        `vertexSize (${declaredSize}) must equal the declaration's component count (${total})`);
    assert.equal(declaredSize, 40, "Carbon's plane vertex is 40 components wide");
}

/**
 * The draw stride used to be the literal 140 while Rebuild owned the size
 * separately, so widening the vertex in one place silently mis-strided the other.
 */
function testStrideIsDerivedNotHardCoded()
{
    const line = source.split("\n").find(l => l.includes("SetDeclaration("));
    assert.ok(line, "the draw must call SetDeclaration");
    assert.ok(/vertexSize/.test(line),
        `stride must derive from vertexSize, got "${line.trim()}"`);
    assert.ok(!/\b140\b/.test(source), "the old hard coded 140 stride must be gone");
}

/**
 * A declared component nobody writes is worse than a missing one: it ships
 * whatever was last in the buffer instead of an obvious zero.
 */
function testWriterFillsEveryComponent()
{
    const rebuild = source.slice(source.indexOf("new Float32Array"));
    for (const offset of [ 33, 34, 35, 36, 37, 38, 39 ])
    {
        assert.ok(
            rebuild.includes(`vtxOffset + ${offset}] =`),
            `the writer must fill component ${offset}`
        );
    }
    // The corner index is written per-quad, outside the vertex loop.
    assert.ok(rebuild.includes("indexOffset] = 0"), "the corner index must still be written");
}
