import {Tw2BaseClass} from "../../global";

/**
 * Tr2CurveColor
 *
 * @property {Tr2CurveScalar} a -
 * @property {Tr2CurveScalar} b -
 * @property {Tr2CurveScalar} g -
 * @property {Tr2CurveScalar} r -
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

