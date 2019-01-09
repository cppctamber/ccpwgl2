import {Tw2BaseClass} from "../../class";

/**
 * Tr2PlaneConstraint
 * @implements ParticleConstraint
 *
 * @parameter {Array.<ParticleAttributeGenerator>} generators -
 * @parameter {Number} reflectionNoise                        -
 */
export default class Tr2PlaneConstraint extends Tw2BaseClass
{

    generators = [];
    reflectionNoise = 0;

}

Tw2BaseClass.define(Tr2PlaneConstraint, Type =>
{
    return {
        isStaging: true,
        type: "Tr2PlaneConstraint",
        category: "ParticleConstraint",
        props: {
            generators: [["Tr2RandomUniformAttributeGenerator"]],
            reflectionNoise: Type.NUMBER
        }
    };
});

