import {Tw2BaseClass} from "../../global";

/**
 * AudEventKey
 *
 * @property {Number} time  -
 * @property {Number} value -
 */
export class AudEventKey extends Tw2BaseClass
{

    time = 0;
    value = 0;

}

Tw2BaseClass.define(AudEventKey, Type =>
{
    return {
        isStaging: true,
        type: "AudEventKey",
        category: "CurveKey",
        props: {
            time: Type.NUMBER,
            value: Type.NUMBER
        }
    };
});


/**
 * AudEventCurve
 * @implements Curve
 *
 * @property {Number} extrapolation               -
 * @property {Array.<CurveKey>} keys              -
 * @property {TriObserverLocal} sourceTriObserver -
 */
export default class AudEventCurve extends Tw2BaseClass
{

    extrapolation = 0;
    keys = [];
    sourceTriObserver = null;

}

Tw2BaseClass.define(AudEventCurve, Type =>
{
    return {
        isStaging: true,
        type: "AudEventCurve",
        category: "Curve",
        props: {
            extrapolation: Type.NUMBER,
            keys: [["AudEventKey"]],
            sourceTriObserver: ["TriObserverLocal"]
        }
    };
});

