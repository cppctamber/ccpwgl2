import {Tw2BaseClass} from "../../class";

/**
 * Tr2CurveVector3
 * @implements Curve
 *
 * @parameter {Tr2CurveScalar} x -
 * @parameter {Tr2CurveScalar} y -
 * @parameter {Tr2CurveScalar} z -
 */
export default class Tr2CurveVector3 extends Tw2BaseClass
{

    x = null;
    y = null;
    z = null;

}

Tw2BaseClass.define(Tr2CurveVector3, Type =>
{
    return {
        isStaging: true,
        type: "Tr2CurveVector3",
        category: "Curve",
        props: {
            x: ["Tr2CurveScalar"],
            y: ["Tr2CurveScalar"],
            z: ["Tr2CurveScalar"]
        }
    };
});

