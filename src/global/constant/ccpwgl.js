/**
 * Values for textureQuality option that can be passed to ccpwgl.initialize.
 */
export const DeviceTextureQuality = {
    HIGH: 0,
    MEDIUM: 1,
    LOW: 2
};

export const DeviceShaderQuality = {
    HIGH: "depth",
    MEDIUM: "hi",
    LOW: "lo"
};

/**
 * Values for the effectProfile option, naming the compiled-effect namespace a
 * `/effect/` path is routed to.
 *
 * GLES2 and WEBGL2 both expect shaders that already exist as GLSL. DX11 reads
 * Carbon containers carrying DXBC and translates them at load time, which is a
 * build step running at runtime and is still alpha.
 */
export const DeviceEffectProfile = {
    GLES2: "effect.gles2",
    WEBGL2: "effect.webgl2",
    DX11: "effect.dx11"
};

/**
 * Carbon's logical level-of-detail vocabulary.
 *
 * This describes update/render detail only. Visibility is tracked separately,
 * and these values never select a geometry resource in ccpwgl.
 */
export const Tr2Lod = Object.freeze({
    TR2_LOD_UNSPECIFIED: -1,
    TR2_LOD_LOW: 0,
    TR2_LOD_MEDIUM: 1,
    TR2_LOD_HIGH: 2,
    TR2_LOD_ULTRA: 3,
    TR2_LOD_COUNT: 4
});

export const DisplayFilter = [
    "LOW",
    "LOW_MEDIUM",
    "MEDIUM",
    "HIGH",
    "ALL",
    "REFLECTIONS_ONLY"
];

export const Mouse = {
    LEFT: 0,
    MIDDLE: 1,
    RIGHT: 2,
    ROTATE: 0,
    DOLLY: 1,
    PAN: 2
};

export const Touch = {
    ROTATE: 0,
    PAN: 1,
    DOLLY_PAN: 2,
    DOLLY_ROTATE: 3
};

export const PickingToSelector = {
    1: 6,
    2: 7,
    3: 8,
    4: 9,
    5: 18,
    6: 19,
    10: 11,
    11: 4,
    12: 21,
    13: 22,
    14: 23
};


export const PickingBlueChannel = {
    UNKNOWN: 0,

    MATERIAL_1: 1,
    MATERIAL_2: 2,
    MATERIAL_3: 3,
    MATERIAL_4: 4,
    MATERIAL_5: 5,
    MATERIAL_6: 6,

    GLOW: 10,
    PAINT: 11,
    HEAT: 12,
    GLASS: 13,
    SAIL: 14,
    SAIL_PATTERN: 14,
    SAIL_BACKGROUND: 15,
    DETAIL: 16,

    DECAL: 20,
    BOOSTER: 21,
    PLANE_SET: 22,
    SPOTLIGHT_SET: 23,
    SPRITE_SET: 24,
    SPRITE_LINE_SET: 25,
    LINE_SET: 26,
    HAZE_SET: 27,
    BANNER: 28,

    // AREA: 100, area from 100 to 255 (100 + area number)
    // ALPHA: If alpha is working then can just use the alpha channel
};


/**
 * Custom mask blend modes.
 *
 * Carbon passes this as a compile-time permutation option; the manual GLES quad
 * shaders have no permutations, so it is demoted to a runtime value in
 * CustomMaskBlending (per-object PS reg 16) and branched over in
 * `applyCustomMaskBlendMode`.
 *
 * `toDeprecate/shaders/quad/shared/constant.js` declares the same nine values as
 * `PatternBlendMode`. That copy is left alone for now - nothing outside
 * toDeprecate imported it, and pointing eve/ at the deprecated tree would be the
 * wrong direction - but the two must not drift.
 * @type {Object<String,Number>}
 */
export const CustomMaskBlendMode = {
    NONE: 0,
    ADD: 1,
    SUBTRACT: 2,
    MULTIPLY: 3,
    DIVIDE: 4,
    DIFFERENCE: 5,
    EXCLUSION: 6,
    NESTED: 7,
    NESTED_INVERTED: 8
};
