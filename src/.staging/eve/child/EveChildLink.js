import {quat} from "../../../global";
import {Tw2BaseClass} from "../../class";

/**
 * EveChildLink
 * @implements ObjectChild
 *
 * @parameter {Array.<TriValueBinding>} linkStrengthBindings -
 * @parameter {Array.<Curve>} linkStrengthCurves             -
 * @parameter {Tr2Mesh} mesh                                 -
 * @parameter {quat} rotation                                -
 */
export default class EveChildLink extends Tw2BaseClass
{

    linkStrengthBindings = [];
    linkStrengthCurves = [];
    mesh = null;
    rotation = quat.create();

}

Tw2BaseClass.define(EveChildLink, Type =>
{
    return {
        isStaging: true,
        type: "EveChildLink",
        category: "ObjectChild",
        props: {
            linkStrengthBindings: [["TriValueBinding"]],
            linkStrengthCurves: [["Tr2CurveColor"]],
            mesh: ["Tr2Mesh"],
            rotation: Type.TR_ROTATION
        }
    };
});

