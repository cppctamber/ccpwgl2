import {Tw2BaseClass} from "../../global";

/**
 * Tw2ScalarKey2
 * @ccp N/A
 *
 */
export class Tw2CurveScalarKey extends Tw2BaseClass
{

    endTangent = 0.0;
    extrapolation = 0;
    index = 0;
    interpolation = 1;
    startTangent = 0.0;
    time = 0.0;
    value = 0.0;

}

Tw2BaseClass.define(Tw2CurveScalarKey, Type =>
{
    return {
        isStaging: true,
        type: "Tw2CurveScalarKey",
        category: "CurveKey",
        props: {
            endTangent: Type.NUMBER,
            extrapolation: Type.NUMBER,
            index: Type.NUMBER,
            interpolation: Type.NUMBER,
            startTangent: Type.NUMBER,
            time: Type.NUMBER,
            value: Type.NUMBER
        }
    };
});


/**
 * Tr2CurveScalar
 * @ccp Tr2CurveScalar
 *
 * @property {Number} extrapolationAfter  -
 * @property {Number} extrapolationBefore -
 * @property {Array} keys                 -
 * @property {Number} timeOffset          -
 * @property {Number} timeScale           -
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

