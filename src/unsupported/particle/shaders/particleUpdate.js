import { RS_ZENABLE, RS_ZWRITEENABLE, RS_CULLMODE, RS_ALPHABLENDENABLE } from "constant";
import { createTex, TEX_2D, WidgetType } from "../../../toDeprecate/shaders/shared/util";
import { Tw2GpuParticleDrawShader } from "./particleDraw";


/**
 * The GPU particle simulation step.
 *
 * One fullscreen pass over the state textures: every texel is a particle, it is
 * read from the front pair, advanced by one frame, and written to the back pair.
 * {@link Tw2GpuParticleState} owns the textures and the swap.
 *
 * ## GLSL ES 3.00, and it has to be
 *
 * Two reasons, both hard limits of ES 1.00:
 *
 *   - **Two outputs.** Position and velocity are produced from the same reads,
 *     so writing them in one pass halves the work. ES 1.00 has `gl_FragData`
 *     only under an extension; ES 3.00 declares them natively.
 *   - **Dynamic indexing**, once the emitter parameters move into a texture and
 *     a particle looks its own emitter up.
 *
 * The shipped legacy shader hit exactly these two walls and could not compile.
 * That is not a reason to avoid its design - it is the reason to write the
 * design out in a language that permits it.
 *
 * ## The state layout
 *
 * ```
 *   attachment 0    xyz position    w age
 *   attachment 1    xyz velocity    w lifetime
 * ```
 *
 * `age < 0` means DEAD, and a dead particle is passed through untouched rather
 * than skipped: every texel must be written every frame, because the pass reads
 * the other side of the ping-pong and anything not written is last frame's
 * value from two frames ago.
 *
 * DIVERGENCE, and a temporary one. The legacy shader packs an emitter index and
 * a phase into the velocity's `w` and looks the lifetime up in an emitter
 * texture. This carries the lifetime there directly, so a single set of emitter
 * parameters can be supplied as constants and the simulation can be verified
 * before the emitter texture exists. The packing goes back when it does.
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
 * Seconds since the last step, in `.x`.
 *
 * Clamped by the CALLER, not here: the emitter already bills a long frame at
 * 1/15s and the simulation has to agree with it, so the clamp lives in one
 * place rather than in both.
 * @type {Object}
 */
const ParticleTime = constant(
    "ParticleTime",
    [ "delta time", "unused", "unused", "unused" ],
    [ 0, 0, 0, 0 ]
);

/**
 * `(gravity.xyz, drag)`.
 *
 * Gravity is an acceleration rather than Carbon's single scalar. Carbon stores
 * one float and the legacy shader applies it to Y alone; a vector costs nothing
 * here and does not bake an axis convention into the shader, which is the kind
 * of assumption that is expensive to find later.
 * @type {Object}
 */
const ParticleForces = constant(
    "ParticleForces",
    [ "gravity x", "gravity y", "gravity z", "drag" ],
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


// Positional binding: this order IS the s# order and the cb7 index order.
const TEXTURES = [ ParticlePositionMap, ParticleVelocityMap ];
const CONSTANTS = [ ParticleTime, ParticleForces ];

const CB_TIME = "cb7[0]";
const CB_FORCES = "cb7[1]";


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

uniform vec4 cb7[${CONSTANTS.length}];

in vec2 particleUv;

layout(location = 0) out vec4 outPosition;
layout(location = 1) out vec4 outVelocity;

void main()
{
    vec4 p = texture(s0, particleUv);
    vec4 v = texture(s1, particleUv);

    float dt = ${CB_TIME}.x;
    vec3 gravity = ${CB_FORCES}.xyz;
    float drag = ${CB_FORCES}.w;

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
        return;
    }

    // Drag opposes motion proportionally, so it is a force on the velocity
    // rather than a scale of it - which keeps it summing with the others
    // instead of ordering against them.
    vec3 accel = gravity - v.xyz * drag;

    // Semi-implicit Euler: velocity first, then position from the NEW velocity.
    // Explicit Euler with the old velocity loses energy on every step, which
    // shows up as particles falling short over a long life.
    vec3 velocity = v.xyz + accel * dt;
    vec3 position = p.xyz + velocity * dt;

    outPosition = vec4(position, aged);
    outVelocity = vec4(velocity, lifetime);
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

    /** Every definition, in the shape `tw2.Register({ shaders })` takes. @type {Array<Object>} */
    static All = [ definition, Tw2GpuParticleDrawShader.Definition ];

    /**
     * The named inputs, for a caller that has to set them.
     *
     * Grouped rather than loose so a consumer reads `Inputs.Time.name` instead
     * of importing four objects and hoping the names still match the shader.
     * @type {Object}
     */
    static Inputs = {
        Time: ParticleTime,
        Forces: ParticleForces,
        PositionMap: ParticlePositionMap,
        VelocityMap: ParticleVelocityMap
    };

}
