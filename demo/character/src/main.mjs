import { CjsCharacterLibraryManager } from "/vendor/runtime-character/library/CjsCharacterLibraryManager.js";
import { CjsCharacterAppearanceResolver } from "/vendor/runtime-character/character/resolution/CjsCharacterAppearanceResolver.js";
import { CjsCharacterModifierOrder } from "/vendor/runtime-character/character/composition/CjsCharacterModifierOrder.js";
import { CcpwglCharacterRenderer } from "./character/CcpwglCharacterRenderer.mjs";
import { CcpwglLegacyCharacterAdapter } from "./character/CcpwglLegacyCharacterAdapter.mjs";
import { CcpwglLegacyAppearanceConstruction } from "./character/CcpwglLegacyAppearanceConstruction.mjs";
import { CcpwglLegacyTexturePolicy } from "./character/CcpwglLegacyTexturePolicy.mjs";
import { CharacterDemoApplication } from "./demo/CharacterDemoApplication.mjs";
import { ConfigureCharacterDemoWithoutSof } from "./demo/CharacterDemoSofPolicy.mjs";
import { CharacterDemoView } from "./demo/CharacterDemoView.mjs";
import { CharacterLibraryClient } from "./demo/CharacterLibraryClient.mjs";

const parameters = new URLSearchParams(globalThis.location.search);
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
    const libraryClient = new CharacterLibraryClient({
        LibraryManager: CjsCharacterLibraryManager
    });
    ConfigureCharacterDemoWithoutSof(globalThis.tw2);
    const adapter = new CcpwglLegacyCharacterAdapter({
        foundationCutMaskEnabled: parameters.get("foundationCutMask") !== "off",
        lowerSleeveMaterialEnabled: parameters.get("lowerSleeveMaterial") !== "off",
        tuckPantsRgbEnabled: parameters.get("tuckRgb") === "pants",
        upperSleeveMaterialEnabled: parameters.get("upperSleeveMaterial") !== "off"
    });
    const constructionResolver = new CcpwglLegacyAppearanceConstruction({
        texturePolicy: new CcpwglLegacyTexturePolicy({
            modifierOrder: CjsCharacterModifierOrder
        })
    });
    const renderer = new CcpwglCharacterRenderer({
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
        view
    });

    globalThis.characterDemo.application = application;
    state.phase = "loading";

    await application.Start({
        libraryURL: parameters.get("library") || "/local/character-library.json",
        paperdollID: parameters.get("paperdoll")
    });

    const isolatedPart = parameters.get("isolatePart");
    if (isolatedPart)
    {
        renderer.SetConfiguredPartDisplay(isolatedPart, false);
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
