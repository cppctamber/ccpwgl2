import {Tw2ParticleConstraint} from "./Tw2ParticleConstraint";

/**
 * Tr2PlaneConstraint
 * TODO: Impelement
 * @ccp Tr2PlaneConstraint
 *
 * @property {Array.<ParticleAttributeGenerator>} generators -
 * @property {Number} reflectionNoise                        -
 */
export class Tr2PlaneConstraint extends Tw2ParticleConstraint
{

    generators = [];
    reflectionNoise = 0;

}

Tw2ParticleConstraint.define(Tr2PlaneConstraint, Type =>
{
    return {
        isStaging: true,
        type: "Tr2PlaneConstraint",
        category: "ParticleConstraint",
        props: {
            generators: [["Tr2RandomUniformAttributeGenerator"]],
            reflectionNoise: Type.NUMBER
        },
        notImplemented: ["*"]
    };
});

