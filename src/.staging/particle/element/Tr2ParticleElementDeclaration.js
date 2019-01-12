import {Tw2BaseClass} from "../../../global";

/**
 * Tr2ParticleElementDeclaration
 *
 * @property {String} customName  -
 * @property {Number} dimension   -
 * @property {String} elementType -
 * @property {Number} usageIndex  -
 * @property {Boolean} usedByGPU  -
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

