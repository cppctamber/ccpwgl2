import {Tw2StagingClass} from "../../class";

/**
 * Tw2EventCurve
 * @ccp TriEventCurve
 * @implements Curve
 *
 * @parameter {Number} extrapolation  -
 * @parameter {Array.<CurveKey>} keys -
 * @parameter {Number} value          -
 */
export default class Tw2EventCurve extends Tw2StagingClass
{

    extrapolation = 0;
    keys = [];
    value = 0;

}

Tw2StagingClass.define(Tw2EventCurve, Type =>
{
    return {
        type: "Tw2EventCurve",
        category: "Curve",
        props: {
            extrapolation: Type.NUMBER,
            keys: [["Tw2EventKey"]],
            value: Type.NUMBER
        }
    };
});

