/* global globalThis */

import {
    createCharacterPartCatalog,
    createCharacterPartIndex
} from "./CharacterDemoPartCatalog.mjs";

const APPAREL_LOCATIONS = new Set([
    "bottominner",
    "bottomouter",
    "bottomunderwear",
    "feet",
    "outer",
    "topinner",
    "topmiddle",
    "topouter",
    "topunderwear"
]);

/**
 * Runs each exact observed apparel choice after releasing the prior audit
 * appearance. This is deliberately a non-atomic, single-character audit path;
 * the interactive editor continues to use URL-owned first-render selections.
 */
export function installCharacterDemoClothingAudit({
    application,
    context = {},
    locations = APPAREL_LOCATIONS,
    sourceObserved = false,
    sourceObservedOutfits = false
} = {})
{
    const character = application?.GetCharacter?.();
    const paperdoll = character?.GetPaperdoll?.();
    if (!character || !paperdoll)
    {
        throw new TypeError("Character clothing audit requires a selected paper doll");
    }

    const index = createCharacterPartIndex(character.GetPaperdolls());
    const catalog = createCharacterPartCatalog(index, paperdoll);
    const selectedLocations = new Set([ ...locations ].map(value =>
        String(value).trim().toLowerCase()).filter(Boolean));
    let choices = catalog.slots
        .filter(slot => selectedLocations.has(slot.modifierKey.toLowerCase()))
        .flatMap(slot => slot.resources.map(resource => ({
            choiceID: resource.choiceID,
            donorRecordID: resource.donorRecordID,
            label: resource.resPath || resource.recordID,
            locationID: slot.locationID,
            modifierKey: slot.modifierKey,
            partSourceRecordID: resource.partSourceRecordID,
            recordID: resource.recordID,
            variation: resource.variation
        })));
    let sourceObservedOutfitMode = null;
    if (sourceObservedOutfits === "all") sourceObservedOutfitMode = "all";
    else if (sourceObservedOutfits === true || sourceObservedOutfits === "1")
    {
        sourceObservedOutfitMode = "choice-cover";
    }
    if (sourceObservedOutfitMode)
    {
        choices = createSourceObservedOutfitCases(
            character.GetPaperdolls(),
            selectedLocations,
            catalog.gender,
            { exhaustive: sourceObservedOutfitMode === "all" }
        );
    }
    const output = document.createElement("output");
    output.id = "character-clothing-audit";
    output.hidden = true;
    output.dataset.total = String(choices.length);
    output.dataset.completed = "0";
    document.body.append(output);

    const pageURL = new URL(globalThis.location.href);
    const auditContext = {
        ...context,
        baselinePaperdollID: String(paperdoll.recordID),
        sourceObserved: sourceObserved === true || sourceObservedOutfitMode !== null,
        sourceObservedOutfits: sourceObservedOutfitMode,
        sex: String(catalog.gender),
        pageURL: pageURL.href,
        backgroundMode: pageURL.searchParams.get("background") ?? "default",
        startedAt: new Date().toISOString()
    };
    const promise = RunChoices(
        application,
        choices,
        output,
        auditContext,
        sourceObserved === true || sourceObservedOutfitMode !== null
    );
    return { choices, output, promise };
}

async function RunChoices(application, choices, output, context, sourceObserved)
{
    const results = [];
    for (const choice of choices)
    {
        let result;
        try
        {
            const selection = sourceObserved
                ? await application.SelectPaperdollForAudit(choice.donorRecordID)
                : await application.SelectPartForAudit(
                    choice.locationID,
                    choice.choiceID
                );
            result = ReadResult(choice, selection);
        }
        catch (error)
        {
            result = {
                ...choice,
                outcome: "failed",
                reason: error?.message ?? String(error)
            };
        }
        results.push(result);
        output.dataset.completed = String(results.length);
        output.dataset.lastOutcome = result.outcome;
        output.textContent = JSON.stringify({
            status: "running",
            ...context,
            completed: results.length,
            total: choices.length,
            results
        });
    }
    if (sourceObserved)
    {
        await application.ResetPaperdollAfterAudit(context.baselinePaperdollID);
    }
    else
    {
        await application.ResetPartsAfterAudit();
    }
    const report = {
        status: "complete",
        ...context,
        completed: results.length,
        total: choices.length,
        results
    };
    output.textContent = JSON.stringify(report);
    output.dataset.status = "complete";
    return report;
}

function ReadResult(choice, selection)
{
    const renderer = selection?.renderer;
    if (!renderer?.status)
    {
        throw new Error("Character clothing audit did not receive a renderer result");
    }
    const alphaText = document.querySelector("#character-alpha-audit")?.textContent ?? "";
    const realization = summarizeClothingRendererDetails(renderer.details);
    const outfitRealizations = Array.isArray(choice.choices)
        ? classifyClothingOutfitRealizations(
            choice.choices,
            realization,
            selection?.diagnostics
        )
        : null;
    return {
        ...choice,
        alpha: alphaText ? JSON.parse(alphaText) : null,
        outcome: renderer.status,
        ...(outfitRealizations ? { outfitRealizations } : {
            choiceRealization: classifyClothingChoiceRealization(
                choice,
                realization,
                selection?.diagnostics
            )
        }),
        renderer: {
            status: renderer.status,
            revision: renderer.revision ?? null,
            reason: renderer.reason ?? null,
            realization
        },
        stage: document.querySelector("#stage-message span")?.textContent ?? "",
        status: document.querySelector("#demo-status")?.textContent ?? ""
    };
}

/**
 * Builds a deterministic donor-outfit cover for every exact apparel choice of
 * the requested sex. Each case keeps only the selected apparel locations under
 * review, but rendering still uses the complete donor paper doll so
 * cross-garment ownership remains intact. Pass `exhaustive` only when every
 * retained donor paper doll is intentionally required.
 */
export function createSourceObservedOutfitCases(
    paperdolls,
    locations = APPAREL_LOCATIONS,
    sex = null,
    { exhaustive = false } = {}
)
{
    const index = createCharacterPartIndex(paperdolls);
    const selectedLocations = new Set([ ...locations ].map(value =>
        String(value).trim().toLowerCase()).filter(Boolean));
    const result = [];

    for (const paperdoll of paperdolls ?? [])
    {
        const paperdollSex = ResolveObservedPaperdollSex(paperdoll);
        if (sex !== null && paperdollSex !== sex) continue;
        const locations = index.byGender.get(paperdollSex) ?? new Map();
        const donorRecordID = ReadRecordID(paperdoll);
        const choices = [];
        for (const [ modifierIndex, modifier ] of (paperdoll?.modifiers ?? []).entries())
        {
            const locationID = ReadRecordID(modifier?.modifierLocationID);
            const slot = locations.get(locationID);
            const modifierKey = String(
                slot?.location?.modifierKey
                ?? modifier?.modifierLocationID?.modifierKey
                ?? locationID
            ).trim();
            if (!modifierKey
                || !selectedLocations.has(modifierKey.toLowerCase())) continue;
            const recordID = ReadRecordID(modifier?.paperdollResourceID);
            if (!recordID) continue;
            const variationValue = Number(modifier?.paperdollResourceVariation ?? 0);
            const variation = Number.isInteger(variationValue) ? variationValue : 0;
            const choiceID = `${recordID}@${variation}`;
            const resource = slot?.resources.get(choiceID)?.resource ?? null;
            choices.push({
                choiceID,
                donorRecordID,
                label: resource?.resPath || recordID,
                locationID,
                modifierKey,
                modifierIndex,
                partSourceRecordID: ReadRecordID(resource?.partType?.partSource),
                recordID,
                resourceResolved: resource !== null,
                variation
            });
        }
        if (!choices.length) continue;
        result.push({
            auditKind: "source-observed-outfit",
            donorRecordID,
            label: `paper doll ${donorRecordID}`,
            choices
        });
    }
    return exhaustive ? result : SelectSourceObservedOutfitChoiceCover(result);
}

/** Classifies every selected apparel member of one rendered donor outfit. */
export function classifyClothingOutfitRealizations(
    choices,
    realization,
    diagnostics = null
)
{
    return (choices ?? []).map(choice => ({
        ...choice,
        realization: classifyClothingChoiceRealization(
            choice,
            realization,
            diagnostics
        )
    }));
}

/** Retains compact per-part material evidence without serializing live objects. */
export function summarizeClothingRendererDetails(details)
{
    if (!details || typeof details !== "object") return null;
    const garment = details.configuredGarmentMaterials ?? null;
    const hair = details.configuredHairMaterials ?? null;
    const headwear = details.configuredHeadwearMaterials ?? null;
    return {
        configuredParts: (details.configuredParts ?? []).map(value => ({
            partIndex: value.partIndex ?? null,
            groupID: value.groupID ?? null,
            partSourceRecordID: value.partSourceRecordID ?? null,
            geometryPath: value.geometryPath ?? null,
            geometryBindingSource: value.geometryBindingSource ?? null,
            renderStatus: value.renderStatus ?? null,
            materialStatus: value.materialStatus ?? null,
            compositionStatus: value.compositionStatus ?? null
        })),
        garmentMaterials: garment ? {
            status: garment.status ?? null,
            applied: (garment.applied ?? []).map(value => ({
                partIndex: value.partIndex ?? null,
                groupID: value.groupID ?? null,
                partSourceRecordID: value.partSourceRecordID ?? null,
                diffuseMode: value.diffuseMode ?? null,
                detailPath: value.detailPath ?? null,
                realizationStatus: value.realizationStatus ?? null,
                expectedSurfaceCount: value.expectedSurfaceCount ?? null,
                completedSurfaceCount: value.completedSurfaceCount ?? null,
                partialSurfaceCount: value.partialSurfaceCount ?? null,
                deferredSurfaceCount: value.deferredSurfaceCount ?? null,
                materialChannels: value.materialChannels ?? null,
                bindings: (value.bindings ?? []).map(binding => ({
                    areaContract: binding.areaContract ?? null,
                    areaFields: [ ...(binding.areaFields ?? []) ],
                    authoredCutMaskInfluence: binding.authoredCutMaskInfluence
                        ? [ ...binding.authoredCutMaskInfluence ]
                        : null,
                    authoredCutMaskBinding: binding.authoredCutMaskBinding
                        ? { ...binding.authoredCutMaskBinding }
                        : null,
                    appliedCutMaskInfluence: binding.appliedCutMaskInfluence
                        ? [ ...binding.appliedCutMaskInfluence ]
                        : null,
                    appliedCutMaskPolicy: binding.appliedCutMaskPolicy ?? null,
                    appliedCutMaskBinding: binding.appliedCutMaskBinding
                        ? { ...binding.appliedCutMaskBinding }
                        : null,
                    sampleBounds: binding.sampleBounds
                        ? [ ...binding.sampleBounds ]
                        : null
                }))
            })),
            deferred: (garment.deferred ?? []).map(value => ({
                partIndex: value.partIndex ?? null,
                groupID: value.groupID ?? null,
                partSourceRecordID: value.partSourceRecordID ?? null,
                surface: value.surface ?? null,
                channel: value.channel ?? null,
                reason: value.reason ?? null
            }))
        } : null,
        hairMaterials: SummarizeConfiguredHairMaterials(hair),
        headwearMaterials: SummarizeConfiguredHeadwearMaterials(headwear),
        headMaterials: SummarizeConfiguredHeadMaterials(
            details.configuredHeadMaterials
        ),
        bodyComposition: details.composition ? {
            status: details.composition.status ?? null,
            bodyDiffuse: {
                status: details.composition.status ?? null,
                diagnosticMode: details.composition.diagnosticMode ?? null,
                passes: (details.composition.passes ?? []).map(pass => ({
                    mode: pass.mode ?? null,
                    path: pass.path ?? pass.detailPath ?? null,
                    role: pass.role ?? null,
                    target: pass.target ?? null,
                    groupID: pass.groupID ?? null,
                    layerIndex: pass.layerIndex ?? null,
                    placement: pass.placement ? [ ...pass.placement ] : null
                }))
            },
            bodyNormal: SummarizeBodyMaterialTarget(details.composition.bodyNormal),
            bodySpecular: SummarizeBodyMaterialTarget(details.composition.bodySpecular),
            deferred: (details.composition.deferred ?? []).map(SummarizeDeferredChannel)
        } : null,
        foundationCoverage: (details.foundationCoverage ?? []).map(value => ({
            ownerPartIndex: value.ownerPartIndex ?? null,
            groupID: value.groupID ?? value.evidence?.groupID ?? null,
            partSourceRecordID: value.partSourceRecordID ?? null,
            roles: [ ...(value.roles ?? []) ],
            strategy: value.strategy ?? null,
            status: value.status ?? null,
            reason: value.reason ?? null,
            evidence: value.evidence ? {
                rule: value.evidence.rule ?? null,
                sex: value.evidence.sex ?? null,
                groupID: value.evidence.groupID ?? null,
                partSourceRecordID: value.evidence.partSourceRecordID ?? null,
                relationships: (value.evidence.relationships ?? []).map(
                    relationship => ({
                        modifierPath: relationship.modifierPath ?? null,
                        modifierLocationKey:
                            relationship.modifierLocationKey ?? null,
                        supportPartSourceRecordID:
                            relationship.supportPartSourceRecordID ?? null,
                        foundationRole: relationship.foundationRole ?? null,
                        relation: relationship.relation ?? null
                    })
                )
            } : null,
            applied: (value.applied ?? []).map(applied => ({
                role: applied.role ?? null,
                meshIndex: applied.meshIndex ?? null,
                display: applied.display ?? null,
                maskedTriangleCount: applied.maskedTriangleCount ?? null,
                sharedApplication: applied.sharedApplication === true,
                sharedFromPartSourceRecordID:
                    applied.sharedFromPartSourceRecordID ?? null
            }))
        }))
    };
}

export function classifyClothingChoiceRealization(choice, realization, diagnostics = null)
{
    if (choice?.resourceResolved === false)
    {
        return {
            status: "unresolved",
            reason: "retained-resource-identity-unavailable"
        };
    }
    const groupID = String(choice?.modifierKey ?? "").trim().toLowerCase();
    const selectedPartSourceRecordID = String(
        choice?.partSourceRecordID ?? ""
    ).trim().toLowerCase();
    const configured = realization?.configuredParts?.find(value =>
        String(value?.groupID ?? "").toLowerCase() === groupID
        && (!selectedPartSourceRecordID
            || String(value?.partSourceRecordID ?? "").trim().toLowerCase()
                === selectedPartSourceRecordID));
    if (configured)
    {
        return {
            status: configured.renderStatus === "ready"
                && String(configured.compositionStatus ?? "").endsWith("-attached")
                ? "configured-attached"
                : "configured-deferred",
            materialStatus: configured.materialStatus ?? null,
            compositionStatus: configured.compositionStatus ?? null,
            partSourceRecordID: configured.partSourceRecordID ?? null
        };
    }

    const suppression = diagnostics?.plan?.diagnostics?.find(value =>
        value?.code === "SELECTION_SUPPRESSED"
        && String(value?.message ?? "").includes(JSON.stringify(groupID)));
    if (suppression)
    {
        return {
            status: "selection-suppressed",
            reason: suppression.message
        };
    }

    const atlasPasses = [
        ...(realization?.headMaterials?.channels ?? [])
            .flatMap(channel => channel.passes ?? [])
            .filter(pass => String(pass?.groupID ?? "").toLowerCase() === groupID),
        ...(realization?.bodyComposition?.bodyDiffuse?.passes ?? [])
            .filter(pass => String(pass?.groupID ?? "").toLowerCase() === groupID)
            .map(pass => ({ ...pass, channel: "DiffuseMap" }))
    ];
    if (atlasPasses.length)
    {
        return {
            status: "atlas-only-applied",
            channelCount: new Set(atlasPasses.map(value => value.channel)).size,
            passCount: atlasPasses.length
        };
    }

    const atlasOcclusion = realization?.bodyComposition?.deferred?.find(value =>
        String(value?.groupID ?? "").trim().toLowerCase() === groupID
        && value?.reason === "authored-modifier-occluded");
    if (atlasOcclusion)
    {
        return {
            status: "atlas-only-occluded",
            reason: atlasOcclusion.reason,
            layerIndex: atlasOcclusion.layerIndex ?? null
        };
    }

    return { status: "unresolved" };
}

function ReadRecordID(value)
{
    return String(typeof value === "string" ? value : value?.recordID ?? "").trim();
}

function ResolveObservedPaperdollSex(paperdoll)
{
    const counts = new Map();
    for (const modifier of paperdoll?.modifiers ?? [])
    {
        const value = Number(modifier?.paperdollResourceID?.resGender);
        if (!Number.isInteger(value) || value < 0) continue;
        counts.set(value, (counts.get(value) ?? 0) + 1);
    }

    let selected = null;
    let selectedCount = -1;
    for (const [ value, count ] of counts)
    {
        if (count <= selectedCount) continue;
        selected = value;
        selectedCount = count;
    }
    return selected;
}

function SelectSourceObservedOutfitChoiceCover(candidates)
{
    const pending = (candidates ?? []).map(value => ({
        keys: new Set((value.choices ?? []).map(CreateOutfitChoiceIdentity)),
        value
    }));
    const uncovered = new Set(pending.flatMap(value => [ ...value.keys ]));
    const result = [];

    while (uncovered.size)
    {
        let selected = null;
        let selectedCount = 0;
        for (const candidate of pending)
        {
            const count = [ ...candidate.keys ].filter(value =>
                uncovered.has(value)).length;
            if (count > selectedCount)
            {
                selected = candidate;
                selectedCount = count;
            }
        }
        if (!selected) break;
        result.push({
            ...selected.value,
            auditKind: "source-observed-outfit-choice-cover",
            coveredChoiceCount: selectedCount
        });
        for (const value of selected.keys) uncovered.delete(value);
        pending.splice(pending.indexOf(selected), 1);
    }
    return result;
}

function CreateOutfitChoiceIdentity(value)
{
    return `${value?.locationID ?? ""}\u0000${value?.choiceID ?? ""}`;
}

function SummarizeConfiguredHeadMaterials(value)
{
    if (!value) return null;
    return {
        status: value.status ?? null,
        channels: (value.channels ?? []).map(channel => ({
            name: channel.name ?? null,
            diagnosticMode: channel.diagnosticMode ?? null,
            passes: (channel.passes ?? []).map(pass => ({
                channel: channel.name ?? null,
                mode: pass.mode ?? null,
                path: pass.path ?? pass.detailPath ?? null,
                groupID: pass.groupID ?? null,
                layerIndex: pass.layerIndex ?? null,
                role: pass.role ?? null
            })),
            policySuppressed: (channel.policySuppressed ?? []).map(pass => ({
                channel: channel.name ?? null,
                path: pass.path ?? null,
                groupID: pass.groupID ?? null,
                layerIndex: pass.layerIndex ?? null,
                role: pass.role ?? null,
                reason: pass.reason ?? null
            }))
        }))
    };
}

function SummarizeConfiguredHairMaterials(value)
{
    if (!value) return null;
    return {
        status: value.status ?? null,
        applied: (value.applied ?? []).map(item => ({
            partIndex: item.partIndex ?? null,
            partSourceRecordID: item.partSourceRecordID ?? null,
            detailPath: item.detailPath ?? null,
            zonePath: item.zonePath ?? null,
            normalPath: item.normalPath ?? null,
            specularPath: item.specularPath ?? null,
            lightingMode: item.lightingMode ?? null,
            materialMode: item.materialMode ?? null,
            attachedEffects: item.attachedEffects ?? null,
            attachedRigidEffects: item.attachedRigidEffects ?? null,
            hiddenDeferredConsumers: item.hiddenDeferredConsumers ?? null,
            consumers: (item.consumers ?? []).map(SummarizeHairConsumer),
            excludedConsumers: (item.excludedConsumers ?? [])
                .map(SummarizeHairConsumer)
        })),
        deferred: (value.deferred ?? []).map(item => ({
            partIndex: item.partIndex ?? null,
            partSourceRecordID: item.partSourceRecordID ?? null,
            reason: item.reason ?? null
        }))
    };
}

function SummarizeConfiguredHeadwearMaterials(value)
{
    if (!value) return null;
    return {
        status: value.status ?? null,
        applied: (value.applied ?? []).map(item => ({
            partIndex: item.partIndex ?? null,
            partSourceRecordID: item.partSourceRecordID ?? null,
            detailPath: item.detailPath ?? null,
            normalPath: item.normalPath ?? null,
            specularPath: item.specularPath ?? null,
            attachedEffects: item.attachedEffects ?? null,
            effectiveMaterialParameters: (item.effectiveMaterialParameters ?? [])
                .map(effect => ({
                    effectName: effect.effectName ?? null,
                    effectPath: effect.effectPath ?? null,
                    parameters: effect.parameters ? { ...effect.parameters } : null
                }))
        })),
        deferred: (value.deferred ?? []).map(item => ({
            partIndex: item.partIndex ?? null,
            partSourceRecordID: item.partSourceRecordID ?? null,
            reason: item.reason ?? null
        }))
    };
}

function SummarizeHairConsumer(value)
{
    return {
        meshName: value?.meshName ?? null,
        areaField: value?.areaField ?? null,
        areaName: value?.areaName ?? null,
        display: value?.display ?? null,
        effectName: value?.effectName ?? null,
        effectPath: value?.effectPath ?? null,
        targetRole: value?.targetRole ?? null,
        reason: value?.reason ?? null,
        authoredRegion: value?.authoredRegion
            ? [ ...value.authoredRegion ]
            : null
    };
}

function SummarizeBodyMaterialTarget(value)
{
    if (!value) return null;
    return {
        status: value.status ?? null,
        reason: value.reason ?? null,
        diagnosticMode: value.diagnosticMode ?? null,
        operationCount: value.operationCount ?? null,
        passes: (value.passes ?? []).map(pass => ({
            mode: pass.mode ?? null,
            path: pass.path ?? null,
            role: pass.role ?? null,
            target: pass.target ?? null,
            groupID: pass.groupID ?? null,
            placement: pass.placement ? [ ...pass.placement ] : null
        })),
        deferred: (value.deferred ?? []).map(SummarizeDeferredChannel)
    };
}

function SummarizeDeferredChannel(value)
{
    return {
        layerIndex: value?.layerIndex ?? null,
        groupID: value?.groupID ?? null,
        role: value?.role ?? null,
        path: value?.path ?? null,
        reason: value?.reason ?? null
    };
}
