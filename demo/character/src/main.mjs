/* global globalThis */

import { CjsCharacterLibraryManager } from "/vendor/runtime-character/library/CjsCharacterLibraryManager.js";
import { CjsCharacterAppearanceResolver } from "/vendor/runtime-character/character/resolution/CjsCharacterAppearanceResolver.js";
import { CjsCharacterModifierOrder } from "/vendor/runtime-character/character/composition/CjsCharacterModifierOrder.js";
import { CjsCharacterAtlasLayout } from "/vendor/runtime-character/character/composition/CjsCharacterAtlasLayout.js";
import { tnyCharacterConstructors } from "/src/runtime/character/register.js";
import { tiny, tny } from "./demo/ccpwgl-global.mjs";
import { CharacterDemoApplication } from "./demo/CharacterDemoApplication.mjs";
import { InstallCharacterDemoGrannyStateResource } from "./demo/CharacterDemoGrannyStateResource.mjs";
import { InitializeCharacterDemoScene } from "./demo/CharacterDemoScene.mjs";
import { installCharacterDemoAlphaAudit } from "./demo/CharacterDemoAlphaAudit.mjs";
import { installCharacterDemoClothingAudit } from "./demo/CharacterDemoClothingAudit.mjs";
import { ConfigureCharacterDemoWithoutSof } from "./demo/CharacterDemoSofPolicy.mjs";
import {
    InstallSyntheticFemaleRobeFixture,
    InstallSyntheticHeadLayerFixture,
    InstallSyntheticMaleTopUnderwearFixture,
    SYNTHETIC_FEMALE_ROBE_RECORD_ID,
    SYNTHETIC_HEAD_RECORD_ID,
    SYNTHETIC_MALE_TOP_UNDERWEAR_RECORD_ID
} from "./demo/CharacterDemoSyntheticFixture.mjs";
import { CharacterDemoView } from "./demo/CharacterDemoView.mjs";

const tw2 = globalThis.tw2;

const TnyCharacterLibraryClient = RequireClass("TnyCharacterLibraryClient");
const TnyCharacterAppearanceManager = RequireClass("TnyCharacterAppearanceManager");
const TnyGlesAppearanceConstruction = RequireClass("TnyGlesAppearanceConstruction");
const TnyGlesAtlasComposer = RequireClass("TnyGlesAtlasComposer");
const TnyGlesCharacterAdapter = RequireClass("TnyGlesCharacterAdapter");
const TnyGlesFoundationConstruction = RequireClass("TnyGlesFoundationConstruction");
const TnyGlesTexturePolicy = RequireClass("TnyGlesTexturePolicy");

const parameters = new URLSearchParams(globalThis.location.search);
const initialPartSelections = [ ...parameters.entries() ]
    .filter(([ name ]) => name.startsWith("part."))
    .map(([ name, choiceID ]) => ({
        locationID: name.slice("part.".length),
        choiceID
    }));
const CAMERA_REGION_PRESETS = Object.freeze({
    head: Object.freeze({
        distance: 0.75,
        fov: 14,
        poi: Object.freeze([ 0, 1.66, 0 ]),
        rotationX: 0,
        rotationY: 0
    }),
    eyes: Object.freeze({
        distance: 0.5,
        fov: 6,
        poi: Object.freeze([ 0, 1.67, 0 ]),
        rotationX: 0,
        rotationY: 0
    }),
    waist: Object.freeze({
        distance: 0.7,
        fov: 12,
        poi: Object.freeze([ 0, 0.78, 0 ]),
        rotationX: 0,
        rotationY: 0
    }),
    body: Object.freeze({
        distance: 1.15,
        fov: 20,
        poi: Object.freeze([ 0, 1.02, 0 ]),
        rotationX: 0,
        rotationY: 0
    })
});
const cameraRegion = CAMERA_REGION_PRESETS[parameters.get("region")] ?? null;
const backgroundProof = parameters.get("background");
const diagnosticClearColor = backgroundProof === "violent-green-html"
    ? [ 0, 0, 0, 0 ]
    : backgroundProof === "violent-green"
        ? [ 0.05, 1, 0, 1 ]
        : [ 0.035, 0.055, 0.08, 1 ];
if (backgroundProof === "violent-green-html")
{
    globalThis.document.documentElement.dataset.backgroundProof = backgroundProof;
}
if (cameraRegion) globalThis.document.documentElement.dataset.cameraRegion = parameters.get("region");
const syntheticHeadFixture = parameters.get("fixture") === "head-layers";
const syntheticFemaleRobeFixture = parameters.get("fixture") === "female-robe";
const syntheticMaleTopUnderwearFixture =
    parameters.get("fixture") === "male-top-underwear";
const morphComparison = parameters.get("morphs");
const morphDeformationSkippedPaths = [];
const morphDeformationSkippedTargets = [];
for (const targetName of (parameters.get("morphSkip") ?? "").split(","))
{
    const normalizedTargetName = targetName.trim();
    if (normalizedTargetName) morphDeformationSkippedTargets.push(normalizedTargetName);
}
if (morphComparison === "tuck-off")
{
    morphDeformationSkippedPaths.push(
        "res:/graphics/character/female/paperdoll/dependants/tuck/basic/tuck.gr2"
    );
}
else if (morphComparison === "pants-off")
{
    morphDeformationSkippedPaths.push(
        "res:/graphics/character/female/paperdoll/bottomouter/pantscf01/pantscf01.gr2"
    );
}
else if (morphComparison === "hip-off")
{
    morphDeformationSkippedTargets.push(
        "pinchleftlowerhipsshape",
        "pinchleftmiddlehipsshape",
        "pinchleftupperhipsshape",
        "pinchrightlowerhipsshape",
        "pinchrightmiddlehipsshape",
        "pinchrightupperhipsshape"
    );
}
const state = {
    ready: false,
    phase: "booting",
    error: null
};

globalThis.characterDemo = { state };
let view = null;

try
{
    view = new CharacterDemoView();
    const toolsService = await LoadToolsServiceConfig();
    const libraryURL = parameters.get("library")
        || `${toolsService.paths.api}character/library.json`;
    const libraryClient = new TnyCharacterLibraryClient({
        LibraryManager: CjsCharacterLibraryManager
    });
    ConfigureCharacterDemoWithoutSof(tw2);
    const runtimeClient = tny || tiny;
    const resourceRoot = toolsService.paths.res.replace(/\/+$/u, "");
    const gState = InstallCharacterDemoGrannyStateResource(tw2);
    globalThis.characterDemo.gState = gState;
    await InitializeCharacterDemoScene({
        client: runtimeClient,
        tw2,
        resourceRoot,
        cameraDistance: parameters.has("cameraDistance")
            ? Number(parameters.get("cameraDistance"))
            : cameraRegion?.distance ?? 3.2,
        clearColor: diagnosticClearColor
    });
    const adapter = new TnyGlesCharacterAdapter({
        client: runtimeClient,
        atlasComposer: new TnyGlesAtlasComposer({
            characterAtlasLayout: CjsCharacterAtlasLayout,
            headNormalMode: [ "authored", "detail", "base", "neutral" ].includes(
                parameters.get("headNormal")
            )
                ? parameters.get("headNormal")
                : "detail",
            headMaterialMode: parameters.get("headMaterial") === "body"
                ? "body-default"
                : "authored",
            skinLightingMode: [ "head-diffuse", "body-diffuse", "diffuse" ].includes(
                parameters.get("skinLighting")
            ) ? parameters.get("skinLighting") : "authored",
            skinDiffuseMode: [
                "solid",
                "base",
                "basecolor",
                "colorized",
                "replace"
            ].includes(
                parameters.get("skinDiffuse")
            ) ? parameters.get("skinDiffuse") : "authored",
            hairLightingMode: [
                "authored",
                "neutral-normal",
                "neutral-specular"
            ].includes(parameters.get("hairLighting"))
                ? parameters.get("hairLighting")
                : "neutral-specular",
            hairMaterialMode: parameters.get("hairMaterial") === "authored"
                ? "authored"
                : "selected",
            glassLightingMode: [ "authored", "legacy" ].includes(
                parameters.get("glassLighting")
            ) ? parameters.get("glassLighting") : "transmission",
            tattooTextureOffsetY: Number.isFinite(Number(parameters.get("tattooV")))
                ? Number(parameters.get("tattooV"))
                : 0,
            browSupportEnabled: parameters.get("browSupport") !== "off",
            browLightingMode: parameters.get("browLighting") === "neutral"
                ? "neutral"
                : "authored",
            browDiffuseColorMode: parameters.get("browDiffuse") === "neutral"
                ? "neutral"
                : "authored",
            tearductsEnabled: parameters.get("tearducts") !== "off",
            tearductLightingMode: parameters.get("tearductLighting") === "neutral"
                ? "neutral"
                : "authored",
            tearductUvMode: parameters.get("tearductUV") === "identity"
                ? "identity"
                : "authored",
            tearductDiffuseMode: [ "composed", "base", "dark" ].includes(
                parameters.get("tearductDiffuse")
            ) ? parameters.get("tearductDiffuse") : "base",
            eyeWetEnabled: parameters.get("eyeWet") !== "off",
            eyeWetMaterialMode: parameters.get("eyeWetMaterial") === "retained"
                ? "retained"
                : "composed",
            eyeballsEnabled: parameters.get("eyeballs") !== "off",
            eyelashCarrierMode: [ "off", "eyelashes-off", "eyeshadow-off" ].includes(
                parameters.get("lashCarrier")
            ) ? parameters.get("lashCarrier") : "all",
            eyelashUvMode: [ "identity", "raw-direct" ].includes(
                parameters.get("lashUV")
            ) ? parameters.get("lashUV") : "carrier-specific",
            eyelashDepthMode: [ "test-no-write", "off" ].includes(
                parameters.get("lashDepth")
            ) ? parameters.get("lashDepth") : "authored",
            eyelashAlphaMode: parameters.get("lashAlpha") === "weighted"
                ? "weighted"
                : "source",
            eyeShadowDiffuseMode: parameters.get("lashShadowDiffuse") === "transparent"
                ? "transparent"
                : "lash",
            eyeShadowLightingMode: parameters.get("lashShadowLighting") === "neutral"
                ? "neutral"
                : "authored"
        }),
        foundationCutMaskEnabled: parameters.get("foundationCutMask") !== "off",
        lowerSleeveMaterialEnabled: parameters.get("lowerSleeveMaterial") !== "off",
        morphDeformationEnabled: morphComparison !== "off",
        morphDeformationSkippedPaths,
        morphDeformationSkippedTargets,
        tuckAuthoredUvEnabled: parameters.get("tuckUV") === "authored",
        tuckCutMaskEnabled: parameters.get("tuckMask") !== "off",
        tuckDetailMaskEnabled: parameters.get("tuckDetailMask") !== "off",
        tuckDepthTestEnabled: parameters.get("tuckDepth") !== "off",
        tuckMaterialBaseEnabled: parameters.get("tuckBaseRgb") === "material",
        tuckAlphaMode: [ "opaque", "transparent" ].includes(parameters.get("tuckAlpha"))
            ? parameters.get("tuckAlpha")
            : "source",
        tuckBlendDetailEnabled: parameters.get("tuckRgbBlend") === "on",
        tuckPantsRgbEnabled: parameters.get("tuckRgb") === "pants",
        tuckSharedBodyRgbEnabled: parameters.get("tuckRgb") === "body",
        upperSleeveMaterialEnabled: parameters.get("upperSleeveMaterial") !== "off"
    });
    const constructionResolver = new TnyGlesAppearanceConstruction({
        foundationResolver: new TnyGlesFoundationConstruction({
            femaleFoundationLayout: parameters.get("foundation") === "combined"
                ? "combined"
                : "split-lod0"
        }),
        texturePolicy: new TnyGlesTexturePolicy({
            modifierOrder: CjsCharacterModifierOrder
        })
    });
    const appearanceManager = new TnyCharacterAppearanceManager({
        adapter,
        backend: "legacy-opengl",
        maximumBones: 58,
        requiredBones: 69
    });
    let application = null;
    application = new CharacterDemoApplication({
        libraryClient,
        appearanceResolver: CjsCharacterAppearanceResolver,
        constructionResolver,
        appearanceManager,
        routePaperdollSelection: recordID =>
        {
            const url = new URL(globalThis.location.href);
            url.searchParams.delete("fixture");
            url.searchParams.set("paperdoll", recordID);
            globalThis.location.assign(url);
        },
        routePartSelection: async (locationID, choiceID) =>
        {
            const result = await application.SelectPart(locationID, choiceID);
            if (!result.partChangeApplied) return result;
            const url = new URL(globalThis.location.href);
            const name = `part.${locationID}`;
            // An explicit empty value is distinct from no override: fixtures
            // may supply a default part, while the editor's None selection
            // must survive refresh and continue to suppress that default.
            url.searchParams.set(name, choiceID);
            globalThis.history.replaceState(null, "", url);
            return result;
        },
        routePartReset: async () =>
        {
            const result = await application.ResetParts();
            const url = new URL(globalThis.location.href);
            for (const name of [ ...url.searchParams.keys() ])
            {
                if (name.startsWith("part.")) url.searchParams.delete(name);
            }
            globalThis.history.replaceState(null, "", url);
            return result;
        },
        view
    });

    globalThis.characterDemo.application = application;
    state.phase = "loading";

    await application.Start({
        libraryURL,
        paperdollID: syntheticHeadFixture
            ? SYNTHETIC_HEAD_RECORD_ID
            : syntheticFemaleRobeFixture
                ? SYNTHETIC_FEMALE_ROBE_RECORD_ID
                : syntheticMaleTopUnderwearFixture
                    ? SYNTHETIC_MALE_TOP_UNDERWEAR_RECORD_ID
                    : parameters.get("paperdoll"),
        prepareLibrary: syntheticHeadFixture
            ? InstallSyntheticHeadLayerFixture
            : syntheticFemaleRobeFixture
                ? InstallSyntheticFemaleRobeFixture
                : syntheticMaleTopUnderwearFixture
                    ? InstallSyntheticMaleTopUnderwearFixture
                    : null,
        initialPartSelections
    });

    if (parameters.get("auditAlpha") === "1"
        || parameters.get("clothingAudit") === "1")
    {
        installCharacterDemoAlphaAudit({ application, tw2 });
    }
    if (parameters.get("clothingAudit") === "1"
        && parameters.get("auditChild") !== "1")
    {
        globalThis.characterDemo.clothingAudit = installCharacterDemoClothingAudit({
            application,
            locations: parameters.get("clothingAuditLocation")
                ?.split(",")
                .map(value => value.trim())
                .filter(Boolean),
            context: {
                libraryURL,
                resourceRoot
            },
            sourceObserved: parameters.get("clothingAuditObserved") === "1",
            sourceObservedOutfits: parameters.get("clothingAuditOutfits")
        });
    }

    if (cameraRegion)
    {
        const camera = runtimeClient.GetCamera();
        camera.poi = cameraRegion.poi;
        camera.fov = cameraRegion.fov;
        camera.rotationX = cameraRegion.rotationX;
        camera.rotationY = cameraRegion.rotationY;
    }
    if (parameters.has("cameraYaw"))
    {
        const cameraYaw = Number(parameters.get("cameraYaw"));
        if (Number.isFinite(cameraYaw)) runtimeClient.GetCamera().rotationX = cameraYaw;
    }

    const isolatedPart = parameters.get("isolatePart");
    if (isolatedPart)
    {
        appearanceManager.SetConfiguredPartDisplay(isolatedPart, false);
        view.Render(application.GetCharacter().GetDiagnostics());
    }
    const hiddenFoundation = parameters.get("hideFoundation");
    if (hiddenFoundation)
    {
        appearanceManager.SetFoundationDisplay(hiddenFoundation, false);
        view.Render(application.GetCharacter().GetDiagnostics());
    }

    state.ready = true;
    state.phase = "ready";
}
catch (error)
{
    state.phase = "error";
    state.error = error?.stack ?? error?.message ?? String(error);
    const message = error?.message ?? String(error);

    if (view)
    {
        view.RenderError(error);
    }
    else
    {
        document.getElementById("demo-status").textContent = message;
        document.getElementById("demo-status").dataset.state = "error";
        document.getElementById("stage-title").textContent = "Rendering failed";
        document.getElementById("stage-message").querySelector("span").textContent = message;
        document.getElementById("stage-message").dataset.state = "failed";
    }
    console.error(error);
}

async function LoadToolsServiceConfig()
{
    const response = await fetch("/local/tools-service.json", { cache: "no-store" });
    if (!response.ok)
    {
        throw new Error(`Tools service configuration failed: HTTP ${response.status}`);
    }

    const options = await response.json();
    const createConfig = tw2.runtime?.createToolsServiceConfig;
    const createApi = tw2.runtime?.createApiService;
    const setApi = tw2.runtime?.setApiService;
    if (!createConfig || !createApi || !setApi)
    {
        throw new Error("The ccpwgl bundle does not expose its tools service configuration API");
    }

    const config = createConfig(options.bootstrap, options);
    setApi(createApi(config.apiOptions));
    return config;
}

function RequireClass(name)
{
    const Constructor = tnyCharacterConstructors[name];
    if (typeof Constructor !== "function")
    {
        throw new Error(`The character constructor catalog does not contain ${name}`);
    }
    return Constructor;
}
