import {vec4} from "../../../global";
import {Tw2StagingClass} from "../../class";

/**
 * EveSOFDataParameter
 *
 * @parameter {vec4} value -
 */
export default class EveSOFDataParameter extends Tw2StagingClass
{

    value = vec4.create();

}

Tw2StagingClass.define(EveSOFDataParameter, Type =>
{
    return {
        type: "EveSOFDataParameter",
        props: {
            value: Type.VECTOR4
        }
    };
});

