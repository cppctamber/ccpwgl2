import {vec4} from "../../../global";
import {Tw2StagingClass} from "../../class";

/**
 * Tw2CurveConstant
 * @ccp Tr2CurveConstant
 * @implements Curve
 *
 * @parameter {vec4} value -
 */
export default class Tw2CurveConstant extends Tw2StagingClass
{

    value = vec4.create();

}

Tw2StagingClass.define(Tw2CurveConstant, Type =>
{
    return {
        type: "Tw2CurveConstant",
        category: "Curve",
        props: {
            value: Type.VECTOR4
        }
    };
});

