import { meta } from "utils";


@meta.notImplemented
@meta.ctor("Tr2GpuParticleSystem")
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


    /**
     * Gets object resources
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2Resource>} [out]
     */
    GetResources(out = [])
    {
        if (this.clear) this.clear.GetResources(out);
        if (this.EmitEvent) this.EmitEvent.GetResources(out);
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
