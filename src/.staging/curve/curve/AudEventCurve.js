import {Tw2BaseClass} from "../../../global";

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

