import { RS_ZENABLE, RS_ZWRITEENABLE, RS_ZFUNC, RS_CULLMODE, CMP_LEQUAL, CULL_CW } from "constant";
import { GLSL_MATERIAL_RESOLVE, PickingShaderKind } from "./materialResolve";


/**
 * Material picking for the ten plain `quadXv5` kinds.
 *
 * STANDALONE shaders, not techniques hung off the shipped ones, so they can be
 * called independently and matched to their opaque equivalent. They draw no
 * lighting and sample none of the appearance maps - only the ones that decide
 * which layer a texel belongs to.
 *
 * One body, ten definitions. The kinds differ in three ways that matter to
 * picking and in no others:
 *
 *   - whether the pattern masks exist at all (five of ten bind them);
 *   - whether an alpha clip applies (wreck);
 *   - which kind constant they report.
 *
 * Everything else they differ in - heat glow, oil film, glass fog, wreck
 * colouring - changes how a surface LOOKS, not which layer it is, so picking is
 * identical and one body serves all ten.
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
 * ## NOT YET RESOLVED: the per-kind sub-layers
 *
 * Several kinds carry layers that are neither a base material nor a pattern.
 * These shaders currently report the base material UNDERNEATH them:
 *
 *     quaddetailv5        Detail1Data, Detail2Data, Detail3Data, DetailSelector
 *     quadheatdetailv5    the same, plus SecondaryDetail2Data
 *     quadenvironmentv5   Detail1Data, Detail2Data, Detail1Material, Detail2Material
 *     quadsailsv5         SailsDetailData
 *     quadwreckv5         WreckColor, WreckFactors
 *
 * `DETAIL1..3` and `SAILS_DETAIL` are reserved in the encoding for these and are
 * NOT emitted yet. The selection rule has not been extracted from the shipped
 * shaders, and `Detail1Material` / `Detail2Material` on the environment kind
 * suggests a detail may be ASSIGNED to a material rather than standing beside
 * it - which would change what a detail region ought to report.
 *
 * Guessing that would produce confident wrong answers across whole regions of a
 * hull. It waits for the same extraction the material tent and the blend modes
 * got.
 *
 * What every kind DOES have, and what is deliberately ignored: every one of the
 * ten carries `MtlNDustDiffuseColor` and `MtlNHeatGlowData`. Those are
 * properties OF a material - dust settling on it, heat glowing through it - not
 * layers standing beside it, so they get no id and never will.
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

/**
 * @param {Number} kind
 * @param {Boolean} hasPatterns
 * @param {Boolean} alphaClip
 * @returns {String}
 */
function makePs(kind, hasPatterns, alphaClip)
{
    const patternUniforms = hasPatterns
        ? "uniform sampler2D PatternMask1Map;\nuniform sampler2D PatternMask2Map;"
        : "";

    const clipUniform = alphaClip ? "uniform sampler2D AlphaThresholdMap;" : "";

    // Wreck geometry is alpha clipped. Without the same clip, picking reports
    // hits on holes that are not there - and a wreck is mostly holes.
    const clip = alphaClip
        ? "    if (texture2D(AlphaThresholdMap, texcoord.xy).x <= 0.5) discard;\n"
        : "";

    const patterns = hasPatterns
        ? `    float p1 = texture2D(PatternMask1Map, patternUv.xy).x;
    float p2 = texture2D(PatternMask2Map, patternUv.zw).x;`
        : `    // This kind binds no pattern masks at all, so PMtl1 and PMtl2 cannot
    // occur. Sampling them would read textures the effect never binds.
    float p1 = 0.0;
    float p2 = 0.0;`;

    return `
precision highp float;

uniform sampler2D MaterialMap;
${patternUniforms}
${clipUniform}

// (material, pattern, paint, unused) - where the boundary sits along a
// gradient, 0.5 being the even split.
uniform vec4 PickingThreshold;

// The Carbon permutation option as a float - see PatternBlendMode.
uniform vec4 PatternBlendMode;

// (areaType, areaIndex, unused, unused), set per area by the picker.
uniform vec4 PickingArea;

// (patterns, paint, details, decals) - each 0 or 1. An excluded layer type is
// fallen THROUGH, so a click reaches whatever is underneath it.
uniform vec4 PickingInclude;

varying vec4 texcoord;
varying vec4 patternUv;

${GLSL_MATERIAL_RESOLVE}

void main()
{
${clip}    float materialValue = texture2D(MaterialMap, texcoord.xy).x;

${patterns}

    // Paint coverage is forced to 1 - see the file header.
    float paint = 1.0;

    float material = cjsResolveMaterial(
        materialValue, p1, p2, paint,
        PatternBlendMode.x,
        PickingThreshold.xyz,
        PickingInclude
    );

    gl_FragColor = cjsPackPicking(material, PickingArea.x, ${kind}.0, PickingArea.y);
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
                    shader: makePs(kind, !!opt.patterns, !!opt.alphaClip)
                },
                // Ordinary opaque depth so the nearest surface wins the pixel,
                // and the hull's own winding so picking covers what is drawn.
                states: {
                    [RS_ZENABLE]: 1,
                    [RS_ZWRITEENABLE]: 1,
                    [RS_ZFUNC]: CMP_LEQUAL,
                    [RS_CULLMODE]: CULL_CW
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
