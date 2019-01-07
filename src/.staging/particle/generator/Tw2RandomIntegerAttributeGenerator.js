import {vec4} from "../../../global";
import {Tw2StagingClass} from "../../class";

/**
 * Tw2RandomIntegerAttributeGenerator
 * @ccp Tr2RandomIntegerAttributeGenerator
 * @implements ParticleAttributeGenerator
 *
 * @parameter {String} customName -
 * @parameter {vec4} maxRange     -
 * @parameter {vec4} minRange     -
 */
export default class Tw2RandomIntegerAttributeGenerator extends Tw2StagingClass
{

    customName = "";
    maxRange = vec4.create();
    minRange = vec4.create();

}

Tw2StagingClass.define(Tw2RandomIntegerAttributeGenerator, Type =>
{
    return {
        type: "Tw2RandomIntegerAttributeGenerator",
        category: "ParticleAttributeGenerator",
        props: {
            customName: Type.STRING,
            maxRange: Type.VECTOR4,
            minRange: Type.VECTOR4
        }
    };
});

