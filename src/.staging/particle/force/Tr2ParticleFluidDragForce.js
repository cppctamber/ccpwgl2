import {Tw2BaseClass} from "../../../global";

/**
 * Tr2ParticleFluidDragForce
 * @implements ParticleForce
 *
 * @property {Number} drag -
 */
export default class Tr2ParticleFluidDragForce extends Tw2BaseClass
{

    drag = 0;

}

Tw2BaseClass.define(Tr2ParticleFluidDragForce, Type =>
{
    return {
        isStaging: true,
        type: "Tr2ParticleFluidDragForce",
        category: "ParticleForce",
        props: {
            drag: Type.NUMBER
        }
    };
});

