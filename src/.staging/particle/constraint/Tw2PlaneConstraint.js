import {Tw2StagingClass} from "../../class";

/**
 * Tw2PlaneConstraint
 * @ccp Tr2PlaneConstraint
 * @implements ParticleConstraint
 *
 * @parameter {Array.<ParticleAttributeGenerator>} generators -
 * @parameter {Number} reflectionNoise                        -
 */
export default class Tw2PlaneConstraint extends Tw2StagingClass
{

    generators = [];
    reflectionNoise = 0;

}

Tw2StagingClass.define(Tw2PlaneConstraint, Type =>
{
    return {
        type: "Tw2PlaneConstraint",
        category: "ParticleConstraint",
        props: {
            generators: [["Tw2RandomUniformAttributeGenerator"]],
            reflectionNoise: Type.NUMBER
        }
    };
});

