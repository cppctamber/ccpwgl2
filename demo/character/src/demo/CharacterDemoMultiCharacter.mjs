/**
 * Creates one independently composed companion character in the shared demo
 * scene. The library may be shared, while the construction resolver,
 * appearance manager, adapter, composition targets, and staged graph remain
 * character-owned.
 *
 * @param {Object} options Companion construction options.
 * @param {Function} options.Character Character runtime constructor.
 * @param {Object} options.libraryManager Hydrated character-library manager.
 * @param {Object} options.appearanceResolver Paper-doll appearance resolver.
 * @param {Object} options.constructionResolver Character-owned construction resolver.
 * @param {Object} options.appearanceManager Character-owned appearance manager.
 * @param {Object} options.primaryPaperdoll The editor-controlled paper doll.
 * @param {String|null} [options.paperdollID=null] Optional exact companion identity.
 * @returns {Promise<Object>} Companion character, paper doll, and commit result.
 */
export async function CreateCharacterDemoCompanion({
    Character,
    libraryManager,
    appearanceResolver,
    constructionResolver,
    appearanceManager,
    primaryPaperdoll,
    paperdollID = null
} = {})
{
    if (typeof Character !== "function")
    {
        throw new TypeError("Character demo companion requires a Character constructor");
    }
    if (!libraryManager || typeof libraryManager.GetDocument !== "function")
    {
        throw new TypeError("Character demo companion requires a library manager");
    }

    const paperdolls = libraryManager.GetDocument("paperdolls") ?? [];
    const paperdoll = ResolveCharacterDemoCompanionPaperdoll(
        paperdolls,
        primaryPaperdoll,
        paperdollID
    );
    const character = new Character({
        libraryManager,
        appearanceResolver,
        constructionResolver,
        appearanceManager
    });

    character.SelectPaperdoll(paperdoll.recordID);
    const result = await character.ApplyAppearance();
    if (result?.status !== "committed")
    {
        throw new Error(
            `Companion paper doll ${JSON.stringify(paperdoll.recordID)}`
            + ` was not committed: ${result?.reason ?? result?.status ?? "unknown"}`
        );
    }

    return { character, paperdoll, result };
}

/**
 * Chooses one exact companion record, preferring the opposite retained
 * resource gender when no explicit identity was requested.
 *
 * @param {Object[]} paperdolls Hydrated paper-doll records.
 * @param {Object} primaryPaperdoll Editor-controlled paper doll.
 * @param {String|null} [paperdollID=null] Optional exact companion identity.
 * @returns {Object} Selected hydrated paper doll.
 */
export function ResolveCharacterDemoCompanionPaperdoll(
    paperdolls,
    primaryPaperdoll,
    paperdollID = null
)
{
    if (!Array.isArray(paperdolls) || paperdolls.length < 2)
    {
        throw new Error("Two-character proof requires at least two library paper dolls");
    }

    const primaryID = String(primaryPaperdoll?.recordID ?? "").trim();
    if (!primaryID)
    {
        throw new TypeError("Two-character proof requires the primary paper doll");
    }

    const requestedID = String(paperdollID ?? "").trim();
    if (requestedID)
    {
        const requested = paperdolls.find(value => value?.recordID === requestedID);
        if (!requested)
        {
            throw new Error(`Unknown companion paper-doll record ${JSON.stringify(requestedID)}`);
        }
        if (requested.recordID === primaryID)
        {
            throw new Error("Two-character proof requires two distinct paper-doll records");
        }
        return requested;
    }

    const primaryGender = GetPaperdollResourceGender(primaryPaperdoll);
    const opposite = paperdolls.find(value => value?.recordID !== primaryID
        && primaryGender !== null
        && GetPaperdollResourceGender(value) !== null
        && GetPaperdollResourceGender(value) !== primaryGender);
    const selected = opposite ?? paperdolls.find(value => value?.recordID !== primaryID);
    if (!selected)
    {
        throw new Error("Two-character proof could not resolve a distinct companion");
    }
    return selected;
}

/**
 * Places every currently attached character in one centered row. This is
 * demo presentation only; the scene remains an unrestricted character
 * collection and owns the shared camera and lights.
 *
 * @param {Object} scene Shared TnyCharacterScene.
 * @param {Number} [spacing=1.1] World-space separation in metres.
 * @returns {Object[]} Applied wrapper translations in scene order.
 */
export function LayoutCharacterDemoCharacters(scene, spacing = 1.1)
{
    if (!scene || typeof scene.GetCharacters !== "function")
    {
        throw new TypeError("Character layout requires a TnyCharacterScene");
    }
    if (!Number.isFinite(spacing) || spacing <= 0)
    {
        throw new TypeError("Character layout spacing must be positive and finite");
    }

    const characters = scene.GetCharacters([]);
    const center = (characters.length - 1) / 2;
    return characters.map((character, index) =>
    {
        if (typeof character?.SetTranslationFromValues !== "function")
        {
            throw new TypeError("Character scene wrapper cannot be translated");
        }
        const translation = [ (index - center) * spacing, 0, 0 ];
        character.SetTranslationFromValues(...translation);

        // TnyCharacterScene renders the wrapper's Tr2IntSkinnedObject. Rebuild
        // now so TnySpaceObject forwards its new world matrix to that backend
        // before the scene's next view-dependent update.
        if (typeof character.RebuildTransforms !== "function")
        {
            throw new TypeError("Character scene wrapper cannot rebuild its transform");
        }
        character.RebuildTransforms({ force: true });
        return { index, character, translation };
    });
}

function GetPaperdollResourceGender(paperdoll)
{
    const counts = new Map();
    for (const modifier of paperdoll?.modifiers ?? [])
    {
        const value = Number(modifier?.paperdollResourceID?.resGender);
        if (!Number.isInteger(value) || value < 0) continue;
        counts.set(value, (counts.get(value) ?? 0) + 1);
    }

    let selected = null;
    let selectedCount = -1;
    for (const [ value, count ] of counts)
    {
        if (count <= selectedCount) continue;
        selected = value;
        selectedCount = count;
    }
    return selected;
}
