/**
 * Serializes appearance realization and publishes only complete staged
 * revisions. A renderer-specific adapter owns resource and GPU work.
 */
export class TnyCharacterRenderer
{
    _adapter;

    _committed = null;

    _committedConstruction = null;

    _requestedRevision = 0;

    _tail = Promise.resolve();

    _lastResult = null;

    constructor({
        adapter = null,
        backend = "legacy-opengl",
        maximumBones = 58,
        requiredBones = 69
    } = {})
    {
        if (adapter !== null && typeof adapter?.Prepare !== "function")
        {
            throw new TypeError("Character renderer adapter must expose Prepare(plan, context)");
        }

        this._adapter = adapter;
        this.backend = String(backend);
        this.maximumBones = RequirePositiveInteger(maximumBones, "maximumBones");
        this.requiredBones = RequirePositiveInteger(requiredBones, "requiredBones");
    }

    /** Describes the active temporary shader capability without hiding gaps. */
    GetCapabilities()
    {
        return {
            backend: this.backend,
            maximumBones: this.maximumBones,
            requiredBones: this.requiredBones,
            completeBonePalette: this.maximumBones >= this.requiredBones,
            adapterConnected: this._adapter !== null
        };
    }

    /** Returns the capability contract and the latest realization outcome. */
    GetState()
    {
        return {
            ...this.GetCapabilities(),
            lastResult: this._lastResult ? { ...this._lastResult } : null
        };
    }

    /** Toggles one committed configured part for controlled demo comparisons. */
    SetConfiguredPartDisplay(partSourceRecordID, display)
    {
        if (!this._committed)
        {
            throw new Error("Character renderer has no committed appearance");
        }
        if (typeof this._adapter?.SetConfiguredPartDisplay !== "function")
        {
            throw new Error("Character renderer adapter cannot isolate configured parts");
        }
        const result = this._adapter.SetConfiguredPartDisplay(
            this._committed,
            partSourceRecordID,
            display
        );
        if (this._lastResult?.status === "committed"
            && typeof this._adapter.GetDiagnostics === "function")
        {
            this._lastResult.details = this._adapter.GetDiagnostics(this._committed);
        }
        return result;
    }

    /** Toggles one committed foundation role for controlled demo comparisons. */
    SetFoundationDisplay(role, display)
    {
        if (!this._committed)
        {
            throw new Error("Character renderer has no committed appearance");
        }
        if (typeof this._adapter?.SetFoundationDisplay !== "function")
        {
            throw new Error("Character renderer adapter cannot isolate foundations");
        }
        const result = this._adapter.SetFoundationDisplay(this._committed, role, display);
        if (this._lastResult?.status === "committed"
            && typeof this._adapter.GetDiagnostics === "function")
        {
            this._lastResult.details = this._adapter.GetDiagnostics(this._committed);
        }
        return result;
    }

    /** Queues one plan and rejects stale prepared work before it can commit. */
    ApplyConstruction(construction, options = {})
    {
        if (!construction
            || typeof construction !== "object"
            || !Array.isArray(construction.operations))
        {
            return Promise.reject(new TypeError("Character renderer requires a construction sequence"));
        }

        const requestRevision = ++this._requestedRevision;
        const operation = this._tail.then(() => this._Apply(
            construction,
            requestRevision,
            options
        ));
        this._tail = operation.catch(() => undefined);
        return operation.then(result =>
        {
            this._lastResult = result;
            return result;
        });
    }

    /**
     * Fully releases the committed appearance before a non-atomic replacement.
     * This is useful for disposal and controlled audit harnesses; interactive
     * renderers should normally retain the previous revision until commit.
     */
    ReleaseCommitted({ reason = "released", source = this } = {})
    {
        const revision = ++this._requestedRevision;
        const operation = this._tail.then(async () =>
        {
            const committed = this._committed;
            this._committed = null;
            this._committedConstruction = null;
            if (committed)
            {
                await this._Release(committed, { reason, revision, source });
            }
            const result = { status: "released", revision };
            this._lastResult = result;
            return result;
        });
        this._tail = operation.catch(() => undefined);
        return operation;
    }

    async _Apply(construction, requestRevision, options)
    {
        if (!this._adapter)
        {
            return {
                status: "deferred",
                reason: "adapter-not-configured",
                revision: requestRevision,
                capabilities: this.GetCapabilities()
            };
        }

        const constructionState = DescribeConstruction(construction);
        const changeSet = CompareConstructionStates(
            this._committedConstruction,
            constructionState
        );
        const context = {
            revision: requestRevision,
            appearancePlan: options.appearancePlan ?? null,
            source: options.source ?? this,
            appearanceChange: changeSet
        };

        // A completed stage is immutable after publication. Reusing that exact
        // construction avoids both composition work and mutable graph sharing;
        // changed stages still rebuild privately until domain-owned leases exist.
        if (this._committed
            && requestRevision === this._requestedRevision
            && changeSet.identical)
        {
            const result = {
                status: "committed",
                revision: requestRevision,
                reused: true,
                reuseRule: "identical-construction",
                appearanceChange: changeSet
            };
            if (typeof this._adapter.GetDiagnostics === "function")
            {
                result.details = this._adapter.GetDiagnostics(this._committed);
            }
            return result;
        }

        const staged = await this._adapter.Prepare(construction, context);

        if (requestRevision !== this._requestedRevision)
        {
            await this._Release(staged, { ...context, reason: "stale" });
            return { status: "stale", revision: requestRevision };
        }

        const previous = this._committed;

        try
        {
            if (typeof this._adapter.Commit !== "function")
            {
                throw new TypeError("Character renderer adapter must expose Commit(staged, context)");
            }

            if (previous && typeof this._adapter.Handoff === "function")
            {
                await this._adapter.Handoff(previous, staged, context);
            }
            else
            {
                await this._adapter.Commit(staged, context);
            }
            this._committed = staged;
            this._committedConstruction = constructionState;
        }
        catch (error)
        {
            await this._Release(staged, { ...context, reason: "commit-failed" });
            throw error;
        }

        if (previous && previous !== staged)
        {
            await this._Release(previous, { ...context, reason: "replaced" });
        }

        const result = {
            status: "committed",
            revision: requestRevision
        };

        if (typeof this._adapter.GetDiagnostics === "function")
        {
            result.details = this._adapter.GetDiagnostics(staged);
        }

        return result;
    }

    async _Release(value, context)
    {
        if (value && typeof this._adapter?.Release === "function")
        {
            await this._adapter.Release(value, context);
        }
    }
}

const CONSTRUCTION_DOMAIN_NAMES = Object.freeze([
    "foundation",
    "geometry",
    "bodyComposition",
    "headComposition",
    "privateComposition",
    "morphs",
    "coverage"
]);

function DescribeConstruction(construction)
{
    const contributions = Array.isArray(construction.textureContributions)
        ? construction.textureContributions
        : [];
    const bodyContributions = [];
    const headContributions = [];
    const privateContributions = [];

    for (const contribution of contributions)
    {
        const targets = CollectContributionTargets(contribution);
        const unresolved = targets.size === 0;
        if (unresolved || targets.has("body")) bodyContributions.push(contribution);
        if (unresolved || targets.has("head")) headContributions.push(contribution);
        if (unresolved || [ ...targets ].some(value => ![ "body", "head" ].includes(value)))
        {
            privateContributions.push(contribution);
        }
    }

    const operations = Array.isArray(construction.operations)
        ? construction.operations
        : [];
    const foundation = {};
    for (const key of Object.keys(construction))
    {
        if ([
            "operations",
            "textureContributions",
            "morphTargets",
            "evidence",
            "resolvedPartCount",
            "configuredPartCount",
            "deferredContributionCount"
        ].includes(key)) continue;
        foundation[key] = construction[key];
    }

    const domains = {
        foundation: StableSignature({
            foundation,
            operations: operations.filter(value => value?.operation !== "configured-part"
                && value?.operation !== "deferred-contribution")
        }),
        geometry: StableSignature(operations.map(value =>
        {
            if (!value || typeof value !== "object") return value;
            const { foundationCoverage: omitted, ...operation } = value;
            return operation;
        })),
        bodyComposition: StableSignature(bodyContributions),
        headComposition: StableSignature(headContributions),
        privateComposition: StableSignature(privateContributions),
        morphs: StableSignature(construction.morphTargets ?? []),
        coverage: StableSignature(operations.map(value => value?.foundationCoverage ?? null))
    };

    return {
        signature: StableSignature(construction),
        domains
    };
}

function CompareConstructionStates(previous, next)
{
    if (!previous)
    {
        return {
            identical: false,
            initial: true,
            dirtyDomains: [ ...CONSTRUCTION_DOMAIN_NAMES ]
        };
    }

    const dirtyDomains = CONSTRUCTION_DOMAIN_NAMES.filter(
        name => previous.domains[name] !== next.domains[name]
    );
    const identical = previous.signature !== null
        && previous.signature === next.signature;

    return {
        identical,
        initial: false,
        dirtyDomains: identical ? [] : dirtyDomains.length
            ? dirtyDomains
            : [ "construction" ]
    };
}

function CollectContributionTargets(value, targets = new Set())
{
    if (!value || typeof value !== "object") return targets;
    if (Array.isArray(value))
    {
        for (const item of value) CollectContributionTargets(item, targets);
        return targets;
    }
    for (const [ key, item ] of Object.entries(value))
    {
        if (key === "target" && typeof item === "string" && item.trim())
        {
            targets.add(item.trim().toLowerCase());
        }
        else
        {
            CollectContributionTargets(item, targets);
        }
    }
    return targets;
}

function StableSignature(value)
{
    try
    {
        return JSON.stringify(NormalizeSignatureValue(value, new Set()));
    }
    catch
    {
        return null;
    }
}

function NormalizeSignatureValue(value, active)
{
    if (value === null || typeof value === "string" || typeof value === "boolean")
    {
        return value;
    }
    if (typeof value === "number")
    {
        return Number.isFinite(value) ? value : { $number: String(value) };
    }
    if (typeof value === "undefined") return { $undefined: true };
    if (typeof value !== "object") throw new TypeError("Unsupported construction value");
    if (active.has(value)) throw new TypeError("Cyclic construction value");

    active.add(value);
    let result;
    if (Array.isArray(value))
    {
        result = value.map(item => NormalizeSignatureValue(item, active));
    }
    else
    {
        result = {};
        for (const key of Object.keys(value).sort())
        {
            result[key] = NormalizeSignatureValue(value[key], active);
        }
    }
    active.delete(value);
    return result;
}

function RequirePositiveInteger(value, label)
{
    const result = Number(value);

    if (!Number.isSafeInteger(result) || result <= 0)
    {
        throw new TypeError(`Character renderer ${label} must be a positive integer`);
    }

    return result;
}
