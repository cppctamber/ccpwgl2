import {Tw2ParticleForce} from "./Tw2ParticleForce";

/**
 * EveParticleDragForce
 * Todo: Is this just a copy of Tw2ParticleDragForce?
 *
 * @property {Number} drag -
 */
export class EveParticleDragForce extends Tw2ParticleForce
{

    drag = 0;

}

Tw2ParticleForce.define(EveParticleDragForce, Type =>
{
    return {
        isStaging: true,
        type: "EveParticleDragForce",
        props: {
            drag: Type.NUMBER
        }
    };
});

