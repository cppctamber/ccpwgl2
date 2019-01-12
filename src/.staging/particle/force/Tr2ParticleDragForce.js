import {Tw2BaseClass} from "../../../global";

/**
 * Tr2ParticleDragForce
 * @implements ParticleForce
 *
 * @property {Number} drag -
 */
export default class Tr2ParticleDragForce extends Tw2BaseClass
{

    drag = 0;

}

Tw2BaseClass.define(Tr2ParticleDragForce, Type =>
{
    return {
        isStaging: true,
        type: "Tr2ParticleDragForce",
        category: "ParticleForce",
        props: {
            drag: Type.NUMBER
        }
    };
});

