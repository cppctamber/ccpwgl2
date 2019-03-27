import {EveSOFBaseClass} from "../EveSOFBaseClass";

/**
 * EveSOFDataGenericString
 *
 * @property {String} str -
 */
export class EveSOFDataGenericString extends EveSOFBaseClass
{

    str = "";

}

EveSOFDataGenericString.define(r =>
{
    return {
        type: "EveSOFDataGenericString",
        black: [
            ["str", r.string],
        ]
    };
});