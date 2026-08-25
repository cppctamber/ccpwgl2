// The extension is explicit so plain node can require this file - the table is
// worth testing, and node will not resolve an extensionless ESM import.
import { PickingShaderKind } from "./pickingEncoding.js";


/**
 * Which picking shader stands in for which shipped shader.
 *
 * A picking pass draws the ship with our shaders instead of its own, so
 * something has to say which of ours replaces which of theirs. This is that
 * table, kept apart from the picker and free of decorators so it can be tested
 * under plain node.
 *
 * ## Matching is on the shader's NAME, and deliberately narrow
 *
 * A shipped effect arrives as a path - `.../v5/quad/unpacked_quadV5.sm_hi` on
 * dx11, `.../quadV5.fx` on gles2 - so the basename is taken, the extension
 * dropped, and the result lowercased. Nothing here reads the directory: the
 * same shader lives at different paths on the two profiles, and that is the
 * point of matching on the name.
 *
 * `unpacked_` is stripped because texture packing changes how a shader READS
 * its maps, not what the surface IS, and the unpacked variants carry the same
 * `MaterialMap`/`PatternMask*Map` names our shaders sample.
 *
 * ## Skinned variants get a skinned picking shader, and MUST
 *
 * A skinned shader transforms its vertices through a bone, so a picking shader
 * that transformed the bind pose by the world matrix would put the buffer's
 * colours somewhere the ship is not - and it would still look like a ship, so
 * every pick would be a plausible wrong answer.
 *
 * The first version of this table refused them for that reason. That was wrong,
 * and measurably: every mesh area of a shipped EVE hull is drawn by a `skinned_`
 * shader - twelve of twelve on `af4_t1` - so refusing them picked NOTHING on a
 * real ship. Each kind therefore has a skinned twin with the bone transform,
 * and both report the same kind, because skinning changes how a vertex gets
 * where it is going and not what the surface is.
 *
 * Both spellings occur in the shipped data - `skinned_quadDetailV5` and
 * `skinnedQuadEnvironmentV5` - so the test is a substring, not a prefix.
 */

/**
 * Why a shipped shader has no picking equivalent.
 * @type {Object}
 */
export const PickingUnsupported = {
    UNKNOWN: "unknown"
};

/**
 * name (lowercased, unpacked_ stripped) -> our shader, and the kind it reports.
 * @type {Object}
 */
export const PICKING_SHADER_BY_NAME = {};

// The quad kinds, each with a skinned twin. The names are built rather than
// written out so the table cannot drift from what the shader file emits.
for (const [ name, kind ] of [
    [ "quadv5", PickingShaderKind.QUAD ],
    [ "quaddetailv5", PickingShaderKind.QUAD_DETAIL ],
    [ "quadenvironmentv5", PickingShaderKind.QUAD_ENVIRONMENT ],
    [ "quadglassv5", PickingShaderKind.QUAD_GLASS ],
    [ "quadheatv5", PickingShaderKind.QUAD_HEAT ],
    [ "quadheatdetailv5", PickingShaderKind.QUAD_HEAT_DETAIL ],
    [ "quadinstancedv5", PickingShaderKind.QUAD_INSTANCED ],
    [ "quadoilv5", PickingShaderKind.QUAD_OIL ],
    [ "quadsailsv5", PickingShaderKind.QUAD_SAILS ],
    [ "quadwreckv5", PickingShaderKind.QUAD_WRECK ]
])
{
    PICKING_SHADER_BY_NAME[name] = {
        kind,
        shader: `cjspicking${name}`,
        skinned: `cjspickingskinned${name}`
    };
}

// Decals ship rigid only, so there is no skinned twin to name. A skinned decal
// would be reported rather than drawn - see GetPickingShaderForPath.
for (const [ name, kind ] of [
    [ "decalv5", PickingShaderKind.DECAL ],
    [ "decalcounterv5", PickingShaderKind.DECAL_COUNTER ],
    [ "decalcylindricv5", PickingShaderKind.DECAL_CYLINDRIC ],
    [ "decalglowv5", PickingShaderKind.DECAL_GLOW ],
    [ "decalglowcylindricv5", PickingShaderKind.DECAL_GLOW_CYLINDRIC ],
    [ "decalholev5", PickingShaderKind.DECAL_HOLE ]
])
{
    PICKING_SHADER_BY_NAME[name] = { kind, shader: `cjspicking${name}`, skinned: null };
}

/**
 * Reduces a shipped effect path to the name the table is keyed on.
 * @param {String} path
 * @returns {String}
 */
export function NormalizePickingSourceName(path)
{
    if (!path) return "";

    return path
        .replace(/\\/g, "/")
        .split("/")
        .pop()
        .replace(/\.(fx|sm_hi|sm_lo|sm_depth|sm_json)$/i, "")
        .toLowerCase()
        .replace(/^unpacked_?/, "");
}

/**
 * Splits a normalized name into the kind it is and whether it is skinned.
 *
 * Both spellings ship - `skinned_quadv5` and `skinnedquadenvironmentv5` - so
 * the underscore is optional. Stripping it leaves the base name the table is
 * keyed on.
 *
 * @param {String} name - already through {@link NormalizePickingSourceName}
 * @returns {{base: String, skinned: Boolean}}
 */
export function SplitPickingSourceName(name)
{
    if (name.indexOf("skinned") === -1) return { base: name, skinned: false };
    return { base: name.replace(/^skinned_?/, ""), skinned: true };
}

/**
 * Finds the picking shader that stands in for a shipped effect path.
 *
 * Returns `{ shader, kind }` when one exists, otherwise `{ unsupported }` with
 * the reason - never null, because "we cannot draw this" is an answer the
 * picker has to report rather than quietly skip.
 *
 * @param {String} path - the shipped effect's file path
 * @returns {{shader: String, kind: Number, name: String}|{unsupported: String, name: String}}
 */
export function GetPickingShaderForPath(path)
{
    const name = NormalizePickingSourceName(path);
    const { base, skinned } = SplitPickingSourceName(name);

    const found = PICKING_SHADER_BY_NAME[base];
    if (!found) return { unsupported: PickingUnsupported.UNKNOWN, name };

    // A decal has no skinned twin because no decal shader ships skinned. If one
    // ever does, this reports it rather than drawing it through the rigid
    // stage - which would draw it in the wrong place and still decode.
    if (skinned && !found.skinned)
    {
        return { unsupported: PickingUnsupported.UNKNOWN, name };
    }

    return {
        shader: skinned ? found.skinned : found.shader,
        kind: found.kind,
        name,
        skinned
    };
}

/**
 * The textures a picking shader samples, by picking shader name.
 *
 * Copied from the shipped effect onto ours. Anything not listed here is an
 * appearance map that picking has no use for.
 *
 * A name listed but absent from the source effect is NOT an error - a quad
 * whose pattern permutation is off genuinely has no pattern masks. What that
 * costs is a sampler with nothing bound to it, and an unbound sampler does not
 * read black: it reads whatever was left in that unit. Measured on a hull with
 * no SKINR pattern applied, it reported PMTL1 over every pixel.
 *
 * So the shaders do not trust the sample. `PickingPresence` carries a flag per
 * layer type, set by the picker from what it actually found on the source
 * effect, and the reads are multiplied by it. Declaring the texture anyway
 * still matters - an undeclared sampler falls back to unit zero, which is the
 * material map - but the flag is what makes the answer deterministic.
 *
 * The ORDER is the register order the GLSL was generated against, so these
 * lists and the `textures` arrays in the shader files have to agree.
 * @type {Object}
 */
export const PICKING_TEXTURES = {
    cjspickingquadv5: [ "MaterialMap", "PaintMaskMap", "PatternMask1Map", "PatternMask2Map" ],
    cjspickingquaddetailv5: [ "MaterialMap", "PaintMaskMap", "PatternMask1Map", "PatternMask2Map" ],
    cjspickingquadheatv5: [ "MaterialMap", "PaintMaskMap", "PatternMask1Map", "PatternMask2Map" ],
    cjspickingquadheatdetailv5: [ "MaterialMap", "PaintMaskMap", "PatternMask1Map", "PatternMask2Map" ],
    cjspickingquadinstancedv5: [ "MaterialMap", "PaintMaskMap", "PatternMask1Map", "PatternMask2Map" ],

    cjspickingquadenvironmentv5: [ "MaterialMap", "PaintMaskMap" ],
    cjspickingquadglassv5: [ "MaterialMap", "PaintMaskMap" ],
    cjspickingquadoilv5: [ "MaterialMap", "PaintMaskMap" ],
    cjspickingquadsailsv5: [ "MaterialMap", "PaintMaskMap" ],

    cjspickingquadwreckv5: [ "MaterialMap", "PaintMaskMap", "AlphaThresholdMap" ],

    cjspickingdecalv5: [ "DecalTransparencyMap" ],
    cjspickingdecalcounterv5: [ "DecalTransparencyMap" ],
    cjspickingdecalcylindricv5: [ "DecalTransparencyMap" ],
    cjspickingdecalglowv5: [ "DecalTransparencyMap" ],
    cjspickingdecalglowcylindricv5: [ "DecalTransparencyMap" ],
    cjspickingdecalholev5: [ "DecalTransparencyMap" ]
};

// A skinned twin samples exactly what its rigid original does - skinning is a
// vertex concern. Copied rather than written out, so the two can never drift.
for (const [ name, textures ] of Object.entries({ ...PICKING_TEXTURES }))
{
    if (name.startsWith("cjspickingquad"))
    {
        PICKING_TEXTURES[name.replace("cjspicking", "cjspickingskinned")] = textures;
    }
}
