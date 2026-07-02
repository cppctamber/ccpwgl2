import { device } from "global";


/**
 * Carbon-shaped render batch accumulator with a per-frame allocation lifetime.
 * This is intentionally opt-in and currently renders through legacy per-object data.
 */
export class Tw2RenderBatchAccumulator
{

    batches = [];
    committed = [];
    mode = null;
    context = null;

    _allocations = [];
    _finalized = false;
    _sortMethod = null;

    /**
     * Constructor
     * @param {Tw2RenderBatchContext} context
     * @param {Number} mode
     * @param {?Function} [sorting=null]
     */
    constructor(context, mode, sorting = null)
    {
        this.context = context;
        this.mode = mode;
        this._sortMethod = sorting;
    }

    /**
     * Gets the batch count
     * @returns {Number}
     */
    get length()
    {
        return this.batches.length;
    }

    /**
     * Allocates a temporary object for this accumulator lifetime
     * @param {Function|Number} [Type]
     * @param {...*} args
     * @returns {*}
     */
    Allocate(Type, ...args)
    {
        let item;
        if (typeof Type === "function")
        {
            item = new Type(...args);
        }
        else if (typeof Type === "number")
        {
            item = new ArrayBuffer(Type);
        }
        else
        {
            item = {};
        }

        this._allocations.push(item);
        if (this.context) this.context._report.allocations++;
        return item;
    }

    /**
     * Gets the current render packet
     * @returns {?Object}
     */
    GetCurrentRenderPacket()
    {
        return this.context && this.context.GetCurrentRenderPacket
            ? this.context.GetCurrentRenderPacket()
            : null;
    }

    /**
     * Gets the current render payload
     * @returns {?Object}
     */
    GetCurrentRenderPayload()
    {
        const packet = this.GetCurrentRenderPacket();
        return packet && packet.payload || null;
    }

    /**
     * Gets legacy per-object data from the current payload, when present.
     * This is a compatibility bridge for legacy GetBatches implementations.
     * @returns {*}
     */
    GetCurrentPerObjectData()
    {
        const payload = this.GetCurrentRenderPayload();
        return payload && (payload.legacyPerObjectData || payload.sourcePerObjectData) || null;
    }

    /**
     * Commits a render batch
     * @param {Tw2RenderBatch} batch
     */
    Commit(batch)
    {
        if (!batch) return;

        if (this.context && !this.context.ShouldCommitBatch(batch, this))
        {
            return;
        }

        if (this.context)
        {
            this.context.AnnotateBatch(batch, this);
        }

        if (!this.batches.includes(batch))
        {
            this.batches.push(batch);
            this._finalized = false;
            if (this.context) this.context.OnBatchCommitted(batch, this);
        }
    }

    /**
     * Finalizes and sorts the accumulator
     */
    Finalize()
    {
        if (this._finalized) return;
        if (this._sortMethod) this.batches.sort(this._sortMethod);
        this._finalized = true;
    }

    /**
     * Clears accumulated batches and temporary allocations
     * @returns {Array}
     */
    Clear()
    {
        this.committed.splice(0);
        this._allocations.splice(0);
        this._finalized = false;
        return this.batches.splice(0);
    }

    /**
     * Renders accumulated batches
     * @param {String} [technique="Main"]
     */
    Render(technique = "Main")
    {
        this.Finalize();
        this.committed.splice(0);

        for (let i = 0; i < this.batches.length; i++)
        {
            const batch = this.batches[i];

            if (batch.renderMode !== device.RM_ANY)
            {
                device.SetStandardStates(batch.renderMode);
            }

            device.perObjectData = this.context
                ? this.context.ResolvePerObjectData(batch, { accumulator: this, technique, renderMode: this.mode })
                : batch.perObjectData;

            const rendered = batch.Commit(batch._techniqueOverride || technique);
            this.committed.push([ batch, rendered ]);
            if (this.context) this.context.OnBatchRendered(batch, rendered, this);
        }
    }

}
