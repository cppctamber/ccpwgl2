import {vec4, Tw2BaseClass} from "../../global";

/**
 * Tr2RotationAdapter
 * @implements CurveAdapter
 *
 * @property {Curve|CurveExpression} curve -
 * @property {vec4} value                  -
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

