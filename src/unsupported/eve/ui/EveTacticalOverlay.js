import { meta } from "utils";


/**
 * EveTacticalOverlay
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
@meta.notImplemented
@meta.ctor("EveTacticalOverlay")
export class EveTacticalOverlay extends meta.Model
{

    @meta.struct()
    anchorEffect = null;

    @meta.float
    arcSegmentMultiplier = 0;

    @meta.struct()
    connectorEffect = null;

    @meta.float
    segmentsHigh = 0;

    @meta.float
    segmentsLow = 0;

    @meta.float
    segmentsMedium = 0;

    @meta.float
    targetMaxSegments = 0;

    @meta.struct()
    velocityEffect = null;

}
