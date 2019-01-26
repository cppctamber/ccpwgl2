import {Tw2BaseClass} from "../../global/index";

/**
 * Tr2CurveVector3
 *
 * @property {Tr2CurveScalar} x -
 * @property {Tr2CurveScalar} y -
 * @property {Tr2CurveScalar} z -
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

