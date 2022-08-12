import { createLinearColor, WidgetType } from "../../shared/util";


export const Outline = {
    name: "Outline",
    value: [ 1, 0, 0, 10 ],
    ui: {
        group: "Outline",
        components: [
            "linear red",
            "linear green",
            "linear blue",
            "size"
        ],
        widget: WidgetType.MIXED,
        display: 0
    }
};


export const Mode = {
    NORMALS: 1,
    BI_TANGENTS: 2,
    TANGENTS: 3,
    PAINT_MASK: 4,
    MATERIAL_MAP: 5,
    MATERIAL_1_MASK: 6,
    MATERIAL_2_MASK: 7,
    MATERIAL_3_MASK: 8,
    MATERIAL_4_MASK: 9,
    DIRT_MASK: 10,
    GLOW_MASK: 11,
    ALBEDO_MAP: 12,
    ROUGHNESS_MAP: 13,
    NORMAL_MAP: 14,
    NORMAL_MAP_POSITIVE: 15,
    NORMAL_MAP_NEGATIVE: 16,
    AMBIENT_OCCLUSION_MAP: 17,
    PATTERN_1_MASK: 18,
    PATTERN_2_MASK : 19,
    DUST_NOISE_MAP: 20,
    HEAT: 21,
    GLASS: 22,
    SAILS_MAP: 23,
    SAILS_MAP_PATTERN: 24,
    SAILS_MAP_BACKGROUND: 25,
    DETAIL_1_MAP: 26,
    DETAIL_2_MAP: 27,
    DETAIL_3_MAP: 28
};


export const SelectorMode = {
    name: "SelectorMode",
    value: [ 0, 0, 0, 0 ],
    ui: {
        group: "Selector",
        components: [ "mode" ],
        widget: WidgetType.MIXED,
        display: 1
    }
};

export const SelectorColor = createLinearColor({
    name: "SelectorColor",
    value: [ 0.5, 0.25, 0.0, 1.0 ],
    ui: {
        group: "Selector",
        display: 1
    }
});
