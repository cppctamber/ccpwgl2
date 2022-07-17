import { createBorderAndWrap, createTex, TEX_2D, TEX_CUBE_MAP, WrapMode } from "../../shared/util";


const [ DecalAlbedoMap_SamplerBorder, DecalAlbedoMap_SamplerWrap ] = createBorderAndWrap("DecalAlbedoMap", TEX_2D, {
    isSRGB: 1,
    ui: {
        suffix: "_a",
        components: [ "red", "green", "blue" ]
    }
});


const [ DecalTransparencyMap_SamplerBorder, DecalTransparencyMap_SamplerWrap ] = createBorderAndWrap("DecalTransparencyMap", TEX_2D, {
    ui: {
        suffix: "_t",
        components: [ "transparency mask" ]
    }
});


const [ DecalFresnelMap_SamplerBorder, DecalFresnelMap_SamplerWrap ] = createBorderAndWrap("DecalFresnelMap", TEX_2D, {
    isSRGB: 1,
    ui: {
        suffix: "_f",
        components: [ "red", "green", "blue" ]
    }
});


const [ DecalNormalMap_SamplerBorder, DecalNormalMap_SamplerWrap ] = createBorderAndWrap("DecalNormalMap", TEX_2D, {
    ui: {
        suffix: "_n",
        components: [ "normal x", "normal y" ]
    }
});


const [ DecalRoughnessMap_SamplerBorder, DecalRoughnessMap_SamplerWrap ] = createBorderAndWrap("DecalRoughnessMap", TEX_2D, {
    ui: {
        suffix: "_r",
        components: [ "roughness mask" ]
    }
});


const [ DecalGlowMap_SamplerBorder, DecalGlowMap_SamplerWrap ] = createBorderAndWrap("DecalGlowMap", TEX_2D, {
    ui: {
        suffix: "_g",
        components: [ "glow mask" ]
    }
});


//----------------------------------------------------------------------------------------[ hole ]--------------------//


export const DecalHoleMap = createTex("DecalHoleMap", TEX_2D, {
    sampler: {
        addressUMode: WrapMode.CLAMP_TO_EDGE,
        addressVMode: WrapMode.CLAMP_TO_EDGE
    }
});

export const DecalInsideCubeMap = createTex("DecalInsideCubeMap", TEX_CUBE_MAP, {
    sampler: {
        addressUMode: WrapMode.CLAMP_TO_EDGE,
        addressVMode: WrapMode.CLAMP_TO_EDGE
    }
});


export {
    DecalAlbedoMap_SamplerBorder,
    DecalAlbedoMap_SamplerWrap,
    DecalTransparencyMap_SamplerBorder,
    DecalTransparencyMap_SamplerWrap,
    DecalFresnelMap_SamplerBorder,
    DecalFresnelMap_SamplerWrap,
    DecalNormalMap_SamplerBorder,
    DecalNormalMap_SamplerWrap,
    DecalRoughnessMap_SamplerBorder,
    DecalRoughnessMap_SamplerWrap,
    DecalGlowMap_SamplerBorder,
    DecalGlowMap_SamplerWrap
};

