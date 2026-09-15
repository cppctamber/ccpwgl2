import { precision } from "../shared/func";
import { createTex, TEX_2D } from "../shared/util";
import {
    RS_ZENABLE, RS_ZWRITEENABLE, RS_CULLMODE, CULL_NONE,
    RS_ALPHABLENDENABLE, RS_SRCBLEND, RS_DESTBLEND, BLEND_SRCALPHA, BLEND_INVSRCALPHA
} from "constant/d3d";


/**
 * GLES motionvector, ported from the shipped DX11 container.
 *
 * This replaced an EMPTY stub - a vertex shader that put every particle at (2,2)
 * and a pixel shader that wrote vec4(0) - which existed because the shipped GLES
 * program has more loops than the profile allows. The DX11 program has NO loops at
 * all: two branches and straight-line arithmetic. So it ports directly, and the
 * register layouts agree where it matters - `cb3[0..3]` is the per-object world
 * matrix and `cb1[8..11]` / `cb1[12..15]` are ViewMat / ProjectionMat on both
 * profiles (`EveSpaceScene.js` per-frame VS layout).
 *
 * Source: the translated GLSL of
 * `res:/graphics/effect.dx11/managed/space/specialfx/particles/motionvector.sm_depth`,
 * captured from a live draw on hardware (2026-09-16).
 *
 * TWO DELIBERATE OMISSIONS, both scene-fed samplers the manual definition cannot
 * reach, and both multiply-only so their absence leaves geometry and colour intact:
 *
 *   - the soft-depth fade against the scene depth buffer (DX11 `s1`), which scales
 *     alpha where a particle approaches geometry. Particles read hard-edged against
 *     intersecting hull instead of fading out.
 *   - the height-fog lookup (DX11 `s0`, a 2D array), which scales the final colour.
 *     It measured 1.0 on the hull tested, so dropping it changes nothing there.
 *
 * The DX11 program also ends with a gamma multiply and a linear->sRGB encode. GLES
 * manual programs write linear and let the target encode, so that tail is dropped
 * too - `planeglow` and the rest of this folder do the same.
 *
 * Constant registers are OURS, not the DX11 container's: it packs `UseWorldScale`
 * and `Depth` into one register, while a manual definition gives every declared
 * constant its own. So `cb0[3].x` is UseWorldScale and `cb0[4].x` is Depth here.
 */

const SpriteFactors = { name: "SpriteFactors", value: [ 0, 0, 0, 0 ] };
const VelocityStretch = { name: "VelocityStretch", value: [ 0, 0, 0, 0 ] };
const SpriteFactors2 = { name: "SpriteFactors2", value: [ 1, 1, 1, 1 ] };
const UseWorldScale = { name: "UseWorldScale", value: [ 0, 0, 0, 0 ] };
const Depth = { name: "Depth", value: [ 0, 0, 0, 0 ] };

const AtlasInfo = { name: "AtlasInfo", value: [ 1, 1, 1, 0 ] };
const Colors = { name: "Colors", value: [ 0, 1, 1, 0 ] };
const Colors2 = { name: "Colors2", value: [ 0, 0, 0, 1 ] };

const textures = [
    createTex("TextureMap", TEX_2D, { ui: { description: "Sprite atlas: red is the ramp lookup, alpha the coverage" } }),
    createTex("ColorRampMap", TEX_2D, { ui: { description: "Colour ramp, U from the atlas red channel and V from particle age" } }),
    createTex("GradientMap", TEX_2D, { ui: { description: "Flow map displacing the two atlas frames apart" } })
];

// The per-instance stream the particle system writes, in the order the DX11 input
// signature declares it: position, (age, rotation scale), velocity, (size start,
// size end), rotation base, rotation rate.
const inputDefinitions = [
    { usage: "POSITION", usageIndex: 0, elements: 3 },
    { usage: "TEXCOORD", usageIndex: 0, elements: 2 },
    { usage: "POSITION", usageIndex: 8, elements: 3 },
    { usage: "TANGENT", usageIndex: 8, elements: 2 },
    { usage: "NORMAL", usageIndex: 8, elements: 3 },
    { usage: "TEXCOORD", usageIndex: 8, elements: 2 },
    { usage: "TEXCOORD", usageIndex: 9, elements: 1 },
    { usage: "TEXCOORD", usageIndex: 10, elements: 1 }
];

const vs = `

attribute vec4 attr0;   // POSITION0  quad corner, -0.5..0.5
attribute vec4 attr1;   // TEXCOORD0  quad uv
attribute vec4 attr2;   // POSITION8  particle position
attribute vec4 attr3;   // TANGENT8   x: normalised age, y: rotation scale
attribute vec4 attr4;   // NORMAL8    particle velocity
attribute vec4 attr5;   // TEXCOORD8  x: size at birth, y: size at death
attribute vec4 attr6;   // TEXCOORD9  rotation base
attribute vec4 attr7;   // TEXCOORD10 rotation rate

varying vec4 texcoord;  // uv, age, view z
varying vec4 texcoord1; // clip z, clip w, depth scale

uniform vec4 cb0[5];
uniform vec4 cb1[16];
uniform vec4 cb3[4];
uniform vec3 ssyf;

void main()
{
    // The object's uniform scale, taken the way the donor takes it: transform (1,1,1)
    // by the world rotation and normalise by sqrt(3).
    vec3 unit;
    unit.x = dot(vec3(1.0, 1.0, 1.0), cb3[0].xyz);
    unit.y = dot(vec3(1.0, 1.0, 1.0), cb3[1].xyz);
    unit.z = dot(vec3(1.0, 1.0, 1.0), cb3[2].xyz);
    float worldScale = sqrt(dot(unit, unit)) * 0.5773502588272095;

    bool useWorldScale = cb0[3].x > 0.0;

    vec4 velocity;
    velocity.x = dot(attr4.xyz, cb3[0].xyz);
    velocity.y = dot(attr4.xyz, cb3[1].xyz);
    velocity.z = dot(attr4.xyz, cb3[2].xyz);
    velocity.w = dot(attr4.xyz, cb3[3].xyz);
    if (useWorldScale) velocity = velocity / worldScale;

    vec4 velocityView;
    velocityView.x = dot(velocity, cb1[8]);
    velocityView.y = dot(velocity, cb1[9]);
    velocityView.z = dot(velocity, cb1[10]);
    velocityView.w = dot(velocity, cb1[11]);

    vec4 local = vec4(attr2.xyz, 1.0);
    vec4 world;
    world.x = dot(local, cb3[0]);
    world.y = dot(local, cb3[1]);
    world.z = dot(local, cb3[2]);
    world.w = dot(local, cb3[3]);

    vec4 view;
    view.x = dot(world, cb1[8]);
    view.y = dot(world, cb1[9]);
    view.z = dot(world, cb1[10]);
    view.w = dot(world, cb1[11]);

    // Where the particle would be one velocity ahead, projected, gives the direction
    // it is travelling ON SCREEN - which is what the quad stretches along.
    vec4 ahead = velocityView + view;
    vec2 motion = vec2(dot(ahead, cb1[12]), dot(ahead, cb1[13]))
        - vec2(dot(view, cb1[12]), dot(view, cb1[13]));
    float motionLength = sqrt(dot(motion, motion));
    vec2 motionDirection = motion / motionLength;
    bool moving = motionLength > 0.0;

    float size = attr3.x * (attr5.y - attr5.x) + attr5.x;
    if (useWorldScale) size = size * worldScale;

    vec2 corner = size * attr0.xy;

    float angle = (attr3.x * attr7.x) * attr3.y + attr6.x + cb0[0].y;
    float sinA = sin(angle);
    float cosA = cos(angle);
    vec2 rotated = vec2(dot(vec2(cosA, -sinA), corner), dot(vec2(sinA, cosA), corner));

    vec4 corners = view + vec4(rotated, 0.0, 0.0);

    if (moving)
    {
        // How far along the screen-space motion this corner sits decides how much of
        // the velocity it is dragged by, so the quad shears into a streak.
        float along = dot(rotated, motionDirection);
        float stretch = clamp(attr3.x / cb0[2].x, 0.0, 1.0) * cb0[1].x;
        corners.xyz = (velocityView.xyz * stretch) * along + corners.xyz;
    }

    gl_Position.x = dot(corners, cb1[12]);
    gl_Position.y = dot(corners, cb1[13]);
    gl_Position.z = dot(corners, cb1[14]);
    gl_Position.w = dot(corners, cb1[15]);

    texcoord = vec4(attr1.xy, attr3.x, corners.z);
    texcoord1 = vec4(gl_Position.z, gl_Position.w, cb0[4].x, 0.0);

    gl_Position.xy += ssyf.xy * gl_Position.w;
    gl_Position.y *= ssyf.z;
    gl_Position.z = gl_Position.z * 2.0 - gl_Position.w;
}
`;

const ps = `

${precision}

varying vec4 texcoord;
varying vec4 texcoord1;

uniform sampler2D s0;   // TextureMap
uniform sampler2D s1;   // ColorRampMap
uniform sampler2D s2;   // GradientMap

uniform vec4 cb7[3];

// One atlas cell, from a frame index: row then column, each clamped to the atlas so
// a frame past the end repeats the last cell rather than wrapping into the first.
vec2 atlasUV(float frame, vec2 uv)
{
    float columns = cb7[0].x;
    float rows = cb7[0].y;
    float row = min(rows - 1.0, floor(frame / columns));
    float column = min(columns - 1.0, floor(frame - row * columns));
    return (clamp(uv, 0.0, 1.0) + vec2(column, row)) / vec2(columns, rows);
}

void main()
{
    float frames = cb7[0].x * cb7[0].y;
    bool loops = cb7[0].w > 0.0;

    float position = frames * fract(texcoord.z);
    float blend = fract(position);
    float first = floor(position);
    float last = frames - 1.0;

    float next = first + 1.0;
    next = loops ? (next >= frames ? 0.0 : next) : min(last, next);

    // A finished, non-looping sprite holds on its final frame.
    bool finished = !loops && texcoord.z >= 1.0;
    if (finished) { first = last; next = last; }

    // The flow map pushes the two frames apart along its gradient, so the crossfade
    // between them slides instead of ghosting.
    vec2 flowFirst = vec2(0.0, 0.0);
    vec2 flowNext = vec2(0.0, 0.0);
    if (cb7[1].w > 0.0)
    {
        vec2 a = texture2D(s2, atlasUV(first, texcoord.xy)).xy * 2.0 - 1.0;
        vec2 b = texture2D(s2, atlasUV(next, texcoord.xy)).xy * 2.0 - 1.0;
        flowFirst = a * blend * cb7[1].w;
        flowNext = b * (1.0 - blend) * cb7[1].w;
    }

    vec2 sampleFirst = texture2D(s0, atlasUV(first, clamp(texcoord.xy - flowFirst, 0.0, 1.0))).xw;
    vec2 sampleNext = texture2D(s0, atlasUV(next, clamp(texcoord.xy + flowNext, 0.0, 1.0))).xw;
    vec2 blended = sampleFirst + blend * (sampleNext - sampleFirst);

    if (blended.y <= 0.0) discard;

    float rampU = clamp((blended.x - cb7[1].x) / (cb7[1].y - cb7[1].x), 0.0, 1.0);
    vec4 ramp = texture2D(s1, vec2(rampU, texcoord.z));

    gl_FragData[0] = vec4(ramp.xyz * cb7[1].zzz, blended.y * ramp.w * cb7[2].w);
}
`;


export const motionvector = {
    name: "motionvector",
    replaces: "graphics/effect.gles2/managed/space/specialfx/particles/motionvector",
    description: "Motion vector particles, ported from the DX11 container",
    techniques: {
        Main: {
            vs: {
                inputDefinitions,
                constants: [ SpriteFactors, VelocityStretch, SpriteFactors2, UseWorldScale, Depth ],
                shader: vs
            },
            ps: {
                constants: [ AtlasInfo, Colors, Colors2 ],
                textures,
                shader: ps
            },
            // Soft particles: depth tested but not depth writing, alpha blended, and
            // two sided because a stretched quad can be dragged past edge-on.
            states: {
                [RS_ZENABLE]: 1,
                [RS_ZWRITEENABLE]: 0,
                [RS_CULLMODE]: CULL_NONE,
                [RS_ALPHABLENDENABLE]: 1,
                [RS_SRCBLEND]: BLEND_SRCALPHA,
                [RS_DESTBLEND]: BLEND_INVSRCALPHA
            }
        }
    }
};
