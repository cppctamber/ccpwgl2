import { Tw2CurveKey, Tw2Curve } from "./Tw2Curve";

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

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "time", r.float ],
            [ "value", r.ushort ]
        ];
    }
}

/**
 * AudEventCurve
 * TODO: Implement
 *
 * @property {Array.<AudEventKey>} keys           -
 * @property {TriObserverLocal} sourceTriObserver -
 */
export class AudEventCurve extends Tw2Curve
{

    keys = [];
    sourceTriObserver = null;

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "name", r.string ],
            [ "keys", r.array ],
            [ "sourceTriObserver, r.object" ]
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}
