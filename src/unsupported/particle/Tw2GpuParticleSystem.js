import { meta } from "utils";


@meta.notImplemented
@meta.define("Tr2GpuParticleSystem", true)
export class Tr2GpuParticleSystem
{

    @meta.struct("Tw2Effect")
    clear = null;

    @meta.struct("Tw2Effect")
    emit = null;

    @meta.struct("Tw2Effect")
    render = null;

    @meta.struct("Tw2Effect")
    setDrawParameters = null;

    @meta.struct("Tw2Effect")
    setSortParameters = null;

    @meta.struct("Tw2Effect")
    sort = null;

    @meta.struct("Tw2Effect")
    sortInner = null;

    @meta.struct("Tw2Effect")
    sortStep = null;

    @meta.struct("Tw2Effect")
    update = null;

    @meta.uint
    maxParticles = 1048576;

    @meta.private
    @meta.boolean
    enableEmit = true;

    @meta.private
    @meta.boolean
    enableUpdate = true;

    @meta.private
    @meta.boolean
    enableSort = true;

    @meta.private
    @meta.boolean
    display = true;

    @meta.private
    @meta.boolean
    updateVisibleCount = false;

    @meta.private
    @meta.uint
    visibleCount = 0;

    /**
     * Batches taken from emitters this frame, awaiting the compute dispatch
     * that does not exist yet.
     * @type {Array<Object>}
     */
    _emitRequests = [];

    InitializeBuffers()
    {
    }

    RegisterVariables()
    {
    }

    Initialize()
    {
        this.InitializeBuffers();
        this.RegisterVariables();
        this.SetMaxParticles(this.maxParticles);
        return true;
    }

    SetMaxParticles(maxParticles)
    {
        this.maxParticles = maxParticles;
        this.Clear();
    }

    OnPrepareResources()
    {
        return true;
    }

    OnModified()
    {
        return true;
    }

    SetVariableStore()
    {
    }

    Update()
    {
    }

    UpdateLiveCount()
    {
    }

    DoClear()
    {
        this.Clear();
        return true;
    }

    RunSimulation()
    {
    }

    ExpireEmitterParams()
    {
    }

    UpdateEmitterParams()
    {
    }

    UpdateGpuEmitterParams()
    {
    }

    EmitParticles()
    {
    }

    Sort()
    {
    }

    SortIncremental()
    {
        return false;
    }

    Render()
    {
    }

    SubmitGeometry()
    {
    }

    ReleaseResources()
    {
    }

    Clear()
    {
        this.visibleCount = 0;

        // Pending batches go with the particles. Keeping them would emit, on
        // the next frame, a burst that was accounted for against a pool that no
        // longer exists.
        this._emitRequests.length = 0;
    }

    /**
     * Takes one batch of particles from an emitter.
     *
     * Ported from Tr2GpuParticleSystem.cpp:716-730. This is the CPU half and it
     * is complete: a request is recorded, and the compute dispatch that consumes
     * it is not written yet - see the class header. So an emitter can be driven,
     * and what it asked for can be inspected, without a device.
     *
     * @param {Object} emitter - the CPU-side emitter struct
     * @param {Number} id - the emitter's id; the unique bit says which kind
     * @param {Number} hash - the params hash, which is what pools them
     * @param {Object} params - the persistent parameters
     * @returns {?Object} the recorded request, or null if emission is off
     */
    Emit(emitter, id, hash, params)
    {
        if (!this.enableEmit) return null;

        // COPIED, vectors and all. The emitter fills one scratch struct and
        // reuses it for every batch, so a shallow copy would leave every
        // request in the frame pointing at the same vectors - and they would
        // all read as whatever the last batch wrote.
        const request = {
            emitter: CopyStruct(emitter),
            id,
            hash,
            params: CopyStruct(params)
        };

        // Clamped to the whole system's capacity, not to what is free. Carbon
        // clamps the same way: a single emitter cannot ask for more than the
        // system could ever hold, and what happens when the pool is already
        // full is the update stage's problem rather than the emitter's.
        request.emitter.count = Math.min(emitter.count, this.maxParticles);

        // A per batch seed, shifted into the high bits so the low bits are left
        // for the particle index the shader adds (Tr2GpuParticleSystem.cpp:725).
        request.emitter.emitterSeed = (Math.floor(Math.random() * 0x10000) << 16) >>> 0;

        this._emitRequests.push(request);
        return request;
    }

    /**
     * The batches taken this frame and not yet dispatched.
     * @returns {Array<Object>}
     */
    GetEmitRequests()
    {
        return this._emitRequests;
    }

    HasParticles()
    {
        return false;
    }

    GetEmitTime()
    {
        return 0;
    }

    GetUpdateTime()
    {
        return 0;
    }

    GetSortTime()
    {
        return 0;
    }

    GetRenderTime()
    {
        return 0;
    }


    /**
     * Gets object resources
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2Resource>} [out]
     */
    GetResources(out = [])
    {
        if (this.clear) this.clear.GetResources(out);
        if (this.emit) this.emit.GetResources(out);
        if (this.render) this.render.GetResources(out);
        if (this.setDrawParameters) this.setDrawParameters.GetResources(out);
        if (this.setSortParameters) this.setSortParameters.GetResources(out);
        if (this.sort) this.sort.GetResources(out);
        if (this.sortInner) this.sortInner.GetResources(out);
        if (this.sortStep) this.sortStep.GetResources(out);
        if (this.update) this.update.GetResources(out);
        return out;
    }

}


/**
 * Copies a plain struct, taking its typed arrays by VALUE.
 *
 * The particle structs are flat: numbers, typed-array vectors, and one array of
 * vectors for the colours. Nothing nested beyond that, so this does not need to
 * be general - and a general deep clone would be slower and would quietly
 * accept shapes this should reject.
 *
 * @param {Object} src
 * @returns {Object}
 */
function CopyStruct(src)
{
    const out = {};

    for (const key in src)
    {
        const value = src[key];

        if (ArrayBuffer.isView(value))
        {
            out[key] = value.slice();
        }
        else if (Array.isArray(value))
        {
            out[key] = value.map(v => (ArrayBuffer.isView(v) ? v.slice() : v));
        }
        else
        {
            out[key] = value;
        }
    }

    return out;
}
