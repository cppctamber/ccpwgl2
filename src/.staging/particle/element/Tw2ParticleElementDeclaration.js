import {Tw2StagingClass} from "../../class";

/**
 * Tw2ParticleElementDeclaration
 * @ccp Tr2ParticleElementDeclaration
 *
 * @parameter {String} customName  -
 * @parameter {Number} dimension   -
 * @parameter {String} elementType -
 * @parameter {Number} usageIndex  -
 * @parameter {Boolean} usedByGPU  -
 */
export default class Tw2ParticleElementDeclaration extends Tw2StagingClass
{

    customName = "";
    dimension = 0;
    elementType = "";
    usageIndex = 0;
    usedByGPU = false;

}

Tw2StagingClass.define(Tw2ParticleElementDeclaration, Type =>
{
    return {
        type: "Tw2ParticleElementDeclaration",
        props: {
            customName: Type.STRING,
            dimension: Type.NUMBER,
            elementType: Type.STRING,
            usageIndex: Type.NUMBER,
            usedByGPU: Type.BOOLEAN
        }
    };
});

