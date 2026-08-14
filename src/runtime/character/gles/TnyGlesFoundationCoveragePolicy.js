const EXACT_COVERAGE = new Map([
    [
        "male\0bottomouter\0male/bottomouter/pantsam01",
        {
            strategy: "hide-carrier",
            roles: [ "legs" ],
            authoredOcclusion: "bottominner"
        }
    ]
]);

const FOOTWEAR_HEIGHTS = new Set([ "low", "shin", "medium", "knee", "high", "xhigh" ]);
const FOUNDATION_ROLE_BY_MODIFIER_LOCATION = new Map([
    [ "topinner", "torso" ]
]);

/**
 * Resolves decoded character metadata into the demo's reviewed legacy-OpenGL
 * foundation visibility operations.
 */
export class TnyGlesFoundationCoveragePolicy
{
    /** Returns one detached coverage instruction, or null when none is proven. */
    Resolve({
        sex,
        foundationLayout = null,
        groupID,
        partSourceRecordID,
        metadata = null
    } = {})
    {
        const normalizedSex = String(sex ?? "").trim();
        const normalizedGroupID = String(groupID ?? "").trim();
        const normalizedSourceID = String(partSourceRecordID ?? "").trim();
        const footwear = normalizedGroupID === "feet"
            ? ResolveAuthoredFootwearHeight(metadata)
            : null;
        const authoredCoverage = normalizedSex === "male"
            ? ResolveAuthoredModifierCoverage(metadata)
            : null;

        if (authoredCoverage)
        {
            return {
                strategy: "hide-carrier",
                roles: [ authoredCoverage.foundationRole ],
                evidence: {
                    status: "policy",
                    rule: "legacy-opengl-authored-modifier-coverage-v1",
                    sex: normalizedSex,
                    groupID: normalizedGroupID,
                    partSourceRecordID: normalizedSourceID,
                    authoredValue: authoredCoverage.authoredValue,
                    modifierLocationKey: authoredCoverage.modifierLocationKey,
                    relation: authoredCoverage.relation
                }
            };
        }

        if (footwear?.height === "shoe") return null;
        if (footwear && FOOTWEAR_HEIGHTS.has(footwear.height))
        {
            const female = normalizedSex === "female";
            const male = normalizedSex === "male";
            if (!female && !male) return null;

            return {
                strategy: female ? "triangle-mask" : "hide-carrier",
                roles: [ female && foundationLayout !== "split-lod0" ? "body" : "feet" ],
                ...(female ? {
                    triangleRule: "legacy-opengl-exact-foundation-triangle-coverage-v1",
                    bonePrefixes: [ "LeftFoot", "RightFoot", "LeftToe", "RightToe" ]
                } : {}),
                evidence: {
                    status: "policy",
                    rule: "legacy-opengl-authored-footwear-coverage-v1",
                    sex: normalizedSex,
                    groupID: normalizedGroupID,
                    partSourceRecordID: normalizedSourceID,
                    footwearHeight: footwear.height,
                    authoredModifierPaths: footwear.authoredModifierPaths
                }
            };
        }

        const policy = EXACT_COVERAGE.get(
            `${normalizedSex}\0${normalizedGroupID}\0${normalizedSourceID}`
        );

        if (!policy) return null;

        return {
            strategy: policy.strategy,
            roles: [ ...policy.roles ],
            ...(policy.triangleRule ? {
                triangleRule: policy.triangleRule,
                bonePrefixes: [ ...policy.bonePrefixes ]
            } : {}),
            ...(policy.authoredOcclusion ? {
                authoredOcclusion: policy.authoredOcclusion
            } : {}),
            evidence: {
                status: "policy",
                rule: "legacy-opengl-exact-foundation-coverage-v1",
                sex: normalizedSex,
                groupID: normalizedGroupID,
                partSourceRecordID: normalizedSourceID
            }
        };
    }
}

function ResolveAuthoredModifierCoverage(metadata)
{
    if (!metadata || !Array.isArray(metadata.occlusions)) return null;

    for (const reference of metadata.occlusions)
    {
        const authoredValue = String(reference?.authoredValue ?? "").trim().toLowerCase();
        const modifierLocationKey = String(
            reference?.modifierLocation?.modifierKey ?? ""
        ).trim().toLowerCase();
        const modifierPath = String(reference?.modifierPath ?? "").trim().toLowerCase();
        const resolvedKey = modifierLocationKey || modifierPath;
        const foundationRole = FOUNDATION_ROLE_BY_MODIFIER_LOCATION.get(resolvedKey);

        if (!foundationRole) continue;

        return {
            authoredValue,
            modifierLocationKey: resolvedKey,
            foundationRole,
            relation: modifierLocationKey
                ? "typed-modifier-location"
                : "exact-modifier-path-fallback"
        };
    }

    return null;
}

function ResolveAuthoredFootwearHeight(metadata)
{
    if (!metadata || !Array.isArray(metadata.dependencies)) return null;

    const paths = metadata.dependencies
        .map(value => String(value?.modifierPath ?? "").trim().toLowerCase())
        .filter(Boolean);
    const heights = new Set();

    for (const path of paths)
    {
        const tuck = path.match(/^utilityshapes\/pantstuck(shoe|shoes|low|shin|medium|knee|high|xhigh)shape$/u);
        const mask = path.match(/^dependants\/bootmasks\/bootmask(low|shin|medium|knee|high|xhigh)$/u);
        const height = tuck?.[1] ?? mask?.[1] ?? null;
        if (height) heights.add(height === "shoes" ? "shoe" : height);
    }

    if (!heights.size) return null;
    if (heights.has("shoe"))
    {
        return heights.size === 1
            ? { height: "shoe", authoredModifierPaths: paths }
            : null;
    }

    const ordered = [ "low", "shin", "medium", "knee", "high", "xhigh" ];
    const height = ordered.findLast(value => heights.has(value));
    return height ? { height, authoredModifierPaths: paths } : null;
}
