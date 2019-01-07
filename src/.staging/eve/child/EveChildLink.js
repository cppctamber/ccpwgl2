import {quat} from "../../../global";
import {Tw2StagingClass} from "../../class";

/**
 * EveChildLink
 * @implements ObjectChild
 *
 * @parameter {Array.<Tw2ValueBinding>} linkStrengthBindings -
 * @parameter {Array.<Curve>} linkStrengthCurves             -
 * @parameter {Tw2Mesh} mesh                                 -
 * @parameter {quat} rotation                                -
 */
export default class EveChildLink extends Tw2StagingClass
{

    linkStrengthBindings = [];
    linkStrengthCurves = [];
    mesh = null;
    rotation = quat.create();

}

Tw2StagingClass.define(EveChildLink, Type =>
{
    return {
        type: "EveChildLink",
        category: "ObjectChild",
        props: {
            linkStrengthBindings: [["Tw2ValueBinding"]],
            linkStrengthCurves: [["Tw2CurveColor"]],
            mesh: ["Tw2Mesh"],
            rotation: Type.TR_ROTATION
        }
    };
});

