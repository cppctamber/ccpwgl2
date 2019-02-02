import {Tw2BaseClass} from "../../global";

/**
 * EveSOFDataGenericString
 *
 * @property {String} str -
 */
export class EveSOFDataGenericString extends Tw2BaseClass
{

    str = "";

}

Tw2BaseClass.define(EveSOFDataGenericString, Type =>
{
    return {
        isStaging: true,
        type: "EveSOFDataGenericString",
        props: {
            str: Type.STRING
        }
    };
});

