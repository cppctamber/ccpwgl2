/**
 * CPU particle constraints and generators, 2026-08-20.
 *
 * ccpwgl had no particle tests at all, and runtime-trinity has none for its
 * constraints either, so these are written against Carbon's C++ rather than
 * mirrored from an existing suite. Each test names the behaviour it pins.
 *
 * Ground truth: `e:\carbonengine\trinity\trinity\Particle\**`.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { transformSync } = require("@babel/core");
const { vec3, vec4, quat } = require("gl-matrix");


const m = loadParticleModules();

testPlanePushesParticlesOutAndBounces();
testPlaneLeavesParticlesOnTheGoodSideAlone();
testSphereProjectsParticlesOntoItsSurface();
testSphereInvertedKeepsParticlesInside();
testBlendScalesAndOffsets();
testConstraintsNoOpUntilBound();
testCollisionFiresGeneratorsWithTheCollidingParticle();
testRandomDirectionIsAUnitVector();
testConsecutiveIntegerWrapsInsideItsRange();
testCapsuleSpansItsEndpoints();
testDistributionExponentBiasesRadius();
testEmitterBudgetClampsTheBatch();
console.log("Particle constraints and generators verified");


// -- constraints ------------------------------------------------------------


/**
 * Carbon pushes a particle that crossed the plane back onto it and reflects the
 * velocity (`Tr2PlaneConstraint.cpp:114-187`). ccpwgl's constraint had an empty
 * body, so collisions did nothing at all.
 */
function testPlanePushesParticlesOutAndBounces()
{
    const ps = makeSystem({ position: [ 0, -2, 0 ], velocity: [ 0, -1, 0 ] });
    const constraint = new m.Tr2PlaneConstraint();

    vec4.set(constraint.plane, 0, 1, 0, 0);   // y = 0, normal up
    assert.equal(constraint.Bind(ps), true, "binds against position and velocity");

    const collisions = constraint.ApplyConstraint(ps._buffers, ps._instanceStride, 1, 0.016);

    assert.equal(collisions, 1, "the particle collided");
    assert.equal(readVec3(ps, "position")[1], 0, "and was pushed back onto the plane");
    assert.ok(readVec3(ps, "velocity")[1] > 0, "with its velocity reflected upward");
}

/**
 * A particle already on the right side, or moving away, must be untouched -
 * Carbon gates on `distance > 0 || velocityDot >= 0`.
 */
function testPlaneLeavesParticlesOnTheGoodSideAlone()
{
    const ps = makeSystem({ position: [ 0, 5, 0 ], velocity: [ 0, -1, 0 ] });
    const constraint = new m.Tr2PlaneConstraint();
    vec4.set(constraint.plane, 0, 1, 0, 0);
    constraint.Bind(ps);

    assert.equal(constraint.ApplyConstraint(ps._buffers, ps._instanceStride, 1, 0.016), 0);
    assert.equal(readVec3(ps, "position")[1], 5, "position untouched");
    assert.equal(readVec3(ps, "velocity")[1], -1, "velocity untouched");
}

/**
 * A particle inside the sphere is projected onto the surface at `radius`
 * (`Tr2SphereConstraint.cpp:142-178`).
 */
function testSphereProjectsParticlesOntoItsSurface()
{
    const ps = makeSystem({ position: [ 1, 0, 0 ], velocity: [ 0, 0, 0 ] });
    const constraint = new m.Tr2SphereConstraint();

    constraint.radius = 5;
    assert.equal(constraint.Bind(ps), true);
    constraint.ApplyConstraint(ps._buffers, ps._instanceStride, 1, 0.016);

    const position = readVec3(ps, "position");
    assert.ok(Math.abs(vec3.length(position) - 5) < 1e-5, `projected onto the surface, got ${vec3.length(position)}`);
    assert.ok(position[0] > 0, "along the direction it came from");
}

/**
 * Inverted, the sphere is a container: a particle OUTSIDE it is pulled back in.
 */
function testSphereInvertedKeepsParticlesInside()
{
    const ps = makeSystem({ position: [ 20, 0, 0 ], velocity: [ 0, 0, 0 ] });
    const constraint = new m.Tr2SphereConstraint();

    constraint.radius = 5;
    constraint.invertSphere = true;
    constraint.Bind(ps);
    constraint.ApplyConstraint(ps._buffers, ps._instanceStride, 1, 0.016);

    assert.ok(Math.abs(vec3.length(readVec3(ps, "position")) - 5) < 1e-5, "pulled onto the surface from outside");
}

/**
 * `value * originalFactor + value` per component
 * (`Tr2ElementBlendConstraint.cpp:31-107`).
 */
function testBlendScalesAndOffsets()
{
    const ps = makeSystem({ position: [ 2, 4, 6 ], velocity: [ 0, 0, 0 ] });
    const constraint = new m.Tr2ElementBlendConstraint();

    constraint.elementType = m.Tw2ParticleElement.Type.POSITION;
    constraint.originalFactor = 2;
    vec4.set(constraint.value, 1, 1, 1, 0);

    assert.equal(constraint.Bind(ps), true);
    constraint.ApplyConstraint(ps._buffers, ps._instanceStride, 1);

    assert.deepEqual(Array.from(readVec3(ps, "position")), [ 5, 9, 13 ], "scaled then offset");
}

/**
 * ccpwgl never called Bind on a constraint, so elements were never resolved.
 * An unbound constraint must be inert rather than throwing.
 */
function testConstraintsNoOpUntilBound()
{
    const ps = makeSystem({ position: [ 0, -2, 0 ], velocity: [ 0, -1, 0 ] });
    const constraint = new m.Tr2PlaneConstraint();
    vec4.set(constraint.plane, 0, 1, 0, 0);

    assert.equal(constraint.ApplyConstraint(ps._buffers, ps._instanceStride, 1, 0.016), 0, "inert while unbound");
    assert.equal(readVec3(ps, "position")[1], -2, "and it changed nothing");

    // And the system binds them itself.
    ps.constraints.push(constraint);
    ps.BindConstraints();
    assert.equal(constraint.isValid, true, "the system binds its constraints");
}

/**
 * Carbon fires the state's generators and emitters for the colliding particle.
 * ccpwgl passes ELEMENT objects and reads through the `offset` cursor, so the
 * cursor must point at the particle that actually collided - and be restored.
 */
function testCollisionFiresGeneratorsWithTheCollidingParticle()
{
    const ps = makeSystem({ position: [ 0, -2, 0 ], velocity: [ 0, -1, 0 ] });
    const constraint = new m.Tr2PlaneConstraint();
    vec4.set(constraint.plane, 0, 1, 0, 0);

    const seen = [];
    constraint.generators.push({
        Bind: () => true,
        Generate: (position, velocity, index) => seen.push({
            y: position.buffer[position.offset + 1],
            index
        })
    });

    const positionElement = ps.GetElement(m.Tw2ParticleElement.Type.POSITION);
    const cursorBefore = positionElement.offset;

    constraint.Bind(ps);
    constraint.ApplyConstraint(ps._buffers, ps._instanceStride, 1, 0.016);

    assert.equal(seen.length, 1, "the generator fired once");
    assert.equal(seen[0].index, 0, "for the colliding particle's index");
    assert.equal(seen[0].y, 0, "reading it at the collision point, through the cursor");
    assert.equal(positionElement.offset, cursorBefore, "and the cursor was put back");
}


// -- generators -------------------------------------------------------------


/** `Tr2RandomDirectionAttributeGenerator.cpp:37-67` - normalised, every time. */
function testRandomDirectionIsAUnitVector()
{
    const ps = makeSystem({ position: [ 0, 0, 0 ], velocity: [ 0, 0, 0 ] });
    const generator = new m.Tw2RandomDirectionAttributeGenerator();

    generator.elementType = m.Tw2ParticleElement.Type.VELOCITY;
    assert.equal(generator.Bind(ps), true);

    for (let i = 0; i < 50; i++)
    {
        generator.Generate(null, null, 0);
        const length = vec3.length(readVec3(ps, "velocity"));
        assert.ok(Math.abs(length - 1) < 1e-5, `expected a unit vector, got length ${length}`);
    }
}

/** `Tr2ConsecutiveIntegerAttributeGenerator.cpp:42-66` - counts, then wraps. */
function testConsecutiveIntegerWrapsInsideItsRange()
{
    const ps = makeSystem({ position: [ 0, 0, 0 ], velocity: [ 0, 0, 0 ] });
    const generator = new m.Tw2ConsecutiveIntegerAttributeGenerator();

    generator.elementType = m.Tw2ParticleElement.Type.VELOCITY;
    vec4.set(generator.minRange, 10, 0, 0, 0);
    vec4.set(generator.maxRange, 13, 0, 0, 0);   // range of 3
    assert.equal(generator.Bind(ps), true);

    const seen = [];
    for (let i = 0; i < 6; i++)
    {
        generator.Generate(null, null, 0);
        seen.push(readVec3(ps, "velocity")[0]);
    }

    assert.deepEqual(seen, [ 11, 12, 10, 11, 12, 10 ], "increments from min and wraps at max");

    // An empty or inverted range pins to min rather than reproducing Carbon's
    // unsigned-underflow modulus.
    const flat = new m.Tw2ConsecutiveIntegerAttributeGenerator();
    flat.elementType = m.Tw2ParticleElement.Type.VELOCITY;
    vec4.set(flat.minRange, 7, 0, 0, 0);
    vec4.set(flat.maxRange, 7, 0, 0, 0);
    flat.Bind(ps);
    flat.Generate(null, null, 0);
    assert.equal(readVec3(ps, "velocity")[0], 7, "a zero range pins to min");
}

/**
 * The capsule places particles between its two endpoints
 * (`Tr2CapsuleShapeAttributeGenerator.cpp:64-120`). With no radius and no cone,
 * every particle lands on the segment itself.
 */
function testCapsuleSpansItsEndpoints()
{
    const ps = makeSystem({ position: [ 0, 0, 0 ], velocity: [ 0, 0, 0 ] });
    const generator = new m.Tw2CapsuleShapeAttributeGenerator();

    generator.controlVelocity = false;
    generator.minRadius = 0;
    generator.maxRadius = 0;
    vec3.set(generator.positionStart, 0, 0, 0);
    vec3.set(generator.positionEnd, 0, 100, 0);

    assert.equal(generator.Bind(ps), true);

    let min = Infinity, max = -Infinity;
    for (let i = 0; i < 200; i++)
    {
        generator.Generate(null, null, 0);
        const y = readVec3(ps, "position")[1];
        assert.ok(y >= -1e-5 && y <= 100 + 1e-5, `landed outside the capsule at ${y}`);
        assert.ok(Math.abs(readVec3(ps, "position")[0]) < 1e-5, "and on the segment, with no radius");
        min = Math.min(min, y);
        max = Math.max(max, y);
    }

    assert.ok(min < 20 && max > 80, `should span the endpoints, saw ${min}..${max}`);
}

/**
 * Carbon samples radius as `min + (max - min) * pow(rand, exponent)`
 * (`Tr2SphereShapeAttributeGenerator.cpp:21-24`). ccpwgl ignored the exponent
 * AND defaulted it to 0 - applying it without fixing the default would have
 * pinned every particle to the maximum radius.
 */
function testDistributionExponentBiasesRadius()
{
    const generator = new m.Tw2SphereShapeAttributeGenerator();
    assert.equal(generator.distributionExponent, 1, "defaults to Carbon's flat distribution");

    const ps = makeSystem({ position: [ 0, 0, 0 ], velocity: [ 0, 0, 0 ] });
    generator.controlVelocity = false;
    generator.minRadius = 0;
    generator.maxRadius = 100;
    generator.distributionExponent = 8;   // heavily biased toward the centre
    generator.Bind(ps);

    let total = 0;
    const samples = 400;
    for (let i = 0; i < samples; i++)
    {
        generator.Generate(null, null, 0);
        total += vec3.length(readVec3(ps, "position"));
    }

    const mean = total / samples;
    assert.ok(mean < 40, `a high exponent should pull particles inward, mean radius was ${mean}`);
}


// -- emitter ----------------------------------------------------------------


/**
 * Carbon clamps the whole batch against the emitter's lifetime budget before
 * inserting any of it (`Tr2DynamicEmitter.cpp:172-179`). Negative is unlimited,
 * and that is the default - ccpwgl defaulted to 0, which would emit nothing.
 */
function testEmitterBudgetClampsTheBatch()
{
    const emitter = new m.Tw2DynamicEmitter();
    assert.equal(emitter.maxParticles, -1, "unlimited by default");

    const spawned = [];
    emitter.particleSystem = {
        BeginSpawnParticle: () => spawned.push(1) - 1,
        EndSpawnParticle: () => undefined
    };
    emitter._isValid = true;
    emitter.rate = 10;
    emitter.maxParticles = 4;

    emitter.SpawnParticles(null, null, 1);
    assert.equal(spawned.length, 4, "the batch is clamped to the budget");

    emitter.SpawnParticles(null, null, 1);
    assert.equal(spawned.length, 4, "and stays clamped once exhausted");

    emitter.Rebind();
    assert.equal(emitter._emittedParticles, 0, "rebinding resets the budget");
}


// -- harness ----------------------------------------------------------------


/**
 * A one-particle system with POSITION and VELOCITY in the CPU buffer, wired the
 * way `Tw2ParticleSystem` wires its own elements.
 */
function makeSystem(values)
{
    const ps = new m.Tw2ParticleSystem();
    const stride = 6;
    const buffer = new Float32Array(stride);

    const make = (type, startOffset) =>
    {
        const element = new m.Tw2ParticleElement();
        element.elementType = type;
        element.dimension = 3;
        element.usedByGPU = 0;
        element.startOffset = startOffset;
        element.offset = startOffset;
        element.instanceStride = stride;
        element.vertexStride = stride;
        element.buffer = buffer;
        return element;
    };

    const position = make(m.Tw2ParticleElement.Type.POSITION, 0);
    const velocity = make(m.Tw2ParticleElement.Type.VELOCITY, 3);

    ps._elements = [ position, velocity ];
    ps._stdElements = [ null, position, velocity, null ];
    ps._buffers = [ null, buffer ];
    ps._instanceStride = [ 0, stride ];
    ps._aliveCount = 1;
    ps._isValid = true;

    buffer.set(values.position, 0);
    buffer.set(values.velocity, 3);

    return ps;
}

/** Reads one element's three components for particle 0. */
function readVec3(ps, which)
{
    const element = ps.GetElement(which === "position"
        ? m.Tw2ParticleElement.Type.POSITION
        : m.Tw2ParticleElement.Type.VELOCITY);

    return element.buffer.subarray(element.startOffset, element.startOffset + 3);
}

function loadParticleModules()
{
    const
        meta = makeMeta(),
        utils = { meta, isString: value => typeof value === "string" },
        math = { vec3, vec4, quat, mat4: { create: () => new Float32Array(16) } },
        core = { Tw2VertexDeclaration: class { elements = []; RebuildHash() {} } },
        global = { device: { gl: null } };

    const element = load("../src/particle/element/Tw2ParticleElement.js", { utils, math });
    const elementBarrel = { Tw2ParticleElement: element.Tw2ParticleElement };

    const base = load("../src/particle/constraint/Tw2ParticleConstraint.js", { utils });
    const constraintDeps = {
        utils, math,
        "./Tw2ParticleConstraint": base,
        "../element": elementBarrel,
        "../element/Tw2ParticleElement": elementBarrel
    };

    const generatorBase = load("../src/particle/generators/Tw2ParticleAttributeGenerator.js", { utils, math });
    const generatorDeps = {
        utils, math,
        "./Tw2ParticleAttributeGenerator": generatorBase,
        "../element": elementBarrel,
        "../element/Tw2ParticleElement": elementBarrel
    };

    return {
        Tw2ParticleElement: element.Tw2ParticleElement,
        Tw2ParticleSystem: load("../src/particle/Tw2ParticleSystem.js", {
            utils, math, core, global, "./element": elementBarrel
        }).Tw2ParticleSystem,
        Tw2DynamicEmitter: load("../src/particle/emitter/Tw2DynamicEmitter.js", {
            utils, math,
            "./Tw2ParticleEmitter": load("../src/particle/emitter/Tw2ParticleEmitter.js", { utils, math })
        }).Tw2DynamicEmitter,
        Tr2PlaneConstraint: load("../src/particle/constraint/Tr2PlaneConstraint.js", constraintDeps).Tr2PlaneConstraint,
        Tr2SphereConstraint: load("../src/particle/constraint/Tr2SphereConstraint.js", constraintDeps).Tr2SphereConstraint,
        Tr2ElementBlendConstraint: load("../src/particle/constraint/Tr2ElementBlendConstraint.js", constraintDeps).Tr2ElementBlendConstraint,
        Tw2RandomDirectionAttributeGenerator: load("../src/particle/generators/Tw2RandomDirectionAttributeGenerator.js", generatorDeps).Tw2RandomDirectionAttributeGenerator,
        Tw2ConsecutiveIntegerAttributeGenerator: load("../src/particle/generators/Tw2ConsecutiveIntegerAttributeGenerator.js", generatorDeps).Tw2ConsecutiveIntegerAttributeGenerator,
        Tw2CapsuleShapeAttributeGenerator: load("../src/particle/generators/Tw2CapsuleShapeAttributeGenerator.js", generatorDeps).Tw2CapsuleShapeAttributeGenerator,
        Tw2SphereShapeAttributeGenerator: load("../src/particle/generators/Tw2SphereShapeAttributeGenerator.js", generatorDeps).Tw2SphereShapeAttributeGenerator
    };
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
        wgl: { define: () => value => value },
        todo: () => value => value,
        notImplemented: property,
        enums: () => property,
        struct: () => property,
        list: () => property,
        string: property,
        boolean: property,
        uint: property,
        float: property,
        vector3: property,
        vector4: property,
        quaternion: property,
        isPrivate: property
    };
}
