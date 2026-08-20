/**
 * Hull child selection, 2026-08-20.
 *
 * No station showed any effect children at all. `chjita`'s hull has exactly one
 * child - `groupIndex: -1`, `buildFilter: 0xffffffff`, holding the entire advert
 * scene - and ccpwgl's filter required a matching VISIBLE faction child, so it
 * was dropped. There was also no build filter gate on children at all, though
 * `SetupControllers` has always had one.
 *
 * Ground truth: `EveSOF::SetupChildrenAndAnimations`
 * (`e:\carbonengine\trinity\trinity\Eve\SpaceObjectFactory\EveSOF.cpp:1765-1776`)
 * and `EveSOFDNA::GetFactionChildData` (`EveSOFDNA.cpp:711-721`).
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { transformSync } = require("@babel/core");


const { EveSOFData } = loadSOFData();
const { STANDALONE, NON_INSTANCED_PLACEMENT, INSTANCED_PLACEMENT } = EveSOFData.BuildFilter;

testUnconditionalChildIsBuilt();
testJitaStationChildSurvivesTheFilter();
testFactionEntryWithoutIsVisibleIsHidden();
testInvisibleFactionChildIsHidden();
testVisibleFactionChildIsBuilt();
testChildWithNoMatchingFactionEntryIsStillBuilt();
testBuildFilterExcludesOtherBuilds();
testMinusOneGroupIndexIgnoresAFactionEntryCarryingMinusOne();
testHullOrderIsPreserved();
console.log("Hull child build filter verified");


/**
 * The case that was broken. `buildFilter` all-bits, no faction group: Carbon
 * builds it, because a null faction lookup falls through (`EveSOF.cpp:1770-1776`).
 */
function testUnconditionalChildIsBuilt()
{
    const child = { groupIndex: -1, buildFilter: 0xffffffff };
    assert.deepEqual(EveSOFData.FilterHullChildren([ child ], []), [ child ]);
}

/**
 * The same thing with the real values read off tools-core for
 * `chjita:caldarinavy:caldari`, against a faction that does have child data -
 * just none for this group.
 */
function testJitaStationChildSurvivesTheFilter()
{
    const child = {
        groupIndex: -1,
        buildFilter: 4294967295,
        redFilePath: "res:/dx9/model/hangar/caldari/chjita/effects/chjita_fx_01a.red"
    };

    // Real `caldarinavy` shape: most entries OMIT isVisible entirely - the faction
    // opts specific groups in, and everything else is left off. None of them is
    // group -1, which is the whole point.
    const factionChildren = [
        { groupIndex: 0, name: "Infestors" },
        { groupIndex: 1, name: "Omega" },
        { groupIndex: 160, isVisible: true, name: "Plinth_CaldariNavy" },
        { groupIndex: 1116, name: "Caldaribase_hologram" },
        { groupIndex: 1117, isVisible: true, name: "Caldarinavy_hologram" }
    ];

    assert.deepEqual(EveSOFData.FilterHullChildren([ child ], factionChildren), [ child ]);
}

/**
 * The other side of the same real data: an entry that exists but omits isVisible
 * is not visible. Carbon reads a `bool` that defaults false, so a missing field
 * and an explicit false behave identically - `Caldaribase_hologram` is off for
 * this faction while `Caldarinavy_hologram` is on.
 */
function testFactionEntryWithoutIsVisibleIsHidden()
{
    const holograms = [
        { groupIndex: 1116, buildFilter: 0xffffffff },
        { groupIndex: 1117, buildFilter: 0xffffffff }
    ];

    const factionChildren = [
        { groupIndex: 1116, name: "Caldaribase_hologram" },
        { groupIndex: 1117, isVisible: true, name: "Caldarinavy_hologram" }
    ];

    assert.deepEqual(
        EveSOFData.FilterHullChildren(holograms, factionChildren),
        [ holograms[1] ],
        "only the faction's own hologram is built"
    );
}

/**
 * The faction gate Carbon does apply: an entry that exists AND says invisible.
 */
function testInvisibleFactionChildIsHidden()
{
    const child = { groupIndex: 3, buildFilter: 0xffffffff };
    const factionChildren = [ { groupIndex: 3, isVisible: false } ];
    assert.deepEqual(EveSOFData.FilterHullChildren([ child ], factionChildren), []);
}

function testVisibleFactionChildIsBuilt()
{
    const child = { groupIndex: 3, buildFilter: 0xffffffff };
    const factionChildren = [ { groupIndex: 3, isVisible: true } ];
    assert.deepEqual(EveSOFData.FilterHullChildren([ child ], factionChildren), [ child ]);
}

/**
 * A positive groupIndex with no faction entry is the same null lookup as -1, so
 * it is built too. This is the half of the old behaviour that was wrong for
 * ships as well as stations, not just for `groupIndex: -1`.
 */
function testChildWithNoMatchingFactionEntryIsStillBuilt()
{
    const child = { groupIndex: 7, buildFilter: 0xffffffff };
    const factionChildren = [ { groupIndex: 3, isVisible: true } ];
    assert.deepEqual(EveSOFData.FilterHullChildren([ child ], factionChildren), [ child ]);
}

/**
 * `(buildFilter & buildFlags) == 0` skips (`EveSOF.cpp:1765`). A child authored
 * only for instanced placements must not appear in a standalone build.
 */
function testBuildFilterExcludesOtherBuilds()
{
    const instancedOnly = { groupIndex: -1, buildFilter: INSTANCED_PLACEMENT };

    assert.deepEqual(EveSOFData.FilterHullChildren([ instancedOnly ], []), [], "not in a standalone build");
    assert.deepEqual(
        EveSOFData.FilterHullChildren([ instancedOnly ], [], INSTANCED_PLACEMENT),
        [ instancedOnly ],
        "but is in an instanced placement build"
    );
    assert.deepEqual(
        EveSOFData.FilterHullChildren([ instancedOnly ], [], NON_INSTANCED_PLACEMENT),
        [],
        "and not in a non-instanced one"
    );
    assert.equal(STANDALONE, 1, "STANDALONE is bit 0");
}

/**
 * Carbon returns null for groupIndex -1 BEFORE looking anything up
 * (`EveSOFDNA.cpp:713-714`), so a faction entry that also carries -1 cannot
 * hide an unconditional child. Ordering the two tests the other way round would
 * pass every test above and still break this one.
 */
function testMinusOneGroupIndexIgnoresAFactionEntryCarryingMinusOne()
{
    const child = { groupIndex: -1, buildFilter: 0xffffffff };
    const factionChildren = [ { groupIndex: -1, isVisible: false } ];
    assert.deepEqual(EveSOFData.FilterHullChildren([ child ], factionChildren), [ child ]);
}

function testHullOrderIsPreserved()
{
    const a = { groupIndex: -1, buildFilter: 0xffffffff };
    const b = { groupIndex: 2, buildFilter: 0xffffffff };
    const c = { groupIndex: 9, buildFilter: 0xffffffff };
    const factionChildren = [ { groupIndex: 2, isVisible: true } ];
    assert.deepEqual(EveSOFData.FilterHullChildren([ a, b, c ], factionChildren), [ a, b, c ]);
}


function loadSOFData()
{
    // EveSOFData imports ~40 modules and touches none of them in the two statics
    // under test, so anything not explicitly stubbed resolves to a permissive
    // proxy. Only the decorator surface and the module-scope defaults have to be
    // real enough for the class body to evaluate.
    const anything = makeAnything();

    // Named exports the module destructures are backed by the same fallback, so a
    // stub only has to name what the class body actually reads at definition time.
    const withFallback = obj => new Proxy(obj, {
        get: (target, key) => (key in target ? target[key] : anything)
    });

    return load("../src/sof/EveSOFData.js", {
        utils: withFallback({ meta: makeMeta(), isString: v => typeof v === "string" }),
        math: withFallback(makeMath())
    }, anything);
}

function makeAnything()
{
    // Self-referential: every property, call and construction yields the same
    // proxy, so an arbitrarily deep read like `X.EveSOFDataHullPlaneSet.Usage.SPACE_VIDEO`
    // resolves without the stub having to know the shape.
    const fn = function () {};
    const proxy = new Proxy(fn, {
        get(target, key)
        {
            if (key === Symbol.toPrimitive || key === "toString") return () => "stub";
            if (key === Symbol.iterator) return function* () {};
            return proxy;
        },
        apply() { return proxy; },
        construct() { return proxy; }
    });
    return proxy;
}

function makeMath()
{
    const arr = n => () => new Float32Array(n);
    const vec = n => ({ create: arr(n), fromValues: (...a) => Float32Array.from(a), copy: () => {}, set: () => {} });
    return {
        vec3: vec(3),
        vec4: vec(4),
        quat: { create: () => Float32Array.from([ 0, 0, 0, 1 ]), copy: () => {}, setAxisAngle: () => {} },
        mat4: { create: arr(16) },
        sph3: vec(4),
        box3: vec(6)
    };
}

function load(relativePath, modules, fallback)
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
    new Function("require", "module", "exports", output.code)(
        id => (id in modules ? modules[id] : fallback),
        module,
        module.exports
    );
    return module.exports;
}

function makeMeta()
{
    // `meta` carries dozens of decorators and factories. Both forms are answered by
    // one self-returning function, which has to tell apart being CALLED as a factory
    // (`meta.list("EveSOFDataFaction")`) from being APPLIED as a decorator. Babel's
    // legacy output is `dec(_class) || _class` and `dec(proto, key, desc) || desc`,
    // so returning undefined from the applied form keeps the original - which is
    // what we want, since the class itself must survive to be exported.
    const self = function (...args)
    {
        const target = args[0];
        const applied = typeof target === "function"
            || (typeof target === "object" && target !== null && args.length >= 2);

        return applied ? undefined : self;
    };

    const model = class { static init() {} };

    return new Proxy({}, {
        get: (target, key) => (key === "Model" ? model : self)
    });
}
