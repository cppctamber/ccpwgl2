import {Tw2BaseClass} from "../../global/index";


/**
 * TriEventKey
 * @implements CurveKey
 *
 * @property {Number} time  -
 * @property {Number} value -
 */
export class TriEventKey extends Tw2BaseClass
{

    time = 0;
    value = 0;

}

Tw2BaseClass.define(TriEventKey, Type =>
{
    return {
        isStaging: true,
        type: "TriEventKey",
        category: "CurveKey",
        props: {
            time: Type.NUMBER,
            value: Type.NUMBER
        }
    };
});


/**
 * TriEventCurve
 * @implements Curve
 *
 * @property {Number} extrapolation  -
 * @property {Array.<CurveKey>} keys -
 * @property {Number} value          -
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

