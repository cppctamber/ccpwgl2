import {Tw2BaseClass} from "../../global/index";

/**
 * Curve set range
 * @ccp Tr2CurveSetRange
 *
 * @property {Number} endTime   -
 * @property {Boolean} looped   -
 * @property {Number} startTime -
 */
export default class Tw2CurveSetRange extends Tw2BaseClass
{

    endTime = 0;
    looped = false;
    startTime = 0;

}

Tw2BaseClass.define(Tw2CurveSetRange, Type =>
{
    return {
        isStaging: true,
        type: "Tr2CurveSetRange",
        props: {
            endTime: Type.NUMBER,
            looped: Type.BOOLEAN,
            startTime: Type.NUMBER
        },
        notImplemented: ["*"]
    };
});

