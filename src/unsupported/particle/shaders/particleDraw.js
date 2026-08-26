import { RS_ZENABLE, RS_ZWRITEENABLE, RS_CULLMODE, RS_ALPHABLENDENABLE, RS_SRCBLEND, RS_DESTBLEND } from "constant";
import { createTex, TEX_2D, WidgetType } from "../../../toDeprecate/shaders/shared/util";


/**
 * Draws the particles the simulation has been moving.
 *
 * ## No vertex buffer at all
 *
 * The draw is `drawArrays(TRIANGLES, 0, particleCount * 6)` with nothing bound.
 * `gl_VertexID / 6` is which particle and `gl_VertexID % 6` is which corner of
 * its quad, and the position comes from the state texture by VERTEX TEXTURE
 * FETCH. There is no per-particle vertex data to build, upload or keep in sync,
 * which is the whole point of the state living in a texture.
 *
 * That trick is taken from the DX11 `quads` shader, which is the one stage of
 * the shipped system that translates to WebGL2 cleanly. Its lowering caps out at
 * 69 particles because the translator puts the state in uniform blocks; the idea
 * survives that, the implementation does not.
 *
 * ## Camera facing, from the one matrix that is verified
 *
 * The centre is projected, then the corner offset is added in CLIP space. That
 * is camera facing by construction - a clip-space offset is a screen-space
 * offset - and it needs only the view-projection.
 *
 * Rows 4-7 are `ViewProjectionMat`, TRANSPOSED - see
 * `EveSpaceScene.perFrameData.vs`, which owns the layout. Also there, unused
 * here: `ViewInverseTransposeMat` at 0-3, `ViewMat` at 8-11, `ProjectionMat` at
 * 12-15.
 *
 * Building the quad in VIEW space would be marginally better at a wide field of
 * view, and rows 8-15 make that possible. It is not worth two extra transforms
 * per vertex for a difference visible only at the edge of a wide frame.
 *
 * The whole block belongs to the SCENE. `device.perFrameVSData` is null until
 * an EveSpaceScene fills it, so a caller drawing these particles outside a
 * scene has to supply it - otherwise every position is (0,0,0,0) and the draw
 * is silently invisible, with no GL error to say so.
 *
 * ## Dead particles collapse
 *
 * A dead particle - `age < 0` - has its quad written to a single point, so it
 * covers no pixels. Cheaper and simpler than a discard in the fragment stage,
 * which would still rasterise it first.
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
 * `(width, height, size, unused)` - the state texture's dimensions, so the
 * shader can turn a particle index into a texel, and the quad's half size in
 * view units.
 * @type {Object}
 */
const ParticleDrawData = constant(
    "ParticleDrawData",
    [ "state width", "state height", "size", "unused" ],
    [ 512, 1, 1, 0 ]
);

/** Colour at birth, faded to `ParticleColorEnd` over the particle's life. @type {Object} */
const ParticleColorStart = constant("ParticleColorStart", [ "r", "g", "b", "a" ], [ 1, 1, 1, 1 ]);

/** @type {Object} */
const ParticleColorEnd = constant("ParticleColorEnd", [ "r", "g", "b", "a" ], [ 1, 1, 1, 0 ]);

/** The position state: xyz position, w age. @type {Object} */
const ParticlePositionMap = createTex("ParticlePositionMap", TEX_2D, {
    ui: { components: [ "x", "y", "z", "age" ] }
});

/** The velocity state: xyz velocity, w lifetime. @type {Object} */
const ParticleVelocityMap = createTex("ParticleVelocityMap", TEX_2D, {
    ui: { components: [ "x", "y", "z", "lifetime" ] }
});


const TEXTURES = [ ParticlePositionMap, ParticleVelocityMap ];
const CONSTANTS = [ ParticleDrawData, ParticleColorStart, ParticleColorEnd ];


const vs = `#version 300 es

precision highp float;

// Vertex texture fetch. Guaranteed in WebGL2 - MAX_VERTEX_TEXTURE_IMAGE_UNITS is
// at least 16 - and the reason the state can live in a texture at all.
uniform sampler2D s0;            // ParticlePositionMap
uniform sampler2D s1;            // ParticleVelocityMap

uniform vec4 cb1[24];            // per frame; rows 4-7 are the view-projection
uniform vec4 cb7[${CONSTANTS.length}];

out vec2 cornerUv;
out float lifeFraction;

void main()
{
    float width = cb7[0].x;
    float height = cb7[0].y;
    float size = cb7[0].z;

    int particle = gl_VertexID / 6;
    int corner = gl_VertexID % 6;

    // Texel centres, not texel corners. Sampling at the edge of a texel with
    // NEAREST is a coin flip between two particles.
    float x = (mod(float(particle), width) + 0.5) / width;
    float y = (floor(float(particle) / width) + 0.5) / height;
    vec2 uv = vec2(x, y);

    vec4 state = texture(s0, uv);
    vec4 motion = texture(s1, uv);

    float age = state.w;
    float lifetime = max(motion.w, 1e-6);
    lifeFraction = clamp(age / lifetime, 0.0, 1.0);

    // Two triangles: 0,1,2 and 2,1,3 in a quad's corner numbering.
    vec2 offsets[6] = vec2[6](
        vec2(-1.0, -1.0), vec2( 1.0, -1.0), vec2(-1.0,  1.0),
        vec2(-1.0,  1.0), vec2( 1.0, -1.0), vec2( 1.0,  1.0)
    );

    vec2 offset = offsets[corner];
    cornerUv = offset;

    // Dead collapses to a point and covers nothing.
    if (age < 0.0) offset = vec2(0.0);

    vec4 world = vec4(state.xyz, 1.0);

    vec4 clip;
    clip.x = dot(world, cb1[4]);
    clip.y = dot(world, cb1[5]);
    clip.z = dot(world, cb1[6]);
    clip.w = dot(world, cb1[7]);

    // The offset goes on in CLIP space, so the quad faces the camera whatever
    // the particle is doing. Not scaled by w, so the perspective divide shrinks
    // distant particles - which is what makes the field read as three
    // dimensional rather than as a flat spray of equal dots.
    clip.xy += offset * size;

    gl_Position = clip;
}
`;

const ps = `#version 300 es

precision highp float;

uniform vec4 cb7[${CONSTANTS.length}];

in vec2 cornerUv;
in float lifeFraction;

out vec4 outColor;

void main()
{
    // A round sprite from the corner coordinates, so a particle is a dot rather
    // than a visible square - and no texture is needed to see whether the
    // simulation is working.
    float r = length(cornerUv);
    if (r > 1.0) discard;

    float falloff = 1.0 - smoothstep(0.4, 1.0, r);

    vec4 start = cb7[1];
    vec4 end = cb7[2];

    outColor = mix(start, end, lifeFraction) * falloff;
}
`;


const definition = {
    name: "tw2particledraw",
    description: "GPU particle draw",
    techniques: {
        Main: {
            pass: 0,
            vs: {
                // NO INPUTS. Every vertex is derived from gl_VertexID, so there
                // is nothing to bind and nothing to keep in sync.
                inputDefinitions: [],
                shader: vs
            },
            ps: {
                constants: CONSTANTS,
                textures: TEXTURES,
                shader: ps
            },
            states: {
                // Additive and depth-read-only, which is what a particle system
                // wants and also why the shipped gles2 set never needed a sort:
                // additive blending is order independent.
                [RS_ZENABLE]: 1,
                [RS_ZWRITEENABLE]: 0,
                [RS_ALPHABLENDENABLE]: 1,
                [RS_SRCBLEND]: 5,
                [RS_DESTBLEND]: 2,
                [RS_CULLMODE]: 1
            }
        }
    }
};


/**
 * The draw pass, exposed as statics for the reason given in
 * `src/unsupported/index.js`.
 */
export class Tw2GpuParticleDrawShader
{

    /** @type {Object} */
    static Definition = definition;

    /** @type {Object} */
    static Inputs = {
        DrawData: ParticleDrawData,
        ColorStart: ParticleColorStart,
        ColorEnd: ParticleColorEnd,
        PositionMap: ParticlePositionMap,
        VelocityMap: ParticleVelocityMap
    };

    /** Six vertices per particle: two triangles, no vertex buffer. @type {Number} */
    static VERTICES_PER_PARTICLE = 6;

}
