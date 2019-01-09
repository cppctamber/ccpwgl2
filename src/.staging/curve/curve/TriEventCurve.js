import {Tw2BaseClass} from "../../class";

/**
 * TriEventCurve
 * @implements Curve
 *
 * @parameter {Number} extrapolation  -
 * @parameter {Array.<CurveKey>} keys -
 * @parameter {Number} value          -
 */
export default class TriEventCurve extends Tw2BaseClass
{

    extrapolation = 0;
    keys = [];
    value = 0;

}

Tw2BaseClass.define(TriEventCurve, Type =>
{
    return {
        isStaging: true,
        type: "TriEventCurve",
        category: "Curve",
        props: {
            extrapolation: Type.NUMBER,
            keys: [["TriEventKey"]],
            value: Type.NUMBER
        }
    };
});

