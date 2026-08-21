/**
 * Sparse sampler registers past the setup loop - 2026-08-22.
 *
 * SetupGLSLShader assigns s0..s15 and nothing above. A Carbon shader can sit
 * well inside the 16 unit budget and STILL declare a register above 15, because
 * the registers are SPARSE: measured on
 * unpackedskinned_quaddetailv5.sm_depth, some permutations carry 14 textures at
 * registers [0..12, 16] - no s15 at all, 13/14/15 free, one sampler at s16.
 *
 * An unassigned sampler uniform defaults to 0 and collides with the samplerCube
 * EnvMap sampling unit 0:
 *
 *   GL_INVALID_OPERATION: glDrawElements:
 *   Two textures of different types use the same sampler location.
 *
 * WebGL DROPS the draw, so the object simply does not appear.
 *
 * The remap predicate used to compare against the DRIVER limit
 * (MAX_TEXTURE_IMAGE_UNITS, 32 on most desktop GPUs), so registers 16-18 fell in
 * a gap - too high for the setup loop, too low to be remapped - and the fault
 * appeared or vanished with the GPU.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(
    path.resolve(__dirname, "../src/core/shader/Tw2ShaderProgram.js"), "utf8");

testPredicateUsesTheLoopBoundNotTheDriverLimit();
testSparseRegisterIsRemappedToAFreeLowUnit();
console.log("Sparse sampler register remap verified");

/** The bound that matters is what the setup loop assigns, not what the GPU has. */
function testPredicateUsesTheLoopBoundNotTheDriverLimit()
{
    assert.ok(source.includes("const SAMPLER_SETUP_UNITS = 16;"),
        "the setup loop bound must be named");
    assert.ok(source.includes("if (reg < SAMPLER_SETUP_UNITS || remap.has(reg)) continue;"),
        "the remap must trigger on the setup loop bound");
    assert.ok(!source.includes("if (reg < MAX_UNITS || remap.has(reg)) continue;"),
        "the driver limit must no longer gate the remap");
}

/** The real measured shape: 14 textures at [0..12, 16] on a 32 unit driver. */
function testSparseRegisterIsRemappedToAFreeLowUnit()
{
    const setUnits = [];
    const gl = {
        MAX_TEXTURE_IMAGE_UNITS: "max",
        getParameter: () => 32,
        getUniformLocation: (prog, name) => ({ name }),
        uniform1i: (loc, unit) => setUnits.push({ name: loc.name, unit })
    };

    const registers = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 16 ];
    const pass = { stages: [ { textures: registers.map(r => ({ registerIndex: r })) }, { textures: [] } ] };
    const program = { program: {}, carbonDataTextures: [] };

    loadSetup()(program, pass, gl);

    assert.ok(program.carbonSamplerUnits, "a remap must have been produced");
    const unit = program.carbonSamplerUnits.get(16);
    assert.notEqual(unit, undefined, "the register at 16 must be remapped");
    assert.ok(unit < 16, `it must move BELOW the setup loop bound, got ${unit}`);
    assert.equal(unit, 13, "and to the lowest genuinely free unit - 13, 14, 15 are free here");

    assert.deepEqual(setUnits, [ { name: "s16", unit: 13 } ],
        "its uniform must actually be assigned, or it still defaults to 0");

    // A dense shader must be left completely alone.
    const dense = { stages: [ { textures: [ 0, 1, 2 ].map(r => ({ registerIndex: r })) } ] };
    const p2 = { program: {}, carbonDataTextures: [] };
    loadSetup()(p2, dense, gl);
    assert.equal(p2.carbonSamplerUnits, null, "in-range registers keep unit == register");
}

/** Runs the real function rather than a restatement of it. */
function loadSetup()
{
    const at = source.indexOf("static SetupCarbonSamplerUnits(program, pass, gl)");
    assert.ok(at !== -1, "SetupCarbonSamplerUnits must exist");
    const open = source.indexOf("{", at);

    let depth = 0, end = open;
    for (let i = open; i < source.length; i++)
    {
        if (source[i] === "{") depth++;
        else if (source[i] === "}" && --depth === 0) { end = i; break; }
    }

    const body = source.slice(open + 1, end)
        .split("Tw2ShaderProgram.GetMaxTextureImageUnits(gl)").join("gl.getParameter()")
        .split("Tw2ShaderProgram.OccupiedTextureUnits(pass, MAX_UNITS)").join("occupiedUnits(pass)");

    const helper = `
        function occupiedUnits(pass) {
            const set = new Set();
            for (const stage of pass.stages || []) {
                for (const t of stage.textures || []) if (t.registerIndex < SAMPLER_SETUP_UNITS) set.add(t.registerIndex);
            }
            return set;
        }`;

    return new Function("program", "pass", "gl",
        "const SAMPLER_SETUP_UNITS = 16;" + helper + body);
}
