/**
 * Phantom texture units - 2026-08-22.
 *
 * A register the MANIFEST declares is not necessarily a sampler the shader HAS.
 * Measured on unpackedskinned_quaddetailv5.sm_depth: Carbon declares 17
 * resources at registers 0-16, but the webgl emitter emits 14 -
 * Detail1Map/Detail2Map/Detail3Map (14/15/16) merge into one sDetailArrayMap at
 * 16, the two light buffers fold into cjsLocalLightTexture, and
 * LightProfileArray (13) is replaced by a constant.
 *
 * Counting all seventeen marked 13, 14 and 15 occupied while nothing sampled
 * them. On a 16 unit driver every unit then looked taken, so the out of range
 * remap had nowhere to put register 16, gave up SILENTLY, and the sampler kept
 * the default unit 0 - colliding with the samplerCube there:
 *
 *   GL_INVALID_OPERATION: glDrawElements:
 *   Two textures of different types use the same sampler location.
 *
 * WebGL drops the draw, so the object does not appear and nothing in the log
 * points at a texture unit.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(
    path.resolve(__dirname, "../src/core/shader/Tw2ShaderProgram.js"), "utf8");

testDroppedRegistersDoNotOccupyUnits();
testCallersAskTheLinker();
testGivingUpIsNotSilent();
console.log("Phantom texture unit occupancy verified");

/** The measured layout: manifest 0-16, emitter keeps 0-12 and 16. */
function testDroppedRegistersDoNotOccupyUnits()
{
    const emitted = new Set([ 0,1,2,3,4,5,6,7,8,9,10,11,12 ]);
    const gl = {
        // The linker keeps s0..s12 and the named array; 13/14/15 are gone.
        getUniformLocation: (prog, name) =>
        {
            if (name === "sDetailArrayMap") return { name };
            if (name.charAt(0) !== "s") return null;
            const n = Number(name.slice(1));
            return Number.isInteger(n) && emitted.has(n) ? { name } : null;
        }
    };

    const textures = [];
    for (let r = 0; r <= 12; r++) textures.push({ registerIndex: r });
    textures.push({ registerIndex: 13 });                                  // LightProfileArray, dropped
    textures.push({ registerIndex: 14 });                                  // Detail1Map, merged away
    textures.push({ registerIndex: 15 });                                  // Detail2Map, merged away
    textures.push({ registerIndex: 16, _glslSymbol: "sDetailArrayMap" }); // the survivor

    const pass = { stages: [ { textures, samplers: [] } ] };
    const occupied = loadOccupancy()(pass, 16, {}, gl);

    for (const free of [ 13, 14, 15 ])
    {
        assert.ok(!occupied.has(free), `unit ${free} is not sampled and must stay free`);
    }
    for (const taken of [ 0, 5, 12 ])
    {
        assert.ok(occupied.has(taken), `unit ${taken} IS sampled and must be occupied`);
    }

    // Without a program to ask, the old assumption stands.
    const blind = loadOccupancy()(pass, 16);
    assert.ok(blind.has(14), "with no linker to consult, every manifest register counts");
}

/** The helper can only ask the linker if the callers hand it the program. */
function testCallersAskTheLinker()
{
    const calls = source.split("OccupiedTextureUnits(pass,").length - 1;
    assert.equal(calls, 3, "two call sites plus the definition");
    assert.ok(!source.includes("OccupiedTextureUnits(pass, MAX_UNITS)"),
        "the remap call site must hand over the program and gl");
    assert.ok(!source.includes("OccupiedTextureUnits(pass, maxUnits)"),
        "the resource call site must hand over the program and gl");
}

/** A silent give-up is what kept this unexplained. */
function testGivingUpIsNotSilent()
{
    const at = source.indexOf("if (unit >= MAX_UNITS)");
    assert.ok(at !== -1, "the exhaustion branch must exist");
    const branch = source.slice(at, at + 900);
    assert.ok(branch.includes("tw2.Debug"), "running out of units must be reported");
    assert.ok(branch.includes("collide"), "and must say what the consequence is");
}

/** Runs the real function rather than a restatement of it. */
function loadOccupancy()
{
    const at = source.indexOf("static OccupiedTextureUnits(pass, maxUnits, program, gl)");
    assert.ok(at !== -1, "OccupiedTextureUnits must take the program");
    const open = source.indexOf("{", at);

    let depth = 0, end = open;
    for (let i = open; i < source.length; i++)
    {
        if (source[i] === "{") depth++;
        else if (source[i] === "}" && --depth === 0) { end = i; break; }
    }
    return new Function("pass", "maxUnits", "program", "gl", source.slice(open + 1, end));
}
