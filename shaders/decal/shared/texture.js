import { createTex, overrideTex, TEX_2D, WrapMode } from "../../shared/util";


const DecalAlbedoMap = createTex("DecalAlbedoMap", TEX_2D, {
    isSRGB: 1,
    ui: {
        suffix: "_a",
        components: [ "red", "green", "blue" ]
    },
    sampler: {
        addressUMode: WrapMode.CLAMP_TO_EDGE,
        addressVMode: WrapMode.CLAMP_TO_EDGE
    },
});

const DecalTransparencyMap = createTex("DecalTransparencyMap", TEX_2D, {
    ui: {
        suffix: "_t",
        components: [ "transparency mask" ]
    },
    sampler: {
        addressUMode: WrapMode.CLAMP_TO_EDGE,
        addressVMode: WrapMode.CLAMP_TO_EDGE
    }
});

const DecalFresnelMap = createTex("DecalFresnelMap", TEX_2D, {
    isSRGB: 1,
    ui: {
        suffix: "_f",
        components: [ "red", "green", "blue" ]
    },
    sampler: {
        addressUMode: WrapMode.CLAMP_TO_EDGE,
        addressVMode: WrapMode.CLAMP_TO_EDGE
    },
});

const DecalNormalMap = createTex("DecalNormalMap", TEX_2D, {
    ui: {
        suffix: "_n",
        components: [ "normal x", "normal y" ]
    },
    sampler: {
        addressUMode: WrapMode.CLAMP_TO_EDGE,
        addressVMode: WrapMode.CLAMP_TO_EDGE
    },
});

const DecalRoughnessMap = createTex("DecalRoughnessMap", TEX_2D, {
    ui: {
        suffix: "_r",
        components: [ "roughness mask" ]
    },
    sampler: {
        addressUMode: WrapMode.CLAMP_TO_EDGE,
        addressVMode: WrapMode.CLAMP_TO_EDGE
    }
});


export const DecalAlbedoMap_SamplerBorder = overrideTex(DecalAlbedoMap, {
    sampler: {
        name: "DecalAlbedoMapSamplerBorder",
    }
});

export const DecalAlbedoMap_SamplerWrap = overrideTex(DecalAlbedoMap, {
    sampler: {
        name: "DecalAlbedoMapSamplerWrap",
        addressUMode: WrapMode.REPEAT,
        addressVMode: WrapMode.REPEAT
    }
});

export const DecalTransparencyMap_SamplerBorder = overrideTex(DecalTransparencyMap, {
    sampler: {
        name: "DecalTransparencyMapSamplerBorder",
    }
});


export const DecalTransparencyMap_SamplerWrap = overrideTex(DecalTransparencyMap, {
    sampler: {
        name: "DecalAlbedoMapSamplerWrap",
        addressUMode: WrapMode.REPEAT,
        addressVMode: WrapMode.REPEAT
    }
});


export const DecalFresnelMap_SamplerBorder = overrideTex(DecalFresnelMap, {
    sampler: {
        name: "DecalFresnelMapSamplerBorder",
    }
});


export const DecalFresnelMap_SamplerWrap = overrideTex(DecalFresnelMap, {
    sampler: {
        name: "DecalFresnelMapSamplerWrap",
        addressUMode: WrapMode.REPEAT,
        addressVMode: WrapMode.REPEAT
    }
});

export const DecalNormalMap_SamplerBorder = overrideTex(DecalNormalMap, {
    sampler: {
        name: "DecalNormalMapSamplerBorder",
    }
});

export const DecalNormalMap_SamplerWrap = overrideTex(DecalNormalMap, {
    sampler: {
        name: "DecalNormalMapSamplerWrap",
        addressUMode: WrapMode.REPEAT,
        addressVMode: WrapMode.REPEAT
    }
});

export const DecalRoughnessMap_SamplerBorder = overrideTex(DecalRoughnessMap, {
    sampler: {
        name: "DecalRoughnessMapSamplerBorder",
    }
});


export const DecalRoughnessMap_SamplerWrap = overrideTex(DecalRoughnessMap, {
    sampler: {
        name: "DecalRoughnessMapSamplerWrap",
        addressUMode: WrapMode.REPEAT,
        addressVMode: WrapMode.REPEAT
    }
});


export const DecalGlowMap = createTex("DecalGlowMap", TEX_2D, {
    ui: {
        suffix: "_g",
        components: [ "glow mask" ]
    },
    sampler: {}

});



