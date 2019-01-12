import {Tw2BaseClass} from "../../global";

/**
 * Tr2GpuParticleSystem
 * @implements ParticleSystem
 *
 * @property {Tr2Effect} clear             -
 * @property {Tr2Effect} emit              -
 * @property {Tr2Effect} render            -
 * @property {Tr2Effect} setDrawParameters -
 * @property {Tr2Effect} setSortParameters -
 * @property {Tr2Effect} sort              -
 * @property {Tr2Effect} sortInner         -
 * @property {Tr2Effect} sortStep          -
 * @property {Tr2Effect} update            -
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

