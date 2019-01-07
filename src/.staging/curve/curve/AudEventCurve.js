import {Tw2StagingClass} from "../../class";

/**
 * AudEventCurve
 * @implements Curve
 *
 * @parameter {Number} extrapolation               -
 * @parameter {Array.<CurveKey>} keys              -
 * @parameter {Tw2ObserverLocal} sourceTriObserver -
 */
export default class AudEventCurve extends Tw2StagingClass
{

    extrapolation = 0;
    keys = [];
    sourceTriObserver = null;

}

Tw2StagingClass.define(AudEventCurve, Type =>
{
    return {
        type: "AudEventCurve",
        category: "Curve",
        props: {
            extrapolation: Type.NUMBER,
            keys: [["AudEventKey"]],
            sourceTriObserver: ["Tw2ObserverLocal"]
        }
    };
});

