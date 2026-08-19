const SYNTHETIC_HEAD_RECORD_ID = "demo:synthetic-head-layers";
const SYNTHETIC_MALE_TOP_UNDERWEAR_RECORD_ID = "demo:synthetic-male-top-underwear";
const SYNTHETIC_FEMALE_ROBE_RECORD_ID = "demo:synthetic-female-robe";

/** Adds one explicitly non-game paper doll assembled only from retained records. */
export function InstallSyntheticHeadLayerFixture(manager)
{
    const existing = manager.Get("paperdolls", SYNTHETIC_HEAD_RECORD_ID);
    if (existing) return existing;

    const base = RequireRecord(manager, "paperdolls", "3000001");
    const frecklesDonor = RequireRecord(manager, "paperdolls", "3003877");
    const singletDonor = RequireRecord(manager, "paperdolls", "3020292");
    const eyeshadowDonor = RequireRecord(manager, "paperdolls", "3003957");
    const augmentationDonor = RequireRecord(manager, "paperdolls", "3020032");
    const heroScarDonor = RequireRecord(manager, "paperdolls", "3019595");
    const bodyAugmentationDonor = RequireRecord(manager, "paperdolls", "3020068");
    // Keep projection placement independent from the blue_a ink authored on
    // paper doll 3019595. These are retained female catalog records, not demo
    // identities or hand-authored resource paths.
    const tattooModifier = {
        modifierLocationID: RequireRecord(manager, "characterModifierLocations", "30"),
        paperdollResourceID: RequireRecord(manager, "characterResources", "527"),
        paperdollResourceVariation: 0
    };
    const tattooColor = {
        colorID: RequireRecord(manager, "characterColorLocations", "26"),
        colorNameA: RequireRecord(manager, "characterColorNames", "243"),
        colorNameBC: null,
        gloss: 0,
        weight: 1
    };
    const modifiers = [
        ...base.modifiers.filter(value =>
            ![ "makeup/freckles", "makeup/bodyaugmentations", "scars/head", "topmiddle" ].includes(
                value?.modifierLocationID?.modifierKey
            )),
        RequireModifier(frecklesDonor, "makeup/freckles"),
        RequireModifier(singletDonor, "topmiddle"),
        RequireModifier(eyeshadowDonor, "makeup/eyeshadow"),
        RequireModifier(augmentationDonor, "makeup/augmentations"),
        RequireModifier(heroScarDonor, "scars/head"),
        RequireModifier(bodyAugmentationDonor, "makeup/bodyaugmentations"),
        tattooModifier,
        {
            modifierLocationID: RequireRecord(manager, "characterModifierLocations", "129"),
            paperdollResourceID: RequireRecord(manager, "characterResources", "3744"),
            paperdollResourceVariation: 0
        }
    ];
    const colorSelections = [
        ...base.colorSelections,
        RequireColorSelection(eyeshadowDonor, "makeup/eyeshadow"),
        tattooColor
    ];

    return manager.Create("paperdolls", {
        ...base.GetValues(),
        recordID: SYNTHETIC_HEAD_RECORD_ID,
        modifiers,
        colorSelections,
        creationDate: "",
        lastRendered: "",
        lastUpdate: ""
    }, { reason: "demo-synthetic-head-layer-proof" });
}

/** Exposes one retained but unobserved male upper-underwear source for review. */
export function InstallSyntheticMaleTopUnderwearFixture(manager)
{
    const existing = manager.Get("paperdolls", SYNTHETIC_MALE_TOP_UNDERWEAR_RECORD_ID);
    if (existing) return existing;

    const base = RequireRecord(manager, "paperdolls", "3019517");
    const modifiers = [
        ...base.modifiers.filter(value => ![
            "outer", "bottomouter", "feet", "topmiddle", "topinner", "topunderwear"
        ].includes(value?.modifierLocationID?.modifierKey)),
        {
            modifierLocationID: RequireRecord(
                manager,
                "characterModifierLocations",
                "121"
            ),
            paperdollResourceID: RequireRecord(manager, "characterResources", "16182"),
            paperdollResourceVariation: 0
        }
    ];

    return manager.Create("paperdolls", {
        ...base.GetValues(),
        recordID: SYNTHETIC_MALE_TOP_UNDERWEAR_RECORD_ID,
        modifiers,
        creationDate: "",
        lastRendered: "",
        lastUpdate: ""
    }, { reason: "demo-synthetic-male-top-underwear-proof" });
}

/** Exposes one retained but unobserved female robe asset. */
export function InstallSyntheticFemaleRobeFixture(manager)
{
    const existing = manager.Get("paperdolls", SYNTHETIC_FEMALE_ROBE_RECORD_ID);
    if (existing) return existing;

    const base = RequireRecord(manager, "paperdolls", "3000001");
    const modifiers = [
        ...base.modifiers.filter(value =>
            value?.modifierLocationID?.modifierKey !== "outer"),
        {
            modifierLocationID: RequireRecord(
                manager,
                "characterModifierLocations",
                "10"
            ),
            paperdollResourceID: RequireRecord(manager, "characterResources", "16515"),
            paperdollResourceVariation: 0
        }
    ];

    return manager.Create("paperdolls", {
        ...base.GetValues(),
        recordID: SYNTHETIC_FEMALE_ROBE_RECORD_ID,
        modifiers,
        creationDate: "",
        lastRendered: "",
        lastUpdate: ""
    }, { reason: "demo-synthetic-female-robe-proof" });
}

function RequireModifier(paperdoll, modifierKey)
{
    const matches = paperdoll.modifiers.filter(value =>
        value?.modifierLocationID?.modifierKey === modifierKey);
    if (matches.length !== 1)
    {
        throw new Error(
            `Synthetic head fixture requires one ${modifierKey} modifier on ${paperdoll.recordID}`
        );
    }
    return matches[0];
}

function RequireColorSelection(paperdoll, colorKey)
{
    const matches = paperdoll.colorSelections.filter(value =>
        value?.colorID?.colorKey === colorKey);
    if (matches.length !== 1)
    {
        throw new Error(
            `Synthetic head fixture requires one ${colorKey} colour on ${paperdoll.recordID}`
        );
    }
    return matches[0];
}

function RequireRecord(manager, documentName, recordID)
{
    const record = manager.Get(documentName, recordID);
    if (!record)
    {
        throw new Error(
            `Synthetic head fixture requires ${documentName} record ${JSON.stringify(recordID)}`
        );
    }
    return record;
}

export {
    SYNTHETIC_FEMALE_ROBE_RECORD_ID,
    SYNTHETIC_HEAD_RECORD_ID,
    SYNTHETIC_MALE_TOP_UNDERWEAR_RECORD_ID
};
