import { meta, Tw2BaseClass } from "global";


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
@meta.type("EveTacticalOverlay", true)
export class EveTacticalOverlay extends Tw2BaseClass
{

    @meta.black.object
    anchorEffect = null;

    @meta.black.float
    arcSegmentMultiplier = 0;

    @meta.black.object
    connectorEffect = null;

    @meta.black.float
    segmentsHigh = 0;

    @meta.black.float
    segmentsLow = 0;

    @meta.black.float
    segmentsMedium = 0;

    @meta.black.float
    targetMaxSegments = 0;

    @meta.black.object
    velocityEffect = null;

}
