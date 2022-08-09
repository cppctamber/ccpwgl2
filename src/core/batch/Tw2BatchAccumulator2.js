import { device } from "global";


export class Tw2BatchAccumulator2
{

    batches = [];

    _reroute = false;
    _reroutedBatches = [];
    _sortMethod = null;

    /**
     * Constructor
     * @param {?function} [sorting=null] - An optional function for sorting the collected render batches
     */
    constructor(sorting = null)
    {
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
     * Commits a batch
     * @param {Tw2BatchAccumulator|Tw2RenderBatch} batch
     */
    Commit(batch)
    {
        if (!this._reroute)
        {
            throw new ReferenceError("Tw2BatchAccumulator2.Commit cannot be called directly");
        }

        if (this._reroutedBatches.indexOf(batch) === -1)
        {
            this._reroutedBatches.push(batch);
        }
    }

    /**
     * Gets render batches from an array of objects
     * @param {Array<*>}arr
     * @param {Number} mode
     * @param {String} [techniqueOverride]
     * @returns {boolean}
     */
    GetObjectArrayBatches(arr, mode, techniqueOverride)
    {
        let hasBatches = false;
        for (let i = 0; i < arr.length; i++)
        {
            if (this.GetObjectBatches(arr[i], mode, techniqueOverride))
            {
                hasBatches = true;
            }
        }
        return hasBatches;
    }

    /**
     * Gets an object's renderable batches
     * @param {*} object
     * @param {Number} mode
     * @param {String} techniqueOverride
     * @returns {boolean} true if the object has renderable batches
     */
    GetObjectBatches(object, mode, techniqueOverride)
    {
        let hasBatches = false;
        this._reroutedBatches.splice(0);

        if (object && object.GetBatches)
        {
            this._rerouted = true;
            object.GetBatches(mode, this);
            this._rerouted = false;

            for (let i = 0; i < this._reroutedBatches.length; i++)
            {
                const batch = this._reroutedBatches[i];
                techniqueOverride = techniqueOverride || batch.techniqueOverride;
                if (techniqueOverride)
                {
                    if (!batch.HasTechnique(techniqueOverride))
                    {
                        this._reroutedBatches.splice(i, 0);
                        i--;
                        continue;
                    }
                    this._reroutedBatches[i].techniqueOverride = techniqueOverride;
                }
                batch.root = object;
                this.batches.push(batch);
                hasBatches = true;
            }
        }
        return hasBatches;
    }

    /**
     * Clears any accumulated render batches
     * @returns the emptied batches
     */
    Clear()
    {
        this._reroutedBatches.splice(0);
        return this.batches.splice(0);
    }

    /**
     * Renders the accumulated render batches
     * @param {String} [technique] - technique name
     * @param {Array<*>} [hasRenderedBatches=[]]
     * @returns {Array<*>} an array of objects that has rendered batches
     */
    Render(technique, hasRenderedBatches=[])
    {
        if (this._sortMethod)
        {
            this.batches.sort(this._sortMethod);
        }

        for (let i = 0; i < this.batches.length; ++i)
        {
            const batch = this.batches[i];
            if (batch.renderMode !== device.RM_ANY)
            {
                device.SetStandardStates(batch.renderMode);
            }

            device.perObjectData = batch.perObjectData;

            if (batch.Commit(technique) && batch.root)
            {
                if (hasRenderedBatches.indexOf(batch.root) === -1)
                {
                    hasRenderedBatches.push(batch.root);
                }
            }
        }

        return hasRenderedBatches;
    }

}
