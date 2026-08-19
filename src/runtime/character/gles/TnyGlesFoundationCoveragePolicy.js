const FOOTWEAR_HEIGHTS = new Set([ "low", "shin", "medium", "knee", "high", "xhigh" ]);
const FOUNDATION_ROLE_BY_MODIFIER_LOCATION = new Map([
    [ "topinner", "torso" ],
    [ "bottominner", "legs" ],
    [ "feet", "feet" ],
    [ "hands", "hands" ]
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
        foundationSupports = [],
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
        const authoredCoverage = ResolveAuthoredModifierCoverage(
            metadata,
            normalizedSex,
            foundationSupports
        );

        if (authoredCoverage?.length)
        {
            return {
                strategy: "hide-carrier",
                roles: [ ...new Set(authoredCoverage.map(value => value.foundationRole)) ],
                evidence: {
                    status: "policy",
                    rule: "legacy-opengl-authored-modifier-coverage-v1",
                    sex: normalizedSex,
                    groupID: normalizedGroupID,
                    partSourceRecordID: normalizedSourceID,
                    relationships: authoredCoverage.map(value => ({ ...value }))
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

        return null;
    }
}

/**
 * Maps exact authored occlusions to independently captured nude carriers.
 * Category-to-carrier coverage remains the reviewed male-only policy. Sleeve
 * support coverage is sex-neutral because the exact torso dependency and the
 * selected garment's matching parent-path occlusion are both retained.
 */
function ResolveAuthoredModifierCoverage(metadata, sex, foundationSupports)
{
    if (!metadata || !Array.isArray(metadata.occlusions)) return [];

    const supportRoles = ResolveFoundationSupportRoles(sex, foundationSupports);
    const result = [];
    for (const reference of metadata.occlusions)
    {
        const authoredValue = String(reference?.authoredValue ?? "").trim().toLowerCase();
        const modifierLocationKey = String(
            reference?.modifierLocation?.modifierKey ?? ""
        ).trim().toLowerCase();
        const modifierPath = String(reference?.modifierPath ?? "").trim().toLowerCase();
        const resolvedKey = modifierLocationKey || modifierPath;
        const foundationRole = sex === "male"
            ? FOUNDATION_ROLE_BY_MODIFIER_LOCATION.get(resolvedKey)
            : null;

        if (foundationRole)
        {
            result.push({
                authoredValue,
                modifierLocationKey: resolvedKey,
                foundationRole,
                relation: modifierLocationKey
                    ? "typed-modifier-location"
                    : "exact-modifier-path-fallback"
            });
            continue;
        }

        const support = supportRoles.get(modifierPath);
        if (!support) continue;

        result.push({
            authoredValue,
            modifierPath,
            supportPartSourceRecordID: support.partSourceRecordID,
            foundationRole: support.role,
            relation: "exact-foundation-support-parent-path"
        });
    }

    return result;
}

/** Builds the exact parent-path-to-carrier map retained by foundation setup. */
function ResolveFoundationSupportRoles(sex, foundationSupports)
{
    const normalizedSex = String(sex ?? "").trim().toLowerCase();
    const result = new Map();

    for (const value of foundationSupports ?? [])
    {
        const role = String(value?.role ?? "").trim();
        const partSourceRecordID = String(
            value?.partSourceRecordID ?? ""
        ).trim().toLowerCase();
        const prefix = `${normalizedSex}/dependants/`;
        if (!role || !partSourceRecordID.startsWith(prefix)) continue;

        const relative = partSourceRecordID.slice(`${normalizedSex}/`.length);
        const separator = relative.lastIndexOf("/");
        if (separator <= 0) continue;
        const parentPath = relative.slice(0, separator);
        const expectedRole = parentPath === "dependants/sleevesupper"
            ? "sleevesUpper"
            : parentPath === "dependants/sleeveslower"
                ? "sleevesLower"
                : null;
        if (role !== expectedRole || result.has(parentPath)) continue;

        result.set(parentPath, { role, partSourceRecordID });
    }

    return result;
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
