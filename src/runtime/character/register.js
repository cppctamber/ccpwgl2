import { TnyCharacter } from "./TnyCharacter.js";
import { TnyCharacterLibraryClient } from "./TnyCharacterLibraryClient.js";
import { TnyCharacterAppearanceManager } from "./TnyCharacterAppearanceManager.js";
import { TnyCharacterScene } from "./TnyCharacterScene.js";
import {
    TnyGlesAppearanceConstruction,
    TnyGlesAtlasComposer,
    TnyGlesCharacterAdapter,
    TnyGlesFoundationConstruction,
    TnyGlesFoundationCoveragePolicy,
    TnyGlesMorphDeformation,
    TnyGlesPaletteCompatibility,
    TnyGlesTexturePolicy,
    TnyGlesTriangleCoverage
} from "./gles/index.js";


export const tnyCharacterConstructors = {
    TnyCharacter,
    TnyCharacterLibraryClient,
    TnyCharacterAppearanceManager,
    TnyCharacterScene,
    TnyGlesAppearanceConstruction,
    TnyGlesAtlasComposer,
    TnyGlesCharacterAdapter,
    TnyGlesFoundationConstruction,
    TnyGlesFoundationCoveragePolicy,
    TnyGlesMorphDeformation,
    TnyGlesPaletteCompatibility,
    TnyGlesTexturePolicy,
    TnyGlesTriangleCoverage
};

/** Registers every optional character-runtime constructor on a TnyClient. */
export function RegisterTnyCharacterConstructors(client)
{
    if (!client?.Register)
    {
        throw new TypeError("Invalid TnyClient");
    }

    client.Register({ constructors: tnyCharacterConstructors });
    return client;
}
