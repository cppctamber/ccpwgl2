const DEFAULT_SHADER = "res:/graphics/effect.gles2/managed/interior/avatar/skinnedavatar.sm_hi";

const FOUNDATIONS = {
    female: {
        resourceGender: 0,
        skeletonPath: "res:/graphics/character/female/skeleton/masterskeletonfemale.gr2",
        geometry: [
            [ "head", "res:/graphics/character/female/paperdoll/head/head_generic/head_generic.gr2" ],
            [ "body", "res:/graphics/character/female/paperdoll/basenude/basenude.gr2", {
                status: "policy",
                rule: "legacy-opengl-bone-capacity-mask-v1",
                shaderCapacity: 58,
                requiredBoneCount: 69,
                bonePrefixes: [ "RightHand" ]
            } ]
        ]
    },
    male: {
        resourceGender: 1,
        skeletonPath: "res:/graphics/character/male/skeleton/masterskeletonmale.gr2",
        geometry: [
            [ "head", "res:/graphics/character/male/paperdoll/head/head_generic/head_generic.gr2" ],
            [ "torso", "res:/graphics/character/male/paperdoll/topinner/torso_nude/torso_nude.gr2" ],
            [ "legs", "res:/graphics/character/male/paperdoll/bottominner/legs_nude/legs_nude.gr2" ],
            [ "hands", "res:/graphics/character/male/paperdoll/hands/hands_nude/hands_nude.gr2" ],
            [ "feet", "res:/graphics/character/male/paperdoll/feet/feet_nude/feet_nude.gr2" ]
        ]
    }
};

/**
 * Describes the isolated demo's temporary legacy OpenGL foundation policy.
 * This is deliberately separate from the runtime-character appearance plan.
 */
export class CcpwglLegacyFoundationConstruction
{
    #shaderPath;

    constructor({ shaderPath = DEFAULT_SHADER } = {})
    {
        this.#shaderPath = RequireResourcePath(shaderPath, "shaderPath");
    }

    /** Produces the exact ordered operations the temporary adapter will consume. */
    Resolve(paperdoll, appearancePlan)
    {
        if (!paperdoll || typeof paperdoll !== "object")
        {
            throw new TypeError("Legacy foundation construction requires a paper doll");
        }
        if (!appearancePlan || typeof appearancePlan !== "object")
        {
            throw new TypeError("Legacy foundation construction requires an appearance plan");
        }

        const sex = ResolvePaperdollSex(paperdoll);
        const definition = FOUNDATIONS[sex];

        if (!definition)
        {
            throw new Error("The selected paper doll does not resolve to one character sex");
        }

        const operations = [ {
            operation: "skeleton",
            resourcePath: definition.skeletonPath
        } ];

        for (let index = 0; index < definition.geometry.length; index++)
        {
            const [ role, resourcePath, compatibility ] = definition.geometry[index];

            operations.push({
                operation: "geometry",
                role,
                index,
                resourcePath,
                ...(compatibility ? { compatibility: CloneCompatibility(compatibility) } : {})
            });
        }

        operations.push({
            operation: "rebuild-areas",
            shaderPath: this.#shaderPath
        }, {
            operation: "proof-textures",
            profile: "neutral"
        }, {
            operation: "bind-animation"
        });

        return {
            backend: "legacy-opengl",
            evidence: {
                status: "policy",
                rule: "legacy-opengl-foundation-v1"
            },
            paperdollRecordID: String(paperdoll.recordID ?? ""),
            sourceBuild: appearancePlan.sourceBuild ?? null,
            sex,
            lod: 0,
            operations
        };
    }
}

function CloneCompatibility(value)
{
    return {
        ...value,
        bonePrefixes: [ ...value.bonePrefixes ]
    };
}

function ResolvePaperdollSex(paperdoll)
{
    const genders = new Set();

    for (const modifier of paperdoll.modifiers ?? [])
    {
        const value = modifier?.paperdollResourceID?.resGender;
        if (value === 0 || value === 1) genders.add(value);
    }

    if (genders.size !== 1) return null;
    return genders.has(0) ? "female" : "male";
}

function RequireResourcePath(value, label)
{
    const result = String(value ?? "").trim();

    if (!/^res:\//iu.test(result))
    {
        throw new TypeError(`Legacy foundation construction ${label} must be a res:/ path`);
    }

    return result;
}

export default CcpwglLegacyFoundationConstruction;
