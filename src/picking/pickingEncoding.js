/**
 * The material-picking wire format: how a resolved texel becomes RGB, and back.
 *
 * Deliberately free of decorators and of any engine import, so it is ordinary
 * JavaScript that node can load. That is not incidental - it means the encoding
 * can be TESTED directly rather than through a transcribed copy that is free to
 * drift from it.
 *
 * Alpha is not available, so four quantities share three channels:
 *
 * ```
 *   R  low nibble  material     high nibble  area type
 *   G  quad kind
 *   B  area index
 * ```
 */

/** @type {Object} */
export const PickingMaterial = Object.freeze({
    NONE: 0,
    MTL1: 1,
    MTL2: 2,
    MTL3: 3,
    MTL4: 4,
    PMTL1: 5,
    PMTL2: 6,
    PAINT: 7,
    DETAIL1: 8,
    DETAIL2: 9,
    DETAIL3: 10
});

/**
 * ZERO IS A DEFECT SIGNAL, not a result - see {@link DecodePicking}.
 * @type {Object}
 */
export const PickingQuadKind = Object.freeze({
    UNKNOWN: 0,
    QUAD: 1,
    QUAD_DETAIL: 2,
    QUAD_ENVIRONMENT: 3,
    QUAD_GLASS: 4,
    QUAD_HEAT: 5,
    QUAD_HEAT_DETAIL: 6,
    QUAD_INSTANCED: 7,
    QUAD_OIL: 8,
    QUAD_SAILS: 9,
    QUAD_WRECK: 10
});

/**
 * Keyed by the CARBON PERMUTATION OPTION, not the UI name. "overlay" and
 * "nested" are UI names and are not these; ccpwgl's EveShip2 accepting them is
 * a defect that nothing here reproduces.
 * @type {Object}
 */
export const PatternBlendMode = Object.freeze({
    BLEND_MODE_OVERLAY: 0,
    BLEND_MODE_SUBTRACT: 1,
    BLEND_MODE_EXCLUSION: 2,
    BLEND_MODE_NESTED: 3,
    BLEND_MODE_NESTED_INVERTED: 4
});

/**
 * The two modes that collapse both masks into ONE weight and never touch the
 * second pattern material, so PMtl2 cannot be picked under them.
 * @type {Array<String>}
 */
export const SINGLE_PATTERN_BLEND_MODES = Object.freeze([
    "BLEND_MODE_SUBTRACT",
    "BLEND_MODE_EXCLUSION"
]);


/**
 * @param {Object} enumeration
 * @param {Number} value
 * @returns {?String}
 */
function nameOf(enumeration, value)
{
    for (const key in enumeration)
    {
        if (enumeration[key] === value) return key;
    }
    return null;
}

/**
 * Packs the four quantities into RGB.
 * @param {Number} material
 * @param {Number} areaType
 * @param {Number} quadKind
 * @param {Number} areaIndex
 * @returns {Array<Number>} r, g, b
 */
export function EncodePicking(material, areaType, quadKind, areaIndex)
{
    return [
        ((areaType & 15) << 4) | (material & 15),
        quadKind & 255,
        areaIndex & 255
    ];
}

/**
 * Decodes one RGB triple read back from the picking buffer.
 *
 * @param {Uint8Array|Array} rgb
 * @returns {Object}
 */
export function DecodePicking(rgb)
{
    const
        material = rgb[0] & 15,
        areaType = rgb[0] >> 4,
        quadKind = rgb[1],
        areaIndex = rgb[2];

    // THIS is the background test - alpha is unavailable, so it cannot be used,
    // and green cannot be used either because green is a legal quad kind. Every
    // drawn pixel has a material of at least 1, so a zero material means
    // nothing was drawn there. Solid green (0, 255, 0) satisfies it for free.
    if (material === PickingMaterial.NONE)
    {
        return { hit: false, material: null, areaType: null, quadKind: null, areaIndex: null };
    }

    return {
        hit: true,
        material,
        materialName: nameOf(PickingMaterial, material),
        areaType,
        quadKind,
        quadKindName: nameOf(PickingQuadKind, quadKind),
        areaIndex,

        // Reported rather than swallowed. Every picking shader sets its kind
        // explicitly, so a DRAWN pixel reporting UNKNOWN means a shader has no
        // picking equivalent, or forgot its constant. Handing 0 back as though
        // it were an answer would hide that gap permanently.
        isDefect: quadKind === PickingQuadKind.UNKNOWN,

        // PaintMask is "material -1": authored rather than data driven, so a
        // user cannot recolour it. Worth reporting so a click lands on
        // something, but a caller must not offer it as editable.
        isSelectable: material !== PickingMaterial.PAINT,

        color: [ rgb[0], rgb[1], rgb[2] ]
    };
}
