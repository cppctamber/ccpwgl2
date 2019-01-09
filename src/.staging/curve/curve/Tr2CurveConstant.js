import {vec4} from "../../../global";
import {Tw2BaseClass} from "../../class";

/**
 * Tr2CurveConstant
 * @implements Curve
 *
 * @parameter {vec4} value -
 */
export default class Tr2CurveConstant extends Tw2BaseClass
{

    value = vec4.create();

}

Tw2BaseClass.define(Tr2CurveConstant, Type =>
{
    return {
        isStaging: true,
        type: "Tr2CurveConstant",
        category: "Curve",
        props: {
            value: Type.VECTOR4
        }
    };
});

