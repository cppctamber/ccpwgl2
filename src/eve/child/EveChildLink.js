import {quat} from "../../global";
import {EveChild} from "./EveChild";

/**
 * EveChildLink
 * TODO: Implement
 * @ccp EveChildLink
 *
 * @property {Array.<Tw2ValueBinding>} linkStrengthBindings -
 * @property {Array.<Curve>} linkStrengthCurves             -
 * @property {Tw2Mesh} mesh                                 -
 * @property {quat} rotation                                -
 */
export class EveChildLink extends EveChild
{

    linkStrengthBindings = [];
    linkStrengthCurves = [];
    mesh = null;
    rotation = quat.create();

}

EveChild.define(EveChildLink, Type =>
{
    return {
        isStaging: true,
        type: "EveChildLink",
        props: {
            linkStrengthBindings: [["Tw2ValueBinding"]],
            linkStrengthCurves: [["Tr2CurveColor"]],
            mesh: ["Tw2Mesh"],
            rotation: Type.TR_ROTATION
        },
        notImplemented: ["*"]
    };
});

