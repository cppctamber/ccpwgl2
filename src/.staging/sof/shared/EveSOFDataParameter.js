import {vec4} from "../../../global";
import {Tw2BaseClass} from "../../../global";

/**
 * EveSOFDataParameter
 *
 * @property {vec4} value -
 */
export default class EveSOFDataParameter extends Tw2BaseClass
{

    value = vec4.create();

}

Tw2BaseClass.define(EveSOFDataParameter, Type =>
{
    return {
        isStaging: true,
        type: "EveSOFDataParameter",
        props: {
            value: Type.VECTOR4
        }
    };
});

