import { RS_ZENABLE, RS_ZWRITEENABLE, RS_CULLMODE, RS_ALPHABLENDENABLE } from "constant";
import { WidgetType } from "../../../toDeprecate/shaders/shared/util";


/**
 * Turns ONE emit request into a run of live particles.
 *
 * The emitter does not produce particles. `Tr2GpuSharedEmitter._SpawnBatch`
 * produces a REQUEST - a count, a segment the emitter swept during the frame, a
 * cone, and ranges for speed and lifetime - and this expands it. That split is
 * Carbon's, and it is why a million particles cost the CPU nothing: the
 * per-particle work never leaves the GPU.
 *
 * ## The run, and why the CPU still allocates it
 *
 * Carbon takes slots off a dead-list with an atomic pop. WebGL2 has no atomics
 * and no scatter, so slots are allocated as a RING on the CPU: the pass is told
 * where its run starts and how long it is, and every fragment in that rectangle
 * becomes a new particle. A ring recycles the oldest slot rather than the first
 * dead one, so a still-living particle can be overwritten when the system is
 * oversubscribed. That is a capacity problem showing itself honestly, and it is
 * the same trade the shipped precursor made.
 *
 * A run can cross rows and wrap the end of the texture, which no single
 * rectangle can express - the CALLER splits it and draws the pieces, all with
 * these same constants. Nothing here needs to know it was split, because the
 * sequence number is derived from the particle's own index rather than from
 * anything about the rasterised area.
 *
 * ## Randomness without a random number generator
 *
 * Each particle hashes its own index with the emitter's seed. Nothing is stored
 * between frames and nothing is read back: the same slot in the same batch
 * always produces the same particle, which is what makes a run reproducible and
 * therefore testable.
 *
 * ## Sub-frame spread
 *
 * The emitter passes the position it had at the START of the frame and the
 * position it has now. A particle is born somewhere along that segment
 * according to its place in the batch, so a fast moving emitter leaves a trail
 * rather than a cluster at one end of it. Carbon's `SpawnParticlesOverSegment`
 * exists for exactly this, and the JS side already bills it that way.
 */

/**
 * @param {String} name
 * @param {Array<String>} components
 * @param {Array<Number>} value
 * @returns {Object}
 */
function constant(name, components, value)
{
    return {
        name,
        value,
        ui: { display: 0, group: "Particles", components, widget: WidgetType.MIXED }
    };
}

/** `(run start, run count, state width, state height)`. @type {Object} */
const EmitRun = constant("EmitRun", [ "start", "count", "width", "height" ], [ 0, 0, 512, 1 ]);

/** The emitter's own seed, mixed into every hash. @type {Object} */
const EmitSeed = constant("EmitSeed", [ "seed", "unused", "unused", "unused" ], [ 0, 0, 0, 0 ]);

/** Where the emitter was at the start of the frame, with its radius in `.w`. @type {Object} */
const EmitPositionStart = constant("EmitPositionStart", [ "x", "y", "z", "radius" ], [ 0, 0, 0, 0 ]);

/** Where the emitter is now. @type {Object} */
const EmitPositionEnd = constant("EmitPositionEnd", [ "x", "y", "z", "unused" ], [ 0, 0, 0, 0 ]);

/** The cone's axis, with the outer half-angle in `.w`. @type {Object} */
const EmitDirection = constant("EmitDirection", [ "x", "y", "z", "angle" ], [ 0, 1, 0, 0 ]);

/** `(inner angle, min speed, max speed, unused)`. @type {Object} */
const EmitCone = constant("EmitCone", [ "inner angle", "min speed", "max speed", "unused" ], [ 0, 1, 1, 0 ]);

/** Velocity inherited from the emitter, already scaled by `inheritVelocity`. @type {Object} */
const EmitVelocity = constant("EmitVelocity", [ "x", "y", "z", "unused" ], [ 0, 0, 0, 0 ]);

/** `(min lifetime, max lifetime, unused, unused)`. @type {Object} */
const EmitLife = constant("EmitLife", [ "min lifetime", "max lifetime", "unused", "unused" ], [ 1, 1, 0, 0 ]);

/**
 * The row this emitter's parameters live in, written into every particle it
 * spawns so the simulation and the draw can look them up.
 * @type {Object}
 */
const EmitRow = constant("EmitRow", [ "row", "unused", "unused", "unused" ], [ 0, 0, 0, 0 ]);


// Positional binding: this order IS the cb7 index order.
const CONSTANTS = [
    EmitRun,
    EmitSeed,
    EmitPositionStart,
    EmitPositionEnd,
    EmitDirection,
    EmitCone,
    EmitVelocity,
    EmitLife,
    EmitRow
];


const vs = `#version 300 es

// The device's full screen quad. The rasterised area is limited by the SCISSOR,
// not by the geometry, so one quad serves every piece of a split run.
in vec4 attr0;
in vec2 attr1;

void main()
{
    gl_Position = attr0;
}
`;

const ps = `#version 300 es

precision highp float;

uniform vec4 cb7[${CONSTANTS.length}];

layout(location = 0) out vec4 outPosition;
layout(location = 1) out vec4 outVelocity;
layout(location = 2) out vec4 outAttributes;

// A cheap integer hash. Successive seeds give independent values, which is all
// the randomness a spawn needs and costs nothing to reproduce.
uint hash(uint x)
{
    x ^= x >> 16; x *= 0x7feb352du;
    x ^= x >> 15; x *= 0x846ca68bu;
    x ^= x >> 16;
    return x;
}

float random(uint x)
{
    // 24 bits into [0,1) - more than a float can distinguish anyway.
    return float(hash(x) >> 8) * (1.0 / 16777216.0);
}

void main()
{
    float runStart = cb7[0].x;
    float runCount = cb7[0].y;
    float width = cb7[0].z;
    float height = cb7[0].w;

    float capacity = width * height;

    // The slot's own index, from where the fragment landed. No varyings, so a
    // split run needs no per-piece setup.
    float index = floor(gl_FragCoord.y) * width + floor(gl_FragCoord.x);

    // Where this slot sits WITHIN the batch, wrapped, so the sub-frame spread
    // stays continuous across a run that wrapped the end of the texture.
    float sequence = mod(index - runStart + capacity, capacity);

    uint seed = uint(cb7[1].x) ^ hash(uint(index));

    float r0 = random(seed);
    float r1 = random(seed + 1u);
    float r2 = random(seed + 2u);
    float r3 = random(seed + 3u);
    float r4 = random(seed + 4u);
    float r5 = random(seed + 5u);

    // ---- position: along the swept segment, then off it by the radius -------
    float along = runCount > 1.0 ? sequence / runCount : 0.0;
    vec3 origin = mix(cb7[2].xyz, cb7[3].xyz, along);

    float radius = cb7[2].w;

    // A direction on the sphere from an area preserving mapping - taking two
    // angles uniformly instead would crowd the poles.
    float offsetZ = r0 * 2.0 - 1.0;
    float offsetPhi = r1 * 6.2831853;
    float offsetR = sqrt(max(0.0, 1.0 - offsetZ * offsetZ));
    vec3 offsetDir = vec3(offsetR * cos(offsetPhi), offsetR * sin(offsetPhi), offsetZ);

    // Cube root, so particles fill the volume evenly rather than bunching at
    // the centre.
    vec3 position = origin + offsetDir * radius * pow(r2, 1.0 / 3.0);

    // ---- direction: inside the cone -----------------------------------------
    vec3 axis = normalize(cb7[4].xyz);

    // An orthonormal basis around the axis. The branch avoids the degenerate
    // cross product when the axis happens to BE the reference vector.
    vec3 reference = abs(axis.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
    vec3 right = normalize(cross(reference, axis));
    vec3 upward = cross(axis, right);

    // Uniform in SOLID angle between the inner and outer cones, which is why
    // the cosines are interpolated rather than the angles.
    float cosOuter = cos(cb7[4].w);
    float cosInner = cos(cb7[5].x);
    float cosTheta = mix(cosInner, cosOuter, r3);
    float sinTheta = sqrt(max(0.0, 1.0 - cosTheta * cosTheta));
    float phi = r4 * 6.2831853;

    vec3 direction = axis * cosTheta + (right * cos(phi) + upward * sin(phi)) * sinTheta;

    float speed = mix(cb7[5].y, cb7[5].z, r5);

    // The emitter's velocity arrives already scaled by inheritVelocity - that
    // is a property of the emitter, not of the particle.
    vec3 velocity = direction * speed + cb7[6].xyz;

    float lifetime = mix(cb7[7].x, cb7[7].y, random(seed + 6u));

    // Born at age 0, NOT at a fraction of the frame. The segment already
    // spreads a batch through space, which is the part that shows; spreading it
    // through time as well would need the step to integrate each particle by a
    // different amount.
    outPosition = vec4(position, 0.0);
    outVelocity = vec4(velocity, lifetime);

    // The emitter row, and a birth seed. The seed has to be STORED rather than
    // recomputed from the slot: a slot is reused, so every particle born there
    // would otherwise be identical to the one before it.
    outAttributes = vec4(cb7[8].x, random(seed + 7u), 0.0, 0.0);
}
`;


const definition = {
    name: "tw2particleemit",
    description: "GPU particle emission",
    techniques: {
        Main: {
            vs: {
                inputDefinitions: [
                    { usage: "POSITION", usageIndex: 0, elements: 4 },
                    { usage: "TEXCOORD", usageIndex: 0, elements: 2 }
                ],
                shader: vs
            },
            ps: {
                constants: CONSTANTS,
                shader: ps
            },
            states: {
                // The same reasoning as the simulation step: this is a
                // computation whose output happens to be a colour attachment.
                [RS_ZENABLE]: 0,
                [RS_ZWRITEENABLE]: 0,
                [RS_ALPHABLENDENABLE]: 0,
                [RS_CULLMODE]: 1
            }
        }
    }
};


/**
 * The emission pass, exposed as statics for the reason given in
 * `src/unsupported/index.js`.
 */
export class Tw2GpuParticleEmitShader
{

    /** @type {Object} */
    static Definition = definition;

    /** @type {Object} */
    static Inputs = {
        Run: EmitRun,
        Row: EmitRow,
        Seed: EmitSeed,
        PositionStart: EmitPositionStart,
        PositionEnd: EmitPositionEnd,
        Direction: EmitDirection,
        Cone: EmitCone,
        Velocity: EmitVelocity,
        Life: EmitLife
    };

}
