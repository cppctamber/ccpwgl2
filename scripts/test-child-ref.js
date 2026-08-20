/**
 * EveChildRef, 2026-08-20.
 *
 * `EveChildRef` was a `@meta.notImplemented` stub with `GetBatches() => false`,
 * which is the single reason no station shows its ad billboards: `chjita`'s SOF
 * build hangs the whole advert scene off one ref pointing at
 * `res:/dx9/model/hangar/caldari/chjita/effects/chjita_fx_01a.red`.
 *
 * Ground truth: `e:\carbonengine\trinity\trinity\Eve\SpaceObject\Children\EveChildRef.cpp`.
 * The base it extends here is stubbed, so these pin the ref's own behaviour -
 * loading, replacement, and the replay a late-arriving child needs - rather than
 * `EveChildContainer`'s, which has its own coverage.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { transformSync } = require("@babel/core");


const loads = [];
const { EveChildRef } = loadChildRef();

testLoadsItsChildOnInitialize();
testDoesNotLoadWhenAutomaticLoadingIsBlocked();
testChildIsVisibleToInheritedTraversals();
testReloadReplacesTheChild();
testAStaleLoadCannotOverwriteANewerOne();
testColourSetReachesAChildThatLoadsLater();
testControllerVariablesReachAChildThatLoadsLater();
testSetResPathOnlyReloadsOnAChange();
console.log("EveChildRef verified");


/**
 * Carbon loads in `Initialize` (cpp:50-58); ccpwgl's readers call `Initialize()`
 * once an object finishes deserializing, so the load starts as soon as the file
 * has supplied `resPath`.
 */
function testLoadsItsChildOnInitialize()
{
    const ref = makeRef({ resPath: "res:/a.red" });
    ref.Initialize();

    assert.deepEqual(loads.map(l => l.path), [ "res:/a.red" ], "requested its resource");

    const child = {};
    loads[0].resolve(child);
    assert.equal(ref.child, child, "and attached the result");
}

/**
 * `m_loadChildAutomatically` gates the load in every Carbon entry point
 * (cpp:29-33, 38-44, 52-56).
 */
function testDoesNotLoadWhenAutomaticLoadingIsBlocked()
{
    const ref = makeRef({ resPath: "res:/a.red", loadChildAutomatically: false });
    ref.Initialize();
    assert.equal(loads.length, 0, "no load requested");

    ref.SetAutoLoadBlocker(false);
    assert.equal(ref.Reload(), true, "unblocking then reloading does load");
    assert.equal(loads.length, 1);
}

/**
 * The point of extending `EveChildContainer`: the child must land in `objects`,
 * because that list is what every inherited traversal walks. A child held only
 * in `ref.child` would load and then never draw.
 */
function testChildIsVisibleToInheritedTraversals()
{
    const ref = makeRef({ resPath: "res:/a.red" });
    ref.Initialize();

    const child = {};
    loads[0].resolve(child);
    assert.deepEqual(ref.objects, [ child ], "child is in objects, not just ref.child");
}

/**
 * Carbon unregisters the old child before loading (cpp:326-330), so a reload
 * never leaves two children attached.
 */
function testReloadReplacesTheChild()
{
    const ref = makeRef({ resPath: "res:/a.red" });
    ref.Initialize();
    const first = {};
    loads[0].resolve(first);

    ref.SetResPath("res:/b.red");
    assert.equal(ref.child, null, "old child detached immediately");
    assert.deepEqual(ref.objects, [], "and removed from objects");

    const second = {};
    loads[1].resolve(second);
    assert.deepEqual(ref.objects, [ second ], "exactly one child after the reload");
}

/**
 * Loading is asynchronous here and synchronous in Carbon, so ccpwgl needs a
 * guard Carbon does not: a slow first load resolving after a second was started
 * must not attach itself over the newer child.
 */
function testAStaleLoadCannotOverwriteANewerOne()
{
    const ref = makeRef({ resPath: "res:/a.red" });
    ref.Initialize();
    ref.SetResPath("res:/b.red");

    const second = {};
    loads[1].resolve(second);
    loads[0].resolve({});                       // the stale one lands last

    assert.equal(ref.child, second, "the newer child survives");
    assert.deepEqual(ref.objects, [ second ]);
}

/**
 * A ref resolves its faction colours while the child is still in flight, and
 * `EveChildInheritProperties` does not keep the set it was given, so the ref
 * has to replay it (Carbon does the equivalent as it registers, cpp:339-343).
 */
function testColourSetReachesAChildThatLoadsLater()
{
    const ref = makeRef({ resPath: "res:/a.red" });
    ref.Initialize();

    const colorSet = { Primary: [ 1, 0, 0, 1 ] };
    ref.SetInheritProperties(colorSet);

    const received = [];
    loads[0].resolve({ SetInheritProperties: set => received.push(set) });

    assert.deepEqual(received, [ colorSet ], "the late child was given the colour set");
}

/**
 * Same ordering problem for controller variables: one set before the load must
 * still reach the child's controllers.
 */
function testControllerVariablesReachAChildThatLoadsLater()
{
    const ref = makeRef({ resPath: "res:/a.red" });
    ref.Initialize();
    ref.controllerVariables.set("ActivationStrength", 0.5);

    const received = [];
    loads[0].resolve({ SetControllerVariable: (name, value) => received.push([ name, value ]) });

    assert.deepEqual(received, [ [ "ActivationStrength", 0.5 ] ]);
}

/**
 * Carbon compares before assigning (cpp:28), so setting the same path again is
 * not a reload - which matters because a reload drops the live child.
 */
function testSetResPathOnlyReloadsOnAChange()
{
    const ref = makeRef({ resPath: "res:/a.red" });
    ref.Initialize();
    const child = {};
    loads[0].resolve(child);

    ref.SetResPath("res:/a.red");
    assert.equal(loads.length, 1, "no second load");
    assert.equal(ref.child, child, "child kept");
}


function makeRef(values = {})
{
    loads.length = 0;
    return Object.assign(new EveChildRef(), values);
}

function loadChildRef()
{
    // `EveChildContainer` is stubbed down to the surface `EveChildRef` actually
    // touches. Loading the real one would drag in the whole eve/curve/state
    // graph and test its behaviour rather than the ref's.
    const container = {
        EveChildContainer: class
        {
            objects = [];
            controllers = [];
            controllerVariables = new Map();
            inheritProperties = null;
            Initialize() {}
            SetInheritProperties() {}
        }
    };

    const resMan = {
        GetObject(path, onResolved)
        {
            loads.push({ path, resolve: onResolved });
        }
    };

    return load("../src/eve/child/EveChildRef.js", {
        utils: { meta: makeMeta() },
        global: { resMan },
        "./EveChildContainer": container
    });
}

function load(relativePath, modules)
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
        Model: class { static init() {} },
        abstract: property,
        type: () => value => value,
        ccp: { define: () => value => value },
        define: () => value => value,
        stage: () => value => value,
        wgl: { define: () => value => value },
        todo: () => value => value,
        notImplemented: property,
        enums: () => property,
        struct: () => property,
        list: () => property,
        path: property,
        string: property,
        boolean: property,
        uint: property,
        float: property,
        vector3: property,
        vector4: property,
        quaternion: property,
        matrix4: property,
        isPrivate: property
    };
}
