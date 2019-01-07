import {vec4} from "../../../global";
import {Tw2StagingClass} from "../../class";

/**
 * Tw2RotationAdapter
 * @ccp Tr2RotationAdapter
 * @implements CurveAdapter
 *
 * @parameter {Curve|CurveExpression} curve -
 * @parameter {vec4} value                  -
 */
export default class Tw2RotationAdapter extends Tw2StagingClass
{

    curve = null;
    value = vec4.create();

}

Tw2StagingClass.define(Tw2RotationAdapter, Type =>
{
    return {
        type: "Tw2RotationAdapter",
        category: "CurveAdapter",
        props: {
            curve: ["Tw2CurveEulerRotation", "Tw2CurveEulerRotationExpression"],
            value: Type.VECTOR4
        }
    };
});

