import { RS_ZENABLE, RS_ZWRITEENABLE, RS_ZFUNC, RS_CULLMODE, CMP_LEQUAL, CULL_CW } from "constant";
import { GLSL_MATERIAL_RESOLVE, PickingQuadKind } from "./materialResolve";


/**
 * Material picking for the `quadv5` family.
 *
 * A STANDALONE shader, not a technique hung off the shipped one, so it can be
 * called independently and matched to its opaque equivalent. It draws no
 * lighting and samples none of the appearance maps - only the three that decide
 * which layer a texel belongs to.
 *
 * ## What it reproduces, and why exactly
 *
 * The pattern UVs are NOT the base UV. The shipped vertex stage projects the
 * object-space position through the two custom-mask matrices:
 *
 *     mirror   = -POSITION.x + abs(POSITION.x)          // 0 where x >= 0
 *     p        = CustomMaskData.y * vec3(mirror,0,0) + POSITION.xyz
 *     uv       = (vec2(dot(p4, row1), dot(p4, row2)) + 1.0) * 0.5
 *
 * with `CustomMaskMatrix0` rows 1 and 2 for pattern one and `CustomMaskMatrix1`
 * rows 1 and 2 for pattern two - rows 1 and 2 rather than 0 and 1 because the
 * matrices arrive transposed. `CustomMaskData.y` is the mirror flag, which is
 * what the existing `// enable, mirror` note in Tr2PerObjectData refers to.
 *
 * Sampling all four maps at the base UV instead would put both patterns in the
 * wrong place - subtly, and only where a pattern is, which is the worst way for
 * it to be wrong.
 *
 * ## PaintMaskMap is forced to 1
 *
 * Paint is "material -1": its colour comes from the authored Albedo RGB rather
 * than from data, and a user cannot recolour it. It is still a region worth
 * reporting, so it gets an id - but `PaintMapInfluence` is deliberately not
 * applied, because an influence value fading the paint out has nothing to do
 * with where the paint IS.
 *
 * ## Output
 *
 * See `cjsPackPicking`. Alpha is unavailable, so material and area type share
 * the red channel, and the background test is on red rather than alpha.
 */

const vs = `
attribute vec4 attr0;
attribute vec4 attr1;

uniform vec4 cb1[24];
uniform vec4 cb3[26];

varying vec4 texcoord;
varying vec4 patternUv;

void main()
{
    vec4 position = vec4(attr0.xyz, 1.0);

    vec4 world;
    world.x = dot(position, cb3[0]);
    world.y = dot(position, cb3[1]);
    world.z = dot(position, cb3[2]);
    world.w = dot(position, cb3[3]);

    gl_Position.x = dot(world, cb1[4]);
    gl_Position.y = dot(world, cb1[5]);
    gl_Position.z = dot(world, cb1[6]);
    gl_Position.w = dot(world, cb1[7]);

    texcoord.xy = attr1.xy;
    texcoord.zw = vec2(0.0);

    // The mirror term, exactly as the shipped stage builds it: zero where x is
    // positive, -2x where negative, so a mirrored pattern folds across x = 0.
    vec3 mirror = vec3(-attr0.x + abs(attr0.x), 0.0, 0.0);

    vec4 p1 = vec4(cb3[24].y * mirror + attr0.xyz, 1.0);
    vec4 p2 = vec4(cb3[25].y * mirror + attr0.xyz, 1.0);

    patternUv.xy = (vec2(dot(p1, cb3[17]), dot(p1, cb3[18])) + vec2(1.0)) * vec2(0.5);
    patternUv.zw = (vec2(dot(p2, cb3[21]), dot(p2, cb3[22])) + vec2(1.0)) * vec2(0.5);
}
`;

const ps = `
precision highp float;

uniform sampler2D MaterialMap;
uniform sampler2D PatternMask1Map;
uniform sampler2D PatternMask2Map;

// (material, pattern, paint, unused) - where the boundary sits along a
// gradient, 0.5 being the even split.
uniform vec4 PickingThreshold;

// The Carbon permutation option as a float - see PatternBlendMode.
uniform vec4 PatternBlendMode;

// (areaType, areaIndex, unused, unused), set per area by the picker.
uniform vec4 PickingArea;

varying vec4 texcoord;
varying vec4 patternUv;

${GLSL_MATERIAL_RESOLVE}

void main()
{
    float materialValue = texture2D(MaterialMap, texcoord.xy).x;
    float p1 = texture2D(PatternMask1Map, patternUv.xy).x;
    float p2 = texture2D(PatternMask2Map, patternUv.zw).x;

    // Paint coverage is forced to 1 - see the file header.
    float paint = 1.0;

    float material = cjsResolveMaterial(
        materialValue, p1, p2, paint,
        PatternBlendMode.x,
        PickingThreshold.xyz
    );

    gl_FragColor = cjsPackPicking(material, PickingArea.x, ${PickingQuadKind.QUAD}.0, PickingArea.y);
}
`;

export const quadPickingV5 = {
    name: "quadpickingv5",
    description: "material picking for the quadv5 family",
    techniques: {
        Main: {
            vs: {
                inputDefinitions: [
                    { usage: "POSITION", usageIndex: 0, elements: 3 },
                    { usage: "TEXCOORD", usageIndex: 0, elements: 2 }
                ],
                shader: vs
            },
            ps: {
                shader: ps
            },
            // Ordinary opaque depth so the nearest surface wins the pixel, and
            // the hull's own winding so picking covers exactly what is drawn.
            states: {
                [RS_ZENABLE]: 1,
                [RS_ZWRITEENABLE]: 1,
                [RS_ZFUNC]: CMP_LEQUAL,
                [RS_CULLMODE]: CULL_CW
            }
        }
    }
};
