import {vec4} from "../../../global";
import {Tw2StagingClass} from "../../class";

/**
 * Tw2RandomUniformAttributeGenerator
 * @ccp Tr2RandomUniformAttributeGenerator
 * @implements ParticleAttributeGenerator
 *
 * @parameter {String} customName  -
 * @parameter {String} elementType -
 * @parameter {vec4} maxRange      -
 * @parameter {vec4} minRange      -
 */
export default class Tw2RandomUniformAttributeGenerator extends Tw2StagingClass
{

    customName = "";
    elementType = "";
    maxRange = vec4.create();
    minRange = vec4.create();

}

Tw2StagingClass.define(Tw2RandomUniformAttributeGenerator, Type =>
{
    return {
        type: "Tw2RandomUniformAttributeGenerator",
        category: "ParticleAttributeGenerator",
        props: {
            customName: Type.STRING,
            elementType: Type.STRING,
            maxRange: Type.VECTOR4,
            minRange: Type.VECTOR4
        }
    };
});

