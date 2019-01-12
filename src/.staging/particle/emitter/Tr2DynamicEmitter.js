import {Tw2BaseClass} from "../../../global";

/**
 * Tr2DynamicEmitter
 * @implements ParticleEmitter
 *
 * @property {Array.<ParticleAttributeGenerator>} generators -
 * @property {Number} maxParticles                           -
 * @property {Tr2ParticleSystem} particleSystem              -
 * @property {Number} rate                                   -
 */
export default class Tr2DynamicEmitter extends Tw2BaseClass
{

    generators = [];
    maxParticles = 0;
    particleSystem = null;
    rate = 0;

}

Tw2BaseClass.define(Tr2DynamicEmitter, Type =>
{
    return {
        isStaging: true,
        type: "Tr2DynamicEmitter",
        category: "ParticleEmitter",
        props: {
            generators: [["Tr2RandomIntegerAttributeGenerator", "Tr2RandomUniformAttributeGenerator", "Tr2SphereShapeAttributeGenerator"]],
            maxParticles: Type.NUMBER,
            particleSystem: ["Tr2ParticleSystem"],
            rate: Type.NUMBER
        }
    };
});

