import {Tw2CurveKey, Tw2Curve} from "./Tw2Curve";

/**
 * AudEventKey
 * TODO: Implement
 *
 * @property {Number} time  -
 * @property {Number} value -
 */
export class AudEventKey extends Tw2CurveKey
{

    time = 0;
    value = 0;

}

/**
 * AudEventCurve
 * TODO: Implement
 *
 * @property {Number} extrapolation               -
 * @property {Array.<AudEventKey>} keys           -
 * @property {TriObserverLocal} sourceTriObserver -
 */
export class AudEventCurve extends Tw2Curve
{

    extrapolation = 0;
    keys = [];
    sourceTriObserver = null;

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}
