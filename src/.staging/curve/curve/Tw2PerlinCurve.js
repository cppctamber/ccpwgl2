import {Tw2StagingClass} from "../../class";

/**
 * Tw2PerlinCurve
 * @ccp TriPerlinCurve
 * @implements Curve
 *
 * @parameter {Number} N      -
 * @parameter {Number} alpha  -
 * @parameter {Number} beta   -
 * @parameter {Number} offset -
 * @parameter {Number} scale  -
 * @parameter {Number} speed  -
 * @parameter {Number} value  -
 */
export default class Tw2PerlinCurve extends Tw2StagingClass
{

    N = 0;
    alpha = 0;
    beta = 0;
    offset = 0;
    scale = 0;
    speed = 0;
    value = 0;

}

Tw2StagingClass.define(Tw2PerlinCurve, Type =>
{
    return {
        type: "Tw2PerlinCurve",
        category: "Curve",
        props: {
            N: Type.NUMBER,
            alpha: Type.NUMBER,
            beta: Type.NUMBER,
            offset: Type.NUMBER,
            scale: Type.NUMBER,
            speed: Type.NUMBER,
            value: Type.NUMBER
        }
    };
});

