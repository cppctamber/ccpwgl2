import { RS_ZENABLE, RS_ZWRITEENABLE, RS_CULLMODE, RS_ALPHABLENDENABLE } from "constant";
import { createTex, TEX_2D, WidgetType } from "../../../toDeprecate/shaders/shared/util";
import { Tw2GpuParticleDrawShader } from "./particleDraw";
import { Tw2GpuParticleEmitShader } from "./particleEmit";


/**
 * The GPU particle simulation step.
 *
 * One fullscreen pass over the state textures: every texel is a particle, it is
 * read from the front side, advanced by one frame, and written to the back.
 * {@link Tw2GpuParticleState} owns the textures and the swap.
 *
 * ## GLSL ES 3.00, and it has to be
 *
 * Two reasons, both hard limits of ES 1.00:
 *
 *   - **Three outputs.** Position, velocity and attributes are produced from
 *     the same reads, so writing them in one pass is a third of the work. ES
 *     1.00 has `gl_FragData` only under an extension; ES 3.00 declares them
 *     natively.
 *   - **Dynamic indexing**, which the emitter parameter lookup needs.
 *
 * The shipped legacy shader hit exactly these two walls and could not compile.
 * That is not a reason to avoid its design - it is the reason to write the
 * design out in a language that permits it.
 *
 * ## Every particle carries its emitter
 *
 * One pass covers the whole system, and particles from different emitters sit
 * side by side in the textures. So drag, gravity, turbulence and the attractor
 * cannot be constants: each particle reads its OWN emitter's row out of the
 * parameter table. {@link Tw2GpuParticleParams} owns that layout and is the
 * other half of this contract.
 *
 * What stays a constant is the frame's `dt` and the gravity AXIS. The first is
 * the same for everyone by definition; the second is a world convention rather
 * than a property of an emitter - Carbon stores gravity as one scalar and
 * applies it downward, and keeping the direction out here states that
 * convention once instead of baking it into the arithmetic.
 *
 * ## The state layout
 *
 * ```
 *   attachment 0    xyz position    w age
 *   attachment 1    xyz velocity    w lifetime
 *   attachment 2    x emitter row   y birth seed
 * ```
 *
 * `age < 0` means DEAD, and a dead particle is passed through untouched rather
 * than skipped: every texel must be written every frame, because the pass reads
 * the other side of the ping-pong and anything not written is that side's value
 * from two frames ago.
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

/**
 * `(delta time, time, unused, unused)`.
 *
 * `dt` is clamped by the CALLER, not here: the emitter already bills a long
 * frame at 1/15s and the simulation has to agree with it, so the clamp lives in
 * one place rather than in both. `time` drives turbulence, which has to move or
 * it is a static distortion field rather than a flow.
 * @type {Object}
 */
const ParticleTime = constant(
    "ParticleTime",
    [ "delta time", "time", "unused", "unused" ],
    [ 0, 0, 0, 0 ]
);

/**
 * `(gravity axis xyz, parameter table rows)`.
 *
 * The rows are here because the lookup has to turn a row number into a texture
 * coordinate, and only the caller knows how tall its table is.
 * @type {Object}
 */
const ParticleWorld = constant(
    "ParticleWorld",
    [ "gravity x", "gravity y", "gravity z", "table rows" ],
    [ 0, -1, 0, 64 ]
);

/** The front position texture: xyz position, w age. @type {Object} */
const ParticlePositionMap = createTex("ParticlePositionMap", TEX_2D, {
    ui: { components: [ "x", "y", "z", "age" ] }
});

/** The front velocity texture: xyz velocity, w lifetime. @type {Object} */
const ParticleVelocityMap = createTex("ParticleVelocityMap", TEX_2D, {
    ui: { components: [ "x", "y", "z", "lifetime" ] }
});

/** The front attribute texture: x emitter row, y birth seed. @type {Object} */
const ParticleAttributeMap = createTex("ParticleAttributeMap", TEX_2D, {
    ui: { components: [ "emitter row", "birth seed", "unused", "unused" ] }
});

/** The per-emitter parameter table. @type {Object} */
const ParticleParamsMap = createTex("ParticleParamsMap", TEX_2D, {
    ui: { components: [ "r", "g", "b", "a" ] }
});


// Positional binding: this order IS the s# order and the cb7 index order.
const TEXTURES = [ ParticlePositionMap, ParticleVelocityMap, ParticleAttributeMap, ParticleParamsMap ];
const CONSTANTS = [ ParticleTime, ParticleWorld ];


const vs = `#version 300 es

// The full-screen quad the device supplies: POSITION with four elements then
// TEXCOORD with two, stride 24.
in vec4 attr0;
in vec2 attr1;

out vec2 particleUv;

void main()
{
    particleUv = attr1;
    gl_Position = attr0;
}
`;

const ps = `#version 300 es

precision highp float;

// highp is not a preference here. State is positions in world space and ages in
// seconds; at mediump a particle's position quantises visibly and its age stops
// advancing once it is large enough relative to the step.

uniform sampler2D s0;            // ParticlePositionMap
uniform sampler2D s1;            // ParticleVelocityMap
uniform sampler2D s2;            // ParticleAttributeMap
uniform sampler2D s3;            // ParticleParamsMap

uniform vec4 cb7[${CONSTANTS.length}];

in vec2 particleUv;

layout(location = 0) out vec4 outPosition;
layout(location = 1) out vec4 outVelocity;
layout(location = 2) out vec4 outAttributes;

// One texel out of the per-emitter table. Eight texels per emitter, one emitter
// per row - the layout is owned by Tw2GpuParticleParams.Pack and the two must
// be edited together. Texel CENTRES, because the table is NEAREST and sampling
// at an edge is a coin flip between two emitters.
vec4 emitterParam(float row, float texel, float rows)
{
    return texture(s3, vec2((texel + 0.5) / 8.0, (row + 0.5) / rows));
}

// A stand-in turbulence field, and NOT Carbon's.
//
// Carbon samples a noise volume, which has not been ported. This is a sum of
// two sine octaves at frequencies that do not divide each other: cheap, and it
// reads as drift rather than as a grid. Each component is driven by the OTHER
// two axes, which makes the field divergence free - so it swirls particles
// around instead of pumping them into and out of the same points.
vec3 turbulence(vec3 p, float frequency, float time)
{
    vec3 q = p * frequency + time * 0.3;

    vec3 a = vec3(
        sin(q.y) + cos(q.z),
        sin(q.z) + cos(q.x),
        sin(q.x) + cos(q.y)
    );

    vec3 r = q * 2.17 + 11.3;

    vec3 b = vec3(
        sin(r.y) + cos(r.z),
        sin(r.z) + cos(r.x),
        sin(r.x) + cos(r.y)
    );

    return a + b * 0.5;
}

void main()
{
    vec4 p = texture(s0, particleUv);
    vec4 v = texture(s1, particleUv);
    vec4 a = texture(s2, particleUv);

    float dt = cb7[0].x;
    float time = cb7[0].y;
    vec3 gravityAxis = cb7[1].xyz;
    float rows = cb7[1].w;

    float age = p.w;
    float lifetime = v.w;

    // DEAD PARTICLES ARE COPIED, not skipped. Every texel is written every
    // frame: the pass writes the other side of the ping-pong, so a texel left
    // alone keeps whatever that side held two frames ago rather than what it
    // held last frame.
    if (age < 0.0)
    {
        outPosition = p;
        outVelocity = v;
        outAttributes = a;
        return;
    }

    float aged = age + dt;

    if (aged >= lifetime)
    {
        // Killed by writing a negative age. The position is kept as it was so a
        // reader can still see where the particle died, and nothing has to be
        // cleared.
        outPosition = vec4(p.xyz, -1.0);
        outVelocity = v;
        outAttributes = a;
        return;
    }

    // ---- this particle's own emitter ----------------------------------------
    float row = a.x;

    vec4 physics = emitterParam(row, 5.0, rows);     // sizeVariance drag gravity textureIndex
    vec4 fields = emitterParam(row, 6.0, rows);      // turbulence amp/freq, attractor strength
    vec4 attractor = emitterParam(row, 7.0, rows);   // attractor position

    float drag = physics.y;
    float gravity = physics.z;

    float turbulenceAmplitude = fields.x;
    float turbulenceFrequency = fields.y;
    float attractorStrength = fields.z;

    // Drag opposes motion proportionally, so it is a force on the velocity
    // rather than a scale of it - which keeps it summing with the others
    // instead of ordering against them.
    vec3 accel = gravityAxis * gravity - v.xyz * drag;

    if (turbulenceAmplitude != 0.0)
    {
        accel += turbulence(p.xyz, turbulenceFrequency, time) * turbulenceAmplitude;
    }

    if (attractorStrength != 0.0)
    {
        vec3 toAttractor = attractor.xyz - p.xyz;

        // Guarded, because a particle sitting exactly on the attractor gives a
        // zero length vector and normalize would hand back NaN - which then
        // spreads into the position and never leaves, since every later step
        // reads it back.
        float distance = length(toAttractor);
        if (distance > 1e-4) accel += (toAttractor / distance) * attractorStrength;
    }

    // Semi-implicit Euler: velocity first, then position from the NEW velocity.
    // Explicit Euler with the old velocity loses energy on every step, which
    // shows up as particles falling short over a long life.
    vec3 velocity = v.xyz + accel * dt;
    vec3 position = p.xyz + velocity * dt;

    outPosition = vec4(position, aged);
    outVelocity = vec4(velocity, lifetime);
    outAttributes = a;
}
`;


const definition = {
    name: "tw2particleupdate",
    description: "GPU particle simulation step",
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
                textures: TEXTURES,
                shader: ps
            },
            states: {
                // No depth and no blending. This is a computation whose output
                // happens to be a colour attachment: a depth test would discard
                // particles by their texel position, and blending would mix the
                // new state with the old.
                [RS_ZENABLE]: 0,
                [RS_ZWRITEENABLE]: 0,
                [RS_ALPHABLENDENABLE]: 0,
                [RS_CULLMODE]: 1
            }
        }
    }
};


/**
 * The GPU particle shaders, and the inputs they bind.
 *
 * A CLASS with statics rather than a set of exported objects, and not for
 * tidiness: `config.js` spreads whole namespaces into `constructors`, so a
 * plain object that reaches one of those barrels is registered as a class and
 * rejected at load. Exposing these as statics means they can be re-exported
 * anywhere without that risk. See the note above `constructors` in
 * `config.js`.
 */
export class Tw2GpuParticleShaders
{

    /** The simulation step. @type {Object} */
    static Update = definition;

    /** The emission pass. @type {Object} */
    static Emit = Tw2GpuParticleEmitShader.Definition;

    /** The draw pass. @type {Object} */
    static Draw = Tw2GpuParticleDrawShader.Definition;

    /** Every definition, in the shape `tw2.Register({ shaders })` takes. @type {Array<Object>} */
    static All = [ definition, Tw2GpuParticleEmitShader.Definition, Tw2GpuParticleDrawShader.Definition ];

    /**
     * The named inputs, for a caller that has to set them.
     *
     * Grouped rather than loose so a consumer reads `Inputs.Time.name` instead
     * of importing four objects and hoping the names still match the shader.
     * @type {Object}
     */
    static Inputs = {
        Time: ParticleTime,
        World: ParticleWorld,
        PositionMap: ParticlePositionMap,
        VelocityMap: ParticleVelocityMap,
        AttributeMap: ParticleAttributeMap,
        ParamsMap: ParticleParamsMap
    };

}
