import { createLinearColor, createGloss, WidgetType } from "../../shared/util";


export const GeneralData = {
    name: "GeneralData",
    value: [ 1, 0, 0, 0 ],
    ui: {
        group: "General",
        widget: WidgetType.MIXED,
        components: [ "paint mask influence", "uv selector" ],
        description: "general controls for the material",
        display: 1
    }
};

export const GeneralGlowColor = createLinearColor({
    name: "GeneralGlowColor",
    ui: {
        group: "General",
        description: "lights color"
    }
});

export const Mtl1DiffuseColor = createLinearColor({
    name: "Mtl1DiffuseColor",
    ui: {
        group: "Material 1",
        description: "albedo color"
    }
});

export const Mtl2DiffuseColor = createLinearColor({
    name: "Mtl2DiffuseColor",
    ui: {
        group: "Material 2",
        description: "albedo color"
    }
});

export const Mtl3DiffuseColor = createLinearColor({
    name: "Mtl3DiffuseColor",
    ui: {
        group: "Material 3",
        description: "albedo color"
    }
});

export const Mtl4DiffuseColor = createLinearColor({
    name: "Mtl4DiffuseColor",
    ui: {
        group: "Material 4",
        description: "albedo color"
    }
});

export const Mtl1FresnelColor = createLinearColor({
    name: "Mtl1FresnelColor",
    ui: {
        group: "Material 1",
        description: "fresnel color"
    }
});

export const Mtl2FresnelColor = createLinearColor({
    name: "Mtl2FresnelColor",
    ui: {
        group: "Material 2",
        description: "fresnel color"
    }
});

export const Mtl3FresnelColor = createLinearColor({
    name: "Mtl3FresnelColor",
    ui: {
        group: "Material 3",
        description: "fresnel color"
    }
});

export const Mtl4FresnelColor = createLinearColor({
    name: "Mtl4FresnelColor",
    ui: {
        group: "Material 4",
        description: "fresnel color"
    }
});

export const Mtl1Gloss = createGloss({
    name: "Mtl1Gloss",
    ui: {
        group: "Material 1",
        description: "gloss"
    }
});

export const Mtl2Gloss = createGloss({
    name: "Mtl2Gloss",
    ui: {
        group: "Material 2",
        description: "gloss"
    }
});

export const Mtl3Gloss = createGloss({
    name: "Mtl3Gloss",
    ui: {
        group: "Material 3",
        description: "gloss"
    }
});

export const Mtl4Gloss = createGloss({
    name: "Mtl4Gloss",
    ui: {
        group: "Material 4",
        description: "gloss"
    }
});


//----------------------------------------------------------------------------------------[ pattern ]-----------------//


export const PMtl1DiffuseColor = createLinearColor({
    name: "PMtl1DiffuseColor",
    ui: {
        group: "Pattern Material 1",
        description: "albedo color"
    }
});

export const PMtl1FresnelColor = createLinearColor({
    name: "PMtl1FresnelColor",
    ui: {
        group: "Pattern Material 1",
        description: "fresnel color"
    }
});

export const PMtl1Gloss = createGloss({
    name: "PMtl1Gloss",
    ui: {
        group: "Pattern Material 1",
        description: "gloss"
    }
});

export const PMtl2DiffuseColor = createLinearColor({
    name: "PMtl2DiffuseColor",
    ui: {
        group: "Pattern Material 2",
        description: "albedo color"
    }
});

export const PMtl2FresnelColor = createLinearColor({
    name: "PMtl2FresnelColor",
    ui: {
        group: "Pattern Material 2",
        description: "fresnel color"
    }
});

export const PMtl2Gloss = createGloss({
    name: "PMtl2Gloss",
    ui: {
        group: "Pattern Material 2",
        description: "gloss"
    }
});


//----------------------------------------------------------------------------------------[ dust ]--------------------//


export const Mtl1DustDiffuseColor = createLinearColor({
    name: "Mtl1DustDiffuseColor",
    ui: {
        group: "Material 1",
        description: "dust albedo color"
    }
});

export const Mtl2DustDiffuseColor = createLinearColor({
    name: "Mtl2DustDiffuseColor",
    ui: {
        group: "Material 2",
        description: "dust albedo color"
    }
});

export const Mtl3DustDiffuseColor = createLinearColor({
    name: "Mtl3DustDiffuseColor",
    ui: {
        group: "Material 3",
        description: "dust albedo color"
    }
});

export const Mtl4DustDiffuseColor = createLinearColor({
    name: "Mtl4DustDiffuseColor",
    ui: {
        group: "Material 4",
        description: "dust albedo color"
    }
});


//----------------------------------------------------------------------------------------[ heat ]--------------------//


const heatGlowDataComponents = [
    "heat booster gain influence",
    "heat shimmer speed",
    "heat shimmer size",
    "heat shimmer strength"
];

const heatGlowDataValue = [ 1, 0, 0, 0 ];

export const Mtl1HeatGlowData = {
    name: "Mtl1HeatGlowData",
    value: heatGlowDataValue,
    ui: {
        group: "Material 1",
        description: "heat glow data",
        components: heatGlowDataComponents,
        widget: WidgetType.MIXED
    }
};

export const Mtl2HeatGlowData = {
    name: "Mtl2HeatGlowData",
    value: heatGlowDataValue,
    ui: {
        group: "Material 2",
        description: "heat glow data",
        components: heatGlowDataComponents,
        widget: WidgetType.MIXED
    }
};

export const Mtl3HeatGlowData = {
    name: "Mtl3HeatGlowData",
    value: heatGlowDataValue,
    ui: {
        group: "Material 3",
        description: "heat glow data",
        components: heatGlowDataComponents,
        widget: WidgetType.MIXED
    }
};

export const Mtl4HeatGlowData = {
    name: "Mtl4HeatGlowData",
    value: heatGlowDataValue,
    ui: {
        group: "Material 4",
        description: "heat glow data",
        components: heatGlowDataComponents,
        widget: WidgetType.MIXED
    }
};

export const GeneralHeatGlowColor = createLinearColor({
    name: "GeneralHeatGlowColor",
    ui: {
        group: "Heat",
        description: "heat glow color"
    }
});


//----------------------------------------------------------------------------------------[ sail ]--------------------//


export const SailsDetailData = {
    name: "SailsDetailData",
    value: [ 1, 0, 0, 0 ],
    ui: {
        group: "Sails",
        description: "sail detail data",
        components: [
            "sail scale",
            "sail rotation",
            "sail specular",
            "sail alpha"
        ],
        widget: WidgetType.MIXED
    }
};


//----------------------------------------------------------------------------------------[ detail ]------------------//


const detailComponents = [
    "detail scale",
    "detail intensity",
    "detail offset x",
    "detail offset y"
];

export const Detail1Data = {
    name: "Detail1Data",
    value: [ 0, 0, 0, 0 ],
    ui: {
        group: "Detail 1",
        components: detailComponents,
        widget: WidgetType.MIXED
    }
};

export const Detail2Data = {
    name: "Detail2Data",
    value: [ 0, 0, 0, 0 ],
    ui: {
        group: "Detail 2",
        components: detailComponents,
        widget: WidgetType.MIXED
    }
};

export const Detail3Data = {
    name: "Detail3Data",
    value: [ 0, 0, 0, 0 ],
    ui: {
        group: "Detail 3",
        components: detailComponents,
        widget: WidgetType.MIXED
    }
};

export const DetailSelector = {
    name: "DetailSelector",
    value: [ 0, 0, 0, 0 ],
    ui: {
        group: "Detail",
        components: [
            "detail mtl1 strength",
            "detail mtl2 strength",
            "detail mtl3 strength",
            "detail mtl4 strength",
        ],
        widget: WidgetType.MIXED
    }
};

export const DetailAlbedoColor = createLinearColor({
    name: "DetailAlbedoColor",
    ui: {
        group: "Detail",
        description: "albedo color"
    }
});

export const DetailFresnelColor = createLinearColor({
    name: "DetailFresnelColor",
    ui: {
        group: "Detail",
        description: "fresnel color"
    }
});

