import {vec3, Tw2BaseClass} from "../../global";

/**
 * EveLocalPositionCurve
 * @ccp EveLocalPositionCurve
 * TODO: Implement
 *
 * @property {vec3} value -
 */
export class EveLocalPositionCurve extends Tw2BaseClass
{

    value = vec3.create();

}

Tw2BaseClass.define(EveLocalPositionCurve, Type =>
{
    return {
        isStaging: true,
        type: "EveLocalPositionCurve",
        props: {
            value: Type.VECTOR3
        },
        notImplemented: ["*"]
    };
});

