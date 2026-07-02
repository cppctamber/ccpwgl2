import { tw2 } from "global";
import { tw2BatchSorter } from "./Tw2BatchSorter";
import { Tw2RenderBatchAccumulator } from "./Tw2RenderBatchAccumulator";

/** @typedef {Object} Tw2RenderBatchContextPerObjectDataWriter */

const identityWriter = {
    name: "identity",
    CanWrite: () => true,
    ResolvePerObjectData: (batch) => batch.perObjectData
};


/**
 * Opt-in Carbon-shaped batch context.
 * It can collect legacy batches today while carrying enough metadata for later
 * per-object-data writers.
 */
export class Tw2RenderBatchContext
{

    accumulators = new Map();
    sorting = null;

    _current = null;
    _writers = null;
    _report = null;

    /**
     * Constructor
     * @param {Object} [opt]
     * @param {?Function} [opt.sorting]
     */
    constructor(opt = {})
    {
        this.sorting = opt.sorting === undefined ? tw2.renderBatchSorter : opt.sorting;
        this._writers = [ identityWriter ];
        this.ResetReport();
    }

    /**
     * Gets the total batch count
     * @returns {Number}
     */
    get length()
    {
        let count = 0;
        this.accumulators.forEach(accumulator => count += accumulator.length);
        return count;
    }

    /**
     * Resets debug counters
     */
    ResetReport()
    {
        this._report = {
            allocations: 0,
            batches: 0,
            byMode: {},
            rendered: 0,
            legacyPerObjectData: 0,
            adapterPerObjectData: 0,
            fallbackObjects: 0,
            carbonObjects: 0,
            writers: this._writers ? this._writers.length : 1
        };
    }

    /**
     * Gets a debug report
     * @returns {Object}
     */
    GetReport()
    {
        return {
            ...this._report,
            byMode: { ...this._report.byMode },
            accumulators: this.accumulators.size,
            length: this.length
        };
    }

    /**
     * Gets an accumulator for a render mode
     * @param {Number} mode
     * @returns {Tw2RenderBatchAccumulator}
     */
    GetAccumulator(mode)
    {
        if (!this.accumulators.has(mode))
        {
            this.accumulators.set(mode, new Tw2RenderBatchAccumulator(this, mode, this.sorting));
        }
        return this.accumulators.get(mode);
    }

    /**
     * Normalizes collection options
     * @param {Object|String} [options]
     * @returns {Object}
     */
    NormalizeOptions(options = {})
    {
        if (typeof options === "string")
        {
            return {
                techniqueFilter: options,
                techniqueOverride: options
            };
        }
        return options || {};
    }

    /**
     * Allocates from the current collection accumulator
     * @param {Function|Number} [Type]
     * @param {...*} args
     * @returns {*}
     */
    Allocate(Type, ...args)
    {
        const mode = this._current ? this._current.mode : 0;
        return this.GetAccumulator(mode).Allocate(Type, ...args);
    }

    /**
     * Adds a per-object data writer
     * @param {Tw2RenderBatchContextPerObjectDataWriter} writer
     * @returns {Boolean}
     */
    AddWriter(writer)
    {
        if (!writer || this._writers.includes(writer)) return false;
        this._writers.splice(0, 0, writer);
        this._report.writers = this._writers.length;
        return true;
    }

    /**
     * Removes a per-object data writer
     * @param {Tw2RenderBatchContextPerObjectDataWriter} writer
     * @returns {Boolean}
     */
    RemoveWriter(writer)
    {
        const index = this._writers.indexOf(writer);
        if (index === -1) return false;
        this._writers.splice(index, 1);
        if (!this._writers.length) this._writers = [ identityWriter ];
        this._report.writers = this._writers.length;
        return true;
    }

    /**
     * Gets available writers
     * @returns {Array<Tw2RenderBatchContextPerObjectDataWriter>}
     */
    GetWriters()
    {
        return this._writers.slice();
    }

    /**
     * Returns the first writer that can handle the batch
     * @param {Tw2RenderBatch} batch
     * @returns {Tw2RenderBatchContextPerObjectDataWriter}
     */
    GetWriterForBatch(batch, options = {})
    {
        for (let i = 0; i < this._writers.length; i++)
        {
            if (!this._writers[i] || typeof this._writers[i].CanWrite !== "function") continue;
            if (this._writers[i].CanWrite(batch, options, this))
            {
                return this._writers[i];
            }
        }

        return identityWriter;
    }

    /**
     * Commits a batch to the batch's render mode or the current collection mode
     * @param {Tw2RenderBatch} batch
     */
    Commit(batch)
    {
        if (!batch) return;
        const mode = batch.renderMode !== undefined && batch.renderMode !== null
            ? batch.renderMode
            : (this._current ? this._current.mode : 0);

        this.GetAccumulator(mode).Commit(batch);
    }

    /**
     * Gets render packet
     * @param {*} object
     * @param {Number} mode
     * @param {Object} options
     * @returns {Object}
     */
    GetRenderPacket(object, mode, options = {})
    {
        const
            parentPacket = options.parentPacket !== undefined
                ? options.parentPacket
                : this.GetCurrentRenderPacket(),
            packet = {
                object,
                root: options.root || (parentPacket && parentPacket.root) || object,
                source: options.source || object,
                parent: options.parent || (parentPacket && parentPacket.source) || null,
                parentPacket,
                parentPayload: options.parentPayload || (parentPacket && parentPacket.payload) || null,
                payload: null,
                mode,
                techniqueFilter: options.techniqueFilter,
                techniqueOverride: options.techniqueOverride,
                renderReason: options.renderReason,
                renderPacket: options.renderPacket,
                accumulator: options.accumulator
            };

        packet.payload = options.payload !== undefined
            ? options.payload
            : this.GetObjectRenderPayload(object, mode, { ...options, packet, parentPacket });

        return packet;
    }

    /**
     * Gets the current render packet
     * @returns {?Object}
     */
    GetCurrentRenderPacket()
    {
        return this._current && this._current.renderPacket || null;
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
     * Gets an object's render payload
     * @param {*} object
     * @param {Number} mode
     * @param {Object} [context]
     * @returns {*}
     */
    GetObjectRenderPayload(object, mode, context = {})
    {
        if (!object || typeof object.GetRenderPayload !== "function")
        {
            return undefined;
        }

        return object.GetRenderPayload(mode, context);
    }

    /**
     * Gets per-object data for a render packet
     * @param {*} object
     * @param {Number} mode
     * @param {Object} context
     * @returns {*}
     */
    GetObjectPerObjectData(object, _mode, context = {})
    {
        if (typeof object.GetPerObjectData !== "function")
        {
            return undefined;
        }

        return object.GetPerObjectData(_mode, context);
    }

    /**
     * Collects batches from an object using legacy GetBatches
     * @param {*} object
     * @param {Number|Array<Number>} modes
     * @param {Object} [options]
     * @returns {Boolean}
     */
    CollectObjectBatches(object, modes, options = {})
    {
        options = this.NormalizeOptions(options);
        if (!object || typeof object.GetBatches !== "function") return false;

        const modeList = Array.isArray(modes) ? modes : [ modes ];
        let result = false;

        for (let i = 0; i < modeList.length; i++)
        {
            const mode = modeList[i];
            const accumulator = this.GetAccumulator(mode);
            const previous = this._current;
            const renderPacket = options.renderPacket || this.GetRenderPacket(object, mode, {
                ...options,
                accumulator
            });

            this._current = {
                root: options.root || object,
                source: options.source || object,
                mode,
                techniqueFilter: options.techniqueFilter,
                techniqueOverride: options.techniqueOverride,
                renderReason: options.renderReason,
                technique: options.technique,
                renderPacket,
                payload: renderPacket.payload
            };

            const perObjectData = this.GetObjectPerObjectData(object, mode, {
                packet: renderPacket,
                accumulator,
                options
            });
            renderPacket.objectData = perObjectData;

            const before = accumulator.length;

            if (typeof object.GetBatchesForMode === "function")
            {
                this._report.carbonObjects++;
                object.GetBatchesForMode(mode, accumulator, perObjectData, options.renderReason, renderPacket);
            }
            else
            {
                this._report.fallbackObjects++;
                object.GetBatches(mode, accumulator, perObjectData);
            }

            if (accumulator.length !== before) result = true;

            this._current = previous;
        }
        return result;
    }

    /**
     * Tests whether a batch should be committed based on context filters
     * @param {Tw2RenderBatch} batch
     * @param {Tw2RenderBatchAccumulator} accumulator
     * @returns {Boolean}
     */
    ShouldCommitBatch(batch, accumulator)
    {
        const current = this._current;
        const filter = current && current.techniqueFilter !== undefined ? current.techniqueFilter : current && current.technique;
        if (filter === undefined || filter === null)
        {
            return true;
        }

        if (typeof batch.HasTechnique !== "function")
        {
            return false;
        }

        if (Array.isArray(filter))
        {
            for (let i = 0; i < filter.length; i++)
            {
                if (batch.HasTechnique(filter[i]))
                {
                    return true;
                }
            }
            return false;
        }

        return batch.HasTechnique(filter);
    }

    /**
     * Collects batches from an array of objects
     * @param {Array<*>} objects
     * @param {Number|Array<Number>} modes
     * @param {Object} [options]
     * @returns {Boolean}
     */
    CollectObjectArrayBatches(objects, modes, options = {})
    {
        options = this.NormalizeOptions(options);
        let result = false;
        for (let i = 0; i < objects.length; i++)
        {
            if (this.CollectObjectBatches(objects[i], modes, options))
            {
                result = true;
            }
        }
        return result;
    }

    /**
     * Annotates a legacy batch with collection context
     * @param {Tw2RenderBatch} batch
     * @param {Tw2RenderBatchAccumulator} accumulator
     */
    AnnotateBatch(batch, accumulator)
    {
        const current = this._current;
        if (!current) return;

        if (batch.renderMode === undefined || batch.renderMode === null)
        {
            batch.renderMode = accumulator.mode;
        }

        if (batch.root === undefined) batch.root = current.root;
        if (batch.source === undefined) batch.source = current.source;
        if (batch.collectionMode === undefined) batch.collectionMode = current.mode;
        if (batch.renderReason === undefined) batch.renderReason = current.renderReason;
        if (batch.techniqueFilter === undefined) batch.techniqueFilter = current.techniqueFilter;
        if (batch._techniqueOverride === undefined && current.techniqueOverride !== undefined)
        {
            batch._techniqueOverride = current.techniqueOverride;
        }
        if (batch.renderPacket === undefined) batch.renderPacket = current.renderPacket;
        if (batch.renderPayload === undefined && current.renderPacket)
        {
            batch.renderPayload = current.renderPacket.payload;
        }
        if (batch.parentPacket === undefined && current.renderPacket)
        {
            batch.parentPacket = current.renderPacket.parentPacket;
        }
    }

    /**
     * Records a committed batch
     * @param {Tw2RenderBatch} batch
     */
    OnBatchCommitted(batch)
    {
        const mode = batch.renderMode;
        this._report.batches++;
        this._report.byMode[mode] = (this._report.byMode[mode] || 0) + 1;
    }

    /**
     * Resolves per-object data for a batch
     * @param {Tw2RenderBatch} batch
     * @returns {*}
     */
    ResolvePerObjectData(batch, options = {})
    {
        if (batch && batch.perObjectData)
        {
            this._report.legacyPerObjectData++;
            return batch.perObjectData;
        }

        const writer = this.GetWriterForBatch(batch, options);
        const contextData = batch.renderPacket && typeof batch.renderPacket === "object" ? batch.renderPacket : null;
        const writerOptions = { ...options, ...contextData };

        if (writer && typeof writer.ResolvePerObjectData === "function" && writer !== identityWriter)
        {
            const resolved = writer.ResolvePerObjectData(batch, contextData, writerOptions, this);
            if (resolved !== undefined && resolved !== null)
            {
                this._report.adapterPerObjectData++;
                return resolved;
            }
        }
        this._report.legacyPerObjectData++;
        return batch.perObjectData;
    }

    /**
     * Records a rendered batch
     * @param {Tw2RenderBatch} batch
     * @param {*} rendered
     */
    OnBatchRendered(batch, rendered)
    {
        if (rendered !== false) this._report.rendered++;
    }

    /**
     * Finalizes all accumulators
     */
    Finalize()
    {
        this.accumulators.forEach(accumulator => accumulator.Finalize());
    }

    /**
     * Renders an accumulator by mode
     * @param {Number} mode
     * @param {String} [technique="Main"]
     */
    RenderMode(mode, technique = "Main")
    {
        const accumulator = this.accumulators.get(mode);
        if (accumulator) accumulator.Render(technique);
    }

    /**
     * Renders all accumulators
     * @param {String} [technique="Main"]
     */
    Render(technique = "Main")
    {
        this.GetRenderModes().forEach(mode => this.RenderMode(mode, technique));
    }

    /**
     * Gets render modes sorted by the configured batch sorter order
     * @returns {Array<Number>}
     */
    GetRenderModes()
    {
        const order = (this.sorting && this.sorting.SortOrder) || tw2BatchSorter.SortOrder;
        return Array.from(this.accumulators.keys()).sort((a, b) =>
        {
            const ao = order[a] === undefined ? a : order[a];
            const bo = order[b] === undefined ? b : order[b];
            return ao - bo;
        });
    }

    /**
     * Clears accumulators and debug counters
     */
    Clear()
    {
        this.accumulators.forEach(accumulator => accumulator.Clear());
        this.ResetReport();
    }

}
