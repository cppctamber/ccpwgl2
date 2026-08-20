/**
 * EveChildInstanceContainer, 2026-08-21.
 *
 * The name is misleading and cost a wrong plan once: this is NOT GPU instancing.
 * Carbon says so in the header - "copies a source EveSpaceObjectChild across
 * locatorsets and or transforms" (`EveChildInstanceContainer.h:29-32`). Each
 * instance is a real child object, deep-copied from `source` and parented under
 * its own transform. `Tw2InstancedMesh` is a different mechanism and this class
 * never touches it.
 *
 * Ground truth:
 * `e:\carbonengine\trinity\trinity\Eve\SpaceObject\Children\EveChildInstanceContainer.cpp`.
 * Jita's container places by LOCATOR SET - verified against the shipped file,
 * which contains `locatorSet` and zero `transforms`.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { transformSync } = require("@babel/core");
const { vec3, vec4, mat4, quat } = require("gl-matrix");


const debugCalls = [];
const m = loadContainer();

testBuildsOneInstancePerLocator();
testBuildsOneInstancePerAuthoredTransform();
testLocatorsAndTransformsBothContribute();
testEachInstanceGetsItsOwnCopyNotTheSource();
testInstancePlacementComesFromTheLocator();
testBoneIndexIsCarriedOntoTheInstance();
testFallsBackToTheSourceWhenNothingWasPlaced();
testNoSourceMeansNoInstancesAndNoCrash();
testInstancesAreBuiltOnceNotEveryFrame();
testControllerVariablesReachInstancesBuiltLater();
testColourSetReachesInstancesBuiltLater();
testAFailedSourceCopyIsSurvivedAndReportedOnce();
console.log("EveChildInstanceContainer verified");


/**
 * Carbon walks the named locator set on the OWNING space object and makes one
 * instance per locator (`cpp:202-215`).
 */
function testBuildsOneInstancePerLocator()
{
    const container = makeContainer({ locatorSet: "advert", source: makeSource() });
    const ship = makeShip({ advert: [ locator([ 1, 0, 0 ]), locator([ 2, 0, 0 ]), locator([ 3, 0, 0 ]) ] });

    assert.equal(container.CreateInstances(ship), 3);
    assert.equal(container.instances.length, 3);
}

/**
 * The authored transform list does the same job without a locator set
 * (`cpp:217-220`).
 */
function testBuildsOneInstancePerAuthoredTransform()
{
    const container = makeContainer({
        source: makeSource(),
        transforms: [ transform([ 5, 0, 0 ]), transform([ 0, 5, 0 ]) ]
    });

    assert.equal(container.CreateInstances(null), 2);
}

/**
 * Carbon does not choose between them - the transform loop runs whether or not
 * locators were found, so a container with both gets both.
 */
function testLocatorsAndTransformsBothContribute()
{
    const container = makeContainer({
        locatorSet: "advert",
        source: makeSource(),
        transforms: [ transform([ 5, 0, 0 ]) ]
    });
    const ship = makeShip({ advert: [ locator([ 1, 0, 0 ]), locator([ 2, 0, 0 ]) ] });

    assert.equal(container.CreateInstances(ship), 3, "two locators plus one transform");
}

/**
 * The point of the class. Sharing one child across placements would make every
 * instance animate identically and sit at whichever transform ran last.
 */
function testEachInstanceGetsItsOwnCopyNotTheSource()
{
    const source = makeSource();
    const container = makeContainer({ source, transforms: [ transform([ 1, 0, 0 ]), transform([ 2, 0, 0 ]) ] });

    container.CreateInstances(null);

    const copies = container.instances.map(i => i.objects[0]);
    assert.equal(copies.length, 2);
    assert.notEqual(copies[0], copies[1], "instances do not share a child");
    assert.notEqual(copies[0], source, "and none of them IS the source");
}

/**
 * A locator contributes rotation, position and bone at UNIT SCALE - Carbon passes
 * `Vector3(1,1,1)` explicitly rather than the locator's own scaling (`cpp:211`).
 */
function testInstancePlacementComesFromTheLocator()
{
    const container = makeContainer({ locatorSet: "advert", source: makeSource() });
    const only = locator([ 10, 20, 30 ]);
    only.scaling = vec3.fromValues(7, 7, 7);

    container.CreateInstances(makeShip({ advert: [ only ] }));

    const instance = container.instances[0];
    assert.deepEqual([ ...instance.translation ], [ 10, 20, 30 ]);
    assert.deepEqual([ ...instance.scaling ], [ 1, 1, 1 ], "unit scale, not the locator's");
}

/**
 * Carbon reaches the bone by wrapping the instance in a SECOND container holding
 * an attach-to-bone modifier (`cpp:265-278`). ccpwgl's container resolves
 * `boneIndex` itself, so the bone is set on the one container - the assertion is
 * that the index survives, however it gets there.
 */
function testBoneIndexIsCarriedOntoTheInstance()
{
    const container = makeContainer({ locatorSet: "advert", source: makeSource() });
    const bony = locator([ 0, 0, 0 ]);
    bony.boneIndex = 4;

    container.CreateInstances(makeShip({ advert: [ bony, locator([ 1, 0, 0 ]) ] }));

    assert.equal(container.instances[0].boneIndex, 4);
    assert.equal(container.instances[1].boneIndex, -1, "a locator with no bone leaves it unset");
}

/**
 * Carbon `RunOnInstances` (cpp:318-331) falls back to the source when nothing was
 * placed, so a container naming a locator set the object does not have still
 * shows something. Without this, a mismatched name fails completely silently.
 */
function testFallsBackToTheSourceWhenNothingWasPlaced()
{
    const source = makeSource();
    const container = makeContainer({ locatorSet: "missing", source });

    assert.equal(container.CreateInstances(makeShip({ advert: [ locator([ 1, 0, 0 ]) ] })), 0);
    assert.deepEqual(container.GetInstances(), [ source ], "the source stands in");
}

function testNoSourceMeansNoInstancesAndNoCrash()
{
    const container = makeContainer({ locatorSet: "advert" });

    assert.equal(container.CreateInstances(makeShip({ advert: [ locator([ 1, 0, 0 ]) ] })), 0);
    assert.deepEqual(container.GetInstances(), []);
    assert.doesNotThrow(() => container.Update(0.016, mat4.create(), null, null));
}

/**
 * Instances are built in `Update` because the locator set lives on the owning
 * object, which is only reachable once it threads itself down - but the reset
 * flag must clear, or every frame would deep-copy the source again.
 */
function testInstancesAreBuiltOnceNotEveryFrame()
{
    const container = makeContainer({ locatorSet: "advert", source: makeSource() });
    const ship = makeShip({ advert: [ locator([ 1, 0, 0 ]), locator([ 2, 0, 0 ]) ] });

    container.Update(0.016, mat4.create(), null, ship);
    const built = container.instances.slice();

    container.Update(0.016, mat4.create(), null, ship);
    assert.deepEqual(container.instances, built, "same instance objects, not rebuilt");

    container.OnModified();
    container.Update(0.016, mat4.create(), null, ship);
    assert.notDeepEqual(container.instances, built, "but a modification does rebuild");
}

/**
 * A variable set before the instances existed must still reach them - Carbon
 * replays its recorded variables onto each instance as it is built (cpp:258-264).
 */
function testControllerVariablesReachInstancesBuiltLater()
{
    const container = makeContainer({ locatorSet: "advert", source: makeSource() });

    container.SetControllerVariable("ActivationStrength", 0.5);
    container.CreateInstances(makeShip({ advert: [ locator([ 1, 0, 0 ]) ] }));

    assert.deepEqual(container.instances[0].received, [ [ "ActivationStrength", 0.5 ] ]);
}

function testColourSetReachesInstancesBuiltLater()
{
    const container = makeContainer({ locatorSet: "advert", source: makeSource() });
    const colorSet = { Primary: [ 1, 0, 0, 1 ] };

    container.SetInheritProperties(colorSet);
    container.CreateInstances(makeShip({ advert: [ locator([ 1, 0, 0 ]) ] }));

    assert.equal(container.instances[0].colorSet, colorSet);
}


/**
 * STOPGAP guard, 2026-08-21. `Model.clone` round-trips through plain values and a
 * source whose curve-set bindings reference sibling objects does not survive it -
 * `Tw2ValueBinding.destinationObject` is an untyped not-owned struct, so
 * rebuilding it throws "Unknown struct constructor for destinationObject". That
 * took the whole object build down, once per attempted instance.
 *
 * A missing effect beats a dead page, but the warning must still fire - and fire
 * ONCE, not once per instance, or the real defect drowns.
 */
function testAFailedSourceCopyIsSurvivedAndReportedOnce()
{
    debugCalls.length = 0;

    const container = makeContainer({
        source: { Clone() { throw new ReferenceError("Unknown struct constructor for destinationObject"); } },
        transforms: [ transform([ 1, 0, 0 ]), transform([ 2, 0, 0 ]) ]
    });

    assert.doesNotThrow(() => container.CreateInstances(null), "the object build survives");
    assert.equal(container.instances.length, 0, "no instances, rather than a crash");
    assert.equal(debugCalls.length, 1, "reported once, not once per instance");
}


// -- harness ----------------------------------------------------------------


function makeContainer(values = {})
{
    return Object.assign(new m.EveChildInstanceContainer(), values);
}

/** A source child that can be cloned and counts its copies. */
function makeSource()
{
    let copies = 0;
    const source = {
        isSource: true,
        Clone() { return { copyOf: source, copyIndex: copies++ }; },
        GetResources(out) { return out; }
    };
    return source;
}

function locator(position)
{
    return {
        position: vec3.fromValues(...position),
        rotation: quat.fromValues(0, 0, 0, 1),
        scaling: vec3.fromValues(1, 1, 1),
        boneIndex: -1
    };
}

function transform(translation)
{
    return {
        scale: vec3.fromValues(1, 1, 1),
        rotation: quat.fromValues(0, 0, 0, 1),
        translation: vec3.fromValues(...translation),
        boneIndex: -1
    };
}

function makeShip(sets)
{
    return {
        _GetLocatorSetItems(name)
        {
            return sets[name] || null;
        }
    };
}

function loadContainer()
{
    const
        meta = makeMeta(),
        utils = { meta },
        math = { vec3, vec4, mat4, quat };

    // A stand-in for EveChildContainer that records what the container did to it.
    // The real one drags in the curve/controller/lighting graph, none of which is
    // what these tests are about.
    const container = {
        EveChildContainer: class
        {
            name = "";
            objects = [];
            transformModifiers = [];
            translation = vec3.create();
            rotation = quat.fromValues(0, 0, 0, 1);
            scaling = vec3.fromValues(1, 1, 1);
            boneIndex = -1;
            useSRT = true;
            received = [];
            colorSet = null;

            Initialize() {}
            SetControllerVariable(name, value) { this.received.push([ name, value ]); }
            SetInheritProperties(colorSet) { this.colorSet = colorSet; }
            Update() {}
            GetBatches() { return false; }
            GetResources(out) { return out; }
        }
    };

    return load("../src/eve/child/EveChildInstanceContainer.js", {
        utils,
        math,
        global: { tw2: { Debug: (...args) => debugCalls.push(args) } },
        "./EveChild": { EveChild: class { _lod = 3; } },
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
