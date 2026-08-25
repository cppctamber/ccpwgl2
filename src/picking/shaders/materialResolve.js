/**
 * The material resolution shared by every picking and highlight shader.
 *
 * ONE copy, deliberately. A highlight that disagreed with a pick about which
 * layer a texel belongs to would be worse than either being wrong on its own -
 * the user would select one thing and see another highlighted. So the rule
 * lives here as GLSL text and both families paste it in.
 *
 * Everything below was read out of the shipped `quadv5` container rather than
 * inferred. See `.agents/HANDOVER-material-picking-for-skindr-2026-08-25.md` for the extraction.
 */

import { PickingMaterial, PickingShaderKind } from "../pickingEncoding";

export { PickingMaterial, PickingShaderKind, PatternBlendMode, SINGLE_PATTERN_BLEND_MODES } from "../pickingEncoding";


/**
 * The material tent, transcribed from the shipped shader.
 *
 *   w = clamp(1.0319149 - abs((v - anchor) * 3.1914894), 0, 1)
 *
 * with anchors at 0, 1/3, 2/3, 1.
 *
 * A tent reaches zero 1.0319149/3.1914894 = 0.3233 from its anchor, which is
 * slightly LESS than the 1/3 spacing - so it is not "wider than the spacing",
 * and saying so was wrong. What makes neighbours overlap is the FULL width:
 * 2 * 0.3233 = 0.6467 against a spacing of 0.3333 leaves 0.3133 of overlap,
 * which is 94% of the interval between two anchors.
 *
 * So gradients are inherent to the format rather than authored, and almost
 * every value between two anchors is a blend. That is why a threshold input
 * exists at all.
 * @type {String}
 */
export const GLSL_MATERIAL_WEIGHTS = `
vec4 cjsMaterialWeights(float v)
{
    vec4 d = vec4(v) - vec4(0.0, 0.3333333432674408, 0.6666666865348816, 1.0);
    return clamp(vec4(1.0319149494171143) - abs(d * 3.1914894580841064), 0.0, 1.0);
}
`;

/**
 * Combines the two pattern masks the way the shipped shader does, selected by
 * `PatternBlendMode`.
 *
 * Extracted from the five compiled bodies that differ only in BLEND_MODE:
 *
 *   OVERLAY           w1 = p1                  w2 = p2
 *   SUBTRACT          w1 = max(p1 - p2, 0)     w2 = 0     <- no second layer
 *   EXCLUSION         w1 = p1 + p2 - 2*p1*p2   w2 = 0     <- no second layer
 *   NESTED            w1 = p1                  w2 = p1 * p2
 *   NESTED_INVERTED   w1 = p1                  w2 = (1 - p1) * p2
 *
 * SUBTRACT and EXCLUSION apply their single weight to pattern ONE's slot and
 * never reference pattern two's, so `w2` is zero for them here. That is not a
 * simplification - it is what the shader does, and it means PMtl2 is not
 * pickable under those modes.
 * @type {String}
 */
export const GLSL_PATTERN_WEIGHTS = `
vec2 cjsPatternWeights(float p1, float p2, float mode)
{
    int m = int(mode + 0.5);

    if (m == 1) return vec2(max(p1 - p2, 0.0), 0.0);          // SUBTRACT
    if (m == 2) return vec2(p1 + p2 - 2.0 * p1 * p2, 0.0);    // EXCLUSION
    if (m == 3) return vec2(p1, p1 * p2);                     // NESTED
    if (m == 4) return vec2(p1, (1.0 - p1) * p2);             // NESTED_INVERTED

    return vec2(p1, p2);                                      // OVERLAY
}
`;

/**
 * Resolves one texel to a single material id.
 *
 * Order is patterns, then paint, then base material. Patterns first because a
 * pattern sits ON the material rather than beside it, so a texel the pattern
 * covers belongs to the pattern whatever the material underneath says.
 *
 * Between the two patterns, the LARGER weight wins rather than a fixed "two
 * over one": that ordering only holds for OVERLAY. Under NESTED the second
 * pattern exists only inside the first, and under SUBTRACT and EXCLUSION there
 * is no second pattern at all, so a fixed precedence would name a layer the
 * shader cannot draw.
 *
 * `thresholds` is (material, pattern, paint) - each the position along a
 * gradient at which the boundary sits, 0.5 being the even split.
 * @type {String}
 */
export const GLSL_RESOLVE_MATERIAL = `
float cjsResolveMaterial(float materialValue, float p1, float p2, float paint, float blendMode, vec3 thresholds, vec4 include)
{
    // include = (patterns, paint, details, decals), each 0 or 1.
    //
    // A layer type that is EXCLUDED is not merely hidden - the resolution falls
    // through it to whatever is underneath, so a click passes down to the base
    // material. That is the point: detail layers are composite textures full of
    // small greebles, and a user dragging an icon at that scale would otherwise
    // keep landing on a rivet instead of the hull.
    vec2 pw = cjsPatternWeights(p1, p2, blendMode);

    if (include.x > 0.5 && max(pw.x, pw.y) > thresholds.y)
    {
        return pw.y > pw.x ? ${PickingMaterial.PMTL2}.0 : ${PickingMaterial.PMTL1}.0;
    }

    if (include.y > 0.5 && paint > thresholds.z) return ${PickingMaterial.PAINT}.0;

    vec4 w = cjsMaterialWeights(materialValue);

    // The winner, and its nearest rival, so the threshold can bias where the
    // boundary between two overlapping tents falls.
    float best = max(max(w.x, w.y), max(w.z, w.w));
    if (best <= 0.0) return ${PickingMaterial.NONE}.0;

    float id = ${PickingMaterial.MTL1}.0;
    if (w.y >= best) id = ${PickingMaterial.MTL2}.0;
    if (w.z >= best) id = ${PickingMaterial.MTL3}.0;
    if (w.w >= best) id = ${PickingMaterial.MTL4}.0;
    return id;
}
`;

/**
 * Packs the resolved values into the RGB the picker reads back.
 *
 * ALPHA IS NOT AVAILABLE, so four quantities share three channels: material and
 * area type both fit in a nibble and share red.
 *
 *   R  low nibble  material      high nibble  area type
 *   G  quad kind
 *   B  area index
 *
 * The background test is `(R & 15) == 0`, not alpha - every real hit has a
 * material of at least 1, so a solid green background reads as "nothing" for
 * free while green remains a legal quad-kind value elsewhere.
 * @type {String}
 */
export const GLSL_PACK = `
vec4 cjsPackPicking(float material, float areaType, float quadKind, float areaIndex)
{
    float r = (floor(areaType) * 16.0 + floor(material)) / 255.0;
    return vec4(r, floor(quadKind) / 255.0, floor(areaIndex) / 255.0, 1.0);
}
`;

/**
 * Everything a picking or highlight fragment shader needs, in dependency order.
 * @type {String}
 */
export const GLSL_MATERIAL_RESOLVE = GLSL_MATERIAL_WEIGHTS
    + GLSL_PATTERN_WEIGHTS
    + GLSL_RESOLVE_MATERIAL
    + GLSL_PACK;
