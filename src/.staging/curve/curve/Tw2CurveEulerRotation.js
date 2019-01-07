import {Tw2StagingClass} from "../../class";

/**
 * Tw2CurveEulerRotation
 * @ccp Tr2CurveEulerRotation
 * @implements Curve
 *
 * @parameter {Tw2CurveScalar} pitch -
 * @parameter {Tw2CurveScalar} roll  -
 * @parameter {Tw2CurveScalar} yaw   -
 */
export default class Tw2CurveEulerRotation extends Tw2StagingClass
{

    pitch = null;
    roll = null;
    yaw = null;

}

Tw2StagingClass.define(Tw2CurveEulerRotation, Type =>
{
    return {
        type: "Tw2CurveEulerRotation",
        category: "Curve",
        props: {
            pitch: ["Tw2CurveScalar"],
            roll: ["Tw2CurveScalar"],
            yaw: ["Tw2CurveScalar"]
        }
    };
});

