/**
 * Tr2ShLightingManager — spherical harmonic secondary lighting
 *
 * Loads the real source module (decorators stripped) and checks the ported
 * Carbon math behaves as carbonengine's Tr2ShLightingManager does: the packed
 * block shape, the three cull rules, intensity linearity, the L1/L2 split, and
 * distance falloff.
 */
const fs = require("fs");
const path = require("path");
const assert = require("assert");
const babel = require("@babel/core");
const glMatrix = require("gl-matrix");

const sourcePath = path.resolve(__dirname, "../src/core/lighting/Tr2ShLightingManager.js");
const { Tr2ShLightingManager } = load(fs.readFileSync(sourcePath, "utf8"));

const PACKED = Tr2ShLightingManager.PACKED_COEFFICIENT_COUNT * 4;


function makeManager(quality = Tr2ShLightingManager.L2)
{
    const manager = new Tr2ShLightingManager();
    manager.quality = quality;
    manager.primaryIntensity = 1;
    manager.secondaryIntensity = 1;
    manager._sources = [];
    manager._sourceData = [];
    manager.lights = [];
    manager._sunDirection = glMatrix.vec3.fromValues(0, 1, 0);
    manager._sunColor = glMatrix.vec3.fromValues(1, 1, 1);
    return manager;
}

function sphere(position, radius, emissive = [ 1, 1, 1 ], albedo = [ 1, 1, 1 ])
{
    return { position, radius, albedo, emissive };
}


// 1. Shape, and the constant w lane
{
    const manager = makeManager();
    const out = manager.GetLighting([ 0, 0, 0 ], 1, 0);

    assert.ok(out instanceof Float32Array, "returns a flat float block");
    assert.equal(out.length, PACKED, "28 floats = PACKED_COEFFICIENT_COUNT vec4s");

    for (let i = 0; i < 27; i++) assert.ok(out[i] === 0, `coefficient ${i} zero with no sources`);
    assert.equal(out[27], 1, "the last w lane is a constant, not accumulated");
    console.log("PASS 1: packed block is 28 floats, empty, with a constant w lane");
}

// 2. A lit sphere contributes, and the ambient term scales linearly with intensity
{
    const manager = makeManager();
    manager.RegisterSecondaryLightSource(sphere([ 0, 0, 50 ], 20));
    manager.UpdateSourceData();

    const full = manager.GetLighting([ 0, 0, 0 ], 1, 0, new Float32Array(PACKED));
    const ambient = full[3];
    assert.ok(Math.abs(ambient) > 0, "a visible sphere writes the ambient term");

    const half = manager.GetLighting([ 0, 0, 0 ], 0.5, 0, new Float32Array(PACKED));
    assert.ok(Math.abs(half[3] - ambient * 0.5) < 1e-6, "half intensity halves the ambient term");
    console.log("PASS 2: a visible sphere contributes and intensity is linear");
}

// 3. The three cull rules: apparent brightness, receiver inside one unit, zero radius
{
    const dim = makeManager();
    dim.RegisterSecondaryLightSource(sphere([ 0, 0, 5000 ], 1, [ 0.0001, 0.0001, 0.0001 ], [ 0, 0, 0 ]));
    dim.UpdateSourceData();
    assert.equal(dim.GetLighting([ 0, 0, 0 ], 1, 0, new Float32Array(PACKED))[3], 0,
        "a source below the cutoff ratio contributes nothing");

    const near = makeManager();
    near.RegisterSecondaryLightSource(sphere([ 0, 0, 0.5 ], 20));
    near.UpdateSourceData();
    assert.equal(near.GetLighting([ 0, 0, 0 ], 1, 0, new Float32Array(PACKED))[3], 0,
        "a source within one unit of the receiver is skipped");

    const flat = makeManager();
    flat.RegisterSecondaryLightSource(sphere([ 0, 0, 50 ], 0));
    flat.UpdateSourceData();
    assert.equal(flat._sourceData.length, 0, "a zero radius sphere is not processed");
    console.log("PASS 3: brightness, proximity and zero-radius culls all hold");
}

// 4. cutoffRadius culls spheres, but never point lights (cutoffMultiplier 0)
{
    const manager = makeManager();
    manager.RegisterSecondaryLightSource(sphere([ 0, 0, 50 ], 20));
    manager.UpdateSourceData();
    assert.equal(manager.GetLighting([ 0, 0, 0 ], 1, 1000, new Float32Array(PACKED))[3], 0,
        "a sphere smaller than the cutoff is culled");

    const lit = makeManager();
    lit.lights = [ { GetLight: () => ({ position: [ 0, 0, 50 ], radius: 20, color: [ 1, 1, 1 ] }) } ];
    lit.UpdateSourceData();
    assert.ok(Math.abs(lit.GetLighting([ 0, 0, 0 ], 1, 1000, new Float32Array(PACKED))[3]) > 0,
        "a point light ignores the cutoff radius");
    console.log("PASS 4: cutoffRadius culls spheres and spares point lights");
}

// 5. L1 writes only the first three vec4s; Carbon leaves the rest untouched
{
    const manager = makeManager(Tr2ShLightingManager.L1);
    manager.RegisterSecondaryLightSource(sphere([ 0, 0, 50 ], 20));
    manager.UpdateSourceData();

    const out = new Float32Array(PACKED).fill(7);
    manager.CalculateSecondaryLighting([ 0, 0, 0 ], 1, 0, out, 2);

    assert.ok(Math.abs(out[3]) > 0, "L1 writes the ambient term");
    for (let i = 12; i < PACKED; i++) assert.equal(out[i], 7, `L1 must not touch float ${i}`);
    console.log("PASS 5: L1 fills only the first three vec4s");
}

// 6. Distance falloff
{
    const manager = makeManager();
    const position = [ 0, 0, 50 ];
    manager.RegisterSecondaryLightSource(sphere(position, 20));
    manager.UpdateSourceData();
    const near = manager.GetLighting([ 0, 0, 0 ], 1, 0, new Float32Array(PACKED))[3];

    const far = makeManager();
    far.RegisterSecondaryLightSource(sphere([ 0, 0, 400 ], 20));
    far.UpdateSourceData();
    const distant = far.GetLighting([ 0, 0, 0 ], 1, 0, new Float32Array(PACKED))[3];

    assert.ok(Math.abs(distant) < Math.abs(near), "a sphere further away contributes less");
    console.log("PASS 6: contribution falls off with distance");
}

// 7. Registration lifecycle
{
    const manager = makeManager();
    const source = sphere([ 0, 0, 50 ], 20);
    manager.RegisterSecondaryLightSource(source);
    manager.UpdateSourceData();
    assert.equal(manager._sourceData.length, 1, "registered once");

    manager.UnregisterSecondaryLightSource(source);
    manager.UpdateSourceData();
    assert.equal(manager._sourceData.length, 0, "unregistered by identity");
    console.log("PASS 7: sources register and unregister by identity");
}

console.log("PASS");


function load(source)
{
    const transformed = babel.transformSync(source, {
        babelrc: false,
        configFile: false,
        plugins: [
            [ require("@babel/plugin-proposal-decorators"), { legacy: true } ],
            [ require("@babel/plugin-proposal-class-properties"), { loose: true } ],
            require("@babel/plugin-transform-modules-commonjs")
        ]
    }).code;

    const module = { exports: {} };
    const meta = createMetaStub();

    const requireStub = request =>
    {
        if (request === "utils") return { meta };
        if (request === "math") return { vec3: glMatrix.vec3, vec4: glMatrix.vec4 };
        throw new Error(`Unexpected Tr2ShLightingManager dependency: ${request}`);
    };

    Function("require", "module", "exports", transformed)(requireStub, module, module.exports);
    return module.exports;
}

function createMetaStub()
{
    let proxy;
    const target = function () {};
    proxy = new Proxy(target, {
        get: (object, property) => property === "Model" ? class {} : proxy,
        apply: (fn, thisArg, args) =>
        {
            if (args.length >= 2 && (typeof args[1] === "string" || typeof args[1] === "symbol")) return args[2];
            return (value, key, descriptor) => descriptor || value;
        }
    });
    return proxy;
}
