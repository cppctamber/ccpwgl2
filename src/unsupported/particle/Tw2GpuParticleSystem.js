import { meta } from "global";


@meta.notImplemented
@meta.type("Tr2GpuParticleSystem", true)
@meta.todo("Handle conflict with Tw2BaseClass.emit")
export class Tr2GpuParticleSystem
{

    @meta.black.objectOf("Tw2Effect")
    clear = null;

    @meta.black.objectOf("Tw2Effect")
    emit = null;

    @meta.black.objectOf("Tw2Effect")
    render = null;

    @meta.black.objectOf("Tw2Effect")
    setDrawParameters = null;

    @meta.black.objectOf("Tw2Effect")
    setSortParameters = null;

    @meta.black.objectOf("Tw2Effect")
    sort = null;

    @meta.black.objectOf("Tw2Effect")
    sortInner = null;

    @meta.black.objectOf("Tw2Effect")
    sortStep = null;

    @meta.black.objectOf("Tw2Effect")
    update = null;


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
