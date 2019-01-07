import {vec4} from "../../../global";
import {Tw2StagingClass} from "../../class";

/**
 * Tw2ValueBinding
 * @ccp TriValueBinding
 *
 * @parameter {String} destinationAttribute -
 * @parameter {*} destinationObject         -
 * @parameter {vec4} offset                 -
 * @parameter {Number} scale                -
 * @parameter {String} sourceAttribute      -
 * @parameter {Curve|Tw2Float} sourceObject -
 */
export default class Tw2ValueBinding extends Tw2StagingClass
{

    destinationAttribute = "";
    destinationObject = null;
    offset = vec4.create();
    scale = 0;
    sourceAttribute = "";
    sourceObject = null;

}

Tw2StagingClass.define(Tw2ValueBinding, Type =>
{
    return {
        type: "Tw2ValueBinding",
        props: {
            destinationAttribute: Type.STRING,
            destinationObject: Type.OBJECT,
            offset: Type.VECTOR4,
            scale: Type.NUMBER,
            sourceAttribute: Type.STRING,
            sourceObject: ["Tw2CurveScalar", "Tw2Float", "Tw2PerlinCurve"]
        }
    };
});

