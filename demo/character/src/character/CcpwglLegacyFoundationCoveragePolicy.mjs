const EXACT_COVERAGE = new Map([
    [
        "male\0feet\0male/feet/bootsam01",
        { strategy: "hide-carrier", roles: [ "feet" ] }
    ],
    [
        "female\0feet\0female/feet/bootscf01",
        {
            strategy: "triangle-mask",
            roles: [ "body" ],
            triangleRule: "legacy-opengl-exact-foundation-triangle-coverage-v1",
            bonePrefixes: [ "LeftFoot", "RightFoot", "LeftToe", "RightToe" ]
        }
    ]
]);

/**
 * Resolves the demo's reviewed legacy-OpenGL foundation visibility rules.
 * These rules are explicit adapter policy, not decoded character metadata.
 */
export class CcpwglLegacyFoundationCoveragePolicy
{
    /** Returns one detached coverage instruction, or null when none is proven. */
    Resolve({ sex, groupID, partSourceRecordID } = {})
    {
        const normalizedSex = String(sex ?? "").trim();
        const normalizedGroupID = String(groupID ?? "").trim();
        const normalizedSourceID = String(partSourceRecordID ?? "").trim();
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

export default CcpwglLegacyFoundationCoveragePolicy;
