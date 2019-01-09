import {vec3} from "../../../global";
import {Tw2BaseClass} from "../../class";

/**
 * EveLensflare
 *
 * @parameter {Array.<EveOccluder>} backgroundOccluders -
 * @parameter {Array.<TriValueBinding>} bindings        -
 * @parameter {Array.<Curve>} distanceToCenterCurves    -
 * @parameter {Array.<Curve>} distanceToEdgeCurves      -
 * @parameter {Tr2Mesh} mesh                            -
 * @parameter {Array.<EveOccluder>} occluders           -
 * @parameter {vec3} position                           -
 * @parameter {Array.<Curve>} radialAngleCurves         -
 * @parameter {Array.<Curve>} xDistanceToCenter         -
 * @parameter {Array} yDistanceToCenter                 -
 */
export default class EveLensflare extends Tw2BaseClass
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

Tw2BaseClass.define(EveLensflare, Type =>
{
    return {
        isStaging: true,
        type: "EveLensflare",
        props: {
            backgroundOccluders: [["EveOccluder"]],
            bindings: [["TriValueBinding"]],
            distanceToCenterCurves: [["Tr2CurveScalar"]],
            distanceToEdgeCurves: [["Tr2CurveScalar"]],
            mesh: ["Tr2Mesh"],
            occluders: [["EveOccluder"]],
            position: Type.TR_TRANSLATION,
            radialAngleCurves: [["Tr2CurveScalar"]],
            xDistanceToCenter: [["Tr2CurveScalar"]],
            yDistanceToCenter: Type.ARRAY
        }
    };
});

