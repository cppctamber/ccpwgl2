import {Tw2BaseClass} from "../../class";

/**
 * EveParticleDragForce
 * @implements ParticleForce
 *
 * @parameter {Number} drag -
 */
export default class EveParticleDragForce extends Tw2BaseClass
{

    drag = 0;

}

Tw2BaseClass.define(EveParticleDragForce, Type =>
{
    return {
        isStaging: true,
        type: "EveParticleDragForce",
        category: "ParticleForce",
        props: {
            drag: Type.NUMBER
        }
    };
});

