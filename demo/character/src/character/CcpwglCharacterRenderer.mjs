/**
 * Serializes appearance realization and publishes only complete staged
 * revisions. A renderer-specific adapter owns resource and GPU work.
 */
export class CcpwglCharacterRenderer
{
    #adapter;

    #committed = null;

    #requestedRevision = 0;

    #tail = Promise.resolve();

    #lastResult = null;

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

        this.#adapter = adapter;
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
            adapterConnected: this.#adapter !== null
        };
    }

    /** Returns the capability contract and the latest realization outcome. */
    GetState()
    {
        return {
            ...this.GetCapabilities(),
            lastResult: this.#lastResult ? { ...this.#lastResult } : null
        };
    }

    /** Toggles one committed configured part for controlled demo comparisons. */
    SetConfiguredPartDisplay(partSourceRecordID, display)
    {
        if (!this.#committed)
        {
            throw new Error("Character renderer has no committed appearance");
        }
        if (typeof this.#adapter?.SetConfiguredPartDisplay !== "function")
        {
            throw new Error("Character renderer adapter cannot isolate configured parts");
        }
        const result = this.#adapter.SetConfiguredPartDisplay(
            this.#committed,
            partSourceRecordID,
            display
        );
        if (this.#lastResult?.status === "committed"
            && typeof this.#adapter.GetDiagnostics === "function")
        {
            this.#lastResult.details = this.#adapter.GetDiagnostics(this.#committed);
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

        const requestRevision = ++this.#requestedRevision;
        const operation = this.#tail.then(() => this.#Apply(
            construction,
            requestRevision,
            options
        ));
        this.#tail = operation.catch(() => undefined);
        return operation.then(result =>
        {
            this.#lastResult = result;
            return result;
        });
    }

    async #Apply(construction, requestRevision, options)
    {
        if (!this.#adapter)
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
        const staged = await this.#adapter.Prepare(construction, context);

        if (requestRevision !== this.#requestedRevision)
        {
            await this.#Release(staged, { ...context, reason: "stale" });
            return { status: "stale", revision: requestRevision };
        }

        const previous = this.#committed;

        try
        {
            if (typeof this.#adapter.Commit !== "function")
            {
                throw new TypeError("Character renderer adapter must expose Commit(staged, context)");
            }

            await this.#adapter.Commit(staged, context);
            this.#committed = staged;
        }
        catch (error)
        {
            await this.#Release(staged, { ...context, reason: "commit-failed" });
            throw error;
        }

        if (previous && previous !== staged)
        {
            await this.#Release(previous, { ...context, reason: "replaced" });
        }

        const result = {
            status: "committed",
            revision: requestRevision
        };

        if (typeof this.#adapter.GetDiagnostics === "function")
        {
            result.details = this.#adapter.GetDiagnostics(staged);
        }

        return result;
    }

    async #Release(value, context)
    {
        if (value && typeof this.#adapter?.Release === "function")
        {
            await this.#adapter.Release(value, context);
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

export default CcpwglCharacterRenderer;
