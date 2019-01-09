import {Tw2BaseClass} from "../class";

/**
 * Tr2GpuParticleSystem
 * @implements ParticleSystem
 *
 * @parameter {Tr2Effect} clear             -
 * @parameter {Tr2Effect} emit              -
 * @parameter {Tr2Effect} render            -
 * @parameter {Tr2Effect} setDrawParameters -
 * @parameter {Tr2Effect} setSortParameters -
 * @parameter {Tr2Effect} sort              -
 * @parameter {Tr2Effect} sortInner         -
 * @parameter {Tr2Effect} sortStep          -
 * @parameter {Tr2Effect} update            -
 */
export default class Tr2GpuParticleSystem extends Tw2BaseClass
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

Tw2BaseClass.define(Tr2GpuParticleSystem, Type =>
{
    return {
        isStaging: true,
        type: "Tr2GpuParticleSystem",
        category: "ParticleSystem",
        props: {
            clear: ["Tr2Effect"],
            emit: ["Tr2Effect"],
            render: ["Tr2Effect"],
            setDrawParameters: ["Tr2Effect"],
            setSortParameters: ["Tr2Effect"],
            sort: ["Tr2Effect"],
            sortInner: ["Tr2Effect"],
            sortStep: ["Tr2Effect"],
            update: ["Tr2Effect"]
        }
    };
});

