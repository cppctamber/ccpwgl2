import {Tw2BaseClass} from "../../class";

/**
 * Tr2CurveEulerRotation
 * @implements Curve
 *
 * @parameter {Tr2CurveScalar} pitch -
 * @parameter {Tr2CurveScalar} roll  -
 * @parameter {Tr2CurveScalar} yaw   -
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

