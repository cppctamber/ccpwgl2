import {Tw2StagingClass} from "../../class";

/**
 * Tw2KelvinColor
 * @ccp Tr2KelvinColor
 *
 * @parameter {Number} temperature -
 * @parameter {Number} tint        -
 */
export default class Tw2KelvinColor extends Tw2StagingClass
{

    temperature = 0;
    tint = 0;

}

Tw2StagingClass.define(Tw2KelvinColor, Type =>
{
    return {
        type: "Tw2KelvinColor",
        props: {
            temperature: Type.NUMBER,
            tint: Type.NUMBER
        }
    };
});

