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

export const DecalDiffuseMode = {
    name: "DecalDiffuseMode",
    value: [ 0, 0, 0, 0 ],
    ui: {
        group: "Decal",
        components: [ "Color mode" ],
        widgets: [ WidgetType.UINT ],
        widget: WidgetType.MIXED,
        display: true
    }
};

export const DecalDiffuseColorModes = {
    NONE: 0,
    ADD: 1,
    SUBTRACT: 2,
    MULTIPLY: 3,
    DIVIDE: 4,
    REPLACE: 5
};

export const DecalDiffuseColorOverride = createLinearColor({
    name: "DecalDiffuseColorOverride",
    value: [ 0, 0, 0, 0 ],
    ui: {
        group: "Decal",
        description: "Colour override",
        widget: WidgetType.LINEAR_COLOR,
        display: true
    }
});

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

export const DecalChromaKeyColor = createLinearColor({
    name: "DecalChromaKeyColor",
    ui: {
        group: "DecalChroma",
        description: "Decal chroma key color"
    }
});

/*

    enable = 0 by default (safe: doesn’t unexpectedly erase existing decals)
    tolerance = 0.07 handles mild compression variation around the background color
    softness = 0.05 feathers edges to avoid harsh halos
    edgeReject = 0.02 works well with manual approx-fwidth at uvStep = 1/1024

 */
export const DecalChromaKeyData = {
    name: "DecalChromaKeyData",
    value: [ 0.0, 0.10, 0.06, 0.75 ],
    ui: {
        group: "DecalChroma",
        description: "Decal chroma key settings",
        components: [
            "chromaEnable",
            "chromaTolerance",
            "chromaSoftness",
            "chromaMajority"     // was chromaEdgeReject
        ],
        widget: WidgetType.MIXED,
        display: true
    }
};

export const DecalChromaKeyData2 = {
    name: "DecalChromaKeyData2",
    value: [ 0.0009765625, 1.0, 0.85, 0.0 ],
    ui: {
        group: "DecalChroma",
        description: "Decal chroma key settings",
        components: [
            "chromaUVStep",          // x
            "chromaAlphaGain",       // y
            "chromaDespillStrength", // z  (moved from Data3)
            "chromaInvert"           // w
        ],
        widget: WidgetType.MIXED,
        display: true
    }
};
