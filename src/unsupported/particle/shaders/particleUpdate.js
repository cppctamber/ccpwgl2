import {
    RS_ZENABLE, RS_ZWRITEENABLE, RS_CULLMODE, RS_ALPHABLENDENABLE,
    RS_ALPHATESTENABLE, RS_COLORWRITEENABLE
} from "constant";
import { createTex, TEX_2D, TEX_VOLUME, WidgetType } from "../../../toDeprecate/shaders/shared/util";
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
    [ "delta time", "time", "force scale", "unused" ],
    [ 0, 0, 1, 0 ]
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

/**
 * `(origin offset xyz, noise ready)`.
 *
 * The offset shifts the whole field relative to the world, which lets a scene
 * rebase its origin without every particle's turbulence jumping.
 *
 * The fourth is a GATE, and it is not optional. Turbulence centres the noise on
 * zero by subtracting a half, so an UNLOADED texture - which samples as zero -
 * does not read as "no turbulence", it reads as -0.5 on every axis, every
 * octave, for every particle. Against an authored amplitude of 30 that is a
 * constant push of about 26 units per second squared along one fixed diagonal:
 * the entire system drifts one way. A missing texture becomes maximum force
 * rather than none, which is the worst possible failure mode and looks like a
 * physics bug rather than a loading one.
 *
 * The caller sets this to 1 only once the volume has actually loaded.
 * @type {Object}
 */
const ParticleNoise = constant(
    "ParticleNoise",
    [ "origin x", "origin y", "origin z", "noise ready" ],
    [ 0, 0, 0, 0 ]
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

/**
 * Carbon's turbulence field: a 32 cubed noise VOLUME.
 *
 * EVE ships it at `res:/texture/global/noise32cube_volume.dds` and ccpwgl loads
 * it as a real `TEXTURE_3D`. The shipped `update.sm_hi` binds it as `sampler3D`
 * and samples it three times per particle.
 * @type {Object}
 */
const ParticleNoiseMap = createTex("ParticleNoiseMap", TEX_VOLUME, {
    ui: { components: [ "r", "g", "b", "a" ] }
});


// Positional binding: this order IS the s# order and the cb7 index order.
const TEXTURES = [ ParticlePositionMap, ParticleVelocityMap, ParticleAttributeMap, ParticleParamsMap, ParticleNoiseMap ];
const CONSTANTS = [ ParticleTime, ParticleWorld, ParticleNoise ];


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

// A 3D sampler has NO default precision in ES 3.00 the way a 2D one does, so
// this is required rather than stylistic - without it the shader fails to
// compile with "'sampler3D' : No precision specified".
precision highp sampler3D;

// highp is not a preference here. State is positions in world space and ages in
// seconds; at mediump a particle's position quantises visibly and its age stops
// advancing once it is large enough relative to the step.

uniform sampler2D s0;            // ParticlePositionMap
uniform sampler2D s1;            // ParticleVelocityMap
uniform sampler2D s2;            // ParticleAttributeMap
uniform sampler2D s3;            // ParticleParamsMap
uniform sampler3D s4;            // ParticleNoiseMap - Carbon's 32 cubed volume

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

// CARBON'S TURBULENCE, decoded from the shipped update.sm_hi rather than
// invented. Three octaves of one 32 cubed noise volume at weights 1, 1/2 and
// 1/4, centred on zero by subtracting a half - the volume stores [0,1] and a
// force has to be able to push both ways.
//
// Two details that would not have been guessed, and were not:
//
//   - The field is ANIMATED BY ANOTHER NOISE SAMPLE. The lookup is offset by
//     noise(time / 32) rather than scrolled linearly, so the structure drifts
//     and deforms instead of sliding past in a straight line.
//   - The second octave's coordinates are SWIZZLED to .zyx as well as doubled.
//     Sampling the same volume at twice the frequency alone would repeat the
//     first octave's own structure at a smaller scale; permuting the axes
//     decorrelates them.
//
// The volume wraps, so no coordinate needs clamping - the sampler is REPEAT and
// the field is continuous across the seam by construction.
vec3 turbulence(vec3 position, float frequency, vec3 animation)
{
    vec3 base = position * frequency + texture(s4, animation).xyz;

    vec3 t = texture(s4, base).xyz - 0.5;
    t += (texture(s4, base.zyx * 2.0).xyz - 0.5) * 0.5;
    t += (texture(s4, base * 4.0).xyz - 0.5) * 0.25;

    return t;
}

void main()
{
    vec4 p = texture(s0, particleUv);
    vec4 v = texture(s1, particleUv);
    vec4 a = texture(s2, particleUv);

    float dt = cb7[0].x;
    float time = cb7[0].y;
    float forceScale = cb7[0].z;
    vec3 gravityAxis = cb7[1].xyz;
    float rows = cb7[1].w;
    vec3 originOffset = cb7[2].xyz;
    float noiseReady = cb7[2].w;

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

    vec3 accel = gravityAxis * gravity;

    // DRAG HAS TWO REGIMES, SELECTED BY ITS SIGN. Carbon branches on it: a
    // positive coefficient is ordinary linear drag proportional to speed, and a
    // NEGATIVE one is a constant deceleration along the direction of travel,
    // independent of how fast the particle is going. A negative drag is
    // therefore not "reverse drag", and treating it as one would make fast
    // particles accelerate.
    if (drag > 0.0)
    {
        accel -= v.xyz * drag;
    }
    else if (drag < 0.0)
    {
        float speed = length(v.xyz);
        if (speed > 1e-4) accel -= (v.xyz / speed) * drag;
    }

    // GATED ON THE TEXTURE BEING THERE. See ParticleNoise: an unloaded volume
    // samples as zero, and zero minus a half is a constant force, not an
    // absent one.
    if (turbulenceAmplitude != 0.0 && noiseReady > 0.0)
    {
        // The animation offset is a point in the volume that moves with time,
        // scaled the way Carbon scales it - 1/32, the volume's own resolution.
        vec3 animation = vec3(time * (1.0 / 32.0));
        accel += turbulence(p.xyz + originOffset, turbulenceFrequency, animation) * turbulenceAmplitude;
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

    // A DIAGNOSTIC, and the reason it is worth a multiply: set the scale to
    // zero and every force drops out, leaving each particle on the ballistic
    // path its emitter gave it. That separates "emitted in the wrong
    // direction" from "emitted correctly and then pushed", which look the same
    // once a particle has moved.
    accel *= forceScale;

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
                // EVERY STATE THIS PASS DEPENDS ON IS NAMED. ccpwgl does not
                // restore per-pass render states, so an unset state is not
                // "the default" - it is whatever the last thing to draw left.
                //
                // That matters more here than for a pass that draws a picture.
                // This one writes STATE: an inherited alpha test would discard
                // particles by their age, and an inherited colour write mask
                // would drop whole components of position or velocity. Either
                // corrupts the simulation silently and looks like a physics
                // bug.
                [RS_ZENABLE]: 0,
                [RS_ZWRITEENABLE]: 0,
                [RS_ALPHATESTENABLE]: 0,
                [RS_ALPHABLENDENABLE]: 0,
                [RS_COLORWRITEENABLE]: 0xf,
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
        Noise: ParticleNoise,
        PositionMap: ParticlePositionMap,
        VelocityMap: ParticleVelocityMap,
        AttributeMap: ParticleAttributeMap,
        ParamsMap: ParticleParamsMap,
        NoiseMap: ParticleNoiseMap
    };

    /**
     * Carbon's turbulence volume, as the shipped system binds it.
     * @type {String}
     */
    static NOISE = "res:/texture/global/noise32cube_volume.dds";

}
