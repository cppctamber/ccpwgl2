import { Tw2BaseClass } from "../global";

/**
 * Tr2GpuParticleSystem
 * TODO: Implement
 * @ccp Tr2GpuParticleSystem
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
export class Tr2GpuParticleSystem extends Tw2BaseClass
{

    clear = null;
    emit = null;
    render = null;
    setDrawParameters = null;
    setSortParameters = null;
    sort = null;
    sortInner = null;
    sortStep = null;
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

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "clear", r.object ],
            [ "emit", r.object ],
            [ "render", r.object ],
            [ "setDrawParameters", r.object ],
            [ "setSortParameters", r.object ],
            [ "sort", r.object ],
            [ "sortInner", r.object ],
            [ "sortStep", r.object ],
            [ "update", r.object ],
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}
