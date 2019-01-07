import {Tw2StagingClass} from "../../class";

/**
 * Tw2Float
 * @ccp TriFloat
 *
 * @parameter {Number} value -
 */
export default class Tw2Float extends Tw2StagingClass
{

    value = 0;

}

Tw2StagingClass.define(Tw2Float, Type =>
{
    return {
        type: "Tw2Float",
        props: {
            value: Type.NUMBER
        }
    };
});

