import {Tw2BaseClass} from "../global";

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
            clear: ["Tw2Effect"],
            emit: ["Tw2Effect"],
            render: ["Tw2Effect"],
            setDrawParameters: ["Tw2Effect"],
            setSortParameters: ["Tw2Effect"],
            sort: ["Tw2Effect"],
            sortInner: ["Tw2Effect"],
            sortStep: ["Tw2Effect"],
            update: ["Tw2Effect"]
        },
        notImplemented: ["*"]
    };
});

