import {vec4} from "../../../global";
import {Tw2BaseClass} from "../../../global";

/**
 * TriValueBinding
 *
 * @property {String} destinationAttribute -
 * @property {*} destinationObject         -
 * @property {vec4} offset                 -
 * @property {Number} scale                -
 * @property {String} sourceAttribute      -
 * @property {Curve|Tw2Float} sourceObject -
 */
export default class TriValueBinding extends Tw2BaseClass
{

    destinationAttribute = "";
    destinationObject = null;
    offset = vec4.create();
    scale = 0;
    sourceAttribute = "";
    sourceObject = null;

}

Tw2BaseClass.define(TriValueBinding, Type =>
{
    return {
        isStaging: true,
        type: "TriValueBinding",
        props: {
            destinationAttribute: Type.STRING,
            destinationObject: Type.OBJECT,
            offset: Type.VECTOR4,
            scale: Type.NUMBER,
            sourceAttribute: Type.STRING,
            sourceObject: ["Tr2CurveScalar", "Tw2Float", "TriPerlinCurve"]
        }
    };
});

