import {Tw2BaseClass} from "../../class";

/**
 * Tr2KelvinColor
 *
 * @parameter {Number} temperature -
 * @parameter {Number} tint        -
 */
export default class Tr2KelvinColor extends Tw2BaseClass
{

    temperature = 0;
    tint = 0;

}

Tw2BaseClass.define(Tr2KelvinColor, Type =>
{
    return {
        isStaging: true,
        type: "Tr2KelvinColor",
        props: {
            temperature: Type.NUMBER,
            tint: Type.NUMBER
        }
    };
});

