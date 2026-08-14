/** Creates a small plain-value proof snapshot from one character session. */
export function createCharacterDiagnostics(character)
{
    const manager = character.GetLibraryManager();
    const library = manager.GetLibrary();
    const plan = character.GetAppearancePlan();
    const construction = character.GetConstructionSequence();
    const documents = {};

    for (const name of manager.ListDocuments())
    {
        documents[name] = manager.GetDocument(name)?.length ?? 0;
    }

    return {
        library: {
            schema: library.schema,
            schemaVersion: library.schemaVersion,
            sourceTarget: library.sourceTarget,
            sourceBuild: library.sourceBuild,
            documents
        },
        selection: {
            recordID: character.GetPaperdoll()?.recordID ?? null,
            revision: character.GetRevision()
        },
        plan: plan ? {
            selections: plan.selections.length,
            parts: plan.parts.length,
            layers: plan.layers.length,
            textures: plan.textures.length,
            coverages: plan.coverages.length,
            morphTargets: plan.morphTargets?.length ?? 0,
            targets: plan.targets.length,
            bindings: plan.bindings.length,
            diagnostics: plan.diagnostics.map(value => ({
                code: value.code,
                severity: value.severity,
                message: value.message
            }))
        } : null,
        construction: construction ? {
            backend: construction.backend,
            evidence: construction.evidence ? { ...construction.evidence } : null,
            paperdollRecordID: construction.paperdollRecordID,
            sourceBuild: construction.sourceBuild,
            sex: construction.sex,
            lod: construction.lod,
            resolvedPartCount: construction.resolvedPartCount ?? 0,
            configuredPartCount: construction.configuredPartCount ?? 0,
            deferredContributionCount: construction.deferredContributionCount ?? 0,
            textureContributionCount: construction.textureContributions?.length ?? 0,
            morphTargetCount: construction.morphTargets?.length ?? 0,
            morphTargets: construction.morphTargets?.map(value => ({
                modifierPath: value.modifierPath,
                targetName: value.targetName,
                weight: value.weight,
                ownerGroupID: value.ownerGroupID,
                evidence: value.evidence ? { ...value.evidence } : null
            })) ?? [],
            textureContributions: construction.textureContributions?.map(value => ({
                ...value,
                source: { ...value.source },
                materialValues: value.materialValues,
                textureCandidates: value.textureCandidates.map(candidate => ({ ...candidate })),
                selectedTextures: value.selectedTextures.map(texture => ({ ...texture })),
                diagnostics: value.diagnostics.map(diagnostic => ({ ...diagnostic })),
                evidence: { ...value.evidence }
            })) ?? [],
            operations: construction.operations.map(value => ({
                ...value,
                evidence: value.evidence ? { ...value.evidence } : undefined
            }))
        } : null,
        renderer: character.GetRenderer()?.GetState?.()
            ?? character.GetRenderer()?.GetCapabilities()
            ?? null
    };
}
