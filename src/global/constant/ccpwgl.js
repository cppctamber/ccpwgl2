/**
 * Values for textureQuality option that can be passed to ccpwgl.initialize.
 */
export const DeviceTextureQuality = {
    HIGH: 0,
    MEDIUM: 1,
    LOW: 2
};

export const DeviceShaderQuality = {
    HIGH: "hi",
    LOW: "lo"
};

export const SceneLodSettings = {
    LOD_DISABLED: 0,
    LOD_ENABLED: 1
};

export const LodLevelPixels = {
    ZERO: 20,
    ONE: 100,
    TWO: 250
};


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