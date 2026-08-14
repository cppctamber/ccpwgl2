/**
 * Serializes appearance realization and publishes only complete staged
 * revisions. A renderer-specific adapter owns resource and GPU work.
 */
export class TnyCharacterRenderer
{
    _adapter;

    _committed = null;

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

        const context = {
            revision: requestRevision,
            appearancePlan: options.appearancePlan ?? null,
            source: options.source ?? this
        };
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

            await this._adapter.Commit(staged, context);
            this._committed = staged;
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

function RequirePositiveInteger(value, label)
{
    const result = Number(value);

    if (!Number.isSafeInteger(result) || result <= 0)
    {
        throw new TypeError(`Character renderer ${label} must be a positive integer`);
    }

    return result;
}
