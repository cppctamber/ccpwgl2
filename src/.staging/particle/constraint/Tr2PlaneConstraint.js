import {Tw2BaseClass} from "../../../global";

/**
 * Tr2PlaneConstraint
 * @implements ParticleConstraint
 *
 * @property {Array.<ParticleAttributeGenerator>} generators -
 * @property {Number} reflectionNoise                        -
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

