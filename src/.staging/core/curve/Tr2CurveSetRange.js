import {Tw2BaseClass} from "../../class";

/**
 * Tr2CurveSetRange
 *
 * @parameter {Number} endTime   -
 * @parameter {Boolean} looped   -
 * @parameter {Number} startTime -
 */
export default class Tr2CurveSetRange extends Tw2BaseClass
{

    endTime = 0;
    looped = false;
    startTime = 0;

}

Tw2BaseClass.define(Tr2CurveSetRange, Type =>
{
    return {
        isStaging: true,
        type: "Tr2CurveSetRange",
        props: {
            endTime: Type.NUMBER,
            looped: Type.BOOLEAN,
            startTime: Type.NUMBER
        }
    };
});

