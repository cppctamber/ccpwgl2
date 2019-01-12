import {vec4} from "../../../global";
import {Tw2BaseClass} from "../../../global";

/**
 * Tr2RandomIntegerAttributeGenerator
 * @implements ParticleAttributeGenerator
 *
 * @property {String} customName -
 * @property {vec4} maxRange     -
 * @property {vec4} minRange     -
 */
export default class Tr2RandomIntegerAttributeGenerator extends Tw2BaseClass
{

    customName = "";
    maxRange = vec4.create();
    minRange = vec4.create();

}

Tw2BaseClass.define(Tr2RandomIntegerAttributeGenerator, Type =>
{
    return {
        isStaging: true,
        type: "Tr2RandomIntegerAttributeGenerator",
        category: "ParticleAttributeGenerator",
        props: {
            customName: Type.STRING,
            maxRange: Type.VECTOR4,
            minRange: Type.VECTOR4
        }
    };
});

