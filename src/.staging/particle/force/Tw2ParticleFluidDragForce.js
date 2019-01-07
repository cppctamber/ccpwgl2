import {Tw2StagingClass} from "../../class";

/**
 * Tw2ParticleFluidDragForce
 * @ccp Tr2ParticleFluidDragForce
 * @implements ParticleForce
 *
 * @parameter {Number} drag -
 */
export default class Tw2ParticleFluidDragForce extends Tw2StagingClass
{

    drag = 0;

}

Tw2StagingClass.define(Tw2ParticleFluidDragForce, Type =>
{
    return {
        type: "Tw2ParticleFluidDragForce",
        category: "ParticleForce",
        props: {
            drag: Type.NUMBER
        }
    };
});

