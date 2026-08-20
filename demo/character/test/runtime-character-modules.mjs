import { registerHooks } from "node:module";

import { SetTestTw2 } from "./ccpwgl-global.mjs";

const globalURL = new URL("./ccpwgl-global.mjs", import.meta.url).href;
const utilsURL = new URL("./ccpwgl-utils.mjs", import.meta.url).href;
const interiorSceneURL = new URL("./ccpwgl-interior-scene.mjs", import.meta.url).href;

registerHooks({
    resolve(specifier, context, nextResolve)
    {
        if (specifier === "global")
        {
            return { shortCircuit: true, url: globalURL };
        }
        if (specifier === "utils")
        {
            return { shortCircuit: true, url: utilsURL };
        }
        if (specifier === "interior/scene/Tr2InteriorScene")
        {
            return { shortCircuit: true, url: interiorSceneURL };
        }
        return nextResolve(specifier, context);
    }
});

const root = new URL("../../../src/runtime/character/", import.meta.url);
const [
    character,
    scene,
    registration,
    appearanceManager,
    libraryClient,
    appearance,
    atlas,
    adapter,
    foundation,
    coverage,
    palette,
    texture,
    triangles,
    morphs
] = await Promise.all([
    import(new URL("TnyCharacter.js", root)),
    import(new URL("TnyCharacterScene.js", root)),
    import(new URL("register.js", root)),
    import(new URL("TnyCharacterAppearanceManager.js", root)),
    import(new URL("TnyCharacterLibraryClient.js", root)),
    import(new URL("gles/TnyGlesAppearanceConstruction.js", root)),
    import(new URL("gles/TnyGlesAtlasComposer.js", root)),
    import(new URL("gles/TnyGlesCharacterAdapter.js", root)),
    import(new URL("gles/TnyGlesFoundationConstruction.js", root)),
    import(new URL("gles/TnyGlesFoundationCoveragePolicy.js", root)),
    import(new URL("gles/TnyGlesPaletteCompatibility.js", root)),
    import(new URL("gles/TnyGlesTexturePolicy.js", root)),
    import(new URL("gles/TnyGlesTriangleCoverage.js", root)),
    import(new URL("gles/TnyGlesMorphDeformation.js", root))
]);

export { SetTestTw2 };
export const { TnyCharacter } = character;
export const { TnyCharacterScene } = scene;
export const {
    RegisterTnyCharacterConstructors,
    tnyCharacterConstructors
} = registration;
export const { TnyCharacterAppearanceManager } = appearanceManager;
export const { TnyCharacterLibraryClient } = libraryClient;
export const { TnyGlesAppearanceConstruction } = appearance;
export const {
    applyLegacyConfiguredFaceTextures,
    attachLegacyBodyDiffuse,
    attachLegacyBodyNormal,
    attachLegacyBodySpecular,
    TnyGlesAtlasComposer,
    commitLegacyConfiguredAccessoryBindings,
    commitLegacyConfiguredConsumerBindings,
    commitLegacyConfiguredGarmentBindings,
    commitLegacyConfiguredHairBindings,
    commitLegacyConfiguredHeadwearBindings,
    commitLegacyConfiguredMaterialOnlyAccessoryBindings,
    commitLegacyConfiguredHeadBindings,
    commitLegacyFoundationAlphaCutBindings,
    commitLegacyFoundationCutMaskBindings,
    composeLegacyConfiguredConsumerPixel,
    composeLegacyFoundationCutMaskPixel,
    decodeLegacyBc3AlphaMask,
    getLegacyConfiguredConsumerPassContract,
    hideLegacyConfiguredHairHeadShells,
    isLegacyConfiguredBodyConsumerEffect,
    parsePngAtlasMetadata,
    ReadLibraryAtlasMetadata,
    planLegacyConfiguredBodyConsumers,
    planLegacyBodyDiffuseOperations,
    planLegacyExactFemaleLowerSleeve,
    planLegacyExactFemaleUpperSleeve,
    planLegacyExactFemaleTuckSupport,
    planLegacySelectedTopDrapeSupport,
    planLegacyFemaleFoundationCutMask,
    resolveLegacyBodyDiffuseContribution,
    resolveLegacyConfiguredAccessoryConsumers,
    resolveLegacyConfiguredAccessoryMaterial,
    resolveLegacyConfiguredMaterialOnlyAccessory,
    resolveLegacyConfiguredGarmentDiffuseContribution,
    resolveLegacyConfiguredHairDiffuseContribution,
    resolveLegacyConfiguredHairConsumers,
    resolveLegacyConfiguredHeadwearMaterial,
    resolveLegacyHairShaderMaterial,
    resolveLegacyBodyMaterialChannels,
    resolveLegacyDefaultBrowCandidate,
    resolveLegacyDefaultEyelashCandidate,
    resolveLegacyBodyFoundationPath,
    resolveLegacyBodyFoundationSpecularPath,
    resolveLegacyCroppedTextureTransform,
    resolveLegacyGarmentMaterialChannels,
    resolveLegacyHairMaterialChannels,
    resolveLegacyHeadMaterialChannels,
    resolveLegacyReadyHeadContributions,
    summarizeLegacyTextureAlpha,
    summarizeLegacyCarrierAlpha
} = atlas;
export const {
    applyLegacyConfiguredCardAreas,
    applyLegacyProofGarmentMaterial,
    OrderConfiguredHairMeshesForRendering,
    PrepareConfiguredFaceCarriers,
    TnyGlesCharacterAdapter
} = adapter;
export const { TnyGlesFoundationConstruction } = foundation;
export const { TnyGlesFoundationCoveragePolicy } = coverage;
export const { TnyGlesPaletteCompatibility } = palette;
export const { TnyGlesTexturePolicy } = texture;
export const { TnyGlesTriangleCoverage } = triangles;
export const { TnyGlesMorphDeformation } = morphs;
