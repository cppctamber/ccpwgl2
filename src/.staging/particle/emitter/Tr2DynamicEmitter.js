import {Tw2BaseClass} from "../../class";

/**
 * Tr2DynamicEmitter
 * @implements ParticleEmitter
 *
 * @parameter {Array.<ParticleAttributeGenerator>} generators -
 * @parameter {Number} maxParticles                           -
 * @parameter {Tr2ParticleSystem} particleSystem              -
 * @parameter {Number} rate                                   -
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

