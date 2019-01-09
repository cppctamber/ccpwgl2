import {vec3} from "../../../global";
import {Tw2BaseClass} from "../../class";

/**
 * EveLocalPositionCurve
 *
 * @parameter {vec3} value -
 */
export default class EveLocalPositionCurve extends Tw2BaseClass
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
        }
    };
});

