import {vec4} from "../../../global";
import {Tw2BaseClass} from "../../../global";

/**
 * Tr2RandomUniformAttributeGenerator
 * @implements ParticleAttributeGenerator
 *
 * @property {String} customName  -
 * @property {String} elementType -
 * @property {vec4} maxRange      -
 * @property {vec4} minRange      -
 */
export default class Tr2RandomUniformAttributeGenerator extends Tw2BaseClass
{

    customName = "";
    elementType = "";
    maxRange = vec4.create();
    minRange = vec4.create();

}

Tw2BaseClass.define(Tr2RandomUniformAttributeGenerator, Type =>
{
    return {
        isStaging: true,
        type: "Tr2RandomUniformAttributeGenerator",
        category: "ParticleAttributeGenerator",
        props: {
            customName: Type.STRING,
            elementType: Type.STRING,
            maxRange: Type.VECTOR4,
            minRange: Type.VECTOR4
        }
    };
});

