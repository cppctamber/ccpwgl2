import {vec4} from "../../../global";
import {Tw2BaseClass} from "../../class";

/**
 * Tr2RandomUniformAttributeGenerator
 * @implements ParticleAttributeGenerator
 *
 * @parameter {String} customName  -
 * @parameter {String} elementType -
 * @parameter {vec4} maxRange      -
 * @parameter {vec4} minRange      -
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

