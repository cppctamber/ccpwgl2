import {Tw2StagingClass} from "../../class";

/**
 * Tw2FloatParameter
 * @ccp Tr2FloatParameter
 * @implements Parameter
 *
 * @parameter {Number} value -
 */
export default class Tw2FloatParameter extends Tw2StagingClass
{

    value = 0;

}

Tw2StagingClass.define(Tw2FloatParameter, Type =>
{
    return {
        type: "Tw2FloatParameter",
        category: "Parameter",
        props: {
            value: Type.NUMBER
        }
    };
});

