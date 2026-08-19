const QUALITY_SCORE = {
    "4k": 4,
    standard: 3,
    "512": 2,
    "256": 1
};

const CONFIGURED_GARMENT_GROUPS = new Set([
    "bottomouter",
    "feet",
    "outer",
    "topouter"
]);

const CONFIGURED_ACCESSORY_GROUP = "accessories";

/**
 * Labels exact retained character textures for the temporary legacy demo.
 * Filename roles are explicit ccpwgl policy, not runtime-character source facts.
 */
export class TnyGlesTexturePolicy
{
    _modifierOrder;

    /** Resolves one retained sex-specific definition for a prepared part type. */
    static resolveTypeDefinition(library, partType, sex)
    {
        return ResolveTypeDefinition(library, partType, sex);
    }

    /** Resolves the labelled material candidate used by this texture policy. */
    static resolveTypeMaterialDefinition(
        library,
        typeDefinition,
        colorVariant,
        sex,
        groupID
    )
    {
        return ResolveTypeMaterialDefinition(
            library,
            typeDefinition,
            colorVariant,
            sex,
            groupID
        );
    }

    constructor({ modifierOrder = null } = {})
    {
        if (modifierOrder !== null
            && (typeof modifierOrder?.sort !== "function"
                || typeof modifierOrder?.resolveCategories !== "function"))
        {
            throw new TypeError("Legacy texture policy modifierOrder must expose sort and resolveCategories");
        }

        this._modifierOrder = modifierOrder;
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

        const ordered = this._modifierOrder
            ? this._modifierOrder.sort(contributions, {
                categories: this._modifierOrder.resolveCategories(),
                getCategory: value => SplitGroup(value.groupID)[0],
                getGroup: value => SplitGroup(value.groupID)[1]
            })
            : contributions;

        return AnnotateAuthoredOcclusions(ordered);
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

    const typeMaterialResolution = ResolveTypeMaterialDefinition(
        library,
        typeDefinition.record,
        partType?.colorVariant,
        sex,
        groupID
    );
    const typeMaterialDefinition = typeMaterialResolution?.record ?? null;
    const colorSelection = ResolveColorSelection(plan, groupID);
    const colorMaterialResolution = typeMaterialDefinition
        ? null
        : ResolveColorSelectionDefinition(
            library,
            colorSelection,
            sex,
            partSource
        );
    const materialDefinition = typeMaterialDefinition ?? colorMaterialResolution?.record;
    const unselectedDefaultMaterial = !materialDefinition
        && !colorSelection
        && !String(partType?.colorVariant ?? "").trim()
        ? ResolveMaterialDefinition(library, typeDefinition.record, "default")
        : null;

    if (partType?.colorVariant && !typeMaterialDefinition)
    {
        diagnostics.push(Diagnostic(
            "MATERIAL_DEFINITION_UNRESOLVED",
            `No retained sibling .color definition matches ${JSON.stringify(partType.colorVariant)}.`
        ));
    }
    if (unselectedDefaultMaterial)
    {
        diagnostics.push(Diagnostic(
            "DEFAULT_MATERIAL_POLICY_UNRESOLVED",
            "An exact sibling default.color exists, but no authored selection proves that it applies."
        ));
    }

    const targetHint = ResolveTextureTargetHint(groupID);
    const allowColorizeShorthand = Boolean(materialDefinition) && Boolean(targetHint);
    const classified = ClassifyTextures(
        ResolveTexturePaths(
            part,
            partSource,
            version,
            targetHint,
            allowColorizeShorthand
        ),
        targetHint,
        { allowColorizeShorthand }
    );
    const directDiffuseUnderlayPath = ResolveDirectDiffuseUnderlayPath(
        part,
        partSource,
        version,
        targetHint,
        allowColorizeShorthand
    );
    const weight = layer?.weight === null || layer?.weight === undefined
        ? 1
        : Number(layer.weight);
    if (!Number.isFinite(weight))
    {
        throw new TypeError(`Legacy texture layer ${layerIndex} has a non-finite weight`);
    }

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
        weight,
        ownerSelectionIndex: Array.isArray(plan.selections)
            ? plan.selections.indexOf(layer.owner)
            : -1,
        groupID,
        source: {
            partSourceRecordID: partSource?.recordID ?? null,
            partPath: partSource?.partPath ?? null,
            versionIndex,
            typeDefinitionPath: typeDefinition.record?.sourcePath ?? null,
            materialDefinitionPath: materialDefinition?.sourcePath ?? null,
            ...(unselectedDefaultMaterial ? {
                materialCandidatePaths: [ unselectedDefaultMaterial.sourcePath ]
            } : {}),
            occludesModifiers: Array.isArray(version?.metadata?.occludesModifiers)
                ? [ ...version.metadata.occludesModifiers ]
                : [],
            ...(Array.isArray(version?.metadata?.occlusions)
                && version.metadata.occlusions.length ? { occlusions:
                    version.metadata.occlusions.map(value => ({
                        authoredValue: value?.authoredValue ?? null,
                        modifierKey: value?.modifierLocation?.modifierKey ?? null
                    }))
                } : {}),
            ...(directDiffuseUnderlayPath ? { directDiffuseUnderlayPath } : {})
        },
        materialValues: materialDefinition?.values ?? null,
        colorSelection: colorSelection ? { ...colorSelection } : null,
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
            rule: "legacy-opengl-texture-filename-v2",
            definitionRule: "exact-retained-definition-v1",
            materialRule: typeMaterialResolution
                ? typeMaterialResolution.rule
                : colorMaterialResolution
                    ? colorMaterialResolution.rule
                    : "unresolved",
            ...(unselectedDefaultMaterial ? {
                materialCandidateRule: "unselected-exact-sibling-default-v1"
            } : {})
        }
    };
}

function AnnotateAuthoredOcclusions(contributions)
{
    for (const contribution of contributions)
    {
        contribution.occludedBy = [];
    }

    for (const owner of contributions)
    {
        const occlusions = [
            ...(owner.source.occlusions ?? []),
            ...(owner.source.occludesModifiers ?? []).map(authoredValue => ({
                authoredValue,
                modifierKey: null
            }))
        ];
        const matchedIdentities = new Set();
        for (const value of occlusions)
        {
            const identity = NormalizeModifierIdentity(
                value.modifierKey ?? value.authoredValue
            );
            if (!identity || matchedIdentities.has(identity)) continue;
            matchedIdentities.add(identity);

            for (const target of contributions)
            {
                if (target === owner
                    || NormalizeModifierIdentity(target.groupID) !== identity) continue;

                target.occludedBy.push({
                    partIndex: owner.partIndex,
                    groupID: owner.groupID,
                    partSourceRecordID: owner.source.partSourceRecordID,
                    authoredValue: value.authoredValue
                });
            }
        }
    }

    return contributions;
}

function NormalizeModifierIdentity(value)
{
    const identity = String(value ?? "").trim().replaceAll("\\", "/").toLowerCase();
    // Female TanktopF01 retains the legacy authored category name while the
    // active paper-doll selection is exposed through the current location.
    if (identity === "topunderwear") return "topinner";
    return identity;
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
    const lowerTypePath = typePath.toLowerCase();
    const marker = Math.max(
        lowerTypePath.lastIndexOf("/types/"),
        lowerTypePath.lastIndexOf("/type/")
    );

    if (!variant || marker === -1) return null;

    const path = `${typePath.slice(0, marker)}/${variant.toLowerCase()}.color`;
    const record = library.Get("characterDefinitions", path);

    return record?.extension === ".color" ? record : null;
}

function ResolveTypeMaterialDefinition(
    library,
    typeDefinition,
    colorVariant,
    sex,
    groupID
)
{
    const sibling = ResolveMaterialDefinition(library, typeDefinition, colorVariant);
    if (sibling)
    {
        return {
            record: sibling,
            path: sibling.sourcePath ?? null,
            rule: "exact-sibling-color-definition-v1"
        };
    }

    const variant = NormalizeModifierIdentity(colorVariant);
    const colorKey = NormalizeModifierIdentity(groupID);
    if (!sex || !variant || !colorKey) return null;

    const path = `res:/graphics/character/${sex}/paperdoll/${colorKey}`
        + `/colors/${variant}.color`;
    const record = library.Get("characterDefinitions", path);
    return record?.extension === ".color"
        ? {
            record,
            path,
            rule: "exact-type-group-color-definition-v1"
        }
        : null;
}

function ResolveColorSelection(plan, groupID)
{
    const matches = (plan?.colorSelections ?? []).filter(value =>
        NormalizeModifierIdentity(value?.colorKey) === NormalizeModifierIdentity(groupID));
    return matches.length === 1 ? matches[0] : null;
}

function ResolveColorSelectionDefinition(library, selection, sex, partSource)
{
    const colorKey = NormalizeModifierIdentity(selection?.colorKey);
    const colorName = NormalizeModifierIdentity(selection?.colorNameA);
    if (!sex || !colorKey || !colorName) return null;

    const sourcePath = String(partSource?.sourcePath ?? "").replace(/\/+$/u, "");
    const candidates = [
        sourcePath && {
            path: `${sourcePath}/${colorName}.color`,
            rule: "exact-part-source-color-selection-v1"
        },
        {
            path: `res:/graphics/character/${sex}/paperdoll/${colorKey}`
                + `/colors/${colorName}.color`,
            rule: "exact-group-color-selection-v1"
        }
    ].filter(Boolean);

    for (const candidate of candidates)
    {
        const record = library.Get("characterDefinitions", candidate.path);
        if (record?.extension === ".color") return { ...candidate, record };
    }
    return null;
}

function ResolveDirectDiffuseUnderlayPath(
    part,
    partSource,
    version,
    targetHint,
    allowColorizeShorthand
)
{
    const base = partSource?.versions?.find(value => value?.resourceVersion == null);
    if (!base || base === version || !Array.isArray(base.textureCandidates)) return null;
    const exactPaths = Array.isArray(part?.texturePaths) && part.texturePaths.length
        ? part.texturePaths
        : version?.textureCandidates ?? [];
    const options = { allowColorizeShorthand };
    const isDirectHairDiffuse = value => value?.recognized
        && value.target === "hair"
        && [ "diffuse-source", "diffuse-overlay" ].includes(value.role);
    const exact = ClassifyTextures(exactPaths, targetHint, options)
        .filter(isDirectHairDiffuse);
    const inherited = ClassifyTextures(base.textureCandidates, targetHint, options)
        .filter(isDirectHairDiffuse);
    return exact.length === 1 && inherited.length === 1
        && exact[0].path !== inherited[0].path
        ? inherited[0].path
        : null;
}

function ResolveTexturePaths(
    part,
    partSource,
    version,
    targetHint = null,
    allowColorizeShorthand = false
)
{
    const exact = Array.isArray(part?.texturePaths) && part.texturePaths.length
        ? part.texturePaths
        : version?.textureCandidates ?? [];
    const base = partSource?.versions?.find(value => value?.resourceVersion == null);

    if (!base || base === version || !Array.isArray(base.textureCandidates))
    {
        return [ ...exact ];
    }

    // A version folder is an overlay, not a complete replacement. CCP commonly
    // publishes only the channels changed by a color/version variant (for
    // example a version-specific specular map), leaving the other families at
    // the part root. Retain the exact version for every family it provides and
    // inherit only missing semantic target/channels from the unversioned source.
    // Semantic precedence matters when an exact version changes a filename stem
    // while still publishing the same body/head normal or specular output.
    const overridden = new Set(exact.map(TextureFamily));
    const classificationOptions = { allowColorizeShorthand };
    const overriddenChannels = new Set(ClassifyTextures(
        exact,
        targetHint,
        classificationOptions
    )
        .filter(value => value.recognized && value.role && value.target)
        .map(value => `${value.target}\0${TextureSemanticChannel(value.role)}`));
    const baseChannels = new Map(ClassifyTextures(
        base.textureCandidates,
        targetHint,
        classificationOptions
    )
        .map(value => [ value.path, value ]));
    return [
        ...exact,
        ...base.textureCandidates.filter(path =>
        {
            if (overridden.has(TextureFamily(path))) return false;
            const value = baseChannels.get(path);
            return !value.recognized
                || !value.role
                || !value.target
                || !overriddenChannels.has(
                    `${value.target}\0${TextureSemanticChannel(value.role)}`
                );
        })
    ];
}

function TextureSemanticChannel(role)
{
    if (/^normal-/u.test(role)) return "normal";
    if (/^specular-/u.test(role)) return "specular";
    if (/^diffuse-/u.test(role)) return "diffuse";
    return role;
}

function ClassifyTextures(
    paths,
    targetHint = null,
    { allowColorizeShorthand = false } = {}
)
{
    if (!Array.isArray(paths))
    {
        throw new TypeError("Legacy texture candidates must be an array");
    }

    const targetHints = new Set();

    for (const value of paths)
    {
        const match = FileStem(value).match(/(?:^|_)(body|head|hair|acc)(?:_|$)/u);
        if (match) targetHints.add(match[1]);
    }

    const inferredTarget = targetHints.size === 1 ? [ ...targetHints ][0] : targetHint;
    const result = paths.map(path => ClassifyTexture(
        path,
        inferredTarget,
        allowColorizeShorthand
    ));
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

function ResolveTextureTargetHint(groupID)
{
    // Configured garment and accessory maps can omit their semantic target
    // from a filename. The selected modifier location supplies that missing
    // target without guessing from an asset family name. Explicit body/head/
    // hair/acc tokens still take precedence in ClassifyTextures.
    const location = SplitGroup(groupID)[0];
    if (CONFIGURED_GARMENT_GROUPS.has(location)) return "body";
    if (location === CONFIGURED_ACCESSORY_GROUP) return "acc";
    return null;
}

function TextureFamily(path)
{
    const stem = FileStem(path);
    const qualityMatch = stem.match(/_(4k|512|256)$/u);
    return qualityMatch ? stem.slice(0, -qualityMatch[0].length) : stem;
}

function ClassifyTexture(path, inferredTarget, allowColorizeShorthand = false)
{
    const exactPath = RequireResourcePath(path);
    const stem = FileStem(exactPath);
    const qualityMatch = stem.match(/_(4k|512|256)$/u);
    const quality = qualityMatch?.[1] ?? "standard";
    const family = qualityMatch ? stem.slice(0, -qualityMatch[0].length) : stem;
    let role = null;
    let target = null;
    let match = family.match(/^colorize_(body|head|hair|acc)_([lz])$/u);

    if (match)
    {
        target = match[1];
        role = match[2] === "l" ? "colorize-layer" : "colorize-zones";
    }
    else
    {
        match = allowColorizeShorthand && inferredTarget
            ? family.match(/_([lz])$/u)
            : null;
        if (match)
        {
            target = inferredTarget;
            role = match[1] === "l" ? "colorize-layer" : "colorize-zones";
        }
        else
        {
            match = family.match(/^comp_(body|head|hair|acc)_(tn|mn|[dnsm])$/u);
            if (match)
            {
                target = match[1];
                role = match[2] === "m"
                    ? "cut-mask"
                    : match[2] === "tn"
                        ? "twist-normal"
                        : match[2] === "mn"
                            ? "normal-overlay"
                            : ChannelRole(match[2], "overlay");
            }
        }
        if (!role)
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
        || ![ 7, 8, 9, 10 ].includes(value.schemaVersion)
        || typeof value.Get !== "function")
    {
        throw new TypeError(
            "Legacy texture policy requires a schema-v7, schema-v8, schema-v9, or schema-v10 character library"
        );
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
