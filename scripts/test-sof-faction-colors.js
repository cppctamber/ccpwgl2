/**
 * Faction colour-set defaults.
 *
 * Every slot used to default to `vec4.create()` - black at alpha ZERO - so any
 * colour a faction does not author rendered black. Published faction data does
 * not carry the four FX colours, so warp, attack and siege lights went dark on
 * a live hull while runtime-sof and the CCP tool showed them correctly.
 *
 * Ground truth is Carbon's constructor, `EveSOFData.cpp:42-52`.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { transformSync } = require("@babel/core");


const { EveSOFDataFactionColorSet } = loadColorSet();
const set = new EveSOFDataFactionColorSet();

// The values tools-core serves for a faction that authors none of them, which
// is how the ARGB byte order was confirmed rather than assumed.
const near = (actual, expected, what) =>
{
    for (let i = 0; i < 4; i++)
    {
        assert.ok(Math.abs(actual[i] - expected[i]) < 1e-6,
            `${what}[${i}] expected ${expected[i]}, got ${actual[i]}`);
    }
};

near(set.PrimaryWarpFx, [ 1, 0.38823529, 0.2, 1 ], "PrimaryWarpFx");       // 0xFFFF6333
near(set.PrimaryAttackFX, [ 1, 0.09411765, 0.04313725, 1 ], "PrimaryAttackFX"); // 0xFFFF180B
near(set.PrimarySiegeFX, [ 1, 0.36862745, 0.17647059, 1 ], "PrimarySiegeFX");   // 0xFFFF5E2D
near(set.PrimaryDockedFX, [ 0.29803922, 0.50980392, 0.88627451, 1 ], "PrimaryDockedFX"); // 0xFF4C82E2
near(set.PrimaryBillboard, [ 2.5, 2.5, 2.5, 2.5 ], "PrimaryBillboard");

// Everything else is black at ALPHA 1. Alpha zero was the old bug and is what
// made an unauthored colour indistinguishable from an authored one.
const specials = new Set([ "PrimaryWarpFx", "PrimaryAttackFX", "PrimarySiegeFX", "PrimaryDockedFX", "PrimaryBillboard" ]);
let checked = 0;

for (const name of EveSOFDataFactionColorSet.Type)
{
    const field = name in set ? name : null;
    if (!field || specials.has(field)) continue;
    near(set[field], [ 0, 0, 0, 1 ], field);
    checked++;
}

assert.ok(checked > 30, `expected most of the table checked, got ${checked}`);
console.log(`Faction colour defaults match Carbon (${checked} black-at-alpha-1, 5 authored)`);


function loadColorSet()
{
    const vec4 = {
        create: () => new Float32Array(4),
        fromValues: (a, b, c, d) => Float32Array.of(a, b, c, d)
    };

    return loadModule("../src/sof/faction/EveSOFDataFactionColorSet.js", {
        utils: { meta: makeMeta() },
        math: { vec4 },
        core: { Tw2Error: class extends Error {} }
    });
}

function loadModule(relativePath, modules)
{
    const filename = path.resolve(__dirname, relativePath);
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
        if (id in modules) return modules[id];
        throw new Error(`Unexpected dependency in ${relativePath}: ${id}`);
    }, module, module.exports);
    return module.exports;
}

function makeMeta()
{
    const property = () => undefined;
    return {
        Model: class {},
        type: () => value => value,
        ccp: { define: () => value => value },
        define: () => value => value,
        wgl: { define: () => value => value },
        alias: () => property,
        todo: () => value => value,
        notImplemented: property,
        color: property,
        struct: () => property,
        list: () => property,
        string: property,
        boolean: property,
        uint: property,
        float: property,
        vector4: property,
        isPrivate: property
    };
}
