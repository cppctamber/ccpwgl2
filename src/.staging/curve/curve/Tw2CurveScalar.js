import {Tw2StagingClass} from "../../class";

/**
 * Tw2CurveScalar
 * @ccp Tr2CurveScalar
 * @implements Curve
 *
 * @parameter {Number} extrapolationAfter  -
 * @parameter {Number} extrapolationBefore -
 * @parameter {Array} keys                 -
 * @parameter {Number} timeOffset          -
 * @parameter {Number} timeScale           -
 */
export default class Tw2CurveScalar extends Tw2StagingClass
{

    extrapolationAfter = 0;
    extrapolationBefore = 0;
    keys = [];
    timeOffset = 0;
    timeScale = 0;

}

Tw2StagingClass.define(Tw2CurveScalar, Type =>
{
    return {
        type: "Tw2CurveScalar",
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

