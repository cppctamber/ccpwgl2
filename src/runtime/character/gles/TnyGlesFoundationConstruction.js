const DEFAULT_SHADER = "res:/graphics/effect.gles2/managed/interior/avatar/skinnedavatar.sm_hi";
const NEUTRAL_NORMAL = "res:/graphics/shared_texture/global/normal_flat.dds";
const BODY_DIFFUSE_FOUNDATIONS = {
    female: "res:/graphics/character/female/paperdoll/archetypes/ccshape/cd_female_body_d_4k.png",
    male: "res:/graphics/character/male/paperdoll/archetypes/ccshape/cd_male_body_d_4k.png"
};
const FEMALE_BODY_FOUNDATION = {
    role: "body",
    index: 1,
    configurationPath: "res:/graphics/character/female/paperdoll/basenude/basenude.black",
    geometryPath: "res:/graphics/character/female/paperdoll/basenude/basenude.gr2"
};
const FEMALE_SPLIT_HANDS_PATH =
    "res:/graphics/character/female/paperdoll/hands/hands_nude/hands_nude.gr2";

const FEMALE_SPLIT_LOD0_GEOMETRY = [
    [ "head", "res:/graphics/character/female/paperdoll/head/head_generic/head_generic.gr2" ],
    [ "torso", "res:/graphics/character/female/paperdoll/topinner/torso_nude/torso_nude.gr2" ],
    [ "sleevesUpper", "res:/graphics/character/female/paperdoll/dependants/sleevesupper/standard/standard.gr2" ],
    [ "sleevesLower", "res:/graphics/character/female/paperdoll/dependants/sleeveslower/standard/standard.gr2" ],
    [ "legs", "res:/graphics/character/female/paperdoll/bottominner/legs_nude/legs_nude.gr2" ],
    [ "hands", FEMALE_SPLIT_HANDS_PATH, {
        status: "policy",
        rule: "legacy-opengl-bone-capacity-mask-v1",
        shaderCapacity: 58,
        requiredBoneCount: 69,
        bonePrefixes: [ "RightHand" ]
    } ],
    [ "feet", "res:/graphics/character/female/paperdoll/feet/feet_nude/feet_nude.gr2" ]
];

const FOUNDATIONS = {
    female: {
        resourceGender: 0,
        skeletonPath: "res:/graphics/character/female/skeleton/masterskeletonfemale.gr2",
        configuredFoundations: [ {
            role: "head",
            index: 0,
            configurationPath: "res:/graphics/character/female/paperdoll/head/head_generic/head_generic.black",
            geometryPath: "res:/graphics/character/female/paperdoll/head/head_generic/head_generic.gr2",
            skinTextures: {
                DiffuseMap: "res:/graphics/character/female/paperdoll/head/head_generic/genericfemhead_d_4k.png",
                NormalMap: "res:/graphics/character/female/paperdoll/head/head_generic/genericfemhead_n_4k.png",
                SpecularMap: "res:/graphics/character/female/paperdoll/head/head_generic/genericfemhead_s_4k.png"
            },
            skinEvidence: {
                status: "retained",
                rule: "exact-head-generic-texture-inventory-v1",
                correctness: "exact-folder-inventory"
            }
        } ],
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
        configuredFoundations: [ {
            role: "head",
            index: 0,
            configurationPath: "res:/graphics/character/male/paperdoll/head/head_generic/head_generic.black",
            geometryPath: "res:/graphics/character/male/paperdoll/head/head_generic/head_generic.gr2",
            skinTextures: {
                DiffuseMap: "res:/graphics/character/male/paperdoll/head/head_generic/genericmale_head_d_4k.png",
                NormalMap: "res:/graphics/character/male/paperdoll/head/head_generic/genericmale_head_n_4k.png",
                SpecularMap: "res:/graphics/character/male/paperdoll/head/head_generic/genericmale_head_s_4k.png"
            },
            skinEvidence: {
                status: "retained",
                rule: "exact-head-generic-texture-inventory-v1",
                correctness: "exact-folder-inventory"
            }
        } ],
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
export class TnyGlesFoundationConstruction
{
    _femaleFoundationLayout;

    _shaderPath;

    constructor({
        shaderPath = DEFAULT_SHADER,
        femaleFoundationLayout = "combined"
    } = {})
    {
        if (![ "combined", "split-lod0" ].includes(femaleFoundationLayout))
        {
            throw new TypeError("Legacy foundation construction femaleFoundationLayout is invalid");
        }
        this._femaleFoundationLayout = femaleFoundationLayout;
        this._shaderPath = RequireResourcePath(shaderPath, "shaderPath");
    }

    /** Produces the exact ordered operations the temporary adapter will consume. */
    Resolve(paperdoll, appearancePlan, library = null)
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

        const baseGeometry = sex === "female" && this._femaleFoundationLayout === "split-lod0"
            ? FEMALE_SPLIT_LOD0_GEOMETRY
            : definition.geometry;
        const geometry = ResolveFoundationGeometry(baseGeometry, sex, library);

        for (let index = 0; index < geometry.length; index++)
        {
            const [ role, resourcePath, compatibility, evidence ] = geometry[index];

            operations.push({
                operation: "geometry",
                role,
                index,
                resourcePath,
                ...(evidence ? { evidence: { ...evidence } } : {}),
                ...(compatibility ? { compatibility: CloneCompatibility(compatibility) } : {})
            });
        }

        operations.push({
            operation: "rebuild-areas",
            shaderPath: this._shaderPath
        }, {
            operation: "proof-textures",
            profile: "neutral"
        });

        const selectedSkin = ResolveSelectedFoundationSkin(paperdoll, sex, library);
        const genericBodySpecular = selectedSkin
            ? null
            : ResolveGenericFoundationSpecular(sex, library);
        for (const configured of definition.configuredFoundations)
        {
            const resolved = configured.role === "head" && selectedSkin
                ? {
                    ...configured,
                    // Keep the generic-head texture inventory beside the
                    // configured support geometry separate from the selected
                    // archetype skin surface. The renderer may compare this
                    // source when qualifying topology-specific face carriers.
                    supportTextures: { ...configured.skinTextures },
                    supportEvidence: { ...configured.skinEvidence },
                    skinTextures: { ...selectedSkin.headTextures },
                    ...(selectedSkin.skinColorization ? { skinColorization: {
                        ...selectedSkin.skinColorization,
                        colors: selectedSkin.skinColorization.colors.map(color => [ ...color ])
                    } } : {}),
                    skinEvidence: { ...selectedSkin.evidence }
                }
                : configured.role === "head" && genericBodySpecular
                    ? {
                        ...configured,
                        skinEvidence: {
                            ...configured.skinEvidence,
                            ...genericBodySpecular
                        }
                    }
                    : configured;
            operations.push({
                operation: "configured-foundation",
                ...resolved
            });
        }
        if (sex === "female"
            && this._femaleFoundationLayout === "combined"
            && selectedSkin?.bodyTextures)
        {
            operations.push({
                operation: "configured-foundation",
                ...FEMALE_BODY_FOUNDATION,
                renderConfiguredCarrier: false,
                renderEvidence: {
                    status: "observed",
                    rule: "legacy-opengl-authored-body-carrier-unqualified-v1"
                },
                skinTextures: { ...selectedSkin.bodyTextures },
                ...(selectedSkin.skinColorization ? { skinColorization: {
                    ...selectedSkin.skinColorization,
                    colors: selectedSkin.skinColorization.colors.map(color => [ ...color ])
                } } : {}),
                skinEvidence: {
                    ...selectedSkin.evidence,
                    normalStatus: "unresolved-neutral",
                    normalRule: "legacy-opengl-neutral-body-normal-v1"
                }
            });
        }
        const browSupport = ResolveSelectedBrowSupport(
            sex,
            selectedSkin?.evidence?.archetypeSourceRecordID,
            library
        );
        if (browSupport)
        {
            operations.push({
                operation: "configured-foundation-support",
                role: "eyebrowbase",
                ...browSupport
            });
        }

        operations.push({
            operation: "bind-animation"
        });

        return {
            backend: "legacy-opengl",
            evidence: {
                status: "policy",
                rule: "legacy-opengl-foundation-v1",
                layout: sex === "female" ? this._femaleFoundationLayout : "split-lod0"
            },
            paperdollRecordID: String(paperdoll.recordID ?? ""),
            sourceBuild: appearancePlan.sourceBuild ?? null,
            sex,
            lod: 0,
            operations
        };
    }
}

/**
 * Adds exact support carriers authored as dependencies of the nude torso.
 * The join is intentionally strict: a dependency must already be hydrated and
 * expose one self-contained version with one configuration/geometry pair.
 */
export function ResolveFoundationGeometry(baseGeometry, sex, library)
{
    const result = baseGeometry.map(value => [
        value[0],
        value[1],
        value[2] ? CloneCompatibility(value[2]) : undefined,
        value[3] ? { ...value[3] } : undefined
    ]);
    if (!library || typeof library.Get !== "function") return result;

    const torso = library.Get("characterPartSources", `${sex}/topinner/torso_nude`);
    const metadata = ResolveEffectiveMetadata(torso);
    const supports = [];

    for (const relation of metadata?.dependencies ?? [])
    {
        const authored = StripDependencyWeight(relation?.authoredValue).toLowerCase();
        const match = /^dependants\/(sleevesupper|sleeveslower)\/[^/]+$/u.exec(authored);
        const target = relation?.partSource;
        if (!match || !target) continue;
        if (String(target.recordID ?? "").toLowerCase() !== `${sex}/${authored}`) continue;

        const versions = (target.versions ?? []).filter(Boolean);
        if (versions.length !== 1) continue;
        const version = versions[0];
        if (version.configurationCandidates?.length !== 1
            || version.geometryCandidates?.length !== 1)
        {
            continue;
        }

        supports.push([
            match[1] === "sleevesupper" ? "sleevesUpper" : "sleevesLower",
            version.geometryCandidates[0],
            undefined,
            {
                status: "derived",
                rule: "exact-foundation-torso-support-dependency-v1",
                torsoPartSourceRecordID: torso.recordID,
                metadataRecordID: metadata.recordID,
                authoredDependency: relation.authoredValue,
                supportPartSourceRecordID: target.recordID,
                configurationPath: version.configurationCandidates[0]
            }
        ]);
    }

    const uniqueRoles = new Set(supports.map(value => value[0]));
    if (uniqueRoles.size !== supports.length) return result;

    const existingRoles = new Set(result.map(value => value[0]));
    const additions = supports
        .filter(value => !existingRoles.has(value[0]))
        .sort((left, right) => FoundationSupportOrder(left[0]) - FoundationSupportOrder(right[0]));
    if (!additions.length) return result;

    const torsoIndex = result.findIndex(value => value[0] === "torso");
    result.splice(torsoIndex < 0 ? result.length : torsoIndex + 1, 0, ...additions);
    return result;
}

function FoundationSupportOrder(role)
{
    return role === "sleevesUpper" ? 0 : 1;
}

/** Resolves one exact authored brow carrier through the selected head metadata. */
export function ResolveSelectedBrowSupport(sex, archetypeSourceRecordID, library)
{
    if (!library || typeof library.GetDocument !== "function") return null;

    const archetypeID = String(archetypeSourceRecordID ?? "").trim().toLowerCase();
    const prefix = `${sex}/archetypes/`;
    if (!archetypeID.startsWith(prefix)) return null;
    const relativeArchetype = archetypeID.slice(`${sex}/`.length);
    const heads = (library.GetDocument("characterPartSources") ?? []).filter(source =>
    {
        if (!String(source?.recordID ?? "").toLowerCase().startsWith(`${sex}/head/`))
        {
            return false;
        }
        const metadata = ResolveEffectiveMetadata(source);
        return metadata?.dependentModifiers?.some(value =>
            StripDependencyWeight(value).toLowerCase() === relativeArchetype);
    });
    if (heads.length !== 1) return null;

    const metadata = ResolveEffectiveMetadata(heads[0]);
    const matches = (metadata?.dependencies ?? []).filter(relation =>
    {
        const authored = StripDependencyWeight(relation?.authoredValue).toLowerCase();
        return authored.startsWith("accessories/browbase/")
            && relation?.partSource
            && String(relation.partSource.recordID ?? "").toLowerCase()
                === `${sex}/${authored}`;
    });
    if (matches.length !== 1) return null;

    const target = matches[0].partSource;
    const versions = (target?.versions ?? []).filter(Boolean);
    if (versions.length !== 1) return null;
    const version = versions[0];
    if (version.configurationCandidates?.length !== 1
        || version.geometryCandidates?.length !== 1)
    {
        return null;
    }

    return {
        partSourceRecordID: target.recordID,
        configurationPath: version.configurationCandidates[0],
        geometryPath: version.geometryCandidates[0],
        evidence: {
            status: "derived",
            rule: "exact-head-archetype-brow-support-dependency-v1",
            headPartSourceRecordID: heads[0].recordID,
            metadataRecordID: metadata.recordID,
            authoredDependency: matches[0].authoredValue,
            archetypeSourceRecordID
        }
    };
}

function ResolveEffectiveMetadata(source)
{
    const versions = (source?.versions ?? []).filter(Boolean);
    return versions.length === 1 && versions[0].metadata
        ? versions[0].metadata
        : source?.metadata ?? null;
}

function StripDependencyWeight(value)
{
    return String(value ?? "").replace(
        /###[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/u,
        ""
    );
}

function ResolveGenericFoundationSpecular(sex, library)
{
    if (!library || typeof library.GetDocument !== "function") return null;
    const diffusePath = String(BODY_DIFFUSE_FOUNDATIONS[sex] ?? "").toLowerCase();
    const diffuseParts = diffusePath.split("/");
    const diffuseName = diffuseParts.at(-1);
    const archetypeFamily = diffuseParts.at(-2)?.replace(/shape$/u, "");
    if (!diffuseName?.endsWith("_d_4k.png")) return null;
    if (!archetypeFamily) return null;
    const specularName = `${diffuseName.slice(0, -"_d_4k.png".length)}_s_4k.png`;
    const expectedSuffix = `/${sex}/paperdoll/skintype/${archetypeFamily}/${specularName}`;
    const matches = (library.GetDocument("characterTextureMetadata") ?? [])
        .filter(value => String(value?.sourcePath ?? "").toLowerCase()
            .endsWith(expectedSuffix));
    if (matches.length !== 1) return null;
    return {
        bodySpecularPath: matches[0].sourcePath,
        bodySpecularMetadataRecordID: matches[0].recordID,
        bodySpecularRule: "exact-foundation-diffuse-token-specular-match-v1"
    };
}

/** Resolves one selected skintone through retained base, PRS, and archetype records. */
export function ResolveSelectedFoundationSkin(paperdoll, sex, library)
{
    if (!library || typeof library.Get !== "function"
        || typeof library.GetDocument !== "function") return null;

    const selections = (paperdoll?.colorSelections ?? []).filter(value =>
        value?.colorID?.colorKey === "skintone"
        && typeof value?.colorNameA?.colorName === "string");
    if (selections.length !== 1) return null;

    const colorName = selections[0].colorNameA.colorName.trim().toLowerCase();
    const root = `res:/graphics/character/${sex}/paperdoll/skintone/basic/`;
    const families = (library.GetDocument("characterDefinitions") ?? [])
        .map(value => String(value?.recordID ?? "").toLowerCase())
        .filter(value => value.startsWith(root) && value.endsWith(".base"))
        .map(value => value.slice(root.length, -".base".length))
        .filter(value => colorName === value || colorName.startsWith(`${value}_`))
        .sort((left, right) => right.length - left.length);
    if (families.length !== 1) return null;

    const family = families[0];
    const basePath = `${root}${family}.base`;
    const baseDefinition = library.Get("characterDefinitions", basePath);
    const materialDefinitionPath = `${root}${colorName}.color`;
    const materialDefinition = library.Get("characterDefinitions", materialDefinitionPath);
    const colors = materialDefinition?.values?.colors;
    const hasSkinColorization = Array.isArray(baseDefinition?.values)
        && baseDefinition.values.length === 4
        && Array.isArray(colors)
        && colors.length === 3
        && colors.every(color => Array.isArray(color) && color.length === 4);
    const definitionPath = "res:/graphics/character/dnafiles/characterselect/"
        + `${family}${sex}clothing.prs`;
    const definition = library.Get("characterDefinitions", definitionPath);
    if (!Array.isArray(definition?.values) || definition.values[0] !== sex) return null;

    const sources = definition.values.slice(1)
        .filter(value => value?.category === "bodyshapes"
            && typeof value?.path === "string")
        .map(value => value.path.replace(/^bodyshapes\//iu, "").toLowerCase())
        .map(value => ({
            identity: `${sex}/archetypes/${value}`,
            source: library.Get("characterPartSources", `${sex}/archetypes/${value}`)
        }))
        .filter(value => value.source);
    if (sources.length !== 1) return null;

    const texturePaths = sources[0].source.versions
        ?.flatMap(value => value?.textureCandidates ?? []) ?? [];
    const archetypeToken = sources[0].identity.split("/").at(-1)?.replace(/shape$/iu, "");
    if (!archetypeToken) return null;
    const prefix = `${archetypeToken}_${sex}_head_`;
    const headTextures = {
        DiffuseMap: SelectExactFoundationTexture(texturePaths, `${prefix}d_4k.png`),
        NormalMap: SelectExactFoundationTexture(texturePaths, `${prefix}n_4k.png`),
        SpecularMap: SelectExactFoundationTexture(texturePaths, `${prefix}s_4k.png`)
    };
    if (Object.values(headTextures).some(value => !value)) return null;

    const bodyPrefix = `${archetypeToken}_${sex}_body_`;
    const bodyDiffusePath = SelectExactFoundationTexture(
        texturePaths,
        `${bodyPrefix}d_4k.png`
    );
    const bodySpecularPath = SelectExactFoundationTexture(
        texturePaths,
        `${bodyPrefix}s_4k.png`
    );

    return {
        headTextures,
        ...(hasSkinColorization ? { skinColorization: {
            materialDefinitionPath,
            colors: colors.map(color => [ ...color ]),
            headDetailPath: `${root}colorize_head_l.png`,
            headZonePath: `${root}colorize_head_z.png`,
            bodyDetailPath: `${root}colorize_body_l.png`,
            bodyZonePath: `${root}colorize_body_z.png`
        } } : {}),
        ...(bodyDiffusePath && bodySpecularPath ? {
            bodyTextures: {
                DiffuseMap: bodyDiffusePath,
                NormalMap: NEUTRAL_NORMAL,
                SpecularMap: bodySpecularPath
            }
        } : {}),
        evidence: {
            status: "derived",
            rule: "exact-skintone-prs-archetype-foundation-v1",
            correctness: "retained-source-join",
            colorName,
            basePath,
            ...(hasSkinColorization ? {
                baseColor: [ ...baseDefinition.values ],
                materialDefinitionPath
            } : {}),
            definitionPath,
            archetypeSourceRecordID: sources[0].identity,
            ...(bodyDiffusePath ? { bodyDiffusePath } : {}),
            ...(bodySpecularPath ? { bodySpecularPath } : {})
        }
    };
}

function SelectExactFoundationTexture(paths, fileName)
{
    const matches = paths.filter(value => String(value).toLowerCase().endsWith(`/${fileName}`));
    return matches.length === 1 ? matches[0] : null;
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
