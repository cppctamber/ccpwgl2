import {Tw2BaseClass} from "../../global/index";

/**
 * TriPerlinCurve
 * @implements Curve
 *
 * @property {Number} N      -
 * @property {Number} alpha  -
 * @property {Number} beta   -
 * @property {Number} offset -
 * @property {Number} scale  -
 * @property {Number} speed  -
 * @property {Number} value  -
 */
export default class TriPerlinCurve extends Tw2BaseClass
{

    N = 0;
    alpha = 0;
    beta = 0;
    offset = 0;
    scale = 0;
    speed = 0;
    value = 0;

}

Tw2BaseClass.define(TriPerlinCurve, Type =>
{
    return {
        isStaging: true,
        type: "TriPerlinCurve",
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

