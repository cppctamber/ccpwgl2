import { createTex, TEX_2D } from "../../shared/util";


export const PaintMaskMap = createTex("PaintMaskMap", TEX_2D, {
    multiplier: "1.0",
    ui: {
        suffix: "_p3",
        //group: "General",
        description: "paint mask",
        components: [ "mask" ]
    }
});

export const MaterialMap = createTex("MaterialMap", TEX_2D, {
    ui: {
        suffix: "_m",
        //group: "General",
        description: "material mask",
        components: [ "mask" ]
    }
});

export const DirtMap = createTex("DirtMap", TEX_2D, {
    ui: {
        suffix: "_d",
        //group: "General",
        description: "dirt mask",
        components: [ "mask" ]
    }
});

export const GlowMap = createTex("GlowMap", TEX_2D, {
    ui: {
        suffix: "_g",
        //group: "General",
        description: "glow mask",
        components: [ "mask" ]
    }
});

export const NormalMap = createTex("NormalMap", TEX_2D, {
    ui: {
        suffix: "_n",
        //group: "General",
        description: "normal",
        components: [ "normal x", "normal y" ]
    }
});

export const AoMap = createTex("AoMap", TEX_2D, {
    ui: {
        suffix: "_o",
        //group: "General",
        description: "ambient occlusion",
        components: [ "ambient occlusion" ]
    }
});


export const AlbedoMap = createTex("AlbedoMap", TEX_2D, {
    isSRGB: 1,
    ui: {
        suffix: "_a",
        //group: "General",
        description: "albedo",
        components: [ "red", "green", "blue" ]
    }
});


export const RoughnessMap = createTex("RoughnessMap", TEX_2D, {
    ui: {
        suffix: "_r",
        //group: "General",
        description: "roughness",
        components: [ "roughness" ]
    }
});


//----------------------------------------------------------------------------------------[ pattern ]-----------------//


export const PatternMask1Map = createTex("PatternMask1Map", TEX_2D, {
    ui: {
        //group: "Pattern 1",
        description: "pattern 1",
        components: [ "mask" ]
    }
});

export const PatternMask2Map = createTex("PatternMask2Map", TEX_2D, {
    ui: {
        //group: "Pattern 2",
        description: "pattern 2",
        components: [ "mask" ]
    }
});


//----------------------------------------------------------------------------------------[ heat ]--------------------//


export const HeatGlowNoiseMap = createTex("HeatGlowNoiseMap", TEX_2D, {
    isSRGB: true,
    ui: {
        //group: "Heat",
        description: "Heat glow noise map",
        components: [ "red", "green", "blue", "alpha" ]
    }
});


//----------------------------------------------------------------------------------------[ sail ]--------------------//


export const SailsDetailMap = createTex("SailsDetailMap", TEX_2D, {
    ui: {
        //group: "Sails",
        description: "Sail detail map"
    }
});


//----------------------------------------------------------------------------------------[ detail ]------------------//


export const Detail1Map = createTex("Detail1Map", TEX_2D, {
    ui: {
        //group: "Detail 1",
        description: "detail map"
    }
});

export const Detail2Map = createTex("Detail1Map", TEX_2D, {
    ui: {
        //group: "Detail 2",
        description: "detail map"
    }
});

export const Detail3Map = createTex("Detail1Map", TEX_2D, {
    ui: {
        //group: "Detail 3",
        description: "detail map"
    }
});


//----------------------------------------------------------------------------------------[ oil ]---------------------//


export const OilFilmLookupMap = createTex("OilFilmLookupMap", TEX_2D, {
    isSRGB: 1,
    ui: {
        //group: "Oil",
        description: "Oil lookup map",
        components: [ "red", "green", "blue", "alpha" ]
    }
});