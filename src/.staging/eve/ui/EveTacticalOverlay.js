import {Tw2BaseClass} from "../../../global";

/**
 * EveTacticalOverlay
 *
 * @property {Tr2Effect} anchorEffect      -
 * @property {Number} arcSegmentMultiplier -
 * @property {Tr2Effect} connectorEffect   -
 * @property {Number} segmentsHigh         -
 * @property {Number} segmentsLow          -
 * @property {Number} segmentsMedium       -
 * @property {Number} targetMaxSegments    -
 * @property {Tr2Effect} velocityEffect    -
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

}

Tw2BaseClass.define(EveTacticalOverlay, Type =>
{
    return {
        isStaging: true,
        type: "EveTacticalOverlay",
        props: {
            anchorEffect: ["Tr2Effect"],
            arcSegmentMultiplier: Type.NUMBER,
            connectorEffect: ["Tr2Effect"],
            segmentsHigh: Type.NUMBER,
            segmentsLow: Type.NUMBER,
            segmentsMedium: Type.NUMBER,
            targetMaxSegments: Type.NUMBER,
            velocityEffect: ["Tr2Effect"]
        }
    };
});

