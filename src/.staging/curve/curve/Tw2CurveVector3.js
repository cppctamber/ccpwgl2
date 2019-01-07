import {Tw2StagingClass} from "../../class";

/**
 * Tw2CurveVector3
 * @ccp Tr2CurveVector3
 * @implements Curve
 *
 * @parameter {Tw2CurveScalar} x -
 * @parameter {Tw2CurveScalar} y -
 * @parameter {Tw2CurveScalar} z -
 */
export default class Tw2CurveVector3 extends Tw2StagingClass
{

    x = null;
    y = null;
    z = null;

}

Tw2StagingClass.define(Tw2CurveVector3, Type =>
{
    return {
        type: "Tw2CurveVector3",
        category: "Curve",
        props: {
            x: ["Tw2CurveScalar"],
            y: ["Tw2CurveScalar"],
            z: ["Tw2CurveScalar"]
        }
    };
});

