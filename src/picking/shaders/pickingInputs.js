import { createTex, TEX_2D, WidgetType } from "../../toDeprecate/shaders/shared/util";


/**
 * The constant and texture DECLARATIONS the picking shaders bind through.
 *
 * ccpwgl's manual shader path binds POSITIONALLY, not by name. A technique
 * declares `constants: []` and `textures: []`, and the runtime packs them into
 * one array uploaded as `cb0` (vertex) / `cb7` (pixel), with textures bound to
 * sampler unit == register index and located as `s0`, `s1`, ... So GLSL that
 * says `uniform sampler2D MaterialMap` links, defaults to zero, and is NEVER
 * WRITTEN - it does not fail, it silently reads nothing.
 *
 * That is exactly what the first version of these shaders did. The declarations
 * below are the fix, and the order of each array IS the register order the GLSL
 * must use.
 *
 * The form follows the existing manual picking shader,
 * `toDeprecate/shaders/decal/extended/decalExtendedPickingV5.js`.
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
        ui: {
            display: 0,
            group: "Picking",
            components,
            widget: WidgetType.MIXED
        }
    };
}

/**
 * Where the boundary sits along a gradient, per quantity. 0.5 is the even
 * split; lower and higher shift which side of a blend claims the texel.
 * @type {Object}
 */
export const PickingThreshold = constant(
    "PickingThreshold",
    [ "material", "pattern", "paint", "unused" ],
    [ 0.5, 0.5, 0.5, 0 ]
);

/**
 * The Carbon permutation option as a float, in `.x`. Keyed by `BLEND_MODE_*`,
 * never by the UI name.
 * @type {Object}
 */
export const PatternBlendMode = constant(
    "PatternBlendMode",
    [ "blend mode", "unused", "unused", "unused" ],
    [ 0, 0, 0, 0 ]
);

/**
 * `(areaType, areaIndex, unused, unused)`, set per mesh area.
 * @type {Object}
 */
export const PickingArea = constant(
    "PickingArea",
    [ "area type", "area index", "unused", "unused" ],
    [ 0, 0, 0, 0 ]
);

/**
 * `(patterns, paint, details, decals)`, each 0 or 1. An excluded type is fallen
 * THROUGH, so a click reaches whatever is underneath.
 * @type {Object}
 */
export const PickingInclude = constant(
    "PickingInclude",
    [ "patterns", "paint", "details", "decals" ],
    [ 1, 1, 1, 1 ]
);


/**
 * `(hasPatterns, hasPaint, unused, unused)`, each 0 or 1, set per SOURCE
 * EFFECT from the textures that effect actually binds.
 *
 * Not redundant with an unbound sampler reading zero, which was the assumption
 * that produced the first wrong answer: a hull with no SKINR pattern applied
 * reported PMTL1 over every pixel, because an unbound sampler does not
 * reliably read black - it reads whatever was left in that unit. Multiplying
 * by a flag the CPU sets from the source effect's own texture list does not
 * depend on that.
 * @type {Object}
 */
export const PickingPresence = constant(
    "PickingPresence",
    [ "has patterns", "has paint", "has decal coverage", "unused" ],
    [ 1, 1, 1, 0 ]
);


/**
 * The material selector. One scalar in `.x`, four materials anchored at
 * 0, 1/3, 2/3, 1.
 * @type {Object}
 */
export const MaterialMap = createTex("MaterialMap", TEX_2D, {
    ui: { components: [ "material selector" ] }
});

/** @type {Object} */
export const PatternMask1Map = createTex("PatternMask1Map", TEX_2D, {
    ui: { components: [ "pattern 1 coverage" ] }
});

/** @type {Object} */
export const PatternMask2Map = createTex("PatternMask2Map", TEX_2D, {
    ui: { components: [ "pattern 2 coverage" ] }
});

/** @type {Object} */
export const AlphaThresholdMap = createTex("AlphaThresholdMap", TEX_2D, {
    ui: { components: [ "alpha clip" ] }
});

/** @type {Object} */
export const DecalTransparencyMap = createTex("DecalTransparencyMap", TEX_2D, {
    ui: { components: [ "transparency mask" ] }
});

/**
 * Paint coverage. "Material -1": the region's colour comes from the authored
 * albedo RGB rather than from data, so a user cannot recolour it.
 * @type {Object}
 */
export const PaintMaskMap = createTex("PaintMaskMap", TEX_2D, {
    ui: { components: [ "paint coverage" ] }
});
