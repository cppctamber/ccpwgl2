import { TnyGlesTexturePolicy } from "../../../../src/runtime/character/gles/TnyGlesTexturePolicy.js";

const ADAPTER_SUPPORTED_LOCATIONS = new Set([
    "bottominner",
    "bottomouter",
    "bottomunderwear",
    "feet",
    "makeup/aging",
    "makeup/augmentations",
    "makeup/blemish",
    "makeup/blush",
    "makeup/bodyaugmentations",
    "makeup/eyebrows",
    "makeup/eyelashes",
    "makeup/eyeliner",
    "makeup/eyes",
    "makeup/eyeshadow",
    "makeup/freckles",
    "makeup/lipstick",
    "makeup/scarring",
    "outer",
    "tattoo/head",
    "topinner",
    "topmiddle",
    "topunderwear"
]);

/** Builds exact modifier-location choices observed in retained paper dolls. */
export function createCharacterPartIndex(paperdolls, library = null)
{
    const byGender = new Map();

    for (const paperdoll of paperdolls ?? [])
    {
        for (const modifier of paperdoll?.modifiers ?? [])
        {
            const location = modifier?.modifierLocationID;
            const observedResource = modifier?.paperdollResourceID;
            const resourceID = RecordIdentity(observedResource);
            const resource = ResolveCanonicalResource(
                library,
                observedResource,
                resourceID
            );
            const gender = NormalizeGender(resource?.resGender);
            const locationID = RecordIdentity(location);

            if (gender === null || !locationID || !resourceID) continue;

            let locations = byGender.get(gender);
            if (!locations)
            {
                locations = new Map();
                byGender.set(gender, locations);
            }

            let slot = locations.get(locationID);
            if (!slot)
            {
                slot = { location, resources: new Map() };
                locations.set(locationID, slot);
            }
            const variation = NormalizeVariation(modifier.paperdollResourceVariation);
            const choiceID = CreateChoiceIdentity(resourceID, variation);
            if (!slot.resources.has(choiceID))
            {
                slot.resources.set(choiceID, {
                    choiceID,
                    donorRecordID: RecordIdentity(paperdoll),
                    resource,
                    colorPreview: ResolveResourceColorPreview(library, resource, location),
                    variation
                });
            }
        }
    }

    return { byGender };
}

function ResolveCanonicalResource(library, resource, resourceID)
{
    if (!resourceID || typeof library?.Get !== "function") return resource;
    return library.Get("characterResources", resourceID) ?? resource;
}

/** Returns every exact observed slot and resource choice for one paper doll. */
export function createCharacterPartCatalog(index, paperdoll)
{
    const gender = GetPaperdollGender(paperdoll);
    const selected = new Map();

    for (const modifier of paperdoll?.modifiers ?? [])
    {
        const locationID = RecordIdentity(modifier?.modifierLocationID);
        if (locationID && !selected.has(locationID))
        {
            const resourceID = RecordIdentity(modifier?.paperdollResourceID);
            selected.set(locationID, {
                resourceID,
                choiceID: CreateChoiceIdentity(
                    resourceID,
                    NormalizeVariation(modifier?.paperdollResourceVariation)
                )
            });
        }
    }

    const locations = index?.byGender?.get(gender) ?? new Map();
    const slots = [ ...locations.entries() ].map(([ locationID, value ]) => ({
        locationID,
        modifierKey: String(value.location?.modifierKey ?? locationID),
        variationKey: String(value.location?.variationKey ?? ""),
        adapterSupported: ADAPTER_SUPPORTED_LOCATIONS.has(
            String(value.location?.modifierKey ?? "").toLowerCase()
        ),
        selectedResourceID: selected.get(locationID)?.resourceID ?? "",
        selectedChoiceID: selected.get(locationID)?.choiceID ?? "",
        resources: [ ...value.resources.values() ]
            .map(value => ({
                choiceID: value.choiceID,
                donorRecordID: value.donorRecordID,
                recordID: RecordIdentity(value.resource),
                resPath: String(value.resource?.resPath ?? ""),
                partSourceRecordID: ResolveResourcePartSourceRecordID(value.resource),
                colorPreview: CloneColorPreview(value.colorPreview),
                variation: value.variation
            }))
            .sort((a, b) => CompareLabels(a.resPath || a.recordID, b.resPath || b.recordID))
    }));

    slots.sort((a, b) => CompareLabels(
        `${a.modifierKey}\u0000${a.variationKey}\u0000${a.locationID}`,
        `${b.modifierKey}\u0000${b.variationKey}\u0000${b.locationID}`
    ));

    return {
        gender,
        paperdollRecordID: RecordIdentity(paperdoll),
        slots
    };
}

function ResolveResourcePartSourceRecordID(resource)
{
    const partType = resource?.partType;
    const direct = RecordIdentity(partType?.partSource);
    if (direct) return direct;

    const candidates = [ ...(partType?.partSources ?? []) ]
        .filter(value => value
            && (!partType?.sex || value.sex === partType.sex)
            && (!partType?.partPath || value.partPath === partType.partPath))
        .map(RecordIdentity)
        .filter(Boolean);
    return new Set(candidates).size === 1 ? candidates[0] : "";
}

/**
 * Projects one exact type-owned material definition into a small UI palette.
 * This proves authored colours for the selected type; it does not imply that
 * every renderer or consumer exposes those colours as editable controls.
 */
function ResolveResourceColorPreview(library, resource, location)
{
    if (typeof library?.Get !== "function") return null;

    const partType = resource?.partType;
    const colorVariant = String(partType?.colorVariant ?? "").trim();
    const sex = resource?.resGender === 0
        ? "female"
        : resource?.resGender === 1
            ? "male"
            : null;
    const typeResolution = TnyGlesTexturePolicy.resolveTypeDefinition(
        library,
        partType,
        sex
    );
    const materialResolution = TnyGlesTexturePolicy.resolveTypeMaterialDefinition(
        library,
        typeResolution.record,
        colorVariant,
        sex,
        location?.modifierKey
    );
    const materialDefinition = materialResolution?.record;
    if (!materialDefinition) return null;

    const colors = NormalizePreviewColors(materialDefinition.values?.colors);
    if (!colors) return null;

    const pattern = String(materialDefinition.values?.pattern ?? "").trim();
    const patternColors = pattern
        ? NormalizePreviewColors(materialDefinition.values?.patternColors)
        : null;
    if (pattern && !patternColors) return null;

    return {
        colorVariant,
        materialDefinitionPath: materialResolution.path
            ?? materialDefinition.sourcePath
            ?? null,
        colors,
        pattern: pattern || null,
        patternColors,
        evidence: {
            valuesStatus: "authored",
            relationshipStatus: "derived-policy",
            rule: `preview-${materialResolution.rule}`
        }
    };
}

function NormalizePreviewColors(values)
{
    if (!Array.isArray(values) || values.length < 3) return null;
    const colors = values.slice(0, 3).map(value =>
        Array.isArray(value) || ArrayBuffer.isView(value)
            ? Array.from(value).slice(0, 4).map(Number)
            : null
    );
    if (colors.some(value => !value
        || value.length < 3
        || value.some(component => !Number.isFinite(component)))) return null;
    for (const color of colors)
    {
        while (color.length < 4) color.push(1);
    }
    return colors;
}

function CloneColorPreview(value)
{
    return value ? {
        ...value,
        colors: value.colors.map(color => [ ...color ]),
        patternColors: value.patternColors?.map(color => [ ...color ]) ?? null,
        evidence: { ...value.evidence }
    } : null;
}

/** Applies URL-owned exact choices before the paper doll's first render. */
export function applyCharacterPaperdollSelections(manager, index, paperdoll, selections)
{
    for (const selection of selections ?? [])
    {
        const locationID = String(selection?.locationID ?? "").trim();
        const choiceID = String(selection?.choiceID ?? "").trim();
        const slot = createCharacterPartCatalog(index, paperdoll).slots.find(value =>
            value.locationID === locationID
        );
        const candidate = slot?.resources.find(value => value.choiceID === choiceID) ?? null;
        const location = manager?.Get?.("characterModifierLocations", locationID);
        if (!slot || !location)
        {
            throw new Error(`Unknown modifier location ${JSON.stringify(locationID)}`);
        }
        if (choiceID && !candidate)
        {
            throw new Error(`Unknown character part choice ${JSON.stringify(choiceID)}`);
        }
        const resource = candidate
            ? manager.Get("characterResources", candidate.recordID)
            : null;
        if (candidate && !resource)
        {
            throw new Error(`Unknown character resource ${JSON.stringify(candidate.recordID)}`);
        }
        setCharacterPaperdollPart(
            paperdoll,
            location,
            resource,
            candidate?.variation ?? 0
        );
    }
}

/** Replaces, adds, or removes one exact modifier selection in-place. */
export function setCharacterPaperdollPart(paperdoll, location, resource, variation = 0)
{
    if (!paperdoll || !Array.isArray(paperdoll.modifiers))
    {
        throw new TypeError("Character part editing requires a hydrated paper doll");
    }

    const locationID = RecordIdentity(location);
    if (!locationID) throw new TypeError("Character part editing requires a modifier location");

    const index = paperdoll.modifiers.findIndex(modifier =>
        RecordIdentity(modifier?.modifierLocationID) === locationID
    );

    if (resource === null)
    {
        if (index !== -1) paperdoll.modifiers.splice(index, 1);
        return;
    }

    if (!RecordIdentity(resource))
    {
        throw new TypeError("Character part editing requires a character resource or null");
    }

    const Modifier = paperdoll.modifiers[index]?.constructor
        ?? paperdoll.modifiers[0]?.constructor;
    if (typeof Modifier !== "function")
    {
        throw new Error("Character paper doll has no modifier constructor");
    }

    const modifier = new Modifier();
    modifier.modifierLocationID = location;
    modifier.paperdollResourceID = resource;
    modifier.paperdollResourceVariation = Number.isInteger(Number(variation))
        ? Number(variation)
        : 0;

    if (index === -1) paperdoll.modifiers.push(modifier);
    else paperdoll.modifiers.splice(index, 1, modifier);
}

/** Captures relationship instances so demo edits can be reset without reloading. */
export function captureCharacterPaperdollParts(paperdoll)
{
    return (paperdoll?.modifiers ?? []).map(modifier => ({
        Modifier: modifier.constructor,
        modifierLocationID: modifier.modifierLocationID,
        paperdollResourceID: modifier.paperdollResourceID,
        paperdollResourceVariation: modifier.paperdollResourceVariation
    }));
}

/** Restores a capture made by captureCharacterPaperdollParts. */
export function restoreCharacterPaperdollParts(paperdoll, captured)
{
    if (!paperdoll || !Array.isArray(paperdoll.modifiers))
    {
        throw new TypeError("Character part reset requires a hydrated paper doll");
    }

    const Modifier = paperdoll.modifiers[0]?.constructor ?? captured[0]?.Modifier;
    if (typeof Modifier !== "function" && captured.length)
    {
        throw new Error("Character paper doll has no modifier constructor");
    }

    paperdoll.modifiers = captured.map(value =>
    {
        const modifier = new Modifier();
        modifier.modifierLocationID = value.modifierLocationID;
        modifier.paperdollResourceID = value.paperdollResourceID;
        modifier.paperdollResourceVariation = value.paperdollResourceVariation;
        return modifier;
    });
}

function GetPaperdollGender(paperdoll)
{
    const counts = new Map();

    for (const modifier of paperdoll?.modifiers ?? [])
    {
        const gender = NormalizeGender(modifier?.paperdollResourceID?.resGender);
        if (gender !== null) counts.set(gender, (counts.get(gender) ?? 0) + 1);
    }

    let selected = null;
    let selectedCount = -1;
    for (const [ gender, count ] of counts)
    {
        if (count > selectedCount)
        {
            selected = gender;
            selectedCount = count;
        }
    }
    return selected;
}

function NormalizeGender(value)
{
    const number = Number(value);
    return Number.isInteger(number) && number >= 0 ? number : null;
}

function RecordIdentity(value)
{
    const identity = String(value?.recordID ?? "").trim();
    return identity || "";
}

function NormalizeVariation(value)
{
    const variation = Number(value ?? 0);
    return Number.isInteger(variation) ? variation : 0;
}

function CreateChoiceIdentity(resourceID, variation)
{
    return resourceID ? `${resourceID}@${variation}` : "";
}

function CompareLabels(a, b)
{
    return String(a).localeCompare(String(b), undefined, {
        numeric: true,
        sensitivity: "base"
    });
}
