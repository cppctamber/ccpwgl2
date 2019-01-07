import {Tw2StagingClass} from "../../class";

/**
 * EveMeshOverlayEffect
 *
 * @parameter {Array.<Tw2Effect>} additiveEffects    -
 * @parameter {Tw2CurveSet} curveSet                 -
 * @parameter {Array.<Tw2Effect>} distortionEffects  -
 * @parameter {Array.<Tw2Effect>} opaqueEffects      -
 * @parameter {Array.<Tw2Effect>} transparentEffects -
 */
export default class EveMeshOverlayEffect extends Tw2StagingClass
{

    additiveEffects = [];
    curveSet = null;
    distortionEffects = [];
    opaqueEffects = [];
    transparentEffects = [];

}

Tw2StagingClass.define(EveMeshOverlayEffect, Type =>
{
    return {
        type: "EveMeshOverlayEffect",
        props: {
            additiveEffects: [["Tw2Effect"]],
            curveSet: ["Tw2CurveSet"],
            distortionEffects: [["Tw2Effect"]],
            opaqueEffects: [["Tw2Effect"]],
            transparentEffects: [["Tw2Effect"]]
        }
    };
});

