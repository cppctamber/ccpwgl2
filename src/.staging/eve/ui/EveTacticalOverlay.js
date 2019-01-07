import {Tw2StagingClass} from "../../class";

/**
 * EveTacticalOverlay
 *
 * @parameter {Tw2Effect} anchorEffect      -
 * @parameter {Number} arcSegmentMultiplier -
 * @parameter {Tw2Effect} connectorEffect   -
 * @parameter {Number} segmentsHigh         -
 * @parameter {Number} segmentsLow          -
 * @parameter {Number} segmentsMedium       -
 * @parameter {Number} targetMaxSegments    -
 * @parameter {Tw2Effect} velocityEffect    -
 */
export default class EveTacticalOverlay extends Tw2StagingClass
{

    anchorEffect = null;
    arcSegmentMultiplier = 0;
    connectorEffect = null;
    segmentsHigh = 0;
    segmentsLow = 0;
    segmentsMedium = 0;
    targetMaxSegments = 0;
    velocityEffect = null;

}

Tw2StagingClass.define(EveTacticalOverlay, Type =>
{
    return {
        type: "EveTacticalOverlay",
        props: {
            anchorEffect: ["Tw2Effect"],
            arcSegmentMultiplier: Type.NUMBER,
            connectorEffect: ["Tw2Effect"],
            segmentsHigh: Type.NUMBER,
            segmentsLow: Type.NUMBER,
            segmentsMedium: Type.NUMBER,
            targetMaxSegments: Type.NUMBER,
            velocityEffect: ["Tw2Effect"]
        }
    };
});

