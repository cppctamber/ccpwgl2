import {Tw2StagingClass} from "../class";

/**
 * Tw2GpuParticleSystem
 * @ccp Tr2GpuParticleSystem
 * @implements ParticleSystem
 *
 * @parameter {Tw2Effect} clear             -
 * @parameter {Tw2Effect} emit              -
 * @parameter {Tw2Effect} render            -
 * @parameter {Tw2Effect} setDrawParameters -
 * @parameter {Tw2Effect} setSortParameters -
 * @parameter {Tw2Effect} sort              -
 * @parameter {Tw2Effect} sortInner         -
 * @parameter {Tw2Effect} sortStep          -
 * @parameter {Tw2Effect} update            -
 */
export default class Tw2GpuParticleSystem extends Tw2StagingClass
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

}

Tw2StagingClass.define(Tw2GpuParticleSystem, Type =>
{
    return {
        type: "Tw2GpuParticleSystem",
        category: "ParticleSystem",
        props: {
            clear: ["Tw2Effect"],
            emit: ["Tw2Effect"],
            render: ["Tw2Effect"],
            setDrawParameters: ["Tw2Effect"],
            setSortParameters: ["Tw2Effect"],
            sort: ["Tw2Effect"],
            sortInner: ["Tw2Effect"],
            sortStep: ["Tw2Effect"],
            update: ["Tw2Effect"]
        }
    };
});

