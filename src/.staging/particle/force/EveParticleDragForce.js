import {Tw2StagingClass} from "../../class";

/**
 * EveParticleDragForce
 * @implements ParticleForce
 *
 * @parameter {Number} drag -
 */
export default class EveParticleDragForce extends Tw2StagingClass
{

    drag = 0;

}

Tw2StagingClass.define(EveParticleDragForce, Type =>
{
    return {
        type: "EveParticleDragForce",
        category: "ParticleForce",
        props: {
            drag: Type.NUMBER
        }
    };
});

