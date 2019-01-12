import {quat} from "../../../global";
import {Tw2BaseClass} from "../../../global";

/**
 * EveChildLink
 * @implements ObjectChild
 *
 * @property {Array.<TriValueBinding>} linkStrengthBindings -
 * @property {Array.<Curve>} linkStrengthCurves             -
 * @property {Tr2Mesh} mesh                                 -
 * @property {quat} rotation                                -
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

