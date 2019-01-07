import {vec3} from "../../../global";
import {Tw2StagingClass} from "../../class";

/**
 * EveLocalPositionCurve
 *
 * @parameter {vec3} value -
 */
export default class EveLocalPositionCurve extends Tw2StagingClass
{

    value = vec3.create();

}

Tw2StagingClass.define(EveLocalPositionCurve, Type =>
{
    return {
        type: "EveLocalPositionCurve",
        props: {
            value: Type.VECTOR3
        }
    };
});

