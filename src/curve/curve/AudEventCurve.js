import {Tw2BaseClass} from "../../global";

/**
 * AudEventKey
 * TODO: Implement
 *
 * @property {Number} time  -
 * @property {Number} value -
 */
export class AudEventKey extends Tw2BaseClass
{

    time = 0;
    value = 0;

}

/**
 * AudEventCurve
 * TODO: Implement
 *
 * @property {Number} extrapolation               -
 * @property {Array.<CurveKey>} keys              -
 * @property {TriObserverLocal} sourceTriObserver -
 */
export class AudEventCurve extends Tw2BaseClass
{

    extrapolation = 0;
    keys = [];
    sourceTriObserver = null;

}
