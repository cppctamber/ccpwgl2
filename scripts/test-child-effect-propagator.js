/**
 * EveChildEffectPropagator, 2026-08-21.
 *
 * The name misleads: it does not propagate properties to children. It is a
 * SPAWNER - it holds one EveChildInstanceContainer as a template plus a list of
 * locators, and fires an instance at each one as a trigger sweeps the set.
 * Carbon's header says so (`EveChildEffectPropagator.h:14-17`).
 *
 * Ground truth:
 * `e:\carbonengine\trinity\trinity\Eve\SpaceObject\Children\EveChildEffectPropagator.cpp`,
 * cross-checked against runtime-trinity's complete port.
 *
 * Several of these pin failure modes that are SILENT: a sphere scalar left at 1
 * spawns nothing, an unsorted locator list breaks the early-out, and a template
 * that rebuilds itself discards every spawn. None of those throw.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { transformSync } = require("@babel/core");
const { vec3, vec4, mat4, quat } = require("gl-matrix");


const { EveChildEffectPropagator: Propagator } = loadPropagator();
const { PropagationType, TriggerType } = Propagator;

testLocalLocatorsBecomeSpawnPoints();
testCompletenessGateCanEmptyTheListAndStops();
testSphereScalarIsRecomputedFromTheLocators();
testLocatorsAreDistanceSortedNearestFirst();
testTriggerSphereFiresNearestFirstAsItGrows();
testRandomSpreadStaysInsideItsRange();
testInstantPermanentFiresEverythingOnce();
testIntervalRetiresOldInstancesAndRecycles();
testStopClearsTheSpawnedInstances();
testItTakesOwnershipOfTheTemplate();
testNothingDrawsUntilSomethingHasFired();
testLocatorRotationNameIsResolved();
console.log("EveChildEffectPropagator verified");


/** LOCAL_LOCATORS: one spawn point per locator on this node's own set. */
function testLocalLocatorsBecomeSpawnPoints()
{
    const p = makePropagator({ localLocators: locatorSet([ [ 10, 0, 0 ], [ 0, 20, 0 ] ]) });
    p.ProcessLocators(null);

    assert.equal(p._processedTransforms.length, 2);
}

/**
 * `completeness` skips locators at random. When it removes them all Carbon calls
 * `Stop()` (`cpp:535-539`) - drop that and the propagator spins on an empty list.
 */
function testCompletenessGateCanEmptyTheListAndStops()
{
    const p = makePropagator({ completeness: 0, localLocators: locatorSet([ [ 10, 0, 0 ] ]) });
    p.isPlaying = true;

    p.ProcessLocators(null);

    assert.equal(p._processedTransforms.length, 0);
    assert.equal(p.isPlaying, false, "Stop() was called");
}

/**
 * `triggerSphereScalarMulti` is NOT a user multiplier - every Process*Locators
 * path recomputes it, and it scales both the curve value and the sphere offset.
 * Left at 1 the sphere never reaches a locator and nothing spawns, silently.
 * Local locators: twice the farthest distance (`cpp:439`).
 */
function testSphereScalarIsRecomputedFromTheLocators()
{
    const p = makePropagator({ localLocators: locatorSet([ [ 3, 0, 0 ], [ 0, 0, 5 ] ]) });
    p.triggerSphereScalarMulti = 1;

    p.ProcessLocators(null);

    assert.equal(p.triggerSphereScalarMulti, 10, "2 x the farthest locator");
}

/** The sort is what makes ManageTriggers' early break correct (`cpp:558-566`). */
function testLocatorsAreDistanceSortedNearestFirst()
{
    const p = makePropagator({ localLocators: locatorSet([ [ 50, 0, 0 ], [ 5, 0, 0 ], [ 20, 0, 0 ] ]) });
    p.ProcessLocators(null);

    const distances = p._processedTransforms.map(r => r.sqrDistToSphereCenter);
    assert.deepEqual(distances, [ ...distances ].sort((a, b) => a - b), "ascending");
    assert.equal(p._processedTransforms[0].position[0], 5, "nearest first");
}

/**
 * The headline behaviour: a growing sphere swallows locators nearest-first and
 * fires one instance each (`cpp:142-169`).
 */
function testTriggerSphereFiresNearestFirstAsItGrows()
{
    const effect = makeEffect();
    const p = makePropagator({
        effect,
        localLocators: locatorSet([ [ 100, 0, 0 ], [ 10, 0, 0 ], [ 50, 0, 0 ] ]),
        triggerSphereRadiusCurve: curve(),
        triggerMethood: TriggerType.TRIGGER_SPHERE_CURVE
    });

    p.trigger = true;
    p.Update(0, mat4.create(), null, null);          // consumes the trigger, plays

    // scalar is 2x farthest = 200, so a curve value of v gives radius 200v
    p.triggerSphereRadiusCurve.value = 0.1;          // radius 20 -> only the nearest
    p.Update(0.016, mat4.create(), null, null);
    assert.equal(effect.created.length, 1, "only the nearest so far");
    assert.equal(effect.created[0].position[0], 10);

    p.triggerSphereRadiusCurve.value = 0.3;          // radius 60 -> the middle one too
    p.Update(0.016, mat4.create(), null, null);
    assert.equal(effect.created.length, 2);
    assert.equal(effect.created[1].position[0], 50);

    p.triggerSphereRadiusCurve.value = 0.9;          // radius 180 -> all three
    p.Update(0.016, mat4.create(), null, null);
    assert.equal(effect.created.length, 3);
}

/** RANDOM_SPREAD samples inside [minRangeThreshold, range] (`cpp:482-508`). */
function testRandomSpreadStaysInsideItsRange()
{
    const p = makePropagator({
        propagationType: PropagationType.RANDOM_SPREAD,
        numTriggers: 40,
        range: 100,
        minRangeThreshold: 10
    });

    p.ProcessLocators(null);

    assert.equal(p._processedTransforms.length, 40);

    for (const record of p._processedTransforms)
    {
        const d = vec3.length(record.position);
        assert.ok(d >= 10 - 1e-3 && d <= 100 + 1e-3, `distance ${d} inside the range`);
        assert.ok(Math.abs(vec3.length(record.rotation) - 1) < 1e-5, "rotation is a packed unit direction");
        assert.equal(record.rotation[3], 0, "with w = 0 - a direction, not a rotation");
    }

    assert.equal(p.triggerSphereScalarMulti, 100, "scalar becomes the range");
}

/** INSTANT_PERMANENT spawns the whole list once and never again (`cpp:224-231`). */
function testInstantPermanentFiresEverythingOnce()
{
    const effect = makeEffect();
    const p = makePropagator({
        effect,
        localLocators: locatorSet([ [ 1, 0, 0 ], [ 2, 0, 0 ], [ 3, 0, 0 ] ]),
        triggerMethood: TriggerType.INSTANT_PERMANENT
    });

    p.trigger = true;
    p.Update(0.016, mat4.create(), null, null);
    assert.equal(effect.created.length, 3);

    p.Update(0.016, mat4.create(), null, null);
    assert.equal(effect.created.length, 3, "does not fire again");
}

/**
 * INTERVAL_TRIGGERS paces spawning by frequency and retires expired instances at
 * the same rate; when deletions catch up the loop restarts (`cpp:277-319`).
 */
function testIntervalRetiresOldInstancesAndRecycles()
{
    const effect = makeEffect();
    const p = makePropagator({
        effect,
        localLocators: locatorSet([ [ 1, 0, 0 ], [ 2, 0, 0 ], [ 3, 0, 0 ] ]),
        triggerMethood: TriggerType.INTERVAL_TRIGGERS,
        frequency: 1,
        durationPerEffect: 2
    });

    p.trigger = true;
    p.Update(0, mat4.create(), null, null);
    assert.equal(effect.created.length, 0,
        "nothing at t=0 - the gate is playTime > index/frequency, and both are zero");

    p.Update(0.5, mat4.create(), null, null);
    assert.equal(effect.created.length, 1, "the first fires once time has passed");

    for (let i = 0; i < 4; i++) p.Update(1, mat4.create(), null, null);

    assert.ok(effect.created.length > 1, "more fired as time passed");
    assert.ok(effect.popped > 0, "and expired ones were retired");
}

/** Carbon `Stop` clears the spawned instances too (`cpp:120-130`). */
function testStopClearsTheSpawnedInstances()
{
    const effect = makeEffect();
    const p = makePropagator({ effect, localLocators: locatorSet([ [ 1, 0, 0 ] ]) });

    p.Play();
    effect.instances.push({});
    p.Stop();

    assert.equal(effect.instances.length, 0, "instance list cleared");
    assert.equal(p.isPlaying, false);
    assert.equal(p._currentTriggerIndex, 0);
}

/**
 * The trap that makes a working port produce nothing: the effect container
 * normally rebuilds its instance list from its own locator set whenever `_reset`
 * is set, which would DISCARD every spawn. The propagator owns the list.
 */
function testItTakesOwnershipOfTheTemplate()
{
    const effect = makeEffect();
    effect._reset = true;

    const p = makePropagator({ effect });
    p.Initialize();

    assert.equal(effect._reset, false, "the template will not rebuild itself");

    const other = makeEffect();
    other._reset = true;
    p.SetEffect(other);
    assert.equal(other._reset, false, "and a swapped-in template is claimed too");
}

/**
 * Carbon draws nothing while nothing has fired (`cpp:399-404`). That gate also
 * covers a ccpwgl-specific hazard: the instance container falls back to
 * returning its SOURCE when it holds no instances, so without this an
 * untriggered propagator would draw its template.
 */
function testNothingDrawsUntilSomethingHasFired()
{
    const effect = makeEffect();
    const p = makePropagator({
        effect,
        localLocators: locatorSet([ [ 1, 0, 0 ] ]),
        triggerMethood: TriggerType.INSTANT_PERMANENT
    });

    assert.equal(p.GetBatches(0, accumulator(), null), false, "nothing before a trigger");

    p.trigger = true;
    p.Update(0.016, mat4.create(), null, null);

    assert.equal(p.GetBatches(0, accumulator(), null), true, "and batches once fired");
}

/**
 * Carbon's locator quaternion is `direction`; ccpwgl's EveLocatorSetItem calls it
 * `rotation`. A literal port of the Carbon line yields undefined and SILENTLY
 * UNROTATED spawns, so both names must resolve.
 */
function testLocatorRotationNameIsResolved()
{
    const wanted = quat.setAxisAngle(quat.create(), [ 0, 1, 0 ], 1.2);

    const ccpwglStyle = makePropagator({ localLocators: locatorSet([ [ 1, 0, 0 ] ], "rotation", wanted) });
    ccpwglStyle.ProcessLocators(null);
    assertQuatEqual(ccpwglStyle._processedTransforms[0].rotation, wanted, "ccpwgl `rotation`");

    const carbonStyle = makePropagator({ localLocators: locatorSet([ [ 1, 0, 0 ] ], "direction", wanted) });
    carbonStyle.ProcessLocators(null);
    assertQuatEqual(carbonStyle._processedTransforms[0].rotation, wanted, "Carbon `direction`");
}


// -- harness ----------------------------------------------------------------


function assertQuatEqual(actual, expected, what)
{
    for (let i = 0; i < 4; i++)
    {
        assert.ok(Math.abs(actual[i] - expected[i]) < 1e-6, `${what}: element ${i}`);
    }
}

function makePropagator(values = {})
{
    return Object.assign(new Propagator(), values);
}

function locatorSet(positions, rotationKey = "rotation", rotation = null)
{
    return {
        locators: positions.map(p =>
        {
            const locator = { position: vec3.fromValues(...p) };
            locator[rotationKey] = rotation || quat.fromValues(0, 0, 0, 1);
            return locator;
        })
    };
}

function curve()
{
    return {
        value: 0,
        GetValueAt() { return this.value; },
        Length() { return 1000; }
    };
}

function makeEffect()
{
    return {
        _reset: false,
        instances: [],
        created: [],
        popped: 0,
        CreateInstance(scale, rotation, position)
        {
            const record = { scale: [ ...scale ], rotation: [ ...rotation ], position: [ ...position ] };
            this.created.push(record);
            this.instances.push(record);
            return record;
        },
        ClearInstanceList() { this.instances.length = 0; },
        PopFront() { this.popped++; this.instances.shift(); return true; },
        GetBatches(mode, acc) { acc.length++; return true; },
        GetResources(out) { return out; },
        SetControllerVariable() {}
    };
}

function accumulator()
{
    return { length: 0 };
}

function loadPropagator()
{
    const meta = makeMeta();

    const container = {
        EveChildContainer: class
        {
            display = true;
            objects = [];
            controllers = [];
            curveSets = [];
            controllerVariables = new Map();
            translation = vec3.create();
            rotation = quat.fromValues(0, 0, 0, 1);
            scaling = vec3.fromValues(1, 1, 1);
            localTransform = mat4.create();
            Initialize() {}
            Update() {}
            SetInheritProperties() {}
        }
    };

    const instanceContainer = {
        EveChildInstanceContainer: class
        {
            static GetLocatorsForSet(spaceObject, name)
            {
                if (!spaceObject) return null;
                return spaceObject._GetLocatorSetItems ? spaceObject._GetLocatorSetItems(name) : null;
            }
        }
    };

    return load("../src/eve/child/EveChildEffectPropagator.js", {
        utils: { meta },
        math: { vec3, vec4, mat4, quat },
        "./EveChildContainer": container,
        "./EveChildInstanceContainer": instanceContainer
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
    const self = function (...args)
    {
        const target = args[0];
        const applied = typeof target === "function"
            || (typeof target === "object" && target !== null && args.length >= 2);

        return applied ? undefined : self;
    };

    return new Proxy({}, {
        get: (target, key) => (key === "Model" ? class {} : self)
    });
}
