import {Tw2BaseClass} from "../../class";

/**
 * Tr2CurveScalar
 * @implements Curve
 *
 * @parameter {Number} extrapolationAfter  -
 * @parameter {Number} extrapolationBefore -
 * @parameter {Array} keys                 -
 * @parameter {Number} timeOffset          -
 * @parameter {Number} timeScale           -
 */
export default class Tr2CurveScalar extends Tw2BaseClass
{

    extrapolationAfter = 0;
    extrapolationBefore = 0;
    keys = [];
    timeOffset = 0;
    timeScale = 0;

}

Tw2BaseClass.define(Tr2CurveScalar, Type =>
{
    return {
        isStaging: true,
        type: "Tr2CurveScalar",
        category: "Curve",
        props: {
            extrapolationAfter: Type.NUMBER,
            extrapolationBefore: Type.NUMBER,
            keys: Type.ARRAY,
            timeOffset: Type.NUMBER,
            timeScale: Type.NUMBER
        }
    };
});

