import {Tw2StagingClass} from "../../class";

/**
 * Tw2CurveSetRange
 * @ccp Tr2CurveSetRange
 *
 * @parameter {Number} endTime   -
 * @parameter {Boolean} looped   -
 * @parameter {Number} startTime -
 */
export default class Tw2CurveSetRange extends Tw2StagingClass
{

    endTime = 0;
    looped = false;
    startTime = 0;

}

Tw2StagingClass.define(Tw2CurveSetRange, Type =>
{
    return {
        type: "Tw2CurveSetRange",
        props: {
            endTime: Type.NUMBER,
            looped: Type.BOOLEAN,
            startTime: Type.NUMBER
        }
    };
});

