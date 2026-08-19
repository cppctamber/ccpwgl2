import {
    TnyGlesFoundationConstruction
} from "./TnyGlesFoundationConstruction.js";
import {
    TnyGlesFoundationCoveragePolicy
} from "./TnyGlesFoundationCoveragePolicy.js";
import { TnyGlesTexturePolicy } from "./TnyGlesTexturePolicy.js";
import {
    ValidateLegacyTextureContributions
} from "./TnyGlesTextureContributions.js";

/** Combines explicit legacy foundation policy with exact resolved plan parts. */
export class TnyGlesAppearanceConstruction
{
    _foundationResolver;

    _foundationCoveragePolicy;

    _texturePolicy;

    constructor({
        foundationResolver = new TnyGlesFoundationConstruction(),
        foundationCoveragePolicy = new TnyGlesFoundationCoveragePolicy(),
        texturePolicy = new TnyGlesTexturePolicy()
    } = {})
    {
        if (typeof foundationResolver?.Resolve !== "function")
        {
            throw new TypeError("Legacy appearance construction requires a foundation resolver");
        }
        if (typeof texturePolicy?.Resolve !== "function")
        {
            throw new TypeError("Legacy appearance construction requires a texture policy");
        }
        if (typeof foundationCoveragePolicy?.Resolve !== "function")
        {
            throw new TypeError("Legacy appearance construction requires a foundation coverage policy");
        }

        this._foundationResolver = foundationResolver;
        this._foundationCoveragePolicy = foundationCoveragePolicy;
        this._texturePolicy = texturePolicy;
    }

    /** Produces foundation operations followed by every exact resolved part. */
    Resolve(paperdoll, appearancePlan, library)
    {
        if (!appearancePlan || typeof appearancePlan !== "object")
        {
            throw new TypeError("Legacy appearance construction requires an appearance plan");
        }
        if (!Array.isArray(appearancePlan.parts) || !Array.isArray(appearancePlan.layers))
        {
            throw new TypeError("Legacy appearance construction requires plan parts and layers");
        }
        if (!library || typeof library !== "object")
        {
            throw new TypeError("Legacy appearance construction requires the installed character library");
        }

        const expectedContributions = appearancePlan.layers.map((layer, layerIndex) =>
        {
            const partIndex = appearancePlan.parts.indexOf(layer?.contributor);
            const groupID = String(layer?.owner?.groupID ?? "").trim();
            if (partIndex === -1)
            {
                throw new Error(`Appearance layer ${layerIndex} does not reference a plan-owned part`);
            }
            if (!groupID)
            {
                throw new Error(`Appearance layer ${layerIndex} has no selection group`);
            }
            return { layerIndex, partIndex, groupID };
        });
        const foundation = this._foundationResolver.Resolve(
            paperdoll,
            appearancePlan,
            library
        );
        const foundationSupports = ResolveFoundationSupports(foundation.operations);
        const operations = foundation.operations.slice(0, -1);
        const textureContributions = this._texturePolicy.Resolve(
            library,
            paperdoll,
            appearancePlan
        );
        const morphTargets = ResolveMorphTargets(appearancePlan);
        ValidateLegacyTextureContributions(
            textureContributions,
            expectedContributions,
            "Legacy appearance construction"
        );

        let configuredPartCount = 0;
        let deferredContributionCount = 0;

        for (let layerIndex = 0; layerIndex < appearancePlan.layers.length; layerIndex++)
        {
            const layer = appearancePlan.layers[layerIndex];
            const part = layer.contributor;
            const { partIndex, groupID } = expectedContributions[layerIndex];

            const common = {
                layerIndex,
                partIndex,
                groupID,
                partSourceRecordID: part.origin?.document === "characterPartSources"
                    ? String(part.origin.recordID ?? "").trim() || null
                    : null,
                evidence: {
                    status: part.origin?.kind ?? "derived",
                    document: part.origin?.document ?? null,
                    recordID: part.origin?.recordID ?? null,
                    rule: part.origin?.rule ?? "appearance-plan-resolved-part"
                }
            };
            const configurationPath = OptionalResourcePath(part.configurationPath);
            const geometryPath = OptionalResourcePath(part.geometryPath);
            const sourceVersion = ResolvePartSourceVersion(
                library,
                common.partSourceRecordID,
                part.origin?.jsonPointer
            );
            const geometryCandidates = sourceVersion?.geometryCandidates
                ?.map(value => OptionalResourcePath(value))
                .filter(Boolean) ?? [];
            const configurationCandidateCount = sourceVersion?.configurationCandidates
                ?.map(value => OptionalResourcePath(value))
                .filter(Boolean).length ?? 0;
            const configuredVisualCandidateInventory = configurationCandidateCount
                || geometryCandidates.length
                ? {
                    configurationCount: configurationCandidateCount,
                    geometryCount: geometryCandidates.length
                }
                : null;

            if (configurationPath && (geometryPath || geometryCandidates.length))
            {
                const metadata = ResolvePartMetadata(
                    library,
                    common.partSourceRecordID,
                    part.origin?.jsonPointer
                );
                const foundationCoverage = this._foundationCoveragePolicy.Resolve({
                    sex: foundation.sex,
                    foundationLayout: foundation.evidence?.layout ?? null,
                    foundationSupports,
                    groupID,
                    partSourceRecordID: common.partSourceRecordID,
                    metadata
                });

                configuredPartCount++;
                operations.push({
                    operation: "configured-part",
                    ...common,
                    configurationPath,
                    geometryPath,
                    ...(geometryCandidates.length ? {
                        geometryCandidates: [ ...geometryCandidates ]
                    } : {}),
                    ...(foundationCoverage ? { foundationCoverage } : {})
                });
            }
            else
            {
                deferredContributionCount++;
                operations.push({
                    operation: "deferred-contribution",
                    ...common,
                    configurationPath,
                    geometryPath,
                    ...(configuredVisualCandidateInventory
                        ? { configuredVisualCandidateInventory }
                        : {})
                });
            }
        }

        operations.push(foundation.operations[foundation.operations.length - 1]);

        return {
            ...foundation,
            evidence: {
                status: "policy",
                rule: "legacy-opengl-appearance-v1",
                foundationRule: foundation.evidence?.rule ?? null,
                resolvedPartRule: "appearance-plan-resolved-parts-v1"
            },
            resolvedPartCount: appearancePlan.layers.length,
            configuredPartCount,
            deferredContributionCount,
            textureContributions,
            morphTargets,
            operations
        };
    }
}

/** Retains only exact torso-authored support identities for coverage joins. */
function ResolveFoundationSupports(operations)
{
    return (operations ?? []).flatMap(value =>
    {
        const evidence = value?.evidence;
        const role = String(value?.role ?? "").trim();
        const partSourceRecordID = String(
            evidence?.supportPartSourceRecordID ?? ""
        ).trim();
        if (value?.operation !== "geometry"
            || evidence?.rule !== "exact-foundation-torso-support-dependency-v1"
            || !role
            || !partSourceRecordID)
        {
            return [];
        }
        return [ { role, partSourceRecordID } ];
    });
}

function ResolveMorphTargets(appearancePlan)
{
    if (!Array.isArray(appearancePlan.morphTargets)) return [];

    return appearancePlan.morphTargets.map((value, index) =>
    {
        const modifierPath = String(value?.modifierPath ?? "").trim().toLowerCase();
        const targetName = String(value?.targetName ?? "").trim();
        const weight = Number(value?.weight);
        const ownerGroupID = String(value?.owner?.groupID ?? "").trim();

        if (!modifierPath.startsWith("utilityshapes/")
            || !targetName
            || !Number.isFinite(weight)
            || !ownerGroupID)
        {
            throw new TypeError(
                `Legacy appearance morph target ${index} is not an exact resolved request`
            );
        }

        return {
            modifierPath,
            targetName,
            weight,
            ownerGroupID,
            evidence: {
                status: "policy",
                rule: "legacy-gles-unique-normalized-morph-target-match-v1",
                sourceStatus: value.origin?.kind ?? null,
                document: value.origin?.document ?? null,
                recordID: value.origin?.recordID ?? null,
                jsonPointer: value.origin?.jsonPointer ?? null,
                sourceRule: value.origin?.rule ?? null
            }
        };
    });
}

function ResolvePartMetadata(library, recordID, jsonPointer)
{
    const version = ResolvePartSourceVersion(library, recordID, jsonPointer);
    if (version?.metadata) return version.metadata;
    if (!recordID || typeof library?.Get !== "function") return null;
    const source = library.Get("characterPartSources", recordID);
    return source?.metadata ?? null;
}

function ResolvePartSourceVersion(library, recordID, jsonPointer)
{
    if (!recordID || typeof library?.Get !== "function") return null;
    const source = library.Get("characterPartSources", recordID);
    const match = String(jsonPointer ?? "").match(/^\/versions\/(\d+)$/u);
    return match ? source?.versions?.[Number(match[1])] ?? null : null;
}

function RequireResourcePath(value, label)
{
    const result = String(value ?? "").trim();

    if (!/^res:\//iu.test(result))
    {
        throw new TypeError(`Legacy appearance construction ${label} must be a res:/ path`);
    }

    return result;
}

function OptionalResourcePath(value)
{
    const result = String(value ?? "").trim();
    if (!result) return null;
    return RequireResourcePath(result, "optional contribution path");
}
