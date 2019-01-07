import {Tw2StagingClass} from "../../class";

/**
 * Tw2DynamicEmitter
 * @ccp Tr2DynamicEmitter
 * @implements ParticleEmitter
 *
 * @parameter {Array.<ParticleAttributeGenerator>} generators -
 * @parameter {Number} maxParticles                           -
 * @parameter {Tw2ParticleSystem} particleSystem              -
 * @parameter {Number} rate                                   -
 */
export default class Tw2DynamicEmitter extends Tw2StagingClass
{

    generators = [];
    maxParticles = 0;
    particleSystem = null;
    rate = 0;

}

Tw2StagingClass.define(Tw2DynamicEmitter, Type =>
{
    return {
        type: "Tw2DynamicEmitter",
        category: "ParticleEmitter",
        props: {
            generators: [["Tw2RandomIntegerAttributeGenerator", "Tw2RandomUniformAttributeGenerator", "Tw2SphereShapeAttributeGenerator"]],
            maxParticles: Type.NUMBER,
            particleSystem: ["Tw2ParticleSystem"],
            rate: Type.NUMBER
        }
    };
});

