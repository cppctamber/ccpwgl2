import { meta } from "utils";


@meta.notImplemented
@meta.type("Tr2GpuParticleSystem")
@meta.ccp.define("Tr2GpuParticleSystem")
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
    }

    Emit()
    {
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
