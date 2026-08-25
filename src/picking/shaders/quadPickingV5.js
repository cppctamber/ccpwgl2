import {
    RS_ZENABLE, RS_ZWRITEENABLE, RS_ZFUNC, RS_CULLMODE,
    RS_ALPHABLENDENABLE, RS_ALPHATESTENABLE,
    CMP_LEQUAL, CULL_CW
} from "constant";
import { precision } from "../../toDeprecate/shaders/shared/func";
import { GLSL_MATERIAL_RESOLVE, PickingShaderKind } from "./materialResolve";
import {
    PickingThreshold, PatternBlendMode, PickingArea, PickingInclude,
    MaterialMap, PatternMask1Map, PatternMask2Map, AlphaThresholdMap
} from "./pickingInputs";


/**
 * Material picking for the ten plain `quadXv5` kinds.
 *
 * STANDALONE shaders, not techniques hung off the shipped ones, so they can be
 * called independently and matched to their opaque equivalent. They draw no
 * lighting and sample none of the appearance maps - only the ones that decide
 * which layer a texel belongs to.
 *
 * One body, ten definitions. The kinds differ in three ways that matter to
 * picking and in no others: whether the pattern masks exist (five of ten bind
 * them), whether an alpha clip applies (wreck alone), and which kind they
 * report. Heat glow, oil film, glass fog and wreck colouring change how a
 * surface LOOKS, not which layer it is.
 *
 * ## Binding is POSITIONAL, and that is not a style choice
 *
 * The manual shader path packs a technique's `constants` into one array
 * uploaded as `cb7` for the pixel stage, and binds `textures` to sampler unit
 * == register index, located as `s0`, `s1`, ... There is NO name-based binding.
 *
 * So `uniform sampler2D MaterialMap` links, defaults to zero and is never
 * written - it does not fail, it silently reads nothing. The first version of
 * this file did exactly that. The declaration arrays below ARE the register
 * order, and the GLSL indices follow them.
 *
 * Because five kinds bind no pattern masks, the register order differs between
 * kinds, so the indices are computed from the list rather than hardcoded.
 *
 * ## What it reproduces, and why exactly
 *
 * The pattern UVs are NOT the base UV. The shipped vertex stage projects the
 * object-space position through the two custom-mask matrices:
 *
 *     mirror = -POSITION.x + abs(POSITION.x)          // 0 where x >= 0
 *     p      = vec4(CustomMaskData.y * vec3(mirror,0,0) + POSITION.xyz, 1.0)
 *     uv     = (vec2(dot(p, row1), dot(p, row2)) + 1.0) * 0.5
 *
 * with `CustomMaskMatrix0` rows 1 and 2 for pattern one and `CustomMaskMatrix1`
 * rows 1 and 2 for pattern two - rows 1 and 2 rather than 0 and 1 because the
 * matrices arrive transposed. `CustomMaskData.y` is the mirror flag, which is
 * what the `// enable, mirror` note in Tr2PerObjectData refers to. Verified
 * independently against the compiled container.
 *
 * Sampling all the maps at the base UV instead would put both patterns in the
 * wrong place - subtly, and only where a pattern is.
 *
 * KNOWN DEVIATION: the shipped pixel stage samples at
 * `mix(vs_r7, clamp(vs_r7, 0, 1), cb4[26])` - a blend between the raw and the
 * clamped UV under a constant - where this samples the raw UV. That differs
 * only outside the 0..1 range, where the shipped shader can clamp and this
 * does not.
 *
 * ## PaintMaskMap is forced to 1
 *
 * Paint is "material -1": its colour comes from the authored Albedo RGB rather
 * than from data, and a user cannot recolour it. It is still a region worth
 * reporting, so it gets an id - but `PaintMapInfluence` is deliberately not
 * applied, because an influence value fading the paint out has nothing to do
 * with where the paint IS.
 *
 * ## NOT YET RESOLVED: the per-kind sub-layers
 *
 * `quaddetailv5`, `quadheatdetailv5` and `quadenvironmentv5` carry three detail
 * layers, and `quadsailsv5` a sails layer. These report the base material
 * UNDERNEATH them. The three detail maps are merged by ccpwgl's own emitter
 * into one `sampler2DArray` (`detail-map-array` -> `DetailArrayMap`), so a
 * picking shader for them needs an array sampler, and the selection rule has
 * not been extracted. `DETAIL1..3` and `SAILS_DETAIL` are reserved, not
 * emitted.
 *
 * What every kind carries and is deliberately ignored: `MtlNDustDiffuseColor`
 * and `MtlNHeatGlowData` are properties OF a material - dust on it, heat
 * through it - not layers beside it, so they get no id.
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

// The constant order IS the cb7 index order.
const CONSTANTS = [ PickingThreshold, PatternBlendMode, PickingArea, PickingInclude ];

const CB_THRESHOLD = "cb7[0]";
const CB_BLEND_MODE = "cb7[1]";
const CB_AREA = "cb7[2]";
const CB_INCLUDE = "cb7[3]";

/**
 * @param {Number} kind
 * @param {Array<Object>} textures - declaration order, which is the s# order
 * @param {Boolean} hasPatterns
 * @param {Boolean} alphaClip
 * @returns {String}
 */
function makePs(kind, textures, hasPatterns, alphaClip)
{
    // The register index comes from the declaration list, because it differs
    // between kinds - five of them declare no pattern masks.
    const reg = name => "s" + textures.findIndex(t => t.name === name);

    const declarations = textures
        .map((t, i) => `uniform sampler2D s${i};            // ${t.name}`)
        .join("\n");

    // Wreck geometry is alpha clipped. Without the same clip, picking reports
    // hits on holes that are not there - and a wreck is mostly holes.
    const clip = alphaClip
        ? `    if (texture2D(${reg("AlphaThresholdMap")}, texcoord.xy).x <= 0.5) discard;\n`
        : "";

    const patterns = hasPatterns
        ? `    float p1 = texture2D(${reg("PatternMask1Map")}, patternUv.xy).x;
    float p2 = texture2D(${reg("PatternMask2Map")}, patternUv.zw).x;`
        : `    // This kind binds no pattern masks at all, so PMtl1 and PMtl2 cannot
    // occur. Sampling them would read textures the effect never binds.
    float p1 = 0.0;
    float p2 = 0.0;`;

    return `
${precision}

${declarations}

uniform vec4 cb7[${CONSTANTS.length}];

varying vec4 texcoord;
varying vec4 patternUv;

${GLSL_MATERIAL_RESOLVE}

void main()
{
${clip}    float materialValue = texture2D(${reg("MaterialMap")}, texcoord.xy).x;

${patterns}

    // Paint coverage is forced to 1 - see the file header.
    float paint = 1.0;

    float material = cjsResolveMaterial(
        materialValue, p1, p2, paint,
        ${CB_BLEND_MODE}.x,
        ${CB_THRESHOLD}.xyz,
        ${CB_INCLUDE}
    );

    gl_FragColor = cjsPackPicking(material, ${CB_AREA}.x, ${kind}.0, ${CB_AREA}.y);
}
`;
}

/**
 * @param {String} name
 * @param {Number} kind
 * @param {Object} [opt]
 * @param {Boolean} [opt.patterns]
 * @param {Boolean} [opt.alphaClip]
 * @returns {Object}
 */
function makeDefinition(name, kind, opt = {})
{
    const textures = [ MaterialMap ];
    if (opt.patterns) textures.push(PatternMask1Map, PatternMask2Map);
    if (opt.alphaClip) textures.push(AlphaThresholdMap);

    return {
        name,
        description: "material picking for the " + name.replace("picking", "") + " family",
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
                    constants: CONSTANTS,
                    textures,
                    shader: makePs(kind, textures, !!opt.patterns, !!opt.alphaClip)
                },
                states: {
                    // Ordinary opaque depth so the nearest surface wins the
                    // pixel, and the hull's own winding so picking covers what
                    // is drawn.
                    [RS_ZENABLE]: 1,
                    [RS_ZWRITEENABLE]: 1,
                    [RS_ZFUNC]: CMP_LEQUAL,
                    [RS_CULLMODE]: CULL_CW,

                    // Declared rather than inherited. Render states persist
                    // between passes, and blending or alpha-testing a packed
                    // nibble would corrupt the id rather than merely dim it.
                    [RS_ALPHABLENDENABLE]: 0,
                    [RS_ALPHATESTENABLE]: 0
                }
            }
        }
    };
}

// Which kinds bind the pattern masks was checked against the shipped
// containers rather than assumed - five of the ten do.
export const quadPickingV5 = makeDefinition("quadpickingv5", PickingShaderKind.QUAD, { patterns: true });
export const quadDetailPickingV5 = makeDefinition("quaddetailpickingv5", PickingShaderKind.QUAD_DETAIL, { patterns: true });
export const quadHeatPickingV5 = makeDefinition("quadheatpickingv5", PickingShaderKind.QUAD_HEAT, { patterns: true });
export const quadHeatDetailPickingV5 = makeDefinition("quadheatdetailpickingv5", PickingShaderKind.QUAD_HEAT_DETAIL, { patterns: true });
export const quadInstancedPickingV5 = makeDefinition("quadinstancedpickingv5", PickingShaderKind.QUAD_INSTANCED, { patterns: true });

// These five bind no pattern masks, so PMtl1/PMtl2 cannot occur on them.
export const quadEnvironmentPickingV5 = makeDefinition("quadenvironmentpickingv5", PickingShaderKind.QUAD_ENVIRONMENT);
export const quadGlassPickingV5 = makeDefinition("quadglasspickingv5", PickingShaderKind.QUAD_GLASS);
export const quadOilPickingV5 = makeDefinition("quadoilpickingv5", PickingShaderKind.QUAD_OIL);
export const quadSailsPickingV5 = makeDefinition("quadsailspickingv5", PickingShaderKind.QUAD_SAILS);

// Wreck alone is alpha clipped.
export const quadWreckPickingV5 = makeDefinition("quadwreckpickingv5", PickingShaderKind.QUAD_WRECK, { alphaClip: true });
