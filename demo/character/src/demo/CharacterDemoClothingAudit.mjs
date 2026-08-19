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
    sourceObserved = false
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
    const choices = catalog.slots
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
        sourceObserved: sourceObserved === true,
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
        sourceObserved === true
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
    return {
        ...choice,
        alpha: alphaText ? JSON.parse(alphaText) : null,
        outcome: renderer.status,
        choiceRealization: classifyClothingChoiceRealization(
            choice,
            realization,
            selection?.diagnostics
        ),
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
            role: value.role ?? null,
            strategy: value.strategy ?? null,
            status: value.status ?? null
        }))
    };
}

export function classifyClothingChoiceRealization(choice, realization, diagnostics = null)
{
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

    return { status: "unresolved" };
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
