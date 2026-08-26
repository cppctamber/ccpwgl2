import {
    RS_ZENABLE, RS_ZWRITEENABLE, RS_ZFUNC, RS_CULLMODE, RS_ALPHABLENDENABLE,
    RS_ALPHATESTENABLE, RS_COLORWRITEENABLE, RS_SRCBLEND, RS_DESTBLEND, RS_BLENDOP,
    CMP_LEQUAL, BLENDOP_ADD
} from "constant";
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

/**
 * `(table rows, unused, unused, unused)`.
 *
 * Colours and sizes are NOT constants: one draw covers the whole system, and
 * particles from different emitters sit side by side. Each reads its own
 * emitter's row out of the parameter table, which is why only the table's
 * height is needed here.
 * @type {Object}
 */
const ParticleTable = constant("ParticleTable", [ "table rows", "atlas tiles", "unused", "unused" ], [ 64, 0, 0, 0 ]);

/** The position state: xyz position, w age. @type {Object} */
const ParticlePositionMap = createTex("ParticlePositionMap", TEX_2D, {
    ui: { components: [ "x", "y", "z", "age" ] }
});

/** The velocity state: xyz velocity, w lifetime. @type {Object} */
const ParticleVelocityMap = createTex("ParticleVelocityMap", TEX_2D, {
    ui: { components: [ "x", "y", "z", "lifetime" ] }
});

/** The attribute state: x emitter row, y birth seed. @type {Object} */
const ParticleAttributeMap = createTex("ParticleAttributeMap", TEX_2D, {
    ui: { components: [ "emitter row", "birth seed", "unused", "unused" ] }
});

/** The per-emitter parameter table. @type {Object} */
const ParticleParamsMap = createTex("ParticleParamsMap", TEX_2D, {
    ui: { components: [ "r", "g", "b", "a" ] }
});

/**
 * The sprite atlas.
 *
 * EVE ships one at `res:/fisfx/gpuparticles/systematlas.dds`: 1024x128, which
 * against the shipped `AtlasMapSize` of `(1024, 8)` is a STRIP of eight 128x128
 * tiles, not a grid. An emitter picks its tile with `textureIndex`, which is
 * why that field is in the parameter table.
 * @type {Object}
 */
const ParticleAtlasMap = createTex("ParticleAtlasMap", TEX_2D, {
    ui: { components: [ "r", "g", "b", "a" ] }
});


const TEXTURES = [ ParticlePositionMap, ParticleVelocityMap, ParticleAttributeMap, ParticleParamsMap, ParticleAtlasMap ];
const CONSTANTS = [ ParticleDrawData, ParticleTable ];


const vs = `#version 300 es

precision highp float;

// Vertex texture fetch. Guaranteed in WebGL2 - MAX_VERTEX_TEXTURE_IMAGE_UNITS is
// at least 16 - and the reason the state can live in a texture at all.
uniform sampler2D s0;            // ParticlePositionMap
uniform sampler2D s1;            // ParticleVelocityMap
uniform sampler2D s2;            // ParticleAttributeMap
uniform sampler2D s3;            // ParticleParamsMap

uniform vec4 cb1[24];            // per frame; 4-7 view-projection, 12-15 projection
uniform vec4 cb7[${CONSTANTS.length}];

out vec2 cornerUv;
out float lifeFraction;
flat out float emitterRow;

// See the note in particleUpdate: this layout belongs to
// Tw2GpuParticleParams.Pack and the two must be edited together.
vec4 emitterParam(float row, float texel, float rows)
{
    return texture(s3, vec2((texel + 0.5) / 8.0, (row + 0.5) / rows));
}

void main()
{
    float width = cb7[0].x;
    float height = cb7[0].y;

    int particle = gl_VertexID / 6;
    int corner = gl_VertexID % 6;

    // Texel centres, not texel corners. Sampling at the edge of a texel with
    // NEAREST is a coin flip between two particles.
    float x = (mod(float(particle), width) + 0.5) / width;
    float y = (floor(float(particle) / width) + 0.5) / height;
    vec2 uv = vec2(x, y);

    vec4 state = texture(s0, uv);
    vec4 motion = texture(s1, uv);
    vec4 attributes = texture(s2, uv);

    emitterRow = attributes.x;

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

    // ---- size, from this particle's own emitter -----------------------------
    float rows = cb7[1].x;

    vec4 sizeRow = emitterParam(emitterRow, 4.0, rows);      // sizes.xyz, colorMidpoint
    vec4 physics = emitterParam(emitterRow, 5.0, rows);      // sizeVariance drag gravity textureIndex

    // A QUADRATIC BEZIER over the three size keys, which is what Carbon does -
    // decoded from the shipped quads.sm_hi vertex shader, where it appears as
    // (1-t)^2*s0 + 2(1-t)t*s1 + t^2*s2 spelled out in registers.
    //
    // NOT linear interpolation through the keys. A Bezier does not pass through
    // its middle control point, it only leans toward it: with keys of
    // (1, 3, 0) a linear reading peaks at 3 and this peaks near 1.75. That
    // difference is most of why authored sizes came out too large.
    float t = lifeFraction;
    float u = 1.0 - t;
    float size = u * u * sizeRow.x + 2.0 * u * t * sizeRow.y + t * t * sizeRow.z;

    // Variance is ONE-SIDED in Carbon - 1 + variance * phase, with the phase
    // in [0,1) - so it only ever grows a particle. A symmetric spread would
    // shrink half of them and halve the mean size.
    //
    // The birth seed rather than a hash of the slot: a slot is reused, and
    // every particle born in it would otherwise be exactly the same size.
    size *= 1.0 + physics.x * attributes.y;

    // Carbon's flat quarter, applied right before the corner offsets. Its
    // corners are +/-1 like these, so this is a straight factor of four and not
    // a difference in how the quad is built.
    size *= 0.25;

    size *= cb7[0].z;

    // Dead collapses to a point and covers nothing.
    if (age < 0.0) offset = vec2(0.0);

    vec4 world = vec4(state.xyz, 1.0);

    vec4 clip;
    clip.x = dot(world, cb1[4]);
    clip.y = dot(world, cb1[5]);
    clip.z = dot(world, cb1[6]);
    clip.w = dot(world, cb1[7]);

    // The offset goes on in CLIP space, so the quad faces the camera whatever
    // the particle is doing, and is not scaled by w, so the perspective divide
    // shrinks distant particles.
    //
    // SCALED BY THE PROJECTION, which it was not before. A world-space quad of
    // half-size s lands at s * P / w in normalised coordinates, where P is the
    // projection's scale - roughly 1/tan(fov/2). Adding the size raw made every
    // particle P times too small: with a 1 radian field of view that is a
    // factor of about 1.8, and it is why authored sizes came out sub-pixel on a
    // hull hundreds of units across.
    //
    // Rows 12-15 are ProjectionMat (EveSpaceScene.perFrameData.vs). Only the
    // diagonal is needed, and the diagonal is unaffected by the transpose the
    // scene uploads.
    clip.xy += offset * size * vec2(cb1[12].x, cb1[13].y);

    gl_Position = clip;
}
`;

const ps = `#version 300 es

precision highp float;

uniform sampler2D s3;            // ParticleParamsMap
uniform sampler2D s4;            // ParticleAtlasMap

uniform vec4 cb7[${CONSTANTS.length}];

in vec2 cornerUv;
in float lifeFraction;
flat in float emitterRow;

out vec4 outColor;

vec4 emitterParam(float row, float texel, float rows)
{
    return texture(s3, vec2((texel + 0.5) / 8.0, (row + 0.5) / rows));
}

void main()
{
    float rows = cb7[1].x;
    float tiles = cb7[1].y;

    // FOUR colour keys with a movable midpoint, which is Carbon's curve and not
    // a gradient between two ends. The midpoint is what lets an effect flash
    // and then fade slowly, rather than crossing its whole range at a constant
    // rate.
    vec4 color0 = emitterParam(emitterRow, 0.0, rows);
    vec4 color1 = emitterParam(emitterRow, 1.0, rows);
    vec4 color2 = emitterParam(emitterRow, 2.0, rows);
    vec4 color3 = emitterParam(emitterRow, 3.0, rows);

    float midpoint = clamp(emitterParam(emitterRow, 4.0, rows).w, 0.001, 0.999);

    vec4 color;

    if (lifeFraction < midpoint)
    {
        float t = lifeFraction / midpoint;
        color = mix(color0, mix(color1, color2, t), t);
    }
    else
    {
        float t = (lifeFraction - midpoint) / (1.0 - midpoint);
        color = mix(color2, color3, t);
    }

    vec4 sprite;

    if (tiles >= 1.0)
    {
        // A strip of tiles across one texture, so only the horizontal
        // coordinate is divided.
        float tile = clamp(floor(emitterParam(emitterRow, 5.0, rows).w), 0.0, tiles - 1.0);

        vec2 tileUv = cornerUv * 0.5 + 0.5;
        sprite = texture(s4, vec2((tile + tileUv.x) / tiles, tileUv.y));
    }
    else
    {
        // NO ATLAS BOUND. A round dot from the corner coordinates, so the
        // simulation can be looked at before there is any art - which is how
        // every stage of this was built. Without the branch an unbound sampler
        // reads black and the whole system is invisible for a reason that has
        // nothing to do with particles.
        float r = length(cornerUv);
        if (r > 1.0) discard;
        // Alpha as well as rgb, because the blend weights by alpha.
        float falloff = 1.0 - smoothstep(0.4, 1.0, r);
        sprite = vec4(falloff);
    }

    // Carbon's own arithmetic: the atlas multiplies the particle colour on rgb
    // AND alpha - quads.sm_hi does r0 = texture2D(s0, uv) * colour and writes
    // both. The fade therefore rides on alpha and the blend applies it.
    //
    // (No backticks in here: this GLSL is a JS template literal, and one would
    // end the string.)
    //
    // NOT reproduced: that shader then encodes rgb to sRGB with the scene
    // gamma from cb2[21].w. ccpwgl handles output transfer elsewhere, and
    // adding a second encode here would double it.
    outColor = color * sprite;
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
                //
                // SRCALPHA over ONE, which is what Carbon's own quads shader
                // implies: it computes `atlas * colour` on rgb AND alpha and
                // writes both, so the alpha is meant to weight the result.
                //
                // Not every tile of the shipped atlas can be drawn this way.
                // Decoding all eight: six are ordinary soft sprites with alpha,
                // tile 2 is alpha-DOMINANT (6,849 fully opaque texels, rgb
                // never above 140), and tile 3 has alpha of exactly ZERO across
                // all 16,384 of its texels while carrying rgb content. Tile 3
                // therefore cannot be an alpha-blended sprite, and is presumably
                // not meant to be one.
                //
                // The earlier build here used ONE and took the shape from rgb
                // to make tile 3 draw. That was backwards - it was fitting the
                // blend to one arbitrarily chosen tile, and it made tile 2
                // far too dim.
                // EVERY STATE THIS PASS DEPENDS ON IS NAMED, including the
                // ones whose value looks like a default.
                //
                // ccpwgl does not restore per-pass render states, so a state
                // left unset is not "the default" - it is whatever the last
                // thing to draw happened to leave. ZFUNC was the one that bit:
                // the pass enabled the depth test without saying how to
                // compare, so it inherited the comparison from the hull's last
                // pass and particles were occluded or not depending on which
                // way the scene had left it. It cannot show up in a sandbox
                // where nothing else draws.
                [RS_ZENABLE]: 1,
                [RS_ZFUNC]: CMP_LEQUAL,
                [RS_ZWRITEENABLE]: 0,
                [RS_ALPHATESTENABLE]: 0,
                [RS_ALPHABLENDENABLE]: 1,
                [RS_COLORWRITEENABLE]: 0xf,
                [RS_BLENDOP]: BLENDOP_ADD,
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
        Table: ParticleTable,
        PositionMap: ParticlePositionMap,
        VelocityMap: ParticleVelocityMap,
        AttributeMap: ParticleAttributeMap,
        ParamsMap: ParticleParamsMap,
        AtlasMap: ParticleAtlasMap
    };

    /**
     * The atlas EVE ships, and how many tiles it holds.
     *
     * Both read off the shipped `Tr2GpuParticleSystem` at
     * `res:/fisfx/gpuparticles/system.black` rather than guessed: its `render`
     * effect binds this texture with an `AtlasMapSize` of `(1024, 8)`, and the
     * file measures 1024x128.
     * @type {Object}
     */
    static ATLAS = {
        path: "res:/fisfx/gpuparticles/systematlas.dds",
        tiles: 8
    };

    /** Six vertices per particle: two triangles, no vertex buffer. @type {Number} */
    static VERTICES_PER_PARTICLE = 6;

}
