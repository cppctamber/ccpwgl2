import {vec3} from "../../../global";
import {Tw2StagingClass} from "../../class";

/**
 * EveLensflare
 *
 * @parameter {Array.<EveOccluder>} backgroundOccluders -
 * @parameter {Array.<Tw2ValueBinding>} bindings        -
 * @parameter {Array.<Curve>} distanceToCenterCurves    -
 * @parameter {Array.<Curve>} distanceToEdgeCurves      -
 * @parameter {Tw2Mesh} mesh                            -
 * @parameter {Array.<EveOccluder>} occluders           -
 * @parameter {vec3} position                           -
 * @parameter {Array.<Curve>} radialAngleCurves         -
 * @parameter {Array.<Curve>} xDistanceToCenter         -
 * @parameter {Array} yDistanceToCenter                 -
 */
export default class EveLensflare extends Tw2StagingClass
{

    backgroundOccluders = [];
    bindings = [];
    distanceToCenterCurves = [];
    distanceToEdgeCurves = [];
    mesh = null;
    occluders = [];
    position = vec3.create();
    radialAngleCurves = [];
    xDistanceToCenter = [];
    yDistanceToCenter = [];

}

Tw2StagingClass.define(EveLensflare, Type =>
{
    return {
        type: "EveLensflare",
        props: {
            backgroundOccluders: [["EveOccluder"]],
            bindings: [["Tw2ValueBinding"]],
            distanceToCenterCurves: [["Tw2CurveScalar"]],
            distanceToEdgeCurves: [["Tw2CurveScalar"]],
            mesh: ["Tw2Mesh"],
            occluders: [["EveOccluder"]],
            position: Type.TR_TRANSLATION,
            radialAngleCurves: [["Tw2CurveScalar"]],
            xDistanceToCenter: [["Tw2CurveScalar"]],
            yDistanceToCenter: Type.ARRAY
        }
    };
});

