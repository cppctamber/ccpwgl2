import {
    CcpwglLegacyFoundationConstruction
} from "./CcpwglLegacyFoundationConstruction.mjs";
import {
    CcpwglLegacyFoundationCoveragePolicy
} from "./CcpwglLegacyFoundationCoveragePolicy.mjs";
import { CcpwglLegacyTexturePolicy } from "./CcpwglLegacyTexturePolicy.mjs";
import {
    ValidateLegacyTextureContributions
} from "./CcpwglLegacyTextureContributions.mjs";

/** Combines explicit legacy foundation policy with exact resolved plan parts. */
export class CcpwglLegacyAppearanceConstruction
{
    #foundationResolver;

    #foundationCoveragePolicy;

    #texturePolicy;

    constructor({
        foundationResolver = new CcpwglLegacyFoundationConstruction(),
        foundationCoveragePolicy = new CcpwglLegacyFoundationCoveragePolicy(),
        texturePolicy = new CcpwglLegacyTexturePolicy()
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

        this.#foundationResolver = foundationResolver;
        this.#foundationCoveragePolicy = foundationCoveragePolicy;
        this.#texturePolicy = texturePolicy;
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
        const foundation = this.#foundationResolver.Resolve(paperdoll, appearancePlan);
        const operations = foundation.operations.slice(0, -1);
        const textureContributions = this.#texturePolicy.Resolve(
            library,
            paperdoll,
            appearancePlan
        );
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

            if (configurationPath && geometryPath)
            {
                const foundationCoverage = this.#foundationCoveragePolicy.Resolve({
                    sex: foundation.sex,
                    groupID,
                    partSourceRecordID: common.partSourceRecordID
                });

                configuredPartCount++;
                operations.push({
                    operation: "configured-part",
                    ...common,
                    configurationPath,
                    geometryPath,
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
                    geometryPath
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
            operations
        };
    }
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

export default CcpwglLegacyAppearanceConstruction;
