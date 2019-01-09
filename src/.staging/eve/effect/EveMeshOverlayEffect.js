import {Tw2BaseClass} from "../../class";

/**
 * EveMeshOverlayEffect
 *
 * @parameter {Array.<Tr2Effect>} additiveEffects    -
 * @parameter {TriCurveSet} curveSet                 -
 * @parameter {Array.<Tr2Effect>} distortionEffects  -
 * @parameter {Array.<Tr2Effect>} opaqueEffects      -
 * @parameter {Array.<Tr2Effect>} transparentEffects -
 */
export default class EveMeshOverlayEffect extends Tw2BaseClass
{

    additiveEffects = [];
    curveSet = null;
    distortionEffects = [];
    opaqueEffects = [];
    transparentEffects = [];

}

Tw2BaseClass.define(EveMeshOverlayEffect, Type =>
{
    return {
        isStaging: true,
        type: "EveMeshOverlayEffect",
        props: {
            additiveEffects: [["Tr2Effect"]],
            curveSet: ["TriCurveSet"],
            distortionEffects: [["Tr2Effect"]],
            opaqueEffects: [["Tr2Effect"]],
            transparentEffects: [["Tr2Effect"]]
        }
    };
});

