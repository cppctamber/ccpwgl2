import {
    RS_ZENABLE, RS_ZWRITEENABLE, RS_ZFUNC, RS_CULLMODE,
    RS_ALPHABLENDENABLE, RS_ALPHATESTENABLE,
    CMP_LEQUAL, CULL_CW
} from "constant";
import { precision, clampToBorder } from "../../toDeprecate/shaders/shared/func";
import { GLSL_MATERIAL_RESOLVE, PickingShaderKind } from "./materialResolve";
import {
    PickingThreshold, PatternBlendMode, PickingArea, PickingInclude,
    PickingPresence,
    MaterialMap, PaintMaskMap, PatternMask1Map, PatternMask2Map, AlphaThresholdMap
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
 * ## PaintMaskMap: the MASK is read, the INFLUENCE is not
 *
 * Paint is "material -1": its colour comes from the authored Albedo RGB rather
 * than from data, and a user cannot recolour it. It is still a region worth
 * reporting, so it gets an id - but `PaintMapInfluence` is deliberately not
 * applied, because an influence value fading the paint out has nothing to do
 * with where the paint IS.
 *
 * The first version of this file forced the COVERAGE to 1 instead, reading
 * "set the paint mask to 1" as "the whole surface is paint". Measured against
 * a hull, that reported PAINT for every pixel - and paint is unselectable, so
 * a picker that ran would have refused every drop on the ship.
 *
 * ## A pattern's presence is CustomMaskTarget, not the mask texture
 *
 * Measured on a hull with no SKINR pattern applied: `PatternMask1Map` was still
 * bound, and bound to SOLID WHITE. Coverage read 1 everywhere, so the first
 * version reported PMTL1 over every pixel - a hull that picked as "all
 * pattern". That default is now black (EveSOFData.SetupCustomMask), because an
 * absent pattern is nowhere rather than everywhere.
 *
 * The gate below stays regardless. A texture is a value; whether a mask APPLIES
 * is a separate fact, and reading the value alone cannot distinguish "no
 * pattern" from "a pattern that covers everything" - which is a thing an artist
 * can legitimately author.
 *
 * `EveCustomMask` writes `display && visible ? targetMaterials : ZERO` into
 * `CustomMaskTarget0/1`, and Tr2PerObjectData's own note records that ccpwgl
 * gates through it where Carbon uses `CustomMaskData.x`. A zero target is
 * therefore the engine SAYING there is no mask, and that is what these shaders
 * read - at `cb4[12]` and `cb4[13]`, see the constants below.
 *
 * `PickingPresence` stays as a second guard for a texture the source effect
 * genuinely does not bind, since an unbound sampler holds whatever was last in
 * that unit rather than black.
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

/**
 * The pattern projection, which is the same whether or not the mesh is skinned.
 *
 * Custom masks are authored in HULL space and the shipped skinned stage
 * projects the un-skinned `v0` through them exactly as the rigid one does, so
 * this text is shared rather than transcribed twice. `cb3[17..25]` holds the
 * mask block in both layouts - only the bones move, and they sit past it.
 * @type {String}
 */
const PATTERN_UV = `
    texcoord.zw = vec2(0.0);

    // The mirror term, exactly as the shipped stage builds it: zero where x is
    // positive, -2x where negative, so a mirrored pattern folds across x = 0.
    vec3 mirror = vec3(-attr0.x + abs(attr0.x), 0.0, 0.0);

    vec4 p1 = vec4(cb3[24].y * mirror + attr0.xyz, 1.0);
    vec4 p2 = vec4(cb3[25].y * mirror + attr0.xyz, 1.0);

    patternUv.xy = (vec2(dot(p1, cb3[17]), dot(p1, cb3[18])) + vec2(1.0)) * vec2(0.5);
    patternUv.zw = (vec2(dot(p2, cb3[21]), dot(p2, cb3[22])) + vec2(1.0)) * vec2(0.5);
`;

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
${PATTERN_UV}}
`;

/**
 * The SKINNED transform, and it is not an optional extra.
 *
 * Every mesh area of a shipped EVE hull is drawn by a `skinned_` shader -
 * measured, not assumed: `af4_t1` collects twelve areas and all twelve are
 * `skinned_quadv5` or `skinned_quadheatv5`. A picker that refuses skinned
 * shaders picks NOTHING on a real ship, which is what the first version of this
 * file did.
 *
 * The scheme is one bone per vertex, no weight blending: `attr1.x * 3` indexes
 * three consecutive rows at `cb3[26]`, and those rows are combined with the
 * world matrix. Transcribed from the shipped
 * `skinnedQuadV5_PosBwtTexTanTexL01` stage, whose register moves are the
 * authority for the layout - in particular that the bone block starts at 26,
 * PAST the custom-mask block, so the pattern projection is untouched.
 *
 * Written out as matrix rows rather than as the compiler's register shuffle,
 * because the shuffle is unreadable and the arithmetic is not.
 * @type {String}
 */
const skinnedVs = `
attribute vec4 attr0;
attribute vec4 attr1;
attribute vec4 attr2;

uniform vec4 cb1[24];
uniform vec4 cb3[200];

varying vec4 texcoord;
varying vec4 patternUv;

void main()
{
    vec4 position = vec4(attr0.xyz, 1.0);

    // One bone, three rows. The index arrives pre-multiplied by three in the
    // shipped stage's arithmetic, so the same rounding is kept here.
    int bone = int(3.0 * attr1.x + 0.5);

    vec4 b0 = cb3[26 + bone];
    vec4 b1 = cb3[27 + bone];
    vec4 b2 = cb3[28 + bone];

    // world row * bone, with the world row's w picking up the bone's
    // translation column - which is what cb3[n].wwww * (0,0,0,1) amounts to.
    vec4 wx = b0 * cb3[0].xxxx + b1 * cb3[0].yyyy + b2 * cb3[0].zzzz + vec4(0.0, 0.0, 0.0, cb3[0].w);
    vec4 wy = b0 * cb3[1].xxxx + b1 * cb3[1].yyyy + b2 * cb3[1].zzzz + vec4(0.0, 0.0, 0.0, cb3[1].w);
    vec4 wz = b0 * cb3[2].xxxx + b1 * cb3[2].yyyy + b2 * cb3[2].zzzz + vec4(0.0, 0.0, 0.0, cb3[2].w);
    vec4 ww = b0 * cb3[3].xxxx + b1 * cb3[3].yyyy + b2 * cb3[3].zzzz + vec4(0.0, 0.0, 0.0, cb3[3].w);

    vec4 world = vec4(dot(position, wx), dot(position, wy), dot(position, wz), dot(position, ww));

    gl_Position.x = dot(world, cb1[4]);
    gl_Position.y = dot(world, cb1[5]);
    gl_Position.z = dot(world, cb1[6]);
    gl_Position.w = dot(world, cb1[7]);

    texcoord.xy = attr2.xy;
${PATTERN_UV}}
`;

// POSITION, TEXCOORD0 - the rigid layout.
const RIGID_INPUTS = [
    { usage: "POSITION", usageIndex: 0, elements: 3 },
    { usage: "TEXCOORD", usageIndex: 0, elements: 2 }
];

// POSITION, BLENDWEIGHT, TEXCOORD0 - the bone index rides in BLENDWEIGHT.x.
const SKINNED_INPUTS = [
    { usage: "POSITION", usageIndex: 0, elements: 3 },
    { usage: "BLENDWEIGHT", usageIndex: 0, elements: 4 },
    { usage: "TEXCOORD", usageIndex: 0, elements: 2 }
];

// The constant order IS the cb7 index order.
const CONSTANTS = [ PickingThreshold, PatternBlendMode, PickingArea, PickingInclude, PickingPresence ];

const CB_THRESHOLD = "cb7[0]";
const CB_BLEND_MODE = "cb7[1]";
const CB_AREA = "cb7[2]";
const CB_INCLUDE = "cb7[3]";
const CB_PRESENCE = "cb7[4]";

/**
 * Where `CustomMaskTarget0/1` sit in the per-object PIXEL block, `cb4`.
 *
 * Counted off `Tr2PerObjectData`'s ps list in vec4 registers: Shipdata 0,
 * Clipdata1 1, Miscdata 2, ShLighting 3-9 (seven), CustomMaskMaterialID0 10,
 * CustomMaskMaterialID1 11, CustomMaskTarget0 12, CustomMaskTarget1 13.
 *
 * The count is corroborated rather than trusted: the same list puts
 * CustomMaskClamps at 14, Screensize at 15 and CustomMaskBlending at 16, and
 * `EveCustomMask` independently names CustomMaskBlending as `cb4[16]`. If the
 * arithmetic were off by one, that would not agree.
 */
const CB_MASK_TARGET_0 = "cb4[12]";
const CB_MASK_TARGET_1 = "cb4[13]";

/**
 * `CustomMaskMaterialID0/1` - (material index, clampU, clampV, clampW).
 *
 * The `.yz` lanes are the clamp-to-BORDER flags, and the shipped quad shader
 * samples both pattern masks through them:
 *
 *     r7 = clampToBorder(s9,  v6.xy, cb4[10].yz, c34.wwww);   // c34.w is 0
 *     r9 = clampToBorder(s10, v6.zw, cb4[11].yz, c34.wwww);
 *
 * WebGL has no border address mode, so it is emulated in the shader: outside
 * 0..1 the sample is the border colour, which is black - no coverage. Sampling
 * raw instead lets the GL wrap mode decide, and REPEAT tiles the pattern across
 * the whole hull. Picking would then report pattern coverage everywhere the
 * projection runs off the edge of the mask.
 */
const CB_MASK_ID_0 = "cb4[10]";
const CB_MASK_ID_1 = "cb4[11]";

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

    // It is a MASK: black is no coverage, and an absent pattern is black. The
    // sample is the coverage, taken at face value, with no cleverness about
    // whether a pattern is "really" there.
    //
    // (It used to default to SOLID WHITE, which read as full coverage and made
    // an unpatterned hull pick as all-pattern. That was a wrong default, now
    // fixed in EveSOFData.SetupCustomMask, rather than something for a shader
    // to work around.)
    //
    // The presence flag stays only for a texture the source effect does not
    // bind at all, where the sampler holds whatever was last in that unit.
    const patterns = hasPatterns
        ? `    float p1 = clampToBorder(${reg("PatternMask1Map")}, patternUv.xy, ${CB_MASK_ID_0}.yz, vec4(0.0)).x * ${CB_PRESENCE}.x;
    float p2 = clampToBorder(${reg("PatternMask2Map")}, patternUv.zw, ${CB_MASK_ID_1}.yz, vec4(0.0)).x * ${CB_PRESENCE}.x;`
        : `    // This kind binds no pattern masks at all, so PMtl1 and PMtl2 cannot
    // occur. Sampling them would read textures the effect never binds.
    float p1 = 0.0;
    float p2 = 0.0;`;

    // Which material slots each pattern REPLACES. `EveCustomMask` writes
    // `display && visible ? targetMaterials : ZERO`, so this carries both which
    // materials a pattern applies to and whether it applies at all - a mask
    // that is not displayed targets nothing and can never win a texel.
    //
    // Without it a pattern targeting only Mtl1 would be reported over an Mtl3
    // area, which the shipped shader would never have drawn.
    const targets = hasPatterns
        ? [ CB_MASK_TARGET_0, CB_MASK_TARGET_1 ]
        : [ "vec4(0.0)", "vec4(0.0)" ];

    return `
${precision}

${declarations}

uniform vec4 cb7[${CONSTANTS.length}];
${hasPatterns ? "uniform vec4 cb4[14];      // per-object pixel block, for CustomMaskTarget0/1" : ""}

varying vec4 texcoord;
varying vec4 patternUv;

${hasPatterns ? clampToBorder : ""}
${GLSL_MATERIAL_RESOLVE}

void main()
{
${clip}    float materialValue = texture2D(${reg("MaterialMap")}, texcoord.xy).x;

${patterns}

    // The paint MASK is sampled; what is not applied is PaintMapInfluence.
    // Forcing the coverage itself to 1 - which the first version did - makes
    // the whole hull paint, and paint is unselectable, so every drop was
    // refused. "Set the paint mask to 1" meant do not fade it by an influence
    // value that has nothing to do with where the paint IS.
    float paint = texture2D(${reg("PaintMaskMap")}, texcoord.xy).x * ${CB_PRESENCE}.y;

    float material = cjsResolveMaterial(
        materialValue, p1, p2, paint,
        ${CB_BLEND_MODE}.x,
        ${CB_THRESHOLD}.xyz,
        ${CB_INCLUDE},
        ${targets[0]}, ${targets[1]}
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
    const textures = [ MaterialMap, PaintMaskMap ];
    if (opt.patterns) textures.push(PatternMask1Map, PatternMask2Map);
    if (opt.alphaClip) textures.push(AlphaThresholdMap);

    return {
        name,
        description: "material picking for the " + name.replace("picking", "") + " family",
        techniques: {
            Main: {
                vs: {
                    inputDefinitions: opt.skinned ? SKINNED_INPUTS : RIGID_INPUTS,
                    shader: opt.skinned ? skinnedVs : vs
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

/**
 * The ten kinds, and what makes each one different to picking.
 *
 * `patterns` was checked against the shipped containers rather than assumed -
 * five of the ten bind the mask textures, and on the other five PMtl1/PMtl2
 * cannot occur at all. `alphaClip` is wreck alone.
 * @type {Array<Object>}
 */
const KINDS = [
    { name: "quadv5", kind: PickingShaderKind.QUAD, patterns: true },
    { name: "quaddetailv5", kind: PickingShaderKind.QUAD_DETAIL, patterns: true },
    { name: "quadheatv5", kind: PickingShaderKind.QUAD_HEAT, patterns: true },
    { name: "quadheatdetailv5", kind: PickingShaderKind.QUAD_HEAT_DETAIL, patterns: true },
    { name: "quadinstancedv5", kind: PickingShaderKind.QUAD_INSTANCED, patterns: true },

    { name: "quadenvironmentv5", kind: PickingShaderKind.QUAD_ENVIRONMENT },
    { name: "quadglassv5", kind: PickingShaderKind.QUAD_GLASS },
    { name: "quadoilv5", kind: PickingShaderKind.QUAD_OIL },
    { name: "quadsailsv5", kind: PickingShaderKind.QUAD_SAILS },

    { name: "quadwreckv5", kind: PickingShaderKind.QUAD_WRECK, alphaClip: true }
];

/**
 * Every kind, rigid and skinned.
 *
 * BOTH, always. A shipped EVE hull is drawn entirely by `skinned_` shaders -
 * twelve of twelve areas on `af4_t1` - so the skinned twin is not a variant
 * for completeness, it is the one that gets used. They report the same kind,
 * because skinning changes how a vertex gets where it is going and not what
 * the surface is.
 * @type {Array<Object>}
 */
export const quadPickingShaders = [];

for (const entry of KINDS)
{
    quadPickingShaders.push(
        makeDefinition(`cjspicking${entry.name}`, entry.kind, entry),
        makeDefinition(`cjspickingskinned${entry.name}`, entry.kind, { ...entry, skinned: true })
    );
}
