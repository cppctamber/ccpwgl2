const QUALITY_SCORE = {
    "4k": 4,
    standard: 3,
    "512": 2,
    "256": 1
};

/**
 * Labels exact retained character textures for the temporary legacy demo.
 * Filename roles are explicit ccpwgl policy, not runtime-character source facts.
 */
export class CcpwglLegacyTexturePolicy
{
    #modifierOrder;

    constructor({ modifierOrder = null } = {})
    {
        if (modifierOrder !== null
            && (typeof modifierOrder?.sort !== "function"
                || typeof modifierOrder?.resolveCategories !== "function"))
        {
            throw new TypeError("Legacy texture policy modifierOrder must expose sort and resolveCategories");
        }

        this.#modifierOrder = modifierOrder;
    }

    /** Resolves every plan layer without omitting unrecognized source candidates. */
    Resolve(library, paperdoll, appearancePlan)
    {
        RequireLibrary(library);

        if (!paperdoll || typeof paperdoll !== "object" || !Array.isArray(paperdoll.modifiers))
        {
            throw new TypeError("Legacy texture policy requires a hydrated paper doll");
        }
        if (!appearancePlan || !Array.isArray(appearancePlan.parts)
            || !Array.isArray(appearancePlan.layers))
        {
            throw new TypeError("Legacy texture policy requires an appearance plan");
        }

        const contributions = appearancePlan.layers.map((layer, layerIndex) => ResolveLayer(
            library,
            paperdoll,
            appearancePlan,
            layer,
            layerIndex
        ));

        if (!this.#modifierOrder) return contributions;

        return this.#modifierOrder.sort(contributions, {
            categories: this.#modifierOrder.resolveCategories(),
            getCategory: value => SplitGroup(value.groupID)[0],
            getGroup: value => SplitGroup(value.groupID)[1]
        });
    }
}

function ResolveLayer(library, paperdoll, plan, layer, layerIndex)
{
    const part = layer?.contributor;
    const partIndex = plan.parts.indexOf(part);
    const groupID = String(layer?.owner?.groupID ?? "").trim();
    const modifierIndex = ParseModifierIndex(layer?.origin?.jsonPointer);
    const modifier = modifierIndex === null ? null : paperdoll.modifiers[modifierIndex];
    const partSource = library.Get("characterPartSources", part?.origin?.recordID);
    const versionIndex = ParseVersionIndex(part?.origin?.jsonPointer);
    const version = versionIndex === null ? null : partSource?.versions?.[versionIndex];
    const diagnostics = [];

    if (partIndex === -1)
    {
        throw new Error(`Legacy texture layer ${layerIndex} does not reference a plan-owned part`);
    }
    if (!groupID)
    {
        throw new Error(`Legacy texture layer ${layerIndex} has no selection group`);
    }
    if (!modifier)
    {
        diagnostics.push(Diagnostic(
            "MODIFIER_PROVENANCE_UNRESOLVED",
            "The plan layer does not point to one exact paper-doll modifier."
        ));
    }
    if (!partSource || !version)
    {
        diagnostics.push(Diagnostic(
            "PART_VERSION_PROVENANCE_UNRESOLVED",
            "The plan contributor does not point to one exact part-source version."
        ));
    }

    const resource = modifier?.paperdollResourceID ?? null;
    const partType = resource?.partType ?? null;
    const sex = resource?.resGender === 0
        ? "female"
        : resource?.resGender === 1
            ? "male"
            : null;
    const typeDefinition = ResolveTypeDefinition(library, partType, sex);

    if (!typeDefinition.record)
    {
        diagnostics.push(Diagnostic(
            "TYPE_DEFINITION_UNRESOLVED",
            "No unique retained type definition matches the selected part type and sex."
        ));
    }

    const materialDefinition = ResolveMaterialDefinition(
        library,
        typeDefinition.record,
        partType?.colorVariant
    );

    if (partType?.colorVariant && !materialDefinition)
    {
        diagnostics.push(Diagnostic(
            "MATERIAL_DEFINITION_UNRESOLVED",
            `No retained sibling .color definition matches ${JSON.stringify(partType.colorVariant)}.`
        ));
    }

    const classified = ClassifyTextures(
        Array.isArray(part?.texturePaths) && part.texturePaths.length
            ? part.texturePaths
            : version?.textureCandidates ?? []
    );

    if (classified.every(value => !value.recognized) && classified.length)
    {
        diagnostics.push(Diagnostic(
            "TEXTURE_FILENAME_POLICY_UNRESOLVED",
            "No texture candidate matches the labelled legacy filename policy."
        ));
    }

    return {
        layerIndex,
        partIndex,
        ownerSelectionIndex: Array.isArray(plan.selections)
            ? plan.selections.indexOf(layer.owner)
            : -1,
        groupID,
        source: {
            partSourceRecordID: partSource?.recordID ?? null,
            versionIndex,
            typeDefinitionPath: typeDefinition.record?.sourcePath ?? null,
            materialDefinitionPath: materialDefinition?.sourcePath ?? null
        },
        materialValues: materialDefinition?.values ?? null,
        textureCandidates: classified,
        selectedTextures: classified
            .filter(value => value.selected)
            .map(value => ({
                path: value.path,
                role: value.role,
                target: value.target,
                quality: value.quality
            })),
        diagnostics,
        evidence: {
            status: "policy",
            rule: "legacy-opengl-texture-filename-v1",
            definitionRule: "exact-retained-definition-v1",
            materialRule: "exact-sibling-color-definition-v1"
        }
    };
}

function ResolveTypeDefinition(library, partType, sex)
{
    if (!partType || !sex) return { record: null, candidates: [] };

    const paths = [
        ...(partType.sourcePaths ?? []),
        partType.sourcePath
    ].filter((value, index, all) => value && all.indexOf(value) === index);
    const candidates = paths
        .filter(path => path.toLowerCase().includes(`/${sex}/`))
        .map(path => library.Get("characterDefinitions", path))
        .filter(record => MatchesTypeDefinition(record, partType));

    return {
        record: candidates.length === 1 ? candidates[0] : null,
        candidates
    };
}

function MatchesTypeDefinition(record, partType)
{
    const values = record?.values;
    if (!Array.isArray(values) || (values.length !== 3 && values.length !== 4)) return false;

    return NormalizePartPath(values[0]) === NormalizePartPath(partType.partPath)
        && NormalizeOptional(values[1]) === NormalizeOptional(partType.resourceVersion)
        && NormalizeOptional(values[2]) === NormalizeOptional(partType.colorVariant);
}

function ResolveMaterialDefinition(library, typeDefinition, colorVariant)
{
    const variant = String(colorVariant ?? "").trim();
    const typePath = String(typeDefinition?.sourcePath ?? "");
    const marker = typePath.toLowerCase().lastIndexOf("/types/");

    if (!variant || marker === -1) return null;

    const path = `${typePath.slice(0, marker)}/${variant.toLowerCase()}.color`;
    const record = library.Get("characterDefinitions", path);

    return record?.extension === ".color" ? record : null;
}

function ClassifyTextures(paths)
{
    if (!Array.isArray(paths))
    {
        throw new TypeError("Legacy texture candidates must be an array");
    }

    const targetHints = new Set();

    for (const value of paths)
    {
        const match = FileStem(value).match(/(?:^|_)(body|head)(?:_|$)/u);
        if (match) targetHints.add(match[1]);
    }

    const inferredTarget = targetHints.size === 1 ? [ ...targetHints ][0] : null;
    const result = paths.map(path => ClassifyTexture(path, inferredTarget));
    const winners = new Map();

    for (let index = 0; index < result.length; index++)
    {
        const value = result[index];
        if (!value.recognized) continue;

        const key = `${value.role}\0${value.target}\0${value.family}`;
        const previous = winners.get(key);

        if (previous === undefined
            || QUALITY_SCORE[value.quality] > QUALITY_SCORE[result[previous].quality])
        {
            winners.set(key, index);
        }
    }

    for (const index of winners.values()) result[index].selected = true;
    return result;
}

function ClassifyTexture(path, inferredTarget)
{
    const exactPath = RequireResourcePath(path);
    const stem = FileStem(exactPath);
    const qualityMatch = stem.match(/_(4k|512|256)$/u);
    const quality = qualityMatch?.[1] ?? "standard";
    const family = qualityMatch ? stem.slice(0, -qualityMatch[0].length) : stem;
    let role = null;
    let target = null;
    let match = family.match(/^colorize_(body|head)_([lz])$/u);

    if (match)
    {
        target = match[1];
        role = match[2] === "l" ? "colorize-layer" : "colorize-zones";
    }
    else
    {
        match = family.match(/^comp_(body|head)_([dnsm])$/u);
        if (match)
        {
            target = match[1];
            role = match[2] === "m"
                ? "cut-mask"
                : ChannelRole(match[2], "overlay");
        }
        else
        {
            match = family.match(/_([dns]|tn)$/u);
            if (match && inferredTarget)
            {
                target = inferredTarget;
                role = match[1] === "tn"
                    ? "twist-normal"
                    : ChannelRole(match[1], "source");
            }
        }
    }

    return {
        path: exactPath,
        family,
        quality,
        role,
        target,
        recognized: Boolean(role && target),
        selected: false
    };
}

function ChannelRole(channel, suffix)
{
    return channel === "d"
        ? `diffuse-${suffix}`
        : channel === "n"
            ? `normal-${suffix}`
            : `specular-${suffix}`;
}

function FileStem(path)
{
    const name = String(path).replaceAll("\\", "/").split("/").at(-1).toLowerCase();
    return name.replace(/\.[^.]+$/u, "");
}

function ParseModifierIndex(pointer)
{
    const match = String(pointer ?? "").match(/^\/modifiers\/(\d+)$/u);
    return match ? Number(match[1]) : null;
}

function ParseVersionIndex(pointer)
{
    const match = String(pointer ?? "").match(/^\/versions\/(\d+)$/u);
    return match ? Number(match[1]) : null;
}

function NormalizePartPath(value)
{
    return String(value ?? "")
        .trim()
        .replaceAll("\\", "/")
        .replace(/^\/+|\/+$/gu, "")
        .toLowerCase();
}

function NormalizeOptional(value)
{
    const result = String(value ?? "").trim();
    return result ? result.toLowerCase() : null;
}

function RequireLibrary(value)
{
    if (!value || value.schema !== "carbonenginejs.characterLibrary"
        || (value.schemaVersion !== 7 && value.schemaVersion !== 8)
        || typeof value.Get !== "function")
    {
        throw new TypeError("Legacy texture policy requires a schema-v7 or schema-v8 character library");
    }
}

function RequireResourcePath(value)
{
    const result = String(value ?? "").trim();
    if (!/^res:\//iu.test(result))
    {
        throw new TypeError("Legacy texture candidate must be a res:/ path");
    }
    return result;
}

function Diagnostic(code, message)
{
    return { code, message };
}

function SplitGroup(value)
{
    const [ category = "", group = "" ] = String(value ?? "").toLowerCase().split("/");
    return [ category, group ];
}

export default CcpwglLegacyTexturePolicy;
