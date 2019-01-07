import {Tw2StagingClass} from "../../class";

/**
 * Tw2ParticleDragForce
 * @ccp Tr2ParticleDragForce
 * @implements ParticleForce
 *
 * @parameter {Number} drag -
 */
export default class Tw2ParticleDragForce extends Tw2StagingClass
{

    drag = 0;

}

Tw2StagingClass.define(Tw2ParticleDragForce, Type =>
{
    return {
        type: "Tw2ParticleDragForce",
        category: "ParticleForce",
        props: {
            drag: Type.NUMBER
        }
    };
});

