import {Tw2BaseClass} from "../../class";

/**
 * Tr2CurveColor
 * @implements Curve
 *
 * @parameter {Tr2CurveScalar} a -
 * @parameter {Tr2CurveScalar} b -
 * @parameter {Tr2CurveScalar} g -
 * @parameter {Tr2CurveScalar} r -
 */
export default class Tr2CurveColor extends Tw2BaseClass
{

    a = null;
    b = null;
    g = null;
    r = null;

}

Tw2BaseClass.define(Tr2CurveColor, Type =>
{
    return {
        isStaging: true,
        type: "Tr2CurveColor",
        category: "Curve",
        props: {
            a: ["Tr2CurveScalar"],
            b: ["Tr2CurveScalar"],
            g: ["Tr2CurveScalar"],
            r: ["Tr2CurveScalar"]
        }
    };
});

