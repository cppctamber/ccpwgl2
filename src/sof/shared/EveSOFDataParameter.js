import {vec4} from "../../global";
import {EveSOFBaseClass} from "../EveSOFBaseClass";

/**
 * EveSOFDataParameter
 *
 * @property {String} name -
 * @property {vec4} value  -
 */
export class EveSOFDataParameter extends EveSOFBaseClass
{

    name = "";
    value = vec4.create();

}

EveSOFDataParameter.define(r =>
{
    return {
        type: "EveSOFDataParameter",
        black: [
            ["name", r.string],
            ["value", r.vector4]
        ]
    };
});