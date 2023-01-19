import { createTex, TEX_2D, TEX_CUBE_MAP, TEX_PROJECTION, WrapMode } from "./util";


/*------------------------------------------------------------------------------------------------- global ----------*/


export const EveSpaceSceneEnvMap = createTex("EveSpaceSceneEnvMap", TEX_CUBE_MAP, {
    isSRGB: 1,
    isAutoregister: 1,
    ui: {
        display: 0
    }
});

export const EveSpaceSceneShadowMap = createTex("EveSpaceSceneShadowMap", TEX_PROJECTION, {
    isAutoregister: 1,
    ui: {
        display: 0
    }
});

export const EveSpaceSceneDepthMap = createTex("EveSpaceSceneDepthMap", TEX_2D, {
    isAutoregister: 1,
    ui: {
        display: 0
    }
});

export const EveSpaceSceneNormalMap = createTex("EveSpaceSceneNormalMap", TEX_2D, {
    isAutoregister: 1,
    ui: {
        display: 0
    }
});


/*------------------------------------------------------------------------------------------------- blit -------------*/


export const BlitCurrent = createTex("BlitCurrent", TEX_2D, {
    ui: {
        display: 0
    }
});

export const BlitOriginal = createTex("BlitOriginal", TEX_2D, {
    ui: {
        display: 0
    }
});


/*------------------------------------------------------------------------------------------------- common -----------*/


export const TextureMap = createTex("TextureMap", TEX_2D, {
    isSRGB: true
});

export const TextureMap_ClampBorder = createTex("TextureMap", TEX_2D, {
    isSRGB: true,
    sampler: {
        name: "TextureMapClampBorderSampler",
        addressUMode: WrapMode.CLAMP_TO_EDGE,
        addressVMode: WrapMode.CLAMP_TO_EDGE
    }
});

export const DustNoiseMap = createTex("DustNoiseMap", TEX_2D, {
    isSRGB: true,
    ui: {
        description: "Dust noise map",
        components: [ "red", "green", "blue", "alpha" ]
    }
});


/*------------------------------------------------------------------------------------------------- fx ---------------*/

export const ImageMap = createTex("ImageMap", TEX_2D, {
    ui: {
        description: "Image map",
        components: [ "red", "green", "blue", "alpha" ]
    }
});

export const MaskMap = createTex("MaskMap", TEX_2D, {
    ui: {
        description: "Mask map",
        components: [ "red" ],                              // ???
    }
});

export const BorderMap = createTex("BorderMap", TEX_2D, {
    ui: {
        description: "Border map",
        components: [ "red" ],                              // ???
    }
});

export const Layer1Map = createTex("Layer1Map", TEX_2D, {
    ui: {
        description: "Layer map",
        components: [ "red", "green", "blue", "alpha" ]     // alpha?
    }
});

export const Layer2Map = createTex("Layer2Map", TEX_2D, {
    ui: {
        description: "Layer map",
        components: [ "red", "green", "blue", "alpha" ]     // alpha?
    }
});

