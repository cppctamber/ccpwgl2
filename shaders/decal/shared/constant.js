import { createLinearColor, WidgetType } from "../../shared/util";


export const DecalClampToBorder = {
    name: "DecalClampToBorder",
    value: [ 0, 0, 0, 0 ],
    ui: {
        group: "Decal",
        description: "Overrides address modes to clamp to border",
        components: [
            "u",
            "v",
            "w"
        ],
        widget: WidgetType.MIXED
    }
};


export const DecalTextureOffset = {
    name: "DecalTextureOffset",
    value: [ 0, 0, 0, 0 ],
    ui: {
        group: "Decal",
        description: "Decal options",
        components: [ "u offset", "v offset" ],
        widget: WidgetType.MIXED,
        display: true
    }
};


export const DecalTextureScaling = {
    name: "DecalTextureScaling",
    value: [ 1, 1, 0, 1 ],
    ui: {
        group: "Decal",
        components: [
            "u scale",
            "v scale",
            "uv angular rotation speed",
            "circular stretch"
        ],
        widget: WidgetType.MIXED,
        display: true
    }
};


export const DecalGlowColor = createLinearColor({
    name: "DecalGlowColor",
    ui: {
        group: "Decal",
        description: "glow color"
    }
});


export const DecalIntensityData = {
    name: "DecalIntensityData",
    value: [ 1, 0, 0, 0 ],
    ui: {
        group: "Decal",
        description: "glow intensity",
        components: [ "decalGlowIntensity" ],
        widget: WidgetType.MIXED,
        display: true
    }
};

