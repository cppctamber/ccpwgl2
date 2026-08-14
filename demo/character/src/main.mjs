/* global globalThis */

import { CjsCharacterLibraryManager } from "/vendor/runtime-character/library/CjsCharacterLibraryManager.js";
import { CjsCharacterAppearanceResolver } from "/vendor/runtime-character/character/resolution/CjsCharacterAppearanceResolver.js";
import { CjsCharacterModifierOrder } from "/vendor/runtime-character/character/composition/CjsCharacterModifierOrder.js";
import { tnyCharacterConstructors } from "/src/runtime/character/register.js";
import { tiny, tny } from "./demo/ccpwgl-global.mjs";
import { CharacterDemoApplication } from "./demo/CharacterDemoApplication.mjs";
import { ConfigureCharacterDemoWithoutSof } from "./demo/CharacterDemoSofPolicy.mjs";
import {
    InstallSyntheticHeadLayerFixture,
    SYNTHETIC_HEAD_RECORD_ID
} from "./demo/CharacterDemoSyntheticFixture.mjs";
import { CharacterDemoView } from "./demo/CharacterDemoView.mjs";

const tw2 = globalThis.tw2;

const TnyCharacterLibraryClient = RequireClass("TnyCharacterLibraryClient");
const TnyCharacterRenderer = RequireClass("TnyCharacterRenderer");
const TnyGlesAppearanceConstruction = RequireClass("TnyGlesAppearanceConstruction");
const TnyGlesAtlasComposer = RequireClass("TnyGlesAtlasComposer");
const TnyGlesCharacterAdapter = RequireClass("TnyGlesCharacterAdapter");
const TnyGlesFoundationConstruction = RequireClass("TnyGlesFoundationConstruction");
const TnyGlesTexturePolicy = RequireClass("TnyGlesTexturePolicy");

const parameters = new URLSearchParams(globalThis.location.search);
const syntheticHeadFixture = parameters.get("fixture") === "head-layers";
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
    const libraryClient = new TnyCharacterLibraryClient({
        LibraryManager: CjsCharacterLibraryManager
    });
    ConfigureCharacterDemoWithoutSof(tw2);
    const runtimeClient = tny || tiny;
    const adapter = new TnyGlesCharacterAdapter({
        client: runtimeClient,
        cameraDistance: parameters.has("cameraDistance")
            ? Number(parameters.get("cameraDistance"))
            : 3.2,
        atlasComposer: new TnyGlesAtlasComposer({
            headNormalMode: [ "authored", "detail", "base", "neutral" ].includes(
                parameters.get("headNormal")
            )
                ? parameters.get("headNormal")
                : "detail",
            skinLightingMode: [ "head-diffuse", "body-diffuse", "diffuse" ].includes(
                parameters.get("skinLighting")
            ) ? parameters.get("skinLighting") : "authored",
            tattooTextureOffsetY: Number.isFinite(Number(parameters.get("tattooV")))
                ? Number(parameters.get("tattooV"))
                : 0
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
    const renderer = new TnyCharacterRenderer({
        adapter,
        backend: "legacy-opengl",
        maximumBones: 58,
        requiredBones: 69
    });
    const application = new CharacterDemoApplication({
        libraryClient,
        appearanceResolver: CjsCharacterAppearanceResolver,
        constructionResolver,
        renderer,
        routePaperdollSelection: recordID =>
        {
            const url = new URL(globalThis.location.href);
            url.searchParams.delete("fixture");
            url.searchParams.set("paperdoll", recordID);
            globalThis.location.assign(url);
        },
        view
    });

    globalThis.characterDemo.application = application;
    state.phase = "loading";

    await application.Start({
        libraryURL: parameters.get("library") || "/local/character-library.json",
        paperdollID: syntheticHeadFixture
            ? SYNTHETIC_HEAD_RECORD_ID
            : parameters.get("paperdoll"),
        prepareLibrary: syntheticHeadFixture
            ? InstallSyntheticHeadLayerFixture
            : null
    });

    if (parameters.has("cameraYaw"))
    {
        const cameraYaw = Number(parameters.get("cameraYaw"));
        if (Number.isFinite(cameraYaw)) runtimeClient.GetCamera().rotationX = cameraYaw;
    }

    const isolatedPart = parameters.get("isolatePart");
    if (isolatedPart)
    {
        renderer.SetConfiguredPartDisplay(isolatedPart, false);
        view.Render(application.GetCharacter().GetDiagnostics());
    }
    const hiddenFoundation = parameters.get("hideFoundation");
    if (hiddenFoundation)
    {
        renderer.SetFoundationDisplay(hiddenFoundation, false);
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

function RequireClass(name)
{
    const Constructor = tnyCharacterConstructors[name];
    if (typeof Constructor !== "function")
    {
        throw new Error(`The character constructor catalog does not contain ${name}`);
    }
    return Constructor;
}
