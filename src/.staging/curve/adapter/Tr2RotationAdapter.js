import {vec4} from "../../../global";
import {Tw2BaseClass} from "../../class";

/**
 * Tr2RotationAdapter
 * @implements CurveAdapter
 *
 * @parameter {Curve|CurveExpression} curve -
 * @parameter {vec4} value                  -
 */
export default class Tr2RotationAdapter extends Tw2BaseClass
{

    curve = null;
    value = vec4.create();

}

Tw2BaseClass.define(Tr2RotationAdapter, Type =>
{
    return {
        isStaging: true,
        type: "Tr2RotationAdapter",
        category: "CurveAdapter",
        props: {
            curve: ["Tr2CurveEulerRotation", "Tr2CurveEulerRotationExpression"],
            value: Type.VECTOR4
        }
    };
});

