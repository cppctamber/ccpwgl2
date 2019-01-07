import {Tw2StagingClass} from "../../class";

/**
 * Tw2CurveColor
 * @ccp Tr2CurveColor
 * @implements Curve
 *
 * @parameter {Tw2CurveScalar} a -
 * @parameter {Tw2CurveScalar} b -
 * @parameter {Tw2CurveScalar} g -
 * @parameter {Tw2CurveScalar} r -
 */
export default class Tw2CurveColor extends Tw2StagingClass
{

    a = null;
    b = null;
    g = null;
    r = null;

}

Tw2StagingClass.define(Tw2CurveColor, Type =>
{
    return {
        type: "Tw2CurveColor",
        category: "Curve",
        props: {
            a: ["Tw2CurveScalar"],
            b: ["Tw2CurveScalar"],
            g: ["Tw2CurveScalar"],
            r: ["Tw2CurveScalar"]
        }
    };
});

