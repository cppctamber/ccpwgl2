import {Tw2BaseClass} from "../../global";

/**
 * EveTacticalOverlay
 * @ccp EveTacticalOverlay
 * TODO: Implement
 *
 * @property {Tw2Effect} anchorEffect      -
 * @property {Number} arcSegmentMultiplier -
 * @property {Tw2Effect} connectorEffect   -
 * @property {Number} segmentsHigh         -
 * @property {Number} segmentsLow          -
 * @property {Number} segmentsMedium       -
 * @property {Number} targetMaxSegments    -
 * @property {Tw2Effect} velocityEffect    -
 */
export default class EveTacticalOverlay extends Tw2BaseClass
{

    anchorEffect = null;
    arcSegmentMultiplier = 0;
    connectorEffect = null;
    segmentsHigh = 0;
    segmentsLow = 0;
    segmentsMedium = 0;
    targetMaxSegments = 0;
    velocityEffect = null;

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["anchorEffect", r.object],
            ["arcSegmentMultiplier", r.float],
            ["connectorEffect", r.object],
            ["segmentsLow", r.float],
            ["segmentsMedium", r.float],
            ["segmentsHigh", r.float],
            ["targetMaxSegments", r.float],
            ["velocityEffect", r.object]
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}
