import { meta } from "global";


/**
 * Tr2GpuParticleSystem
 *
 * @property {Tw2Effect} clear             -
 * @property {Tw2Effect} emit              -
 * @property {Tw2Effect} render            -
 * @property {Tw2Effect} setDrawParameters -
 * @property {Tw2Effect} setSortParameters -
 * @property {Tw2Effect} sort              -
 * @property {Tw2Effect} sortInner         -
 * @property {Tw2Effect} sortStep          -
 * @property {Tw2Effect} update            -
 */
@meta.ccp("Tr2GpuParticleSystem")
@meta.notImplemented
export class Tr2GpuParticleSystem
{

    @meta.black.object
    clear = null;

    @meta.black.object
    @meta.todo("Handle conflict with Tw2BaseClass.emit")
    emit = null;

    @meta.black.object
    render = null;

    @meta.black.object
    setDrawParameters = null;

    @meta.black.object
    setSortParameters = null;

    @meta.black.object
    sort = null;

    @meta.black.object
    sortInner = null;

    @meta.black.object
    sortStep = null;

    @meta.black.object
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
