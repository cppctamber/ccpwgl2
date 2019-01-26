import {Tw2BaseClass} from "../../global/index";

/**
 * Tr2CurveEulerRotation
 *
 * @property {Tr2CurveScalar} pitch -
 * @property {Tr2CurveScalar} roll  -
 * @property {Tr2CurveScalar} yaw   -
 */
export default class Tr2CurveEulerRotation extends Tw2BaseClass
{

    pitch = null;
    roll = null;
    yaw = null;

}

Tw2BaseClass.define(Tr2CurveEulerRotation, Type =>
{
    return {
        isStaging: true,
        type: "Tr2CurveEulerRotation",
        category: "Curve",
        props: {
            pitch: ["Tr2CurveScalar"],
            roll: ["Tr2CurveScalar"],
            yaw: ["Tr2CurveScalar"]
        }
    };
});

