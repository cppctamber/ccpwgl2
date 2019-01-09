import {vec4} from "../../../global";
import {Tw2BaseClass} from "../../class";

/**
 * TriValueBinding
 *
 * @parameter {String} destinationAttribute -
 * @parameter {*} destinationObject         -
 * @parameter {vec4} offset                 -
 * @parameter {Number} scale                -
 * @parameter {String} sourceAttribute      -
 * @parameter {Curve|TriFloat} sourceObject -
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
            sourceObject: ["Tr2CurveScalar", "TriFloat", "TriPerlinCurve"]
        }
    };
});

