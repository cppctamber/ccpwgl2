import {Tw2BaseClass} from "../../class";

/**
 * Tr2ParticleElementDeclaration
 *
 * @parameter {String} customName  -
 * @parameter {Number} dimension   -
 * @parameter {String} elementType -
 * @parameter {Number} usageIndex  -
 * @parameter {Boolean} usedByGPU  -
 */
export default class Tr2ParticleElementDeclaration extends Tw2BaseClass
{

    customName = "";
    dimension = 0;
    elementType = "";
    usageIndex = 0;
    usedByGPU = false;

}

Tw2BaseClass.define(Tr2ParticleElementDeclaration, Type =>
{
    return {
        isStaging: true,
        type: "Tr2ParticleElementDeclaration",
        props: {
            customName: Type.STRING,
            dimension: Type.NUMBER,
            elementType: Type.STRING,
            usageIndex: Type.NUMBER,
            usedByGPU: Type.BOOLEAN
        }
    };
});

